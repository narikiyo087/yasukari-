import type { NextApiRequest, NextApiResponse } from "next";

import { COGNITO_ID_TOKEN_COOKIE, verifyCognitoIdToken } from "../../../lib/cognitoServer";
import {
  fetchUserNotifications,
  getUserNotificationSettings,
  markUserNotificationRead,
  saveUserNotificationSettings,
} from "../../../lib/userNotifications";

const AUTH_REQUIRED_MESSAGE = "通知を受け取るには、ログインを完了してください。";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let userId: string | null = null;
  try {
    const token = req.cookies?.[COGNITO_ID_TOKEN_COOKIE];
    const payload = await verifyCognitoIdToken(token);
    userId = payload?.sub ?? null;
  } catch (error) {
    console.error("Failed to verify authentication for notifications", error);
    return res.status(503).json({ message: "通知機能の認証に失敗しました。時間をおいて再度お試しください。" });
  }

  if (!userId) {
    return res.status(401).json({ message: AUTH_REQUIRED_MESSAGE });
  }

  if (req.method === "GET") {
    const rawLimit = Number.parseInt(String(req.query.limit ?? ""), 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 30;

    try {
      const [notifications, settings] = await Promise.all([
        fetchUserNotifications(userId, limit),
        getUserNotificationSettings(userId),
      ]);

      return res.status(200).json({ notifications, settings });
    } catch (error) {
      console.error("Failed to load notifications", error);
      return res.status(500).json({ message: "通知の取得に失敗しました。" });
    }
  }

  if (req.method === "PUT") {
    const { receiveEmail, receiveSite, receiveMarketing, receiveBroadcast } = (req.body ?? {}) as {
      receiveEmail?: unknown;
      receiveSite?: unknown;
      receiveMarketing?: unknown;
      receiveBroadcast?: unknown;
    };

    if (receiveEmail !== undefined && typeof receiveEmail !== "boolean") {
      return res.status(400).json({ message: "receiveEmail must be a boolean" });
    }
    if (receiveSite !== undefined && typeof receiveSite !== "boolean") {
      return res.status(400).json({ message: "receiveSite must be a boolean" });
    }
    if (receiveMarketing !== undefined && typeof receiveMarketing !== "boolean") {
      return res.status(400).json({ message: "receiveMarketing must be a boolean" });
    }
    if (receiveBroadcast !== undefined && typeof receiveBroadcast !== "boolean") {
      return res.status(400).json({ message: "receiveBroadcast must be a boolean" });
    }

    try {
      const settings = await saveUserNotificationSettings(userId, {
        receiveEmail: receiveEmail as boolean | undefined,
        receiveSite: receiveSite as boolean | undefined,
        receiveMarketing: receiveMarketing as boolean | undefined,
        receiveBroadcast: receiveBroadcast as boolean | undefined,
      });
      return res.status(200).json({ settings });
    } catch (error) {
      console.error("Failed to update notification settings", error);
      return res.status(500).json({ message: "通知設定の更新に失敗しました。" });
    }
  }

  if (req.method === "PATCH") {
    const { notificationId, createdAt } = (req.body ?? {}) as {
      notificationId?: unknown;
      createdAt?: unknown;
    };

    if (!notificationId || typeof notificationId !== "string") {
      return res.status(400).json({ message: "notificationId is required" });
    }
    if (!createdAt || typeof createdAt !== "string") {
      return res.status(400).json({ message: "createdAt is required" });
    }

    try {
      const readAt = await markUserNotificationRead(userId, notificationId, createdAt);
      return res.status(200).json({ readAt });
    } catch (error) {
      console.error("Failed to mark notification as read", error);
      return res.status(500).json({ message: "通知の既読処理に失敗しました。" });
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "PATCH"]);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}
