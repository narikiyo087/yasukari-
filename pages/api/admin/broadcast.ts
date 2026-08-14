import type { NextApiRequest, NextApiResponse } from "next";

import { EMAIL_FOOTER_TEXT_LINES } from "../../../lib/emailFooter";
import { hasSmtpConfig, listBulkRecipients, sendBulkMail } from "../../../lib/bulkMailer";

const MAX_SUBJECT_LENGTH = 200;
const MAX_BODY_LENGTH = 8000;

type BroadcastRequest = {
  mode?: "preview" | "send";
  subject?: string;
  body?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "POST メソッドのみ対応しています。" });
  }

  const { mode, subject, body } = (req.body ?? {}) as BroadcastRequest;

  if (mode === "preview") {
    try {
      const summary = await listBulkRecipients("broadcast");
      return res.status(200).json({
        smtpConfigured: hasSmtpConfig(),
        recipientCount: summary.recipients.length,
        emailRecipientCount: summary.recipients.filter((r) => r.emailEnabled).length,
        excludedOptedOut: summary.excludedOptedOut,
        excludedNoEmail: summary.excludedNoEmail,
        excludedInactive: summary.excludedInactive,
      });
    } catch (error) {
      console.error("[broadcast] Failed to build recipient preview", error);
      return res.status(500).json({
        message: "配信対象の取得に失敗しました。Cognito・DynamoDBの設定をご確認ください。",
      });
    }
  }

  const normalizedSubject = typeof subject === "string" ? subject.trim() : "";
  const normalizedBody = typeof body === "string" ? body.trim() : "";

  if (!normalizedSubject || normalizedSubject.length > MAX_SUBJECT_LENGTH) {
    return res.status(400).json({ message: "件名を入力してください。" });
  }
  if (!normalizedBody || normalizedBody.length > MAX_BODY_LENGTH) {
    return res.status(400).json({ message: "本文を入力してください。" });
  }

  try {
    const { recipients } = await listBulkRecipients("broadcast");
    if (recipients.length === 0) {
      return res.status(200).json({
        message: "配信対象の会員がいないため、配信は行われませんでした。",
        summary: { emailSent: 0, emailSkipped: 0, emailFailed: 0, siteRecorded: 0 },
      });
    }

    const text = [normalizedBody, "", ...EMAIL_FOOTER_TEXT_LINES].join("\n");
    const summary = await sendBulkMail({
      recipients,
      subject: normalizedSubject,
      text,
      category: "全体通知",
    });

    return res.status(200).json({
      message: `配信が完了しました。メール送信 ${summary.emailSent}件 / スキップ ${summary.emailSkipped}件 / 失敗 ${summary.emailFailed}件 / サイト内通知 ${summary.siteRecorded}件`,
      summary,
    });
  } catch (error) {
    console.error("[broadcast] Failed to send broadcast", error);
    return res.status(500).json({ message: "全体通知の配信に失敗しました。" });
  }
}
