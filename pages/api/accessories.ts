import type { NextApiRequest, NextApiResponse } from "next";
import { BatchWriteCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

import { generateNextNumericId, getDocumentClient } from "../../lib/dynamodb";
import { Accessory, AccessoryPriceKey } from "../../lib/dashboard/types";

const TABLE_NAME = process.env.RENTAL_ACCESSORIES_TABLE ?? "RentalAccessories";
const PRICE_KEYS: AccessoryPriceKey[] = ["24h", "2d", "4d", "1w", "2w", "1m", "extra24h"];

type AccessoryResponse =
  | Accessory
  | Accessory[]
  | { message: string }
  | { deletedIds: number[] };

const normalizePriceValue = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const sanitized = value.replace(/,/g, "").trim();
    if (!sanitized) {
      return undefined;
    }

    const parsed = Number(sanitized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const normalizePrices = (
  prices: unknown
): Partial<Record<AccessoryPriceKey, number>> | null => {
  if (!prices || typeof prices !== "object") {
    return null;
  }

  const entries = PRICE_KEYS.map((key) => {
    const value = normalizePriceValue((prices as Record<string, unknown>)[key]);
    return value == null ? null : ([key, value] as const);
  }).filter((entry): entry is [AccessoryPriceKey, number] => Boolean(entry));

  if (entries.length === 0) {
    return null;
  }

  return Object.fromEntries(entries);
};

async function handleGet(response: NextApiResponse<AccessoryResponse>) {
  try {
    const client = getDocumentClient();
    const result = await client.send(new ScanCommand({ TableName: TABLE_NAME }));
    const items = ((result.Items ?? []) as Accessory[]).sort(
      (a, b) => a.accessory_id - b.accessory_id
    );
    response.status(200).json(items);
  } catch (error) {
    console.error("Failed to fetch accessories", error);
    response
      .status(500)
      .json({ message: "オプション用品の取得に失敗しました。" });
  }
}

async function handlePost(
  request: NextApiRequest,
  response: NextApiResponse<AccessoryResponse>
) {
  const { name, prices } = request.body ?? {};

  if (typeof name !== "string" || name.trim().length === 0) {
    response.status(400).json({ message: "用品名を入力してください。" });
    return;
  }

  const normalizedPrices = normalizePrices(prices);
  if (!normalizedPrices) {
    response.status(400).json({ message: "料金を1つ以上入力してください。" });
    return;
  }

  try {
    const client = getDocumentClient();
    const timestamp = new Date().toISOString();
    const accessoryId = await generateNextNumericId(TABLE_NAME, "accessory_id");

    const item: Accessory = {
      accessory_id: accessoryId,
      name: name.trim(),
      prices: normalizedPrices,
      updated_at: timestamp,
    };

    await client.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: "attribute_not_exists(accessory_id)",
      })
    );

    response.status(201).json(item);
  } catch (error) {
    console.error("Failed to create accessory", error);
    response.status(500).json({ message: "用品の登録に失敗しました。" });
  }
}

async function handlePut(
  request: NextApiRequest,
  response: NextApiResponse<AccessoryResponse>
) {
  const { accessory_id, name, prices } = request.body ?? {};

  if (typeof accessory_id !== "number") {
    response.status(400).json({ message: "用品IDを指定してください。" });
    return;
  }

  if (typeof name !== "string" || name.trim().length === 0) {
    response.status(400).json({ message: "用品名を入力してください。" });
    return;
  }

  const normalizedPrices = normalizePrices(prices);
  if (!normalizedPrices) {
    response.status(400).json({ message: "料金を1つ以上入力してください。" });
    return;
  }

  try {
    const client = getDocumentClient();
    const timestamp = new Date().toISOString();
    const item: Accessory = {
      accessory_id,
      name: name.trim(),
      prices: normalizedPrices,
      updated_at: timestamp,
    };

    await client.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: "attribute_exists(accessory_id)",
      })
    );

    response.status(200).json(item);
  } catch (error) {
    console.error("Failed to update accessory", error);
    response.status(500).json({ message: "用品の更新に失敗しました。" });
  }
}

async function handleDelete(
  request: NextApiRequest,
  response: NextApiResponse<AccessoryResponse>
) {
  const { accessoryIds } = request.body ?? {};

  if (!Array.isArray(accessoryIds) || accessoryIds.length === 0) {
    response.status(400).json({ message: "削除対象の用品を選択してください。" });
    return;
  }

  const numericIds = accessoryIds.filter(
    (value): value is number => typeof value === "number"
  );

  if (numericIds.length === 0) {
    response.status(400).json({ message: "削除対象の用品を選択してください。" });
    return;
  }

  try {
    const client = getDocumentClient();
    await client.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: numericIds.map((accessoryId) => ({
            DeleteRequest: { Key: { accessory_id: accessoryId } },
          })),
        },
      })
    );

    response.status(200).json({ deletedIds: numericIds });
  } catch (error) {
    console.error("Failed to delete accessories", error);
    response.status(500).json({ message: "用品の削除に失敗しました。" });
  }
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<AccessoryResponse>
) {
  switch (request.method) {
    case "GET":
      await handleGet(response);
      break;
    case "POST":
      await handlePost(request, response);
      break;
    case "PUT":
      await handlePut(request, response);
      break;
    case "DELETE":
      await handleDelete(request, response);
      break;
    default:
      response.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      response.status(405).json({ message: "Method Not Allowed" });
  }
}
