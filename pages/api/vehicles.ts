import type { NextApiRequest, NextApiResponse } from "next";
import { BatchWriteCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { getDocumentClient, scanAllItems } from "../../lib/dynamodb";

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
const MODELS_TABLE = process.env.BIKE_MODELS_TABLE ?? "BikeModels";

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

async function handleGet(response: NextApiResponse<Vehicle[] | { message: string }>) {
  try {
    const items = await scanAllItems<Vehicle>({ TableName: VEHICLES_TABLE });
    const normalizedItems = items.map((item) => {
      const normalizedAvailability = normalizeRentalAvailability(item.rentalAvailability);
      if (normalizedAvailability !== undefined) {
        item.rentalAvailability = normalizedAvailability;
      } else if (item.rentalAvailability !== undefined) {
        delete (item as Partial<Vehicle>).rentalAvailability;
      }
      return item;
    });

    normalizedItems.sort((a, b) =>
      a.managementNumber.localeCompare(b.managementNumber)
    );
    response.status(200).json(normalizedItems);
  } catch (error) {
    console.error("Failed to fetch vehicles", error);
    response.status(500).json({ message: "車両情報の取得に失敗しました。" });
  }
}

async function handlePost(
  request: NextApiRequest,
  response: NextApiResponse<Vehicle | { message: string }>
) {
  const {
    managementNumber,
    modelId,
    storeId,
    publishStatus,
    tags,
    autoAvailabilityInitialized,
    rentalAvailability,
    policyNumber1,
    policyBranchNumber1,
    policyNumber2,
    policyBranchNumber2,
    inspectionExpiryDate,
    licensePlateNumber,
    parkingNumber,
    previousLicensePlateNumber,
    liabilityInsuranceExpiryDate,
    videoUrl,
    notes,
  } = request.body ?? {};

  if (typeof managementNumber !== "string" || managementNumber.trim().length === 0) {
    response.status(400).json({ message: "管理番号を正しく入力してください。" });
    return;
  }

  if (typeof modelId !== "number") {
    response.status(400).json({ message: "車種を正しく選択してください。" });
    return;
  }

  if (typeof storeId !== "string" || storeId.trim().length === 0) {
    response.status(400).json({ message: "店舗IDを正しく入力してください。" });
    return;
  }

  if (publishStatus !== "ON" && publishStatus !== "OFF") {
    response.status(400).json({ message: "掲載状態を正しく選択してください。" });
    return;
  }

  const normalizedTags = Array.isArray(tags)
    ? tags
        .filter((tag) => typeof tag === "string" && tag.trim().length > 0)
        .map((tag) => tag.trim())
    : [];

  const normalizedAvailability = normalizeRentalAvailability(rentalAvailability);

  try {
    const client = getDocumentClient();

    const [existingVehicle, modelResult] = await Promise.all([
      client.send(
        new GetCommand({
          TableName: VEHICLES_TABLE,
          Key: { managementNumber: managementNumber.trim() },
        })
      ),
      client.send(
        new GetCommand({
          TableName: MODELS_TABLE,
          Key: { modelId },
        })
      ),
    ]);

    if (existingVehicle.Item) {
      response.status(400).json({ message: "同じ管理番号の車両が既に存在します。" });
      return;
    }

    if (!modelResult.Item) {
      response.status(400).json({ message: "選択された車種が存在しません。" });
      return;
    }

    const timestamp = new Date().toISOString();
    const item: Vehicle = {
      managementNumber: managementNumber.trim(),
      modelId,
      storeId: storeId.trim(),
      publishStatus,
      tags: normalizedTags,
      ...(autoAvailabilityInitialized !== undefined
        ? { autoAvailabilityInitialized: Boolean(autoAvailabilityInitialized) }
        : { autoAvailabilityInitialized: false }),
      ...(normalizedAvailability !== undefined
        ? { rentalAvailability: normalizedAvailability }
        : {}),
      policyNumber1:
        typeof policyNumber1 === "string" && policyNumber1.trim() ? policyNumber1.trim() : undefined,
      policyBranchNumber1:
        typeof policyBranchNumber1 === "string" && policyBranchNumber1.trim()
          ? policyBranchNumber1.trim()
          : undefined,
      policyNumber2:
        typeof policyNumber2 === "string" && policyNumber2.trim() ? policyNumber2.trim() : undefined,
      policyBranchNumber2:
        typeof policyBranchNumber2 === "string" && policyBranchNumber2.trim()
          ? policyBranchNumber2.trim()
          : undefined,
      inspectionExpiryDate:
        typeof inspectionExpiryDate === "string" && inspectionExpiryDate.trim()
          ? inspectionExpiryDate
          : undefined,
      licensePlateNumber:
        typeof licensePlateNumber === "string" && licensePlateNumber.trim()
          ? licensePlateNumber.trim()
          : undefined,
      parkingNumber:
        typeof parkingNumber === "string" && parkingNumber.trim()
          ? parkingNumber.trim()
          : undefined,
      previousLicensePlateNumber:
        typeof previousLicensePlateNumber === "string" && previousLicensePlateNumber.trim()
          ? previousLicensePlateNumber.trim()
          : undefined,
      liabilityInsuranceExpiryDate:
        typeof liabilityInsuranceExpiryDate === "string" && liabilityInsuranceExpiryDate.trim()
          ? liabilityInsuranceExpiryDate
          : undefined,
      videoUrl: typeof videoUrl === "string" && videoUrl.trim() ? videoUrl.trim() : undefined,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await client.send(
      new PutCommand({
        TableName: VEHICLES_TABLE,
        Item: item,
        ConditionExpression: "attribute_not_exists(managementNumber)",
      })
    );

    response.status(201).json(item);
  } catch (error) {
    console.error("Failed to create vehicle", error);
    response.status(500).json({ message: "車両の登録に失敗しました。" });
  }
}

async function handlePut(
  request: NextApiRequest,
  response: NextApiResponse<Vehicle | { message: string }>
) {
  const {
    managementNumber,
    modelId,
    storeId,
    publishStatus,
    tags,
    autoAvailabilityInitialized,
    rentalAvailability,
    policyNumber1,
    policyBranchNumber1,
    policyNumber2,
    policyBranchNumber2,
    inspectionExpiryDate,
    licensePlateNumber,
    parkingNumber,
    previousLicensePlateNumber,
    liabilityInsuranceExpiryDate,
    videoUrl,
    notes,
  } = request.body ?? {};

  if (typeof managementNumber !== "string" || managementNumber.trim().length === 0) {
    response.status(400).json({ message: "管理番号を正しく入力してください。" });
    return;
  }

  if (typeof modelId !== "number") {
    response.status(400).json({ message: "車種を正しく選択してください。" });
    return;
  }

  if (typeof storeId !== "string" || storeId.trim().length === 0) {
    response.status(400).json({ message: "店舗IDを正しく入力してください。" });
    return;
  }

  if (publishStatus !== "ON" && publishStatus !== "OFF") {
    response.status(400).json({ message: "掲載状態を正しく選択してください。" });
    return;
  }

  const normalizedTags = Array.isArray(tags)
    ? tags
        .filter((tag) => typeof tag === "string" && tag.trim().length > 0)
        .map((tag) => tag.trim())
    : [];

  const normalizedAvailability = normalizeRentalAvailability(rentalAvailability);

  try {
    const client = getDocumentClient();

    const [existingVehicle, modelResult] = await Promise.all([
      client.send(
        new GetCommand({
          TableName: VEHICLES_TABLE,
          Key: { managementNumber: managementNumber.trim() },
        })
      ),
      client.send(
        new GetCommand({
          TableName: MODELS_TABLE,
          Key: { modelId },
        })
      ),
    ]);

    if (!existingVehicle.Item) {
      response.status(404).json({ message: "指定された車両が見つかりません。" });
      return;
    }

    if (!modelResult.Item) {
      response.status(400).json({ message: "選択された車種が存在しません。" });
      return;
    }

    const timestamp = new Date().toISOString();
    const existingVehicleItem = existingVehicle.Item as Vehicle;
    const item: Vehicle = {
      ...existingVehicleItem,
      managementNumber: managementNumber.trim(),
      modelId,
      storeId: storeId.trim(),
      publishStatus,
      tags: normalizedTags,
      ...(typeof policyNumber1 === "string" && policyNumber1.trim()
        ? { policyNumber1: policyNumber1.trim() }
        : {}),
      ...(typeof policyBranchNumber1 === "string" && policyBranchNumber1.trim()
        ? { policyBranchNumber1: policyBranchNumber1.trim() }
        : {}),
      ...(typeof policyNumber2 === "string" && policyNumber2.trim()
        ? { policyNumber2: policyNumber2.trim() }
        : {}),
      ...(typeof policyBranchNumber2 === "string" && policyBranchNumber2.trim()
        ? { policyBranchNumber2: policyBranchNumber2.trim() }
        : {}),
      ...(typeof inspectionExpiryDate === "string" && inspectionExpiryDate.trim()
        ? { inspectionExpiryDate: inspectionExpiryDate.trim() }
        : {}),
      ...(typeof licensePlateNumber === "string" && licensePlateNumber.trim()
        ? { licensePlateNumber: licensePlateNumber.trim() }
        : {}),
      ...(typeof parkingNumber === "string" && parkingNumber.trim()
        ? { parkingNumber: parkingNumber.trim() }
        : {}),
      ...(typeof previousLicensePlateNumber === "string" && previousLicensePlateNumber.trim()
        ? { previousLicensePlateNumber: previousLicensePlateNumber.trim() }
        : {}),
      ...(typeof liabilityInsuranceExpiryDate === "string" && liabilityInsuranceExpiryDate.trim()
        ? { liabilityInsuranceExpiryDate: liabilityInsuranceExpiryDate.trim() }
        : {}),
      ...(typeof videoUrl === "string" && videoUrl.trim()
        ? { videoUrl: videoUrl.trim() }
        : {}),
      ...(typeof notes === "string" && notes.trim() ? { notes: notes.trim() } : {}),
      createdAt: existingVehicleItem.createdAt,
      updatedAt: timestamp,
    };

    if (normalizedAvailability !== undefined) {
      item.rentalAvailability = normalizedAvailability;
    }

    if (autoAvailabilityInitialized !== undefined) {
      item.autoAvailabilityInitialized = Boolean(autoAvailabilityInitialized);
    }

    await client.send(
      new PutCommand({
        TableName: VEHICLES_TABLE,
        Item: item,
        ConditionExpression: "attribute_exists(managementNumber)",
      })
    );

    response.status(200).json(item);
  } catch (error) {
    console.error("Failed to update vehicle", error);
    response.status(500).json({ message: "車両の更新に失敗しました。" });
  }
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) {
    return [items];
  }

  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

async function handleDelete(
  request: NextApiRequest,
  response: NextApiResponse<{ deletedIds: string[] } | { message: string }>
) {
  const { managementNumbers } = request.body ?? {};

  if (!Array.isArray(managementNumbers) || managementNumbers.length === 0) {
    response.status(400).json({ message: "削除する車両を選択してください。" });
    return;
  }

  const normalizedNumbers = Array.from(
    new Set(
      managementNumbers
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    )
  );

  if (normalizedNumbers.length === 0) {
    response.status(400).json({ message: "車両IDの形式が正しくありません。" });
    return;
  }

  try {
    const client = getDocumentClient();

    for (const chunk of chunkArray(normalizedNumbers, 25)) {
      let pendingRequests = chunk.map((managementNumber) => ({
        DeleteRequest: {
          Key: { managementNumber },
        },
      }));

      while (pendingRequests.length > 0) {
        const { UnprocessedItems } = await client.send(
          new BatchWriteCommand({
            RequestItems: {
              [VEHICLES_TABLE]: pendingRequests,
            },
          })
        );

        pendingRequests =
          (UnprocessedItems?.[VEHICLES_TABLE] as typeof pendingRequests) ?? [];
      }
    }

    response.status(200).json({ deletedIds: normalizedNumbers });
  } catch (error) {
    console.error("Failed to delete vehicles", error);
    response.status(500).json({ message: "車両の削除に失敗しました。" });
  }
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  if (request.method === "GET") {
    await handleGet(response);
    return;
  }

  if (request.method === "POST") {
    await handlePost(request, response);
    return;
  }

  if (request.method === "PUT") {
    await handlePut(request, response);
    return;
  }

  if (request.method === "DELETE") {
    await handleDelete(request, response);
    return;
  }

  response.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  response.status(405).json({ message: "Method Not Allowed" });
}
