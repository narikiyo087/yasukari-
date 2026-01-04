import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

import { getDocumentClient } from "./dynamodb";

export type MailHistoryStatus = "sent" | "failed" | "skipped";

export type MailHistoryCategory = "仮登録" | "本登録" | "予約完了" | "レンタル延長" | "その他";

export type MailHistoryEntry = {
  id: string;
  category: MailHistoryCategory;
  to: string;
  subject: string;
  status: MailHistoryStatus;
  errorMessage?: string;
  createdAt: string;
};

const MAX_HISTORY_LENGTH = 500;
const TABLE_NAME = process.env.MAIL_HISTORY_TABLE_NAME ?? "usermailHistory";
const inMemoryHistory: MailHistoryEntry[] = [];

const sortByCreatedAtDesc = (entries: MailHistoryEntry[]): MailHistoryEntry[] =>
  [...entries].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

const toCategory = (value?: string): MailHistoryCategory => {
  if (value === "仮登録" || value === "本登録" || value === "予約完了" || value === "レンタル延長") {
    return value;
  }

  return "その他";
};

const normalizeRecipient = (recipient: string): string => recipient.trim().toLowerCase();

const matchesEntry = (
  entry: MailHistoryEntry,
  to: string,
  category: MailHistoryCategory,
  status?: MailHistoryStatus
): boolean => {
  const normalizedTo = normalizeRecipient(to);
  const normalizedEntryTo = normalizeRecipient(entry.to);
  if (normalizedEntryTo !== normalizedTo) return false;
  if (entry.category !== category) return false;
  if (status && entry.status !== status) return false;
  return true;
};

async function saveToDynamo(record: MailHistoryEntry): Promise<void> {
  const client = getDocumentClient();
  await client.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: record,
    })
  );
}

async function fetchHistoryFromDynamo(limit: number): Promise<MailHistoryEntry[]> {
  const client = getDocumentClient();
  const response = await client.send(
    new ScanCommand({
      TableName: TABLE_NAME,
    })
  );

  const entries = sortByCreatedAtDesc((response.Items ?? []) as MailHistoryEntry[]);
  return entries.slice(0, limit);
}

export async function addMailHistory(
  entry: Omit<MailHistoryEntry, "id" | "createdAt"> & { createdAt?: string }
): Promise<MailHistoryEntry> {
  const record: MailHistoryEntry = {
    ...entry,
    id: randomUUID(),
    category: toCategory(entry.category),
    createdAt: entry.createdAt || new Date().toISOString(),
  };

  inMemoryHistory.unshift(record);

  if (inMemoryHistory.length > MAX_HISTORY_LENGTH) {
    inMemoryHistory.length = MAX_HISTORY_LENGTH;
  }

  try {
    await saveToDynamo(record);
  } catch (error) {
    console.error(`[mailHistory] Failed to save mail history to ${TABLE_NAME}`, error);
  }

  return record;
}

export async function getMailHistory(limit = 200): Promise<MailHistoryEntry[]> {
  const effectiveLimit = Math.max(1, Math.min(limit, MAX_HISTORY_LENGTH));
  try {
    return await fetchHistoryFromDynamo(effectiveLimit);
  } catch (error) {
    console.error(`[mailHistory] Failed to load mail history from ${TABLE_NAME}`, error);
    return inMemoryHistory.slice(0, effectiveLimit);
  }
}

export async function hasMailHistoryEntry(options: {
  to: string;
  category: MailHistoryCategory;
  status?: MailHistoryStatus;
}): Promise<boolean> {
  const { to, category, status } = options;

  if (inMemoryHistory.some((entry) => matchesEntry(entry, to, category, status))) {
    return true;
  }

  try {
    const client = getDocumentClient();
    const filterParts = ['#to = :to', '#category = :category'];
    const values: Record<string, string> = {
      ':to': normalizeRecipient(to),
      ':category': category,
    };

    if (status) {
      filterParts.push('#status = :status');
      values[':status'] = status;
    }

    const response = await client.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: filterParts.join(' AND '),
        ExpressionAttributeNames: {
          '#to': 'to',
          '#category': 'category',
          '#status': 'status',
        },
        ExpressionAttributeValues: values,
        Limit: 1,
      })
    );

    const entries = (response.Items ?? []) as MailHistoryEntry[];
    return entries.length > 0;
  } catch (error) {
    console.error(`[mailHistory] Failed to check mail history in ${TABLE_NAME}`, error);
    return false;
  }
}
