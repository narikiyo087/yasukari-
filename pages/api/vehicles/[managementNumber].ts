import type { NextApiRequest, NextApiResponse } from "next";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { getDocumentClient } from "../../../lib/dynamodb";

type Vehicle = {
  managementNumber: string;
  modelId: number;
  storeId: string;
  publishStatus: "ON" | "OFF";
  tags: string[];
  rentalAvailability?: RentalAvailabilityMap;
  policyNumber1?: string;
  policyBranchNumber1?: string;
  policyNumber2?: string;
  policyBranchNumber2?: string;
  inspectionExpiryDate?: string;
  licensePlateNumber?: string;
  parkingNumber?: string;
  previousLicensePlateNumber?: string;
  liabilityInsuranceExpiryDate?: string;
  videoUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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

const VEHICLES_TABLE = process.env.VEHICLES_TABLE ?? "Vehicles";

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

async function handleGet(
  request: NextApiRequest,
  response: NextApiResponse<Vehicle | { message: string }>
) {
  const managementNumberParam = request.query.managementNumber;
  const managementNumber =
    typeof managementNumberParam === "string" ? managementNumberParam.trim() : "";

  if (!managementNumber) {
    response.status(400).json({ message: "管理番号を正しく指定してください。" });
    return;
  }

  try {
    const client = getDocumentClient();
    const result = await client.send(
      new GetCommand({
        TableName: VEHICLES_TABLE,
        Key: { managementNumber },
      })
    );

    const item = result.Item as Vehicle | undefined;
    if (!item) {
      response.status(404).json({ message: "指定された車両が見つかりません。" });
      return;
    }

    const normalizedAvailability = normalizeRentalAvailability(item.rentalAvailability);
    if (normalizedAvailability !== undefined) {
      item.rentalAvailability = normalizedAvailability;
    } else if (item.rentalAvailability !== undefined) {
      delete (item as Partial<Vehicle>).rentalAvailability;
    }

    response.status(200).json(item);
  } catch (error) {
    console.error("Failed to fetch vehicle", error);
    response.status(500).json({ message: "車両情報の取得に失敗しました。" });
  }
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  if (request.method === "GET") {
    await handleGet(request, response);
    return;
  }

  response.setHeader("Allow", ["GET"]);
  response.status(405).json({ message: "Method Not Allowed" });
}
