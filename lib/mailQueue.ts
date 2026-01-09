import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';

import { addMailHistory, MailHistoryCategory } from './mailHistory';
import { recordUserNotification, NotificationChannel } from './userNotifications';

const MAX_RETRY_ATTEMPTS = 3;
const MAX_CONSECUTIVE_FAILURES = 3;
const MAX_EMAILS_PER_SECOND = 5;
const MIN_INTERVAL_PER_RECIPIENT_MS = 10_000;
const MAIL_FROM = process.env.MAIL_FROM ?? '格安レンタルバイクならヤスカリ <info@yasukaribike.com>';

export type MailPayload = {
  to: string;
  cc?: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  category?: MailHistoryCategory;
  userIdForNotification?: string;
  notificationBody?: string;
  mirrorToSite?: boolean;
};

type QueueItem = MailPayload & {
  attempts: number;
  resolve: (value: SentMessageInfo) => void;
  reject: (reason?: unknown) => void;
};

let transporterPromise: Promise<Transporter> | null = null;
const queue: QueueItem[] = [];
let processing = false;
const sendTimestamps: number[] = [];
const lastSentAtByRecipient = new Map<string, number>();
const consecutiveFailuresByRecipient = new Map<string, number>();
const blockedRecipients = new Set<string>();

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const normalizeRecipient = (recipient: string): string => recipient.trim().toLowerCase();

const getGlobalRateDelayMs = (): number => {
  const now = Date.now();
  while (sendTimestamps.length > 0 && sendTimestamps[0] <= now - 1000) {
    sendTimestamps.shift();
  }

  if (sendTimestamps.length < MAX_EMAILS_PER_SECOND) {
    return 0;
  }

  const earliest = sendTimestamps[0] ?? now;
  return Math.max(0, earliest + 1000 - now);
};

const getRecipientDelayMs = (recipient: string): number => {
  const normalized = normalizeRecipient(recipient);
  const lastSentAt = lastSentAtByRecipient.get(normalized);
  if (!lastSentAt) {
    return 0;
  }

  const elapsed = Date.now() - lastSentAt;
  return elapsed >= MIN_INTERVAL_PER_RECIPIENT_MS ? 0 : MIN_INTERVAL_PER_RECIPIENT_MS - elapsed;
};

const recordSendAttempt = (): void => {
  sendTimestamps.push(Date.now());
};

const recordSendSuccess = (recipient: string): void => {
  const normalized = normalizeRecipient(recipient);
  lastSentAtByRecipient.set(normalized, Date.now());
  consecutiveFailuresByRecipient.set(normalized, 0);
  blockedRecipients.delete(normalized);
};

const recordSendFailure = (recipient: string): void => {
  const normalized = normalizeRecipient(recipient);
  const nextCount = (consecutiveFailuresByRecipient.get(normalized) ?? 0) + 1;
  consecutiveFailuresByRecipient.set(normalized, nextCount);
  if (nextCount >= MAX_CONSECUTIVE_FAILURES) {
    blockedRecipients.add(normalized);
  }
};

function buildTransporter(): Transporter {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP_HOST, SMTP_USER, and SMTP_PASS must be configured to send emails.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function getTransporter(): Promise<Transporter> {
  if (!transporterPromise) {
    transporterPromise = Promise.resolve(buildTransporter());
  }

  return transporterPromise;
}

async function sendMailOnce(payload: MailPayload): Promise<SentMessageInfo> {
  const transporter = await getTransporter();
  const replyToAddress = payload.replyTo?.trim() || MAIL_FROM;

  return transporter.sendMail({
    from: MAIL_FROM,
    to: payload.to,
    cc: payload.cc,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
    replyTo: replyToAddress,
  });
}

const mirrorMailToUserNotification = async (payload: QueueItem): Promise<void> => {
  const userId = payload.userIdForNotification || payload.to;
  if (!userId) return;

  const channels: NotificationChannel[] =
    payload.mirrorToSite === false ? ["email"] : ["email", "site"];
  const bodyForNotification = payload.notificationBody ?? payload.text;

  try {
    await recordUserNotification({
      userId,
      subject: payload.subject,
      body: bodyForNotification,
      category: payload.category,
      channels,
      recipientEmail: payload.to,
    });
  } catch (error) {
    console.error("[mailQueue] Failed to mirror notification", { error, to: payload.to });
  }
};

async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;

    try {
      const recipientKey = normalizeRecipient(item.to);
      if (blockedRecipients.has(recipientKey)) {
        await addMailHistory({
          to: item.to,
          subject: item.subject,
          status: 'skipped',
          category: item.category ?? 'その他',
          errorMessage: '送信失敗が続いたため、この宛先への送信を停止しました。',
        });
        item.reject(new Error('メール送信を停止中の宛先です。'));
        continue;
      }

      const delayMs = Math.max(getGlobalRateDelayMs(), getRecipientDelayMs(item.to));
      if (delayMs > 0) {
        await wait(delayMs);
      }
      recordSendAttempt();
      const info = await sendMailOnce(item);
      recordSendSuccess(item.to);
      await addMailHistory({
        to: item.to,
        subject: item.subject,
        status: 'sent',
        category: item.category ?? 'その他',
      });
      await mirrorMailToUserNotification(item);
      item.resolve(info);
    } catch (error) {
      recordSendFailure(item.to);
      const nextAttempts = item.attempts + 1;
      if (nextAttempts < MAX_RETRY_ATTEMPTS) {
        queue.push({ ...item, attempts: nextAttempts });
      } else {
        await addMailHistory({
          to: item.to,
          subject: item.subject,
          status: 'failed',
          category: item.category ?? 'その他',
          errorMessage:
            error instanceof Error ? error.message : 'メール送信中にエラーが発生しました。',
        });
        item.reject(error);
      }
    }
  }

  processing = false;
}

export async function enqueueEmail(payload: MailPayload): Promise<SentMessageInfo> {
  return new Promise<SentMessageInfo>((resolve, reject) => {
    queue.push({ ...payload, attempts: 0, resolve, reject });
    void processQueue();
  });
}
