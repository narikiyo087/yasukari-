import type { Reservation } from "./reservations";
import { addMailHistory } from "./mailHistory";
import { enqueueEmail } from "./mailQueue";

type RentalExtensionEmailParams = {
  reservation: Reservation;
  previousReturnAt: string;
  newReturnAt: string;
  extensionDays: number;
  amount: number;
  paymentId?: string;
};

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

const formatAmount = (value: number): string => `${value.toLocaleString("ja-JP")}円`;

const buildTextBody = ({
  reservation,
  previousReturnAt,
  newReturnAt,
  extensionDays,
  amount,
  paymentId,
}: RentalExtensionEmailParams): string => {
  const previousReturn = previousReturnAt ? formatDateTime(previousReturnAt) : "-";
  const nextReturn = newReturnAt ? formatDateTime(newReturnAt) : "-";

  return [
    "この度はヤスカリバイクレンタルをご利用いただきありがとうございます。",
    "レンタル延長の決済が完了しました。下記内容をご確認ください。",
    "",
    "■レンタル延長内容",
    `店舗: ${reservation.storeName}`,
    `車両: ${reservation.vehicleModel} (${reservation.vehiclePlate || reservation.vehicleCode})`,
    `延長日数: ${extensionDays}日`,
    `延長前の返却予定: ${previousReturn}`,
    `延長後の返却予定: ${nextReturn}`,
    `延長料金: ${formatAmount(amount)}`,
    paymentId ? `決済ID: ${paymentId}` : undefined,
    "",
    "■お客様情報",
    reservation.memberName ? `お名前: ${reservation.memberName}` : undefined,
    reservation.memberPhone ? `電話番号: ${reservation.memberPhone}` : undefined,
    reservation.memberEmail ? `メール: ${reservation.memberEmail}` : undefined,
    "",
    "ご不明点がございましたら本メールにご返信ください。",
    "ヤスカリ バイクレンタル",
    "",
    "※本メールはお客様にご入力いただいたメールアドレスあてに発信しているため、",
    "入力ミスなどの理由によりまったく別の方にメールが届く可能性があります。",
    "もし本メールにお心当たりが無い場合は、",
    "お手数ですが、破棄していただけますようお願いします。",
    "",
    "※お問い合わせは、本メールにご返信ください。",
    "大変恐れ入りますが、お電話でのお問い合わせはお受けしておりません。",
    "",
    "ヤスカリ https://yasukari.com",
    "足立小台本店 レンタル受付時間: 10:00 〜 19:00 （月曜定休）",
    "三ノ輪店 レンタル受付時間: 24時間営業",
    "事故受付専用:ロードサービス専用ダイヤル 0120-024-024",
  ]
    .filter(Boolean)
    .join("\n");
};

const buildHtmlBody = ({
  reservation,
  previousReturnAt,
  newReturnAt,
  extensionDays,
  amount,
  paymentId,
}: RentalExtensionEmailParams): string => {
  const previousReturn = previousReturnAt ? formatDateTime(previousReturnAt) : "-";
  const nextReturn = newReturnAt ? formatDateTime(newReturnAt) : "-";

  return `<!DOCTYPE html>
<html lang="ja">
  <body>
    <p>この度はヤスカリバイクレンタルをご利用いただきありがとうございます。<br />レンタル延長の決済が完了しました。下記内容をご確認ください。</p>
    <h3>レンタル延長内容</h3>
    <ul>
      <li>店舗: ${reservation.storeName}</li>
      <li>車両: ${reservation.vehicleModel} (${reservation.vehiclePlate || reservation.vehicleCode})</li>
      <li>延長日数: ${extensionDays}日</li>
      <li>延長前の返却予定: ${previousReturn}</li>
      <li>延長後の返却予定: ${nextReturn}</li>
      <li>延長料金: ${formatAmount(amount)}</li>
      ${paymentId ? `<li>決済ID: ${paymentId}</li>` : ""}
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
      ヤスカリ https://yasukari.com<br />
      足立小台本店 レンタル受付時間: 10:00 〜 19:00 （月曜定休）<br />
      三ノ輪店 レンタル受付時間: 24時間営業<br />
      事故受付専用:ロードサービス専用ダイヤル 0120-024-024
    </p>
  </body>
</html>`;
};

export async function sendRentalExtensionCompletionEmail(
  params: RentalExtensionEmailParams
): Promise<MailSendResult> {
  const { reservation } = params;
  if (!reservation.memberEmail) {
    console.info("[extension-email] Skip sending: member email not provided", reservation.id);
    await addMailHistory({
      category: "レンタル延長",
      to: "(メール未入力)",
      subject: "【ヤスカリ】レンタル延長の決済完了",
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
    console.info("[extension-email] SMTP configuration is incomplete. Email not sent.", {
      hostProvided: Boolean(host),
      portProvided: Boolean(port),
      userProvided: Boolean(user),
      passProvided: Boolean(password),
    });
    await addMailHistory({
      category: "レンタル延長",
      to: reservation.memberEmail,
      subject: "【ヤスカリ】レンタル延長の決済完了",
      status: "skipped",
      errorMessage: "SMTP設定不足のため送信できませんでした。",
    });
    return { simulated: true };
  }

  const subject = "【ヤスカリ】レンタル延長の決済完了";
  const text = buildTextBody(params);
  const html = buildHtmlBody(params);

  await enqueueEmail({
    to: reservation.memberEmail,
    subject,
    text,
    html,
    category: "レンタル延長",
    userIdForNotification: reservation.memberId || reservation.memberEmail,
    notificationBody: text,
    mirrorToSite: true,
  });

  return { simulated: false };
}
