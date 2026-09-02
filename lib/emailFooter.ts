import { STORES } from "./stores";

// メールの共通フッター。店舗名・営業時間は lib/stores.ts（店舗マスタ）から作る。
// 店舗が増減しても、マスタを直せばメール文面も追従する。

export const EMAIL_FOOTER_TEXT_LINES = [
  "━…━…━…━…━…━…━…━…━…━…━…━…━…━…━…━",
  "【ヤスカリ】https://yasukari.com",
  ...STORES.flatMap((s) => [
    "",
    `・${s.emailLabel}`,
    `レンタル受付時間：${s.hoursLabel}`,
    ...(s.hoursNote ? [s.hoursNote] : []),
  ]),
  "",
  "事故受付専用　ロードサービス専用ダイヤル：0120-024-024",
  "━…━…━…━…━…━…━…━…━…━…━…━…━…━…━…━",
];

export const EMAIL_FOOTER_HTML = EMAIL_FOOTER_TEXT_LINES.join("<br />\n");
