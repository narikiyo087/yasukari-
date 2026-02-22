import type { NextApiRequest, NextApiResponse } from "next";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { getDocumentClient } from "../../../lib/dynamodb";

const VEHICLES_TABLE = process.env.VEHICLES_TABLE ?? "Vehicles";

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

type Vehicle = {
  managementNumber: string;
  modelId: number;
  storeId: string;
  publishStatus: "ON" | "OFF";
  tags: string[];
  autoAvailabilityInitialized?: boolean;
  rentalAvailability?: RentalAvailabilityMap;
  policyNumber1?: string;
  policyBranchNumber1?: string;
  policyNumber2?: string;
  policyBranchNumber2?: string;
  inspectionExpiryDate?: string;
  licensePlateNumber?: string;
  previousLicensePlateNumber?: string;
  liabilityInsuranceExpiryDate?: string;
  videoUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

const normalizeDate = (value: string | undefined): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

const isInsuranceOrInspectionMaintenance = (
  day: RentalAvailabilityDay | undefined
) =>
  day?.status === "MAINTENANCE" &&
  (day.note === "自賠責満了期間" || day.note === "車検満了期間");

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<Vehicle | { message: string }>
) {
  if (request.method !== "POST") {
    response.setHeader("Allow", ["POST"]);
    response.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const { managementNumber } = request.body ?? {};

  if (typeof managementNumber !== "string" || managementNumber.trim().length === 0) {
    response.status(400).json({ message: "車両IDを指定してください。" });
    return;
  }

  try {
    const client = getDocumentClient();
    const vehicleResult = await client.send(
      new GetCommand({
        TableName: VEHICLES_TABLE,
        Key: { managementNumber: managementNumber.trim() },
      })
    );

    if (!vehicleResult.Item) {
      response.status(404).json({ message: "指定された車両が見つかりません。" });
      return;
    }

    const vehicle = vehicleResult.Item as Vehicle;


    const liabilityDate = normalizeDate(vehicle.liabilityInsuranceExpiryDate);
    const inspectionDate = normalizeDate(vehicle.inspectionExpiryDate);
    const candidateDates = [liabilityDate, inspectionDate].filter(
      (date): date is Date => date !== null
    );

    if (candidateDates.length === 0) {
      response.status(400).json({ message: "満了日が登録されていないため自動設定できません。" });
      return;
    }

    const earliestExpiry = candidateDates.reduce((earliest, date) =>
      earliest < date ? earliest : date
    );

    const endDate = new Date(earliestExpiry);
    endDate.setDate(endDate.getDate() - 1);

    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (endDate < startDate) {
      response.status(400).json({ message: "有効なレンタル可能日程がありません。" });
      return;
    }

    const updatedAvailability: RentalAvailabilityMap = {
      ...(vehicle.rentalAvailability ?? {}),
    };

    for (
      let cursor = new Date(startDate.getTime());
      cursor <= endDate;
      cursor.setDate(cursor.getDate() + 1)
    ) {
      const dateKey = formatDateKey(cursor);
      const currentDay = updatedAvailability[dateKey];
      const isRented = currentDay?.status === "RENTED";

      if (isRented || isInsuranceOrInspectionMaintenance(currentDay)) {
        continue;
      }

      updatedAvailability[dateKey] = { status: "AVAILABLE" };
    }

    const timestamp = new Date().toISOString();
    const updatedVehicle: Vehicle = {
      ...vehicle,
      rentalAvailability: updatedAvailability,
      autoAvailabilityInitialized: true,
      updatedAt: timestamp,
    };

    await client.send(
      new PutCommand({
        TableName: VEHICLES_TABLE,
        Item: updatedVehicle,
        ConditionExpression: "attribute_exists(managementNumber)",
      })
    );

    response.status(200).json(updatedVehicle);
  } catch (error) {
    console.error("Failed to auto set rental availability", error);
    response.status(500).json({ message: "自動設定に失敗しました。" });
  }
}
