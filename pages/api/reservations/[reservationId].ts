import type { NextApiRequest, NextApiResponse } from "next";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

import { getDocumentClient } from "../../../lib/dynamodb";
import { formatDateKey } from "../../../lib/dashboard/utils";
import type {
  RentalAvailabilityMap,
  RentalAvailabilityStatus,
} from "../../../lib/dashboard/types";
import {
  fetchReservationById,
  Reservation,
  updateReservation,
} from "../../../lib/reservations";
import { getPayjpSecretKey, getPayjpSecretKeyError } from "../../../lib/payjpServer";
import { issueKeyboxPinForReservation } from "../../../lib/keybox";

type VehicleRecord = {
  managementNumber: string;
  rentalAvailability?: RentalAvailabilityMap;
  updatedAt?: string;
  [key: string]: unknown;
};

type ReservationDetailResponse = {
  reservation: Reservation;
};

const VEHICLES_TABLE = process.env.VEHICLES_TABLE ?? "Vehicles";
const REFUND_LIMIT_DAYS = 180;

const isValidRentalStatus = (value: unknown): value is RentalAvailabilityStatus =>
  value === "AVAILABLE" ||
  value === "UNAVAILABLE" ||
  value === "MAINTENANCE" ||
  value === "RENTED" ||
  value === "RENTAL_COMPLETED";

const normalizeRentalAvailability = (value: unknown): RentalAvailabilityMap => {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<RentalAvailabilityMap>(
    (acc, [date, raw]) => {
      if (typeof date !== "string") {
        return acc;
      }

      if (typeof raw !== "object" || raw === null) {
        return acc;
      }

      const { status, note } = raw as Record<string, unknown>;
      if (!isValidRentalStatus(status)) {
        return acc;
      }

      acc[date] = {
        status,
        ...(typeof note === "string" && note.trim().length > 0 ? { note: note.trim() } : {}),
      };

      return acc;
    },
    {}
  );
};

const buildDateKeysInRange = (start: string, end: string): string[] => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return [];
  }

  const keys: string[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    keys.push(formatDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
};

const isVehicleAvailableForDateKeys = (
  availability: RentalAvailabilityMap,
  dateKeys: string[]
): boolean => {
  if (dateKeys.length === 0) {
    return false;
  }

  return dateKeys.every((key) => availability[key]?.status === "AVAILABLE");
};

const buildAdminChangeNote = (renterName: string) => {
  const parts = [renterName.trim() || "名前未登録", "管理者により変更"];
  return Array.from(new Set(parts)).join(" / ");
};

const parsePaymentAmount = (amount: unknown): number | null => {
  if (typeof amount === "number") return amount;
  if (typeof amount !== "string") return null;
  const normalized = amount.replace(/[,\s円]/g, "");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};

const isWithinRefundWindow = (paymentDate: string | undefined): boolean => {
  if (!paymentDate) return false;
  const paidAt = new Date(paymentDate);
  if (Number.isNaN(paidAt.getTime())) return false;

  const now = new Date();
  const diffMs = now.getTime() - paidAt.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= REFUND_LIMIT_DAYS;
};

const requestPayjpRefund = async (chargeId: string, amount: number, email?: string) => {
  const secretKeyError = getPayjpSecretKeyError(email);
  if (secretKeyError) {
    throw new Error(secretKeyError);
  }

  const secretKey = getPayjpSecretKey(email);

  const basicAuth = Buffer.from(`${secretKey}:`).toString("base64");
  const params = new URLSearchParams({ amount: amount.toString() });

  const response = await fetch(`https://api.pay.jp/v1/charges/${chargeId}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const responseData = (await response.json()) as { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(responseData.error?.message ?? "Pay.jp 返金処理に失敗しました。");
  }
};

const updateVehicleAvailability = async (
  managementNumber: string,
  updateMap: (current: RentalAvailabilityMap) => RentalAvailabilityMap
) => {
  const client = getDocumentClient();
  const response = await client.send(
    new GetCommand({
      TableName: VEHICLES_TABLE,
      Key: { managementNumber },
    })
  );

  if (!response.Item) {
    throw new Error(`Vehicle ${managementNumber} not found`);
  }

  const vehicle = response.Item as VehicleRecord;
  const currentAvailability = normalizeRentalAvailability(vehicle.rentalAvailability);
  const updatedAvailability = updateMap(currentAvailability);

  await client.send(
    new PutCommand({
      TableName: VEHICLES_TABLE,
      Item: {
        ...vehicle,
        rentalAvailability: updatedAvailability,
        updatedAt: new Date().toISOString(),
      },
      ConditionExpression: "attribute_exists(managementNumber)",
    })
  );
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReservationDetailResponse | { error: string }>
) {
  const reservationId = req.query.reservationId;
  if (typeof reservationId !== "string") {
    return res.status(400).json({ error: "reservationId is required" });
  }

  if (req.method === "GET") {
    try {
      const reservation = await fetchReservationById(reservationId);
      if (!reservation) {
        return res.status(404).json({ error: "予約が見つかりませんでした" });
      }

      return res.status(200).json({ reservation });
    } catch (error) {
      console.error(`Failed to load reservation ${reservationId}`, error);
      return res.status(500).json({ error: "予約データの取得に失敗しました。" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const existingReservation = await fetchReservationById(reservationId);
      if (!existingReservation) {
        return res.status(404).json({ error: "予約が見つかりませんでした" });
      }

      const body = req.body as Partial<Reservation> & {
        vehicleModel?: string;
        skipRefund?: boolean;
      };
      const updates: Partial<Reservation> = {};
      const pickupAtUpdated =
        typeof body.pickupAt === "string" && body.pickupAt !== existingReservation.pickupAt;
      const returnAtUpdated =
        typeof body.returnAt === "string" && body.returnAt !== existingReservation.returnAt;

      if (typeof body.vehicleCode === "string") {
        updates.vehicleCode = body.vehicleCode;
      }

      if (typeof body.vehiclePlate === "string") {
        updates.vehiclePlate = body.vehiclePlate;
      }

      const requestedVehicleCode =
        typeof body.vehicleCode === "string" ? body.vehicleCode : existingReservation.vehicleCode;
      const requestedVehiclePlate =
        typeof body.vehiclePlate === "string" ? body.vehiclePlate : existingReservation.vehiclePlate;
      const vehicleSelectionChanged =
        requestedVehicleCode !== existingReservation.vehicleCode ||
        requestedVehiclePlate !== existingReservation.vehiclePlate;

      if ((body.vehicleCode || body.vehiclePlate) && vehicleSelectionChanged) {
        if (body.vehicleModel && body.vehicleModel !== existingReservation.vehicleModel) {
          return res.status(400).json({ error: "同一車種の車両のみ選択できます" });
        }

        if (requestedVehicleCode !== existingReservation.vehicleCode) {
          const client = getDocumentClient();
          const vehicleResult = await client.send(
            new GetCommand({
              TableName: VEHICLES_TABLE,
              Key: { managementNumber: requestedVehicleCode },
            })
          );

          if (!vehicleResult.Item) {
            return res.status(404).json({ error: "指定された車両が見つかりません。" });
          }

          const nextVehicle = vehicleResult.Item as VehicleRecord;
          const nextAvailability = normalizeRentalAvailability(nextVehicle.rentalAvailability);
          const requiredDateKeys = buildDateKeysInRange(
            existingReservation.pickupAt,
            existingReservation.returnAt
          );

          if (!isVehicleAvailableForDateKeys(nextAvailability, requiredDateKeys)) {
            return res.status(400).json({
              error:
                "変更先の車両は予約期間中にレンタル不可の日があります。1日でもレンタル可でない日は変更できません。",
            });
          }
        }

        updates.vehicleChangedAt = body.vehicleChangedAt ?? new Date().toISOString();
        updates.vehicleChangeNotified = body.vehicleChangeNotified ?? false;
      }

      if (typeof body.status === "string") {
        updates.status = body.status;
      }

      if (typeof body.refundNote === "string") {
        updates.refundNote = body.refundNote;
      }

      if (typeof body.returnRating === "number") {
        updates.returnRating = Math.max(0, Math.min(5, body.returnRating));
      }

      if (typeof body.returnSurvey === "string") {
        updates.returnSurvey = body.returnSurvey.trim();
      }

      if (typeof body.pickupAt === "string") {
        updates.pickupAt = body.pickupAt;
      }

      if (typeof body.returnAt === "string") {
        updates.returnAt = body.returnAt;
      }

      if (pickupAtUpdated || returnAtUpdated) {
        const pickupAt = new Date(updates.pickupAt ?? existingReservation.pickupAt);
        const returnAt = new Date(updates.returnAt ?? existingReservation.returnAt);
        if (!Number.isNaN(pickupAt.getTime()) && !Number.isNaN(returnAt.getTime())) {
          const diff = returnAt.getTime() - pickupAt.getTime();
          if (diff > 0) {
            updates.rentalDurationHours = Math.round((diff / (1000 * 60 * 60)) * 10) / 10;
          }
        }
      }

      if (typeof body.paymentId === "string") {
        updates.paymentId = body.paymentId;
      }

      if (typeof body.paymentDate === "string") {
        updates.paymentDate = body.paymentDate;
      }

      if (typeof body.paymentAmount === "string") {
        updates.paymentAmount = body.paymentAmount;
      }
      if (typeof body.extensionPaidFlag === "boolean") {
        updates.extensionPaidFlag = body.extensionPaidFlag;
      }

      if (typeof body.memberPhone === "string") {
        updates.memberPhone = body.memberPhone;
      }

      if (typeof body.memberCountryCode === "string") {
        updates.memberCountryCode = body.memberCountryCode;
      }

      if (typeof body.reservationCompletedFlag === "boolean") {
        updates.reservationCompletedFlag = body.reservationCompletedFlag;
      }

      if (typeof body.vehicleChangeNotified === "boolean" && !updates.vehicleChangedAt) {
        updates.vehicleChangeNotified = body.vehicleChangeNotified;
      }

      const isCancelling =
        updates.status === "キャンセル" && existingReservation.status !== "キャンセル";

      if (isCancelling && !body.skipRefund) {
        if (!existingReservation.paymentId) {
          return res.status(400).json({ error: "決済番号が登録されていないため返金できません。" });
        }

        const paymentAmount = parsePaymentAmount(existingReservation.paymentAmount);
        if (paymentAmount === null) {
          return res.status(400).json({ error: "決済金額の形式が不正なため返金できません。" });
        }

        if (!isWithinRefundWindow(existingReservation.paymentDate)) {
          return res
            .status(400)
            .json({ error: "売上日から180日を経過しているため返金できません。" });
        }

        try {
          await requestPayjpRefund(
            existingReservation.paymentId,
            paymentAmount,
            existingReservation.memberEmail
          );
          updates.refundNote =
            updates.refundNote ??
            `${existingReservation.paymentAmount}円 / ${existingReservation.paymentId} の返金を実行`; 
        } catch (refundError) {
          const message =
            refundError instanceof Error ? refundError.message : "返金処理に失敗しました";
          console.error(`Failed to refund reservation ${reservationId}`, refundError);
          return res.status(500).json({ error: message });
        }
      }

      const reservation = await updateReservation(reservationId, updates);

      const scheduleChanged = pickupAtUpdated || returnAtUpdated;

      let reservationWithKeybox = reservation;
      if (returnAtUpdated && reservation.keyboxPinCode) {
        const keyboxIssueResult = await issueKeyboxPinForReservation(reservation);
        if (keyboxIssueResult.reservationUpdates) {
          reservationWithKeybox = await updateReservation(
            reservationId,
            keyboxIssueResult.reservationUpdates
          );
        } else {
          console.error(`Failed to refresh keybox pin for extended reservation ${reservationId}`);
        }
      }

      if (
        typeof updates.vehicleCode === "string" &&
        updates.vehicleCode !== existingReservation.vehicleCode
      ) {
        const previousKeys = buildDateKeysInRange(
          existingReservation.pickupAt,
          existingReservation.returnAt
        );
        const nextKeys = buildDateKeysInRange(reservation.pickupAt, reservation.returnAt);
        const renterNote = buildAdminChangeNote(existingReservation.memberName);

        if (previousKeys.length > 0) {
          await updateVehicleAvailability(existingReservation.vehicleCode, (current) => {
            const next = { ...current };
            previousKeys.forEach((key) => {
              const entry = next[key];
              if (entry?.status === "RENTED" || entry?.status === "RENTAL_COMPLETED") {
                next[key] = { status: "AVAILABLE" };
              }
            });
            return next;
          });
        }

        if (nextKeys.length > 0) {
          await updateVehicleAvailability(updates.vehicleCode, (current) => {
            const next = { ...current };
            nextKeys.forEach((key) => {
              next[key] = { status: "RENTED", note: renterNote };
            });
            return next;
          });
        }
      }

      if (scheduleChanged && reservation.vehicleCode === existingReservation.vehicleCode) {
        const previousKeys = buildDateKeysInRange(
          existingReservation.pickupAt,
          existingReservation.returnAt
        );
        const nextKeys = buildDateKeysInRange(reservation.pickupAt, reservation.returnAt);

        if (previousKeys.length > 0 || nextKeys.length > 0) {
          const scheduleUpdateNote = buildAdminChangeNote(existingReservation.memberName);
          await updateVehicleAvailability(existingReservation.vehicleCode, (current) => {
            const next = { ...current };
            const previousSet = new Set(previousKeys);
            const nextSet = new Set(nextKeys);

            previousKeys.forEach((key) => {
              if (!nextSet.has(key)) {
                const entry = next[key];
                if (entry?.status === "RENTED" || entry?.status === "RENTAL_COMPLETED") {
                  next[key] = { status: "AVAILABLE" };
                }
              }
            });

            nextKeys.forEach((key) => {
              if (!previousSet.has(key)) {
                next[key] = { status: "RENTED", note: scheduleUpdateNote };
              }
            });

            return next;
          });
        }
      }

      const isNewlyCompleted =
        reservation.status === "予約完了" && existingReservation.status !== "予約完了";

      if (isNewlyCompleted) {
        const completionKeys = buildDateKeysInRange(
          reservation.pickupAt,
          reservation.returnAt
        );

        if (completionKeys.length > 0) {
          await updateVehicleAvailability(reservation.vehicleCode, (current) => {
            const next = { ...current };
            completionKeys.forEach((key) => {
              const entry = next[key];
              if (entry?.status === "RENTED" || entry?.status === "RENTAL_COMPLETED") {
                next[key] = { status: "AVAILABLE" };
              }
            });

            return next;
          });
        }
      }

      return res.status(200).json({ reservation: reservationWithKeybox });
    } catch (error) {
      console.error(`Failed to update reservation ${reservationId}`, error);
      return res.status(500).json({ error: "予約データの更新に失敗しました。" });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ error: `Method ${req.method ?? "unknown"} Not Allowed` });
}
