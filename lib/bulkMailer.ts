import { addMailHistory, MailHistoryCategory } from "./mailHistory";
import { enqueueEmail } from "./mailQueue";
import { getUserNotificationSettings, recordUserNotification } from "./userNotifications";

export type BulkRecipient = {
  userId: string;
  email: string;
  name: string;
  /** メール配信の対象か（false の場合はサイト内通知のみ） */
  emailEnabled: boolean;
};

export type BulkRecipientSummary = {
  recipients: BulkRecipient[];
  excludedOptedOut: number;
  excludedNoEmail: number;
  excludedInactive: number;
};

export type BulkAudience = "broadcast" | "marketing";

export type BulkSendSummary = {
  emailSent: number;
  emailSkipped: number;
  emailFailed: number;
  siteRecorded: number;
};

export const hasSmtpConfig = (): boolean =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * 配信対象の会員一覧を取得する。
 * - broadcast: 全体通知を受け取る設定（既定オン）の会員
 * - marketing: メルマガ・クーポンをオンにした会員のみ（opt-in）
 */
export async function listBulkRecipients(
  audience: BulkAudience
): Promise<BulkRecipientSummary> {
  const { fetchMembers } = await import("./adminMembers");
  const members = await fetchMembers();

  const summary: BulkRecipientSummary = {
    recipients: [],
    excludedOptedOut: 0,
    excludedNoEmail: 0,
    excludedInactive: 0,
  };

  for (const member of members) {
    if (member.isBlacklisted || member.status === "退会済み") {
      summary.excludedInactive += 1;
      continue;
    }

    if (!member.email || !isValidEmail(member.email)) {
      summary.excludedNoEmail += 1;
      continue;
    }

    let settings;
    try {
      settings = await getUserNotificationSettings(member.id);
    } catch (error) {
      console.error("[bulkMailer] Failed to load notification settings", member.id, error);
      settings = null;
    }

    if (audience === "marketing") {
      if (!settings?.receiveMarketing) {
        summary.excludedOptedOut += 1;
        continue;
      }
    } else if (settings && settings.receiveBroadcast === false) {
      summary.excludedOptedOut += 1;
      continue;
    }

    summary.recipients.push({
      userId: member.id,
      email: member.email,
      name: member.name,
      emailEnabled: settings ? settings.receiveEmail !== false : true,
    });
  }

  return summary;
}

/**
 * 対象者へメール（SMTP設定時）とサイト内通知を配信する。
 * SMTP未設定時はメール履歴に skipped を記録し、サイト内通知のみ行う。
 */
export async function sendBulkMail(options: {
  recipients: BulkRecipient[];
  subject: string;
  text: string;
  html?: string;
  category: MailHistoryCategory;
}): Promise<BulkSendSummary> {
  const { recipients, subject, text, html, category } = options;
  const smtpReady = hasSmtpConfig();
  const summary: BulkSendSummary = {
    emailSent: 0,
    emailSkipped: 0,
    emailFailed: 0,
    siteRecorded: 0,
  };

  for (const recipient of recipients) {
    if (smtpReady && recipient.emailEnabled) {
      try {
        await enqueueEmail({
          to: recipient.email,
          subject,
          text,
          html,
          category,
          userIdForNotification: recipient.userId,
          notificationBody: text,
          mirrorToSite: true,
        });
        summary.emailSent += 1;
        summary.siteRecorded += 1;
        continue;
      } catch (error) {
        console.error("[bulkMailer] Failed to send email", recipient.email, error);
        summary.emailFailed += 1;
      }
    } else {
      summary.emailSkipped += 1;
      try {
        await addMailHistory({
          to: recipient.email,
          subject,
          status: "skipped",
          category,
          errorMessage: smtpReady
            ? "メール通知がオフのため送信をスキップしました。"
            : "SMTP設定不足のため送信できませんでした。",
        });
      } catch (error) {
        console.error("[bulkMailer] Failed to record skipped mail history", error);
      }
    }

    try {
      await recordUserNotification({
        userId: recipient.userId,
        subject,
        body: text,
        category,
        channels: ["site"],
        recipientEmail: recipient.email,
      });
      summary.siteRecorded += 1;
    } catch (error) {
      console.error("[bulkMailer] Failed to record site notification", recipient.userId, error);
    }
  }

  return summary;
}
