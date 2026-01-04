import { randomUUID } from "crypto";

import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import { getDocumentClient } from "./dynamodb";

export type NotificationChannel = "email" | "site";

export type UserNotificationRecord = {
  userId: string;
  notificationId: string;
  subject: string;
  body: string;
  category?: string;
  channels: NotificationChannel[];
  createdAt: string;
  readAt?: string;
  recipientEmail?: string;
};

export type NotificationSettings = {
  receiveEmail: boolean;
  receiveSite: boolean;
  receiveMarketing: boolean;
  receiveBroadcast: boolean;
  updatedAt: string;
};

type NotificationItem = UserNotificationRecord & {
  sortKey: string;
  itemType: "notification";
};

type SettingsItem = NotificationSettings & {
  userId: string;
  sortKey: "SETTINGS";
  itemType: "settings";
};

const TABLE_NAME = process.env.USER_NOTIFICATIONS_TABLE ?? "UserNotifications";

const toSettings = (item: Partial<SettingsItem> | undefined): NotificationSettings => ({
  receiveEmail: item?.receiveEmail ?? true,
  receiveSite: item?.receiveSite ?? true,
  receiveMarketing: item?.receiveMarketing ?? false,
  receiveBroadcast: item?.receiveBroadcast ?? true,
  updatedAt: item?.updatedAt ?? new Date(0).toISOString(),
});

const normalizeChannels = (channels?: NotificationChannel[]): NotificationChannel[] => {
  const base: NotificationChannel[] = channels?.length ? channels : ["email", "site"];
  return Array.from(new Set(base));
};

export async function recordUserNotification(
  params: Omit<UserNotificationRecord, "notificationId" | "createdAt" | "channels"> & {
    channels?: NotificationChannel[];
  }
): Promise<UserNotificationRecord> {
  const client = getDocumentClient();
  const notificationId = randomUUID();
  const createdAt = new Date().toISOString();
  const channels = normalizeChannels(params.channels);

  const item: NotificationItem = {
    ...params,
    channels,
    userId: params.userId,
    notificationId,
    createdAt,
    sortKey: `NOTIFICATION#${createdAt}#${notificationId}`,
    itemType: "notification",
  };

  await client.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  return item;
}

export async function fetchUserNotifications(
  userId: string,
  limit = 30
): Promise<UserNotificationRecord[]> {
  const client = getDocumentClient();
  const response = await client.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "userId = :userId AND begins_with(sortKey, :prefix)",
      ExpressionAttributeValues: {
        ":userId": userId,
        ":prefix": "NOTIFICATION#",
      },
      ScanIndexForward: false,
      Limit: limit,
    })
  );

  return (response.Items ?? [])
    .filter((item): item is NotificationItem => item.itemType === "notification")
    .map((item) => ({
      userId: item.userId,
      notificationId: item.notificationId,
      subject: item.subject,
      body: item.body,
      category: item.category,
      channels: normalizeChannels(item.channels as NotificationChannel[] | undefined),
      createdAt: item.createdAt,
      readAt: item.readAt,
      recipientEmail: item.recipientEmail,
    }));
}

export async function getUserNotificationSettings(userId: string): Promise<NotificationSettings> {
  const client = getDocumentClient();
  const response = await client.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId, sortKey: "SETTINGS" },
    })
  );

  return toSettings(response.Item as SettingsItem | undefined);
}

export async function saveUserNotificationSettings(
  userId: string,
  settings: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  const nextSettings: SettingsItem = {
    ...toSettings(undefined),
    ...settings,
    userId,
    sortKey: "SETTINGS",
    itemType: "settings",
    updatedAt: new Date().toISOString(),
  };

  const client = getDocumentClient();
  await client.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: nextSettings,
    })
  );

  return toSettings(nextSettings);
}

export async function markUserNotificationRead(
  userId: string,
  notificationId: string,
  createdAt: string
): Promise<string> {
  const client = getDocumentClient();
  const readAt = new Date().toISOString();
  const sortKey = `NOTIFICATION#${createdAt}#${notificationId}`;

  await client.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId, sortKey },
      UpdateExpression: "SET readAt = :readAt",
      ExpressionAttributeValues: {
        ":readAt": readAt,
      },
      ConditionExpression: "attribute_exists(notificationId)",
    })
  );

  return readAt;
}
