import { randomUUID } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import { getDocumentClient } from "../../../../lib/dynamodb";
import { ChatHistoryEntry } from "../../../../lib/chatbot/inquiries";
import { EMAIL_FOOTER_TEXT_LINES } from "../../../../lib/emailFooter";
import { addMailHistory } from "../../../../lib/mailHistory";
import { enqueueEmail } from "../../../../lib/mailQueue";
import { fetchMemberEmail } from "../../../../lib/memberContact";
import { recordUserNotification } from "../../../../lib/userNotifications";

type ChatSessionRecord = {
  session_id: string;
  user_id?: string | null;
  client_id: string;
  is_logged_in?: boolean;
  created_at: string;
  last_activity_at: string;
};

type ChatMessageRecord = {
  session_id: string;
  message_id: string;
  message_index: number | string;
  role: "user" | "assistant";
  content: string;
  user_id?: string | null;
  client_id: string;
  created_at: string;
  history?: ChatHistoryEntry[];
};

type InquiryDetailResponse = {
  inquiry: {
    sessionId: string;
    isLoggedIn: boolean;
    userId: string | null;
    clientId: string;
    createdAt: string;
    lastActivityAt: string;
    messages: Array<{
      messageId: string;
      role: "user" | "assistant";
      content: string;
      userId: string | null;
      clientId: string;
      createdAt: string;
      messageIndex: number;
    }>;
    history?: ChatHistoryEntry[];
  };
  notification?: {
    siteNotified: boolean;
    emailStatus: "sent" | "skipped" | "not_available";
  };
};

function normalizeSession(record: ChatSessionRecord) {
  return {
    sessionId: record.session_id,
    isLoggedIn: Boolean(record.is_logged_in || record.user_id),
    userId: typeof record.user_id === "string" ? record.user_id : null,
    clientId: record.client_id,
    createdAt: record.created_at,
    lastActivityAt: record.last_activity_at,
  };
}

function normalizeMessages(records: ChatMessageRecord[]) {
  return records.map((message) => ({
    messageId: message.message_id,
    role: message.role,
    content: message.content,
    userId: typeof message.user_id === "string" ? message.user_id : null,
    clientId: message.client_id,
    createdAt: message.created_at,
    messageIndex:
      typeof message.message_index === "number"
        ? message.message_index
        : Number(message.message_index),
    history: message.history,
  }));
}

async function findLatestMessageIndex(sessionId: string) {
  const client = getDocumentClient();
  const response = await client.send(
    new QueryCommand({
      TableName: "ChatMessages",
      KeyConditionExpression: "session_id = :sessionId",
      ExpressionAttributeValues: { ":sessionId": sessionId },
      ProjectionExpression: "message_index",
      ScanIndexForward: false,
      Limit: 1,
    })
  );

  const latest = response.Items?.[0]?.message_index;
  if (typeof latest === "number") {
    return latest;
  }

  const parsed = Number(latest);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function fetchSession(sessionId: string) {
  const client = getDocumentClient();
  const session = await client.send(
    new GetCommand({
      TableName: "ChatSessions",
      Key: { session_id: sessionId },
    })
  );

  return session.Item as ChatSessionRecord | undefined;
}

async function fetchMessages(sessionId: string) {
  const client = getDocumentClient();
  const response = await client.send(
    new QueryCommand({
      TableName: "ChatMessages",
      KeyConditionExpression: "session_id = :sessionId",
      ExpressionAttributeValues: { ":sessionId": sessionId },
      ScanIndexForward: true,
    })
  );

  return normalizeMessages((response.Items ?? []) as ChatMessageRecord[]);
}

async function fetchHistory(sessionId: string): Promise<ChatHistoryEntry[]> {
  const client = getDocumentClient();
  const response = await client.send(
    new QueryCommand({
      TableName: "ChatMessages",
      KeyConditionExpression: "session_id = :sessionId",
      ExpressionAttributeValues: { ":sessionId": sessionId },
      ProjectionExpression: "message_id, #role, content, created_at, user_id, client_id",
      ExpressionAttributeNames: { "#role": "role" },
      ScanIndexForward: true,
    })
  );

  return (response.Items ?? []).map((item) => ({
    messageId: String(item.message_id ?? ""),
    role: (item.role as ChatHistoryEntry["role"]) ?? "user",
    content: String(item.content ?? ""),
    createdAt: String(item.created_at ?? ""),
    userId: typeof item.user_id === "string" ? item.user_id : null,
    clientId: String(item.client_id ?? ""),
  }));
}

async function appendReply(session: ChatSessionRecord, content: string) {
  const client = getDocumentClient();
  const now = new Date().toISOString();
  const nextIndex = (await findLatestMessageIndex(session.session_id)) + 1;
  const messageId = randomUUID();
  const history = await fetchHistory(session.session_id);
  const updatedHistory: ChatHistoryEntry[] = history.concat({
    messageId,
    role: "assistant",
    content,
    createdAt: now,
    userId: typeof session.user_id === "string" ? session.user_id : null,
    clientId: session.client_id,
  });

  await client.send(
    new PutCommand({
      TableName: "ChatMessages",
      Item: {
        session_id: session.session_id,
        message_id: messageId,
        message_index: nextIndex,
        role: "assistant",
        content,
        user_id: session.user_id ?? null,
        client_id: session.client_id,
        created_at: now,
        history: updatedHistory,
      },
    })
  );

  await client.send(
    new UpdateCommand({
      TableName: "ChatSessions",
      Key: { session_id: session.session_id },
      UpdateExpression:
        "SET #last_activity_at = :now, #user_id = :user_id, #client_id = :client_id, #is_logged_in = :is_logged_in",
      ExpressionAttributeNames: {
        "#last_activity_at": "last_activity_at",
        "#user_id": "user_id",
        "#client_id": "client_id",
        "#is_logged_in": "is_logged_in",
      },
      ExpressionAttributeValues: {
        ":now": now,
        ":user_id": session.user_id ?? null,
        ":client_id": session.client_id,
        ":is_logged_in": Boolean(session.is_logged_in || session.user_id),
      },
    })
  );

  return {
    messageId,
    content,
    role: "assistant" as const,
    userId: typeof session.user_id === "string" ? session.user_id : null,
    clientId: session.client_id,
    createdAt: now,
    messageIndex: nextIndex,
    lastActivityAt: now,
    history: updatedHistory,
  };
}

type ReplyNotificationResult = {
  siteNotified: boolean;
  emailStatus: "sent" | "skipped" | "not_available";
};

const REPLY_SUBJECT = "【ヤスカリ】お問い合わせに返信がありました";

const hasSmtpConfig = (): boolean =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const buildReplyNotificationBody = (content: string): string =>
  [
    "ヤスカリへのお問い合わせに、スタッフから返信がありました。",
    "",
    "■返信内容",
    "----------------------------------------",
    content,
    "----------------------------------------",
    "",
    "続きのやり取りは、サイト右下のチャットからご確認いただけます。",
    "",
    "※お問い合わせは、本メールにご返信いただいても対応いたします。",
    "",
    ...EMAIL_FOOTER_TEXT_LINES,
  ].join("\n");

async function notifyCustomerOfReply(
  session: ChatSessionRecord,
  content: string
): Promise<ReplyNotificationResult> {
  const result: ReplyNotificationResult = {
    siteNotified: false,
    emailStatus: "not_available",
  };

  const userId = typeof session.user_id === "string" && session.user_id ? session.user_id : null;
  if (!userId) {
    return result;
  }

  const body = buildReplyNotificationBody(content);
  const memberEmail = await fetchMemberEmail(userId);

  if (memberEmail && hasSmtpConfig()) {
    try {
      await enqueueEmail({
        to: memberEmail,
        subject: REPLY_SUBJECT,
        text: body,
        category: "問い合わせ",
        userIdForNotification: userId,
        notificationBody: body,
        mirrorToSite: true,
      });
      result.siteNotified = true;
      result.emailStatus = "sent";
      return result;
    } catch (error) {
      console.error("[chatbot] Failed to send reply email", { sessionId: session.session_id, error });
    }
  } else if (memberEmail) {
    result.emailStatus = "skipped";
    try {
      await addMailHistory({
        to: memberEmail,
        subject: REPLY_SUBJECT,
        status: "skipped",
        category: "問い合わせ",
        errorMessage: "SMTP設定不足のため送信できませんでした。",
      });
    } catch (error) {
      console.error("[chatbot] Failed to record skipped mail history", error);
    }
  }

  try {
    await recordUserNotification({
      userId,
      subject: REPLY_SUBJECT,
      body,
      category: "問い合わせ",
      channels: ["site"],
      recipientEmail: memberEmail ?? undefined,
    });
    result.siteNotified = true;
  } catch (error) {
    console.error("[chatbot] Failed to record reply notification", {
      sessionId: session.session_id,
      error,
    });
  }

  return result;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InquiryDetailResponse | { error: string }>
) {
  const { sessionId } = req.query;

  if (typeof sessionId !== "string") {
    return res.status(400).json({ error: "sessionId is required" });
  }

  const session = await fetchSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (req.method === "POST") {
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (content.length === 0) {
      return res.status(400).json({ error: "content is required" });
    }

    const reply = await appendReply(session, content);
    const notification = await notifyCustomerOfReply(session, content);
    return res.status(200).json({
      inquiry: {
        ...normalizeSession({ ...session, last_activity_at: reply.lastActivityAt }),
        messages: [reply],
        history: reply.history,
      },
      notification,
    });
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method ?? "unknown"} Not Allowed` });
  }

  const messages = await fetchMessages(sessionId);
  const history =
    messages[messages.length - 1]?.history ?? (await fetchHistory(sessionId));

  return res.status(200).json({
    inquiry: {
      ...normalizeSession(session),
      messages,
      history,
    },
  });
}
