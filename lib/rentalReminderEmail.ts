import { EMAIL_FOOTER_HTML, EMAIL_FOOTER_TEXT_LINES } from "./emailFooter";
import type { Reservation } from "./reservations";
import { addMailHistory } from "./mailHistory";
import { enqueueEmail } from "./mailQueue";
import { recordUserNotification } from "./userNotifications";

type MailSendResult = {
  simulated: boolean;
};

const isEnglishReservation = (reservation: Reservation): boolean =>
  reservation.notes?.includes("Saved via Pay.JP payment") ?? false;

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || "-";
  }

  return date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
};

const isMinowaStore = (reservation: Reservation): boolean =>
  reservation.storeName.includes("三ノ輪");

const buildTextBody = (reservation: Reservation): string => {
  const pickupAt = reservation.pickupAt ? formatDateTime(reservation.pickupAt) : "-";
  const returnAt = reservation.returnAt ? formatDateTime(reservation.returnAt) : "-";

  if (isEnglishReservation(reservation)) {
    return [
      "Thank you for choosing Yasukari bike rental.",
      "This is a reminder that your rental starts tomorrow. Please review the details below.",
      "",
      "Reservation details",
      `Reservation ID: ${reservation.id}`,
      `Store: ${reservation.storeName}`,
      `Vehicle: ${reservation.vehicleModel} (${reservation.vehiclePlate || reservation.vehicleCode})`,
      `Pickup: ${pickupAt}`,
      `Return: ${returnAt}`,
      "",
      "Please bring your driver's license and a helmet (rental helmets are also available).",
      isMinowaStore(reservation)
        ? "The Minowa branch is self-service. Your keybox PIN will be available on My Page before pickup."
        : "Please visit the store during business hours and speak to our staff.",
      "",
      "If you need to change or cancel your reservation, please reply to this email.",
      "",
      ...EMAIL_FOOTER_TEXT_LINES,
    ].join("\n");
  }

  return [
    "この度はヤスカリバイクレンタルをご利用いただきありがとうございます。",
    "ご予約いただいたレンタルの開始日が明日に迫りましたので、ご案内いたします。",
    "",
    "■ご予約内容",
    `予約番号: ${reservation.id}`,
    `店舗: ${reservation.storeName}`,
    `車両: ${reservation.vehicleModel} (${reservation.vehiclePlate || reservation.vehicleCode})`,
    `貸出日時: ${pickupAt}`,
    `返却予定: ${returnAt}`,
    "",
    "■ご来店時のお願い",
    "・運転免許証を必ずご持参ください。",
    "・ヘルメットをお持ちの方はご持参ください（レンタルもございます）。",
    isMinowaStore(reservation)
      ? "・三ノ輪店はセルフ店です。キーボックスの暗証番号は貸出前にマイページでご確認いただけます。"
      : "・営業時間内にご来店のうえ、スタッフにお声かけください。",
    "",
    "ご予約の変更・キャンセルをご希望の場合は、本メールにご返信ください。",
    "",
    "※本メールはお客様にご入力いただいたメールアドレスあてに発信しているため、",
    "入力ミスなどの理由によりまったく別の方にメールが届く可能性があります。",
    "もし本メールにお心当たりが無い場合は、",
    "お手数ですが、破棄していただけますようお願いします。",
    "",
    "※お問い合わせは、本メールにご返信ください。",
    "大変恐れ入りますが、お電話でのお問い合わせはお受けしておりません。",
    "",
    ...EMAIL_FOOTER_TEXT_LINES,
  ].join("\n");
};

const buildHtmlBody = (reservation: Reservation): string => {
  const pickupAt = reservation.pickupAt ? formatDateTime(reservation.pickupAt) : "-";
  const returnAt = reservation.returnAt ? formatDateTime(reservation.returnAt) : "-";

  if (isEnglishReservation(reservation)) {
    return `<!DOCTYPE html>
<html lang="en">
  <body>
    <p>Thank you for choosing Yasukari bike rental.<br />This is a reminder that your rental starts tomorrow.</p>
    <ul>
      <li>Reservation ID: ${reservation.id}</li>
      <li>Store: ${reservation.storeName}</li>
      <li>Vehicle: ${reservation.vehicleModel} (${reservation.vehiclePlate || reservation.vehicleCode})</li>
      <li>Pickup: ${pickupAt}</li>
      <li>Return: ${returnAt}</li>
    </ul>
    <p>Please bring your driver's license and a helmet (rental helmets are also available).</p>
    <p>${
      isMinowaStore(reservation)
        ? "The Minowa branch is self-service. Your keybox PIN will be available on My Page before pickup."
        : "Please visit the store during business hours and speak to our staff."
    }</p>
    <p>If you need to change or cancel your reservation, please reply to this email.</p>
    ${EMAIL_FOOTER_HTML}
  </body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="ja">
  <body>
    <p>この度はヤスカリバイクレンタルをご利用いただきありがとうございます。<br />ご予約いただいたレンタルの開始日が明日に迫りましたので、ご案内いたします。</p>
    <h3>ご予約内容</h3>
    <ul>
      <li>予約番号: ${reservation.id}</li>
      <li>店舗: ${reservation.storeName}</li>
      <li>車両: ${reservation.vehicleModel} (${reservation.vehiclePlate || reservation.vehicleCode})</li>
      <li>貸出日時: ${pickupAt}</li>
      <li>返却予定: ${returnAt}</li>
    </ul>
    <h3>ご来店時のお願い</h3>
    <ul>
      <li>運転免許証を必ずご持参ください。</li>
      <li>ヘルメットをお持ちの方はご持参ください（レンタルもございます）。</li>
      <li>${
        isMinowaStore(reservation)
          ? "三ノ輪店はセルフ店です。キーボックスの暗証番号は貸出前にマイページでご確認いただけます。"
          : "営業時間内にご来店のうえ、スタッフにお声かけください。"
      }</li>
    </ul>
    <p>ご予約の変更・キャンセルをご希望の場合は、本メールにご返信ください。</p>
    <p>
      ※本メールはお客様にご入力いただいたメールアドレスあてに発信しているため、<br />
      入力ミスなどの理由によりまったく別の方にメールが届く可能性があります。<br />
      もし本メールにお心当たりが無い場合は、<br />
      お手数ですが、破棄していただけますようお願いします。
    </p>
    <p>
      ※お問い合わせは、本メールにご返信ください。<br />
      大変恐れ入りますが、お電話でのお問い合わせはお受けしておりません。
    </p>
    <p>${EMAIL_FOOTER_HTML}</p>
  </body>
</html>`;
};

export const rentalReminderSubject = (reservation: Reservation): string =>
  isEnglishReservation(reservation)
    ? "[Yasukari] Your rental starts tomorrow"
    : "【ヤスカリ】明日はレンタル開始日です";

export async function sendRentalReminderEmail(
  reservation: Reservation
): Promise<MailSendResult> {
  const subject = rentalReminderSubject(reservation);

  if (!reservation.memberEmail || !reservation.memberEmail.includes("@")) {
    console.info("[rental-reminder] Skip sending: member email not provided", reservation.id);
    await addMailHistory({
      category: "レンタル前日",
      to: "(メール未入力)",
      subject,
      status: "skipped",
      errorMessage: "会員のメールアドレスが未設定のため送信をスキップしました。",
    });
    return { simulated: true };
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;
  if (!host || !user || !password) {
    console.info("[rental-reminder] SMTP configuration is incomplete. Email not sent.", {
      reservationId: reservation.id,
    });
    await addMailHistory({
      category: "レンタル前日",
      to: reservation.memberEmail,
      subject,
      status: "skipped",
      errorMessage: "SMTP設定不足のため送信できませんでした。",
    });
    try {
      await recordUserNotification({
        userId: reservation.memberId || reservation.memberEmail,
        subject,
        body: buildTextBody(reservation),
        category: "レンタル前日",
        channels: ["site"],
        recipientEmail: reservation.memberEmail,
      });
    } catch (error) {
      console.error("[rental-reminder] Failed to record site notification", error);
    }
    return { simulated: true };
  }

  const text = buildTextBody(reservation);
  const html = buildHtmlBody(reservation);

  await enqueueEmail({
    to: reservation.memberEmail,
    subject,
    text,
    html,
    category: "レンタル前日",
    userIdForNotification: reservation.memberId || reservation.memberEmail,
    notificationBody: text,
    mirrorToSite: true,
  });

  return { simulated: false };
}
