import type { NextApiRequest, NextApiResponse } from "next";

import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { verifyCognitoIdToken, COGNITO_ID_TOKEN_COOKIE } from "../../../lib/cognitoServer";
import { getDocumentClient } from "../../../lib/dynamodb";
import { formatDateKey } from "../../../lib/dashboard/utils";
import {
  createReservation,
  fetchAllReservations,
  fetchReservationById,
  Reservation,
  updateReservation,
} from "../../../lib/reservations";
import { issueKeyboxPinForReservation } from "../../../lib/keybox";
import { sendReservationCompletionEmail } from "../../../lib/reservationCompletionEmail";

type ReservationListResponse = {
  reservations: Reservation[];
};

type CreateReservationRequest = {
  storeName?: string;
  vehicleModel?: string;
  vehicleCode?: string;
  vehiclePlate?: string;
  pickupAt?: string;
  returnAt?: string;
  status?: string;
  paymentAmount?: number;
  paymentId?: string;
  paymentDate?: string;
  rentalDurationHours?: number | null;
  rentalCompletedAt?: string;
  reservationCompletedFlag?: boolean;
  memberName?: string;
  memberEmail?: string;
  memberPhone?: string;
  couponCode?: string;
  couponDiscount?: number;
  notes?: string;
  accessories?: Record<string, number>;
};

type RentalAvailabilityStatus =
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "MAINTENANCE"
  | "RENTED"
  | "RENTAL_COMPLETED";

type RentalAvailabilityDay = {
  status: RentalAvailabilityStatus;
  note?: string;
};

type RentalAvailabilityMap = Record<string, RentalAvailabilityDay>;

type VehicleRecord = {
  managementNumber: string;
  licensePlateNumber?: string;
  rentalAvailability?: RentalAvailabilityMap;
};

const VEHICLES_TABLE = process.env.VEHICLES_TABLE ?? "Vehicles";

const normalizeAccessorySelection = (
  value: unknown
): Record<string, number> | undefined => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const entries = Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>(
    (acc, [key, raw]) => {
      const parsed = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
      if (!Number.isNaN(parsed) && parsed > 0) {
        acc[key] = parsed;
      }
      return acc;
    },
    {}
  );

  return Object.keys(entries).length > 0 ? entries : undefined;
};

const isValidRentalStatus = (value: unknown): value is RentalAvailabilityStatus =>
  value === "AVAILABLE" ||
  value === "UNAVAILABLE" ||
  value === "MAINTENANCE" ||
  value === "RENTED" ||
  value === "RENTAL_COMPLETED";

const normalizeRentalAvailabilityDay = (
  value: unknown
): RentalAvailabilityDay | null => {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return null;
    }

    const [firstSlot] = value as Record<string, unknown>[];
    const noteCandidate =
      typeof firstSlot?.note === "string" && firstSlot.note.trim().length > 0
        ? firstSlot.note.trim()
        : undefined;

    return { status: "AVAILABLE", ...(noteCandidate ? { note: noteCandidate } : {}) };
  }

  if (typeof value !== "object" || value === null) {
    return null;
  }

  const { status, note } = value as Record<string, unknown>;
  if (!isValidRentalStatus(status)) {
    return null;
  }

  const trimmedNote =
    typeof note === "string" && note.trim().length > 0 ? note.trim() : undefined;

  return { status, ...(trimmedNote ? { note: trimmedNote } : {}) } satisfies RentalAvailabilityDay;
};

const normalizeRentalAvailability = (
  value: unknown
): RentalAvailabilityMap | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const normalizedEntries = Object.entries(value as Record<string, unknown>)
    .map(([date, day]): [string, RentalAvailabilityDay] | null => {
      if (typeof date !== "string") {
        return null;
      }

      const normalizedDay = normalizeRentalAvailabilityDay(day);
      if (!normalizedDay) {
        return null;
      }

      return [date, normalizedDay];
    })
    .filter((entry): entry is [string, RentalAvailabilityDay] => entry !== null);

  return normalizedEntries.reduce<RentalAvailabilityMap>((acc, [date, day]) => {
    acc[date] = day;
    return acc;
  }, {});
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

const buildRenterNote = (memberName: string): string | undefined => {
  const normalized = memberName.trim();
  return normalized.length > 0 ? normalized : undefined;
};

const isReservationRangeAvailable = (
  availabilityMap: RentalAvailabilityMap | undefined,
  pickupAt: string,
  returnAt: string
): boolean => {
  if (!availabilityMap) {
    return false;
  }

  const pickupDateTime = new Date(pickupAt);
  const returnDateTime = new Date(returnAt);
  if (
    Number.isNaN(pickupDateTime.getTime()) ||
    Number.isNaN(returnDateTime.getTime())
  ) {
    return false;
  }

  const startDate = new Date(
    pickupDateTime.getFullYear(),
    pickupDateTime.getMonth(),
    pickupDateTime.getDate()
  );
  const endDate = new Date(
    returnDateTime.getFullYear(),
    returnDateTime.getMonth(),
    returnDateTime.getDate()
  );
  if (startDate > endDate) {
    return false;
  }

  for (const cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
    const key = formatDateKey(cursor);
    if (availabilityMap[key]?.status !== "AVAILABLE") {
      return false;
    }
  }

  return true;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReservationListResponse | { error: string }>
) {
  if (req.method === "GET") {
    try {
      const reservations = await fetchAllReservations();
      return res.status(200).json({ reservations });
    } catch (error) {
      console.error("Failed to load reservations", error);
      return res.status(500).json({ error: "予約データの取得に失敗しました。" });
    }
  }

  if (req.method === "POST") {
    try {
      const token = req.cookies?.[COGNITO_ID_TOKEN_COOKIE];
      const payload = await verifyCognitoIdToken(token);

      if (!payload?.sub) {
        return res.status(401).json({ error: "認証が必要です" });
      }

      const body = req.body as CreateReservationRequest;
      const requiredFields: Array<keyof CreateReservationRequest> = [
        "storeName",
        "vehicleModel",
        "vehicleCode",
        "pickupAt",
        "returnAt",
        "paymentAmount",
        "paymentId",
      ];

      const missingField = requiredFields.find((field) => !body[field]);
      if (missingField) {
        return res.status(400).json({ error: `${missingField} is required` });
      }

      const existingReservation = await fetchReservationById(body.paymentId!);
      if (existingReservation) {
        return res.status(200).json({ reservations: [existingReservation] });
      }

      const client = getDocumentClient();
      const vehicleResult = await client.send(
        new GetCommand({
          TableName: VEHICLES_TABLE,
          Key: { managementNumber: body.vehicleCode },
        })
      );
      const vehicle = vehicleResult.Item as VehicleRecord | undefined;

      if (!vehicle) {
        return res.status(404).json({ error: "車両情報が見つかりませんでした。" });
      }

      const normalizedAvailability = normalizeRentalAvailability(
        vehicle.rentalAvailability
      );
      const accessories = normalizeAccessorySelection(body.accessories);
      const isAvailable = isReservationRangeAvailable(
        normalizedAvailability,
        body.pickupAt!,
        body.returnAt!
      );

      if (!isAvailable) {
        return res.status(409).json({
          error: "レンタル中または貸出不可のため予約できません。レンタル可の期間のみ予約可能です。",
        });
      }

      let reservation = await createReservation({
        storeName: body.storeName!,
        vehicleModel: body.vehicleModel!,
        vehicleCode: body.vehicleCode!,
        vehiclePlate:
          vehicle.licensePlateNumber ??
          body.vehiclePlate ??
          body.vehicleCode ??
          "未設定",
        pickupAt: body.pickupAt!,
        returnAt: body.returnAt!,
        status: (body.status as Reservation["status"]) || "予約受付完了",
        paymentAmount: body.paymentAmount!,
        paymentId: body.paymentId!,
        paymentDate: body.paymentDate,
        rentalDurationHours: body.rentalDurationHours ?? null,
        rentalCompletedAt: body.rentalCompletedAt,
        reservationCompletedFlag: body.reservationCompletedFlag ?? false,
        memberId: payload.sub,
        memberName: body.memberName ?? payload["name"] ?? "",
        memberEmail: body.memberEmail ?? (payload["email"] as string) ?? "",
        memberPhone: body.memberPhone ?? "",
        couponCode: body.couponCode,
        couponDiscount: body.couponDiscount,
        options: {
          vehicleCoverage: "",
          theftCoverage: "",
        },
        accessories,
        notes: body.notes,
      });

      const reservationDateKeys = buildDateKeysInRange(
        reservation.pickupAt,
        reservation.returnAt
      );

      if (reservationDateKeys.length > 0) {
        const renterNote = buildRenterNote(reservation.memberName ?? "");
        const updatedAvailability = { ...(normalizedAvailability ?? {}) };

        reservationDateKeys.forEach((key) => {
          updatedAvailability[key] = renterNote
            ? { status: "RENTED", note: renterNote }
            : { status: "RENTED" };
        });

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
      }

      if (reservation.storeName === "三ノ輪店") {
        try {
          const { reservationUpdates } = await issueKeyboxPinForReservation(reservation);
          if (reservationUpdates) {
            reservation = await updateReservation(reservation.id, reservationUpdates);
          }
        } catch (keyboxError) {
          console.error("Failed to issue keybox PIN", keyboxError);
        }
      }

      try {
        await sendReservationCompletionEmail(reservation);
      } catch (emailError) {
        console.error("Failed to send reservation completion email", emailError);
      }

      return res.status(201).json({ reservations: [reservation] });
    } catch (error) {
      console.error("Failed to create reservation", error);
      return res.status(500).json({ error: "予約データの保存に失敗しました。" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: `Method ${req.method ?? "unknown"} Not Allowed` });
}
