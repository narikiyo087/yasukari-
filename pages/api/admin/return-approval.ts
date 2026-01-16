import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { formatDateKey } from "../../../lib/dashboard/utils";
import type {
  RentalAvailabilityMap,
  RentalAvailabilityStatus,
} from "../../../lib/dashboard/types";
import { getDocumentClient } from "../../../lib/dynamodb";
import {
  fetchReservationById,
  Reservation,
  updateReservation,
} from "../../../lib/reservations";

type VehicleRecord = {
  managementNumber: string;
  rentalAvailability?: RentalAvailabilityMap;
  updatedAt?: string;
  [key: string]: unknown;
};

type AdminReturnApprovalResponse = {
  reservation: Reservation;
};

const VEHICLES_TABLE = process.env.VEHICLES_TABLE ?? "Vehicles";
const bucketName = process.env.RETURN_REPORT_BUCKET ?? "yasukari-file";
const bucketRegion = process.env.AWS_REGION ?? "ap-northeast-1";
const bucketPrefix = process.env.ADMIN_RETURN_APPROVAL_PREFIX ?? "AdminReturnApprovals/";

const DUMMY_IMAGE_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMBAAq9oD0AAAAASUVORK5CYII=";

const normalizePrefix = (prefix: string) => (prefix.endsWith("/") ? prefix : `${prefix}/`);

const encodeS3Key = (key: string) =>
  key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

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

const s3Client = new S3Client({ region: bucketRegion });

const uploadDummyImage = async () => {
  const key = `${normalizePrefix(bucketPrefix)}${Date.now()}-${crypto.randomUUID()}-admin-return.png`;
  const body = Buffer.from(DUMMY_IMAGE_BASE64, "base64");

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: "image/png",
    })
  );

  return `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${encodeS3Key(key)}`;
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
  request: NextApiRequest,
  response: NextApiResponse<AdminReturnApprovalResponse | { message: string }>
) {
  try {
    if (request.method !== "POST") {
      response.setHeader("Allow", ["POST"]);
      response.status(405).json({ message: "Method Not Allowed" });
      return;
    }

    const { reservationId } = request.body as { reservationId?: string };
    if (!reservationId || typeof reservationId !== "string") {
      response.status(400).json({ message: "reservationId is required" });
      return;
    }

    const reservation = await fetchReservationById(reservationId);
    if (!reservation) {
      response.status(404).json({ message: "予約が見つかりませんでした。" });
      return;
    }

    const adminReturnReportUrl = await uploadDummyImage();
    const adminReturnApprovedAt = new Date().toISOString();

    const nextReservation = await updateReservation(reservationId, {
      status: "予約完了",
      reservationCompletedFlag: true,
      adminReturnReportUrl,
      adminReturnApprovedAt,
    });

    if (reservation.status !== "予約完了") {
      const completionKeys = buildDateKeysInRange(reservation.pickupAt, reservation.returnAt);
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

    response.status(200).json({ reservation: nextReservation });
  } catch (error) {
    console.error("Failed to approve return", error);
    response.status(500).json({ message: "管理者承認による返却処理に失敗しました。" });
  }
}
