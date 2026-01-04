import type { Reservation } from "./reservations";
import { addMailHistory } from "./mailHistory";
import { enqueueEmail } from "./mailQueue";

type MailSendResult = {
  simulated: boolean;
};

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || "-";
  }

  return date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
};

const buildTextBody = (reservation: Reservation): string => {
  const pickup = reservation.pickupAt ? formatDateTime(reservation.pickupAt) : "-";
  const dropoff = reservation.returnAt ? formatDateTime(reservation.returnAt) : "-";

  return [
    "この度はヤスカリバイクレンタルをご利用いただきありがとうございます。",
    "ご予約と決済が完了しました。下記内容をご確認ください。",
    "",
    "■ご予約内容",
    `店舗: ${reservation.storeName}`,
    `車両: ${reservation.vehicleModel} (${reservation.vehiclePlate || reservation.vehicleCode})`,
    `お受け取り: ${pickup}`,
    `ご返却: ${dropoff}`,
    `お支払い金額: ${reservation.paymentAmount}円`,
    reservation.paymentId ? `決済ID: ${reservation.paymentId}` : undefined,
    "",
    "■お客様情報",
    reservation.memberName ? `お名前: ${reservation.memberName}` : undefined,
    reservation.memberPhone ? `電話番号: ${reservation.memberPhone}` : undefined,
    reservation.memberEmail ? `メール: ${reservation.memberEmail}` : undefined,
    "",
    "ご不明点がございましたら本メールにご返信ください。",
    "",
    "※本メールはお客様にご入力いただいたメールアドレスあてに発信しているため、",
    "入力ミスなどの理由によりまったく別の方にメールが届く可能性があります。",
    "もし本メールにお心当たりが無い場合は、",
    "お手数ですが、破棄していただけますようお願いします。",
    "",
    "※お問い合わせは、本メールにご返信ください。",
    "大変恐れ入りますが、お電話でのお問い合わせはお受けしておりません。",
    "",
    "ヤスカリ https://yasukaribike.com",
    "足立小台本店 レンタル受付時間: 10:00 〜 19:00 （月曜定休）",
    "三ノ輪店 レンタル受付時間: 24時間営業",
    "事故受付専用:ロードサービス専用ダイヤル 0120-024-024",
  ]
    .filter(Boolean)
    .join("\n");
};

const buildHtmlBody = (reservation: Reservation): string => {
  const pickup = reservation.pickupAt ? formatDateTime(reservation.pickupAt) : "-";
  const dropoff = reservation.returnAt ? formatDateTime(reservation.returnAt) : "-";

  return `<!DOCTYPE html>
<html lang="ja">
  <body>
    <p>この度はヤスカリバイクレンタルをご利用いただきありがとうございます。<br />ご予約と決済が完了しました。下記内容をご確認ください。</p>
    <h3>ご予約内容</h3>
    <ul>
      <li>店舗: ${reservation.storeName}</li>
      <li>車両: ${reservation.vehicleModel} (${reservation.vehiclePlate || reservation.vehicleCode})</li>
      <li>お受け取り: ${pickup}</li>
      <li>ご返却: ${dropoff}</li>
      <li>お支払い金額: ${reservation.paymentAmount}円</li>
      ${reservation.paymentId ? `<li>決済ID: ${reservation.paymentId}</li>` : ""}
    </ul>
    <h3>お客様情報</h3>
    <ul>
      ${reservation.memberName ? `<li>お名前: ${reservation.memberName}</li>` : ""}
      ${reservation.memberPhone ? `<li>電話番号: ${reservation.memberPhone}</li>` : ""}
      ${reservation.memberEmail ? `<li>メール: ${reservation.memberEmail}</li>` : ""}
    </ul>
    <p>ご不明点がございましたら本メールにご返信ください。<br />ヤスカリ バイクレンタル</p>
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
    <p>
      ヤスカリ https://yasukaribike.com<br />
      足立小台本店 レンタル受付時間: 10:00 〜 19:00 （月曜定休）<br />
      三ノ輪店 レンタル受付時間: 24時間営業<br />
      事故受付専用:ロードサービス専用ダイヤル 0120-024-024
    </p>
  </body>
</html>`;
};

export async function sendReservationCompletionEmail(reservation: Reservation): Promise<MailSendResult> {
  if (!reservation.memberEmail) {
    console.info("[reservation-email] Skip sending: member email not provided", reservation.id);
    await addMailHistory({
      category: "予約完了",
      to: "(メール未入力)",
      subject: "【ヤスカリ】バイクレンタルのご予約完了",
      status: "skipped",
      errorMessage: "会員のメールアドレスが未設定のため送信をスキップしました。",
    });
    return { simulated: true };
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "");
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;
  if (!host || !port || !user || !password) {
    console.info("[reservation-email] SMTP configuration is incomplete. Email not sent.", {
      hostProvided: Boolean(host),
      portProvided: Boolean(port),
      userProvided: Boolean(user),
      passProvided: Boolean(password),
    });
    await addMailHistory({
      category: "予約完了",
      to: reservation.memberEmail,
      subject: "【ヤスカリ】バイクレンタルのご予約完了",
      status: "skipped",
      errorMessage: "SMTP設定不足のため送信できませんでした。",
    });
    return { simulated: true };
  }

  const subject = "【ヤスカリ】バイクレンタルのご予約完了";
  const text = buildTextBody(reservation);
  const html = buildHtmlBody(reservation);

  try {
    await enqueueEmail({
      to: reservation.memberEmail,
      subject,
      text,
      html,
      category: "予約完了",
      userIdForNotification: reservation.memberId || reservation.memberEmail,
      notificationBody: text,
      mirrorToSite: true,
    });
    return { simulated: false };
  } catch (error) {
    throw error;
  }
}
