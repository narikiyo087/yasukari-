import type { NextApiRequest, NextApiResponse } from "next";

import { hasSmtpConfig, listBulkRecipients, sendBulkMail } from "../../../lib/bulkMailer";
import { addMailHistory } from "../../../lib/mailHistory";
import { enqueueEmail } from "../../../lib/mailQueue";
import { readNewsletterSettings } from "../../../lib/server/newsletterSettings";

type NewsletterSendRequest = {
  mode?: "preview" | "test" | "send";
  email?: string;
};

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const htmlToText = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "POST メソッドのみ対応しています。" });
  }

  const { mode, email } = (req.body ?? {}) as NewsletterSendRequest;

  let settings;
  try {
    settings = await readNewsletterSettings();
  } catch (error) {
    console.error("[newsletter-send] Failed to read newsletter settings", error);
    return res.status(500).json({ message: "メルマガ設定の読み込みに失敗しました。" });
  }

  const subject = settings?.subject?.trim() ?? "";
  const htmlContent = settings?.htmlContent ?? "";
  if (!subject || !htmlContent.trim()) {
    return res.status(400).json({
      message: "件名とHTML本文を保存してから配信してください。",
    });
  }

  const text = htmlToText(htmlContent) || subject;

  if (mode === "preview") {
    try {
      const summary = await listBulkRecipients("marketing");
      return res.status(200).json({
        smtpConfigured: hasSmtpConfig(),
        subject,
        recipientCount: summary.recipients.length,
        excludedOptedOut: summary.excludedOptedOut,
        excludedNoEmail: summary.excludedNoEmail,
        excludedInactive: summary.excludedInactive,
      });
    } catch (error) {
      console.error("[newsletter-send] Failed to build recipient preview", error);
      return res.status(500).json({
        message: "配信対象の取得に失敗しました。Cognito・DynamoDBの設定をご確認ください。",
      });
    }
  }

  if (mode === "test") {
    const normalizedEmail = typeof email === "string" ? email.trim() : "";
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "有効なメールアドレスを入力してください。" });
    }

    if (!hasSmtpConfig()) {
      await addMailHistory({
        to: normalizedEmail,
        subject,
        status: "skipped",
        category: "メルマガ",
        errorMessage: "SMTP設定不足のため送信できませんでした。",
      });
      return res.status(200).json({
        message: "SMTP設定不足のため送信をスキップしました。",
        status: "skipped",
      });
    }

    try {
      await enqueueEmail({
        to: normalizedEmail,
        subject,
        text,
        html: htmlContent,
        category: "メルマガ",
        mirrorToSite: false,
      });
      return res.status(200).json({
        message: `テスト配信を送信しました（${normalizedEmail}）。`,
        status: "sent",
      });
    } catch (error) {
      console.error("[newsletter-send] Failed to send test newsletter", error);
      return res.status(500).json({ message: "テスト配信の送信に失敗しました。" });
    }
  }

  if (mode === "send") {
    try {
      const { recipients } = await listBulkRecipients("marketing");
      if (recipients.length === 0) {
        return res.status(200).json({
          message:
            "メルマガの受信をオンにしている会員がいないため、配信は行われませんでした。（メルマガはオプトイン制です）",
          summary: { emailSent: 0, emailSkipped: 0, emailFailed: 0, siteRecorded: 0 },
        });
      }

      const summary = await sendBulkMail({
        recipients,
        subject,
        text,
        html: htmlContent,
        category: "メルマガ",
      });

      return res.status(200).json({
        message: `メルマガ配信が完了しました。メール送信 ${summary.emailSent}件 / スキップ ${summary.emailSkipped}件 / 失敗 ${summary.emailFailed}件 / サイト内通知 ${summary.siteRecorded}件`,
        summary,
      });
    } catch (error) {
      console.error("[newsletter-send] Failed to send newsletter", error);
      return res.status(500).json({ message: "メルマガ配信に失敗しました。" });
    }
  }

  return res.status(400).json({ message: "mode には preview / test / send を指定してください。" });
}
