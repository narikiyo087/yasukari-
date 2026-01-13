import { promises as fs } from "fs";
import path from "path";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { getDocumentClient } from "../dynamodb";

export type VehicleRentalPriceRecord = {
  vehicle_type_id: number;
  days: number;
  price: number;
  createdAt: string;
  updatedAt: string;
};

const DATA_FILE_PATH = path.join(process.cwd(), "data", "vehicle-rental-prices.json");
const TABLE_NAME =
  process.env.VEHICLE_RENTAL_PRICES_TABLE ||
  process.env.VEHICLE_RENTAL_PRICE_TABLE ||
  "VEHICLE_RENTAL_PRICES_TABLE";

const shouldUseLocalStorage =
  process.env.USE_LOCAL_VEHICLE_RENTAL_PRICE_STORAGE === "true" ||
  (!process.env.AWS_ACCESS_KEY_ID &&
    !process.env.AWS_PROFILE &&
    !process.env.AWS_REGION &&
    !process.env.AWS_DEFAULT_REGION);

async function ensureDataFile(): Promise<void> {
  try {
    await fs.access(DATA_FILE_PATH);
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
      await fs.writeFile(DATA_FILE_PATH, "[]\n", "utf-8");
    } else {
      throw error;
    }
  }
}

function isValidRecord(value: unknown): value is VehicleRentalPriceRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const { vehicle_type_id, days, price, createdAt, updatedAt } = value as Record<
    string,
    unknown
  >;

  return (
    Number.isInteger(vehicle_type_id) &&
    Number(vehicle_type_id) > 0 &&
    Number.isInteger(days) &&
    Number(days) > 0 &&
    typeof price === "number" &&
    Number.isFinite(price) &&
    price >= 0 &&
    typeof createdAt === "string" &&
    createdAt.length > 0 &&
    typeof updatedAt === "string" &&
    updatedAt.length > 0
  );
}

export async function readVehicleRentalPrices(
  vehicleTypeId?: number
): Promise<VehicleRentalPriceRecord[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE_PATH, "utf-8");

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isValidRecord)
      .filter((record) =>
        typeof vehicleTypeId === "number"
          ? record.vehicle_type_id === vehicleTypeId
          : true
      )
      .sort((a, b) => a.days - b.days);
  } catch (error) {
    console.error("Failed to parse vehicle rental prices data", error);
    return [];
  }
}

export async function readVehicleRentalPricesFromStore(
  vehicleTypeId?: number
): Promise<VehicleRentalPriceRecord[]> {
  if (typeof vehicleTypeId !== "number") {
    return [];
  }

  if (shouldUseLocalStorage) {
    return readVehicleRentalPrices(vehicleTypeId);
  }

  try {
    const client = getDocumentClient();
    const result = await client.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "#vehicle_type_id = :vehicle_type_id",
        ExpressionAttributeNames: { "#vehicle_type_id": "vehicle_type_id" },
        ExpressionAttributeValues: { ":vehicle_type_id": vehicleTypeId },
      })
    );

    return ((result.Items ?? []) as VehicleRentalPriceRecord[]).sort(
      (a, b) => a.days - b.days
    );
  } catch (error) {
    console.error("Failed to fetch vehicle rental prices", {
      table: TABLE_NAME,
      error,
    });
    return [];
  }
}

export async function writeVehicleRentalPrices(
  records: VehicleRentalPriceRecord[]
): Promise<void> {
  await ensureDataFile();
  const sorted = [...records].sort((a, b) => {
    if (a.vehicle_type_id !== b.vehicle_type_id) {
      return a.vehicle_type_id - b.vehicle_type_id;
    }
    return a.days - b.days;
  });
  await fs.writeFile(DATA_FILE_PATH, `${JSON.stringify(sorted, null, 2)}\n`, "utf-8");
}

export async function upsertVehicleRentalPrice(
  record: Omit<VehicleRentalPriceRecord, "createdAt" | "updatedAt"> & {
    createdAt?: string;
    updatedAt?: string;
  }
): Promise<VehicleRentalPriceRecord> {
  const records = await readVehicleRentalPrices();
  const timestamp = new Date().toISOString();

  const nextRecords = [...records];
  const index = nextRecords.findIndex(
    (item) =>
      item.vehicle_type_id === record.vehicle_type_id && item.days === record.days
  );

  const createdAt = record.createdAt ?? nextRecords[index]?.createdAt ?? timestamp;
  const updatedAt = record.updatedAt ?? timestamp;

  const normalized: VehicleRentalPriceRecord = {
    ...record,
    createdAt,
    updatedAt,
  } as VehicleRentalPriceRecord;

  if (index >= 0) {
    nextRecords[index] = normalized;
  } else {
    nextRecords.push(normalized);
  }

  await writeVehicleRentalPrices(nextRecords);
  return normalized;
}

export async function removeVehicleRentalPrice(
  vehicleTypeId: number,
  days: number
): Promise<void> {
  const records = await readVehicleRentalPrices();
  const nextRecords = records.filter(
    (record) => !(record.vehicle_type_id === vehicleTypeId && record.days === days)
  );
  await writeVehicleRentalPrices(nextRecords);
}
