import type { NextApiRequest, NextApiResponse } from "next";

import { EMAIL_FOOTER_TEXT_LINES } from "../../lib/emailFooter";
import { addMailHistory } from "../../lib/mailHistory";
import { enqueueEmail } from "../../lib/mailQueue";

const CONTACT_INBOX = process.env.CONTACT_INBOX ?? "info@yasukari.com";
const MAX_NAME_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 4000;

const CATEGORY_LABELS: Record<string, { ja: string; en: string }> = {
  reservation: { ja: "予約について", en: "Reservations" },
  extension: { ja: "延長希望", en: "Extension request" },
  insurance: { ja: "任意保険証希望", en: "Insurance certificate request" },
  trouble: { ja: "車両・事故トラブル", en: "Vehicle trouble / accident" },
  other: { ja: "その他", en: "Other" },
};

type ContactPayload = {
  name: string;
  email: string;
  category: string;
  reservationId: string;
  message: string;
  locale: "ja" | "en";
};

type ContactResponse = {
  message: string;
  status?: "sent" | "skipped";
};

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const hasSmtpConfig = (): boolean =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const parsePayload = (body: unknown): ContactPayload | null => {
  if (typeof body !== "object" || body === null) return null;

  const { name, email, category, reservationId, message, locale } = body as Record<string, unknown>;

  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedEmail = typeof email === "string" ? email.trim() : "";
  const normalizedCategory =
    typeof category === "string" && category in CATEGORY_LABELS ? category : "other";
  const normalizedReservationId = typeof reservationId === "string" ? reservationId.trim() : "";
  const normalizedMessage = typeof message === "string" ? message.trim() : "";
  const normalizedLocale = locale === "en" ? "en" : "ja";

  if (!normalizedName || normalizedName.length > MAX_NAME_LENGTH) return null;
  if (!normalizedEmail || !isValidEmail(normalizedEmail)) return null;
  if (!normalizedMessage || normalizedMessage.length > MAX_MESSAGE_LENGTH) return null;

  return {
    name: normalizedName,
    email: normalizedEmail,
    category: normalizedCategory,
    reservationId: normalizedReservationId,
    message: normalizedMessage,
    locale: normalizedLocale,
  };
};

const buildAdminBody = (payload: ContactPayload): string =>
  [
    "サイトのお問い合わせフォームから新しいお問い合わせが届きました。",
    "",
    `お名前: ${payload.name}`,
    `メールアドレス: ${payload.email}`,
    `種別: ${CATEGORY_LABELS[payload.category].ja}`,
    payload.reservationId ? `予約番号: ${payload.reservationId}` : "予約番号: (未記入)",
    `言語: ${payload.locale === "en" ? "英語" : "日本語"}`,
    "",
    "■お問い合わせ内容",
    payload.message,
    "",
    "※このメールに返信すると、お客様に直接返信できます。",
  ].join("\n");

const buildAutoReplyBody = (payload: ContactPayload): string => {
  if (payload.locale === "en") {
    return [
      `Dear ${payload.name},`,
      "",
      "Thank you for contacting Yasukari. We have received your inquiry.",
      "Our staff will reply by email within business hours (10:00-17:00 JST on business days).",
      "",
      "Your inquiry",
      `Category: ${CATEGORY_LABELS[payload.category].en}`,
      payload.reservationId ? `Reservation ID: ${payload.reservationId}` : undefined,
      "----------------------------------------",
      payload.message,
      "----------------------------------------",
      "",
      "This is an automated confirmation email. If you need to add anything, simply reply to this email.",
      "",
      ...EMAIL_FOOTER_TEXT_LINES,
    ]
      .filter((line): line is string => line !== undefined)
      .join("\n");
  }

  return [
    `${payload.name} 様`,
    "",
    "この度はヤスカリへお問い合わせいただき、ありがとうございます。",
    "以下の内容でお問い合わせを受け付けました。",
    "営業日10時〜17時の間に、担当者よりメールでご返信いたします。",
    "",
    "■お問い合わせ内容",
    `種別: ${CATEGORY_LABELS[payload.category].ja}`,
    payload.reservationId ? `予約番号: ${payload.reservationId}` : undefined,
    "----------------------------------------",
    payload.message,
    "----------------------------------------",
    "",
    "※本メールは自動送信です。追記がある場合は、本メールにそのままご返信ください。",
    "",
    ...EMAIL_FOOTER_TEXT_LINES,
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContactResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "POST メソッドのみ対応しています。" });
  }

  const payload = parsePayload(req.body);
  if (!payload) {
    return res.status(400).json({
      message: "お名前・メールアドレス・お問い合わせ内容を正しく入力してください。",
    });
  }

  const adminSubject = `【お問い合わせ】${CATEGORY_LABELS[payload.category].ja} - ${payload.name} 様`;
  const autoReplySubject =
    payload.locale === "en"
      ? "[Yasukari] We have received your inquiry"
      : "【ヤスカリ】お問い合わせを受け付けました";
  const acceptedMessage =
    payload.locale === "en"
      ? "Your inquiry has been received. A confirmation email will be sent to you."
      : "お問い合わせを受け付けました。確認メールをお送りしましたのでご確認ください。";

  if (!hasSmtpConfig()) {
    await addMailHistory({
      to: CONTACT_INBOX,
      subject: adminSubject,
      status: "skipped",
      category: "問い合わせ",
      errorMessage: "SMTP設定不足のため送信できませんでした。",
    });
    await addMailHistory({
      to: payload.email,
      subject: autoReplySubject,
      status: "skipped",
      category: "問い合わせ",
      errorMessage: "SMTP設定不足のため自動返信を送信できませんでした。",
    });
    return res.status(200).json({ message: acceptedMessage, status: "skipped" });
  }

  try {
    await enqueueEmail({
      to: CONTACT_INBOX,
      subject: adminSubject,
      text: buildAdminBody(payload),
      replyTo: payload.email,
      category: "問い合わせ",
      mirrorToSite: false,
    });

    await enqueueEmail({
      to: payload.email,
      subject: autoReplySubject,
      text: buildAutoReplyBody(payload),
      category: "問い合わせ",
      userIdForNotification: payload.email,
      notificationBody: buildAutoReplyBody(payload),
      mirrorToSite: true,
    });

    return res.status(200).json({ message: acceptedMessage, status: "sent" });
  } catch (error) {
    console.error("[contact] Failed to send inquiry emails", error);
    return res.status(500).json({
      message:
        payload.locale === "en"
          ? "Failed to submit your inquiry. Please try again later or email us directly."
          : "お問い合わせの送信に失敗しました。時間をおいて再度お試しいただくか、直接メールでご連絡ください。",
    });
  }
}
