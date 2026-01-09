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

  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const month = parts.find((part) => part.type === "month")?.value ?? "--";
  const day = parts.find((part) => part.type === "day")?.value ?? "--";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "--";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "--";

  return `${month}月${day}日 ${hour}:${minute}`;
};

const ACCESSORY_LABELS: Record<string, string> = {
  halfCap: "半キャップ",
  jetHelmet: "ジェットヘル",
  brandHelmet: "ブランド・ヘルメット",
  glove: "グローブ",
};

const buildOptionLines = (reservation: Reservation): string[] => {
  const lines: string[] = [];

  if (reservation.options?.vehicleCoverage) {
    lines.push(`1点 ${reservation.options.vehicleCoverage}`);
  }
  if (reservation.options?.theftCoverage) {
    lines.push(`1点 ${reservation.options.theftCoverage}`);
  }

  Object.entries(reservation.accessories ?? {}).forEach(([key, count]) => {
    if (count > 0) {
      const label = ACCESSORY_LABELS[key] ?? key;
      lines.push(`${count}点 ${label}`);
    }
  });

  return lines.length ? lines : ["なし"];
};

const buildTextBody = (reservation: Reservation): string => {
  const pickup = reservation.pickupAt ? formatDateTime(reservation.pickupAt) : "-";
  const dropoff = reservation.returnAt ? formatDateTime(reservation.returnAt) : "-";
  const optionLines = buildOptionLines(reservation);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yasukaribike.com";
  const myPageUrl = `${siteUrl.replace(/\/$/, "")}/mypage`;

  return [
    "いつも「ヤスカリ」をご利用いただきまして",
    "誠にありがとうございます。",
    "",
    "予約が確定しました。",
    "下記予約内容をご確認いただき、そのままご予約の日時にご来店ください。",
    "※本メールは配信専用のため、ご返信いただきましても店舗へは届きません。",
    "",
    "■予約番号",
    reservation.id,
    "■出発日時",
    pickup,
    "■返却日時",
    dropoff,
    "■店舗",
    reservation.storeName,
    "■利用内容",
    `車両: ${reservation.vehicleModel} (${reservation.vehiclePlate || reservation.vehicleCode})`,
    "▽オプション",
    ...optionLines,
    "■合計金額",
    `${reservation.paymentAmount}円`,
    "",
    "予約詳細ページはこちらから",
    myPageUrl,
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
    "足立小台本店 レンタル受付時間: 10:00 〜 19:00 （月曜・木曜定休）",
    "三ノ輪店 レンタル受付時間: 24時間営業",
    "事故受付専用",
    "ロードサービス専用ダイヤル",
    "0120-024-024",
  ]
    .filter(Boolean)
    .join("\n");
};

const buildHtmlBody = (reservation: Reservation): string => {
  const pickup = reservation.pickupAt ? formatDateTime(reservation.pickupAt) : "-";
  const dropoff = reservation.returnAt ? formatDateTime(reservation.returnAt) : "-";
  const optionLines = buildOptionLines(reservation);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yasukaribike.com";
  const myPageUrl = `${siteUrl.replace(/\/$/, "")}/mypage`;
  const optionItems = optionLines.map((line) => `<li>${line}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="ja">
  <body>
    <p>いつも「ヤスカリ」をご利用いただきまして<br />誠にありがとうございます。</p>
    <p>予約が確定しました。<br />下記予約内容をご確認いただき、そのままご予約の日時にご来店ください。<br />※本メールは配信専用のため、ご返信いただきましても店舗へは届きません。</p>
    <p>
      <strong>■予約番号</strong><br />
      ${reservation.id}<br />
      <strong>■出発日時</strong><br />
      ${pickup}<br />
      <strong>■返却日時</strong><br />
      ${dropoff}<br />
      <strong>■店舗</strong><br />
      ${reservation.storeName}<br />
      <strong>■利用内容</strong><br />
      車両: ${reservation.vehicleModel} (${reservation.vehiclePlate || reservation.vehicleCode})<br />
      <strong>▽オプション</strong>
    </p>
    <ul>
      ${optionItems}
    </ul>
    <p>
      <strong>■合計金額</strong><br />
      ${reservation.paymentAmount}円
    </p>
    <p>
      予約詳細ページはこちらから<br />
      <a href="${myPageUrl}">${myPageUrl}</a>
    </p>
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
      足立小台本店 レンタル受付時間: 10:00 〜 19:00 （月曜・木曜定休）<br />
      三ノ輪店 レンタル受付時間: 24時間営業<br />
      事故受付専用<br />
      ロードサービス専用ダイヤル<br />
      0120-024-024
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
      cc: "info@yasukari.com",
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
