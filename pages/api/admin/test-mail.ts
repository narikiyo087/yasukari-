import type { NextApiRequest, NextApiResponse } from "next";

import { addMailHistory } from "../../../lib/mailHistory";
import { deliverFullRegistrationEmail, deliverProvisionalRegistrationEmail } from "../../../lib/registrationEmails";
import { sendReservationCompletionEmail } from "../../../lib/reservationCompletionEmail";
import type { Reservation } from "../../../lib/reservations";

type TestMailType = "provisional" | "full" | "reservation";

type TestMailResponse = {
  message: string;
  status?: "sent" | "skipped";
};

const MAIL_DEFINITIONS: Record<
  TestMailType,
  {
    label: string;
    subject: string;
    category: "仮登録" | "本登録" | "予約完了";
  }
> = {
  provisional: {
    label: "仮予約",
    subject: "【ヤスカリ】仮登録が完了しました",
    category: "仮登録",
  },
  full: {
    label: "本登録",
    subject: "【ヤスカリ】本登録が完了しました",
    category: "本登録",
  },
  reservation: {
    label: "予約受付完了",
    subject: "【ヤスカリ】バイクレンタルのご予約完了",
    category: "予約完了",
  },
};

const hasSmtpConfig = (): boolean => {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
};

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const buildSampleReservation = (email: string): Reservation => {
  const now = new Date();
  const pickupAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const returnAt = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

  return {
    id: "TEST-RESERVATION-001",
    storeName: "渋谷店",
    vehicleModel: "PCX 125",
    vehicleCode: "PCX125",
    vehiclePlate: "品川あ 12-34",
    vehicleThumbnailUrl: "",
    videoUrl: "",
    vehicleChangedAt: "",
    vehicleChangeNotified: false,
    pickupAt,
    returnAt,
    status: "予約受付完了",
    paymentAmount: "8,900",
    paymentId: "PAYMENT-TEST",
    paymentDate: now.toISOString(),
    rentalDurationHours: 24,
    rentalCompletedAt: now.toISOString(),
    reservationCompletedFlag: true,
    memberId: "TEST-MEMBER-001",
    memberName: "テスト太郎",
    memberEmail: email,
    memberPhone: "090-0000-0000",
    memberCountryCode: "+81",
    couponCode: "TEST2024",
    couponDiscount: "500",
    options: {
      vehicleCoverage: "加入",
      theftCoverage: "加入",
    },
    accessories: {
      halfCap: 1,
      glove: 2,
    },
    notes: "テスト送信用のサンプルデータです。",
    refundNote: "",
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestMailResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ message: "POST メソッドのみ対応しています。" });
    return;
  }

  const { email, mailType } = req.body as {
    email?: string;
    mailType?: string;
  };

  const normalizedEmail = typeof email === "string" ? email.trim() : "";
  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    res.status(400).json({ message: "有効なメールアドレスを入力してください。" });
    return;
  }

  if (!mailType || !(mailType in MAIL_DEFINITIONS)) {
    res.status(400).json({ message: "メール種別を選択してください。" });
    return;
  }

  const selectedType = mailType as TestMailType;
  const definition = MAIL_DEFINITIONS[selectedType];

  try {
    if (selectedType === "provisional") {
      if (!hasSmtpConfig()) {
        await addMailHistory({
          to: normalizedEmail,
          subject: definition.subject,
          status: "skipped",
          category: definition.category,
          errorMessage: "SMTP設定不足のため送信できませんでした。",
        });
        res
          .status(200)
          .json({ message: "SMTP設定不足のため送信をスキップしました。", status: "skipped" });
        return;
      }

      await deliverProvisionalRegistrationEmail(normalizedEmail);
      res.status(200).json({ message: "仮予約のテストメールを送信しました。", status: "sent" });
      return;
    }

    if (selectedType === "full") {
      if (!hasSmtpConfig()) {
        await addMailHistory({
          to: normalizedEmail,
          subject: definition.subject,
          status: "skipped",
          category: definition.category,
          errorMessage: "SMTP設定不足のため送信できませんでした。",
        });
        res
          .status(200)
          .json({ message: "SMTP設定不足のため送信をスキップしました。", status: "skipped" });
        return;
      }

      await deliverFullRegistrationEmail(normalizedEmail);
      res.status(200).json({ message: "本登録のテストメールを送信しました。", status: "sent" });
      return;
    }

    const sampleReservation = buildSampleReservation(normalizedEmail);
    const result = await sendReservationCompletionEmail(sampleReservation);
    res.status(200).json({
      message: result.simulated
        ? "SMTP設定不足のため送信をスキップしました。"
        : "予約受付完了のテストメールを送信しました。",
      status: result.simulated ? "skipped" : "sent",
    });
  } catch (error) {
    console.error("Failed to send test mail", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "テストメール送信に失敗しました。",
    });
  }
}
