import {
  DeleteCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

import { getDocumentClient } from "../dynamodb";

export type HighSeasonRecord = {
  date: string;
  isHighSeason: boolean;
};

const TABLE_NAME = "highSeasonFeeCalendar";

type DynamoHighSeasonRecord = {
  date: string;
  is_high_season: boolean;
};

export async function readHighSeasonRecords(
  month?: string
): Promise<HighSeasonRecord[]> {
  const client = getDocumentClient();
  const records: DynamoHighSeasonRecord[] = [];
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const response = await client.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        ...(month
          ? {
              FilterExpression: "begins_with(#date, :month_prefix)",
              ExpressionAttributeNames: {
                "#date": "date",
              },
              ExpressionAttributeValues: {
                ":month_prefix": `${month}-`,
              },
            }
          : {}),
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    records.push(...((response.Items ?? []) as DynamoHighSeasonRecord[]));
    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return records.map((record) => ({
    date: record.date,
    isHighSeason: record.is_high_season,
  }));
}

export async function upsertHighSeasonRecord(
  record: HighSeasonRecord
): Promise<void> {
  const client = getDocumentClient();
  await client.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        date: record.date,
        is_high_season: record.isHighSeason,
      } satisfies DynamoHighSeasonRecord,
    })
  );
}

export async function removeHighSeasonRecord(date: string): Promise<void> {
  const client = getDocumentClient();
  await client.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        date,
      },
    })
  );
}
