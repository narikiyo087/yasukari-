// 店舗マスタ（唯一の出所）。
//
// これまで店舗の情報がコードのあちこちに直書きされていた：
//   - 店舗の選択肢       … lib/dashboard/storeOptions.ts（id と label のみ）
//   - 住所・営業時間     … pages/stores.tsx
//   - メール文面の店舗名 … lib/emailFooter.ts / lib/reservationCompletionEmail.ts
//   - KEYBOXのユニットID … lib/keybox.ts
// 3店舗目を追加するとき、これらを全部探して直すのは現実的でないため、ここに集約した。
// **店舗を追加・変更するときは、このファイルの STORES だけを直す。**
//
// id は予約データの storeName と同じ文字列（"足立小台店" / "三ノ輪店"）。
// 既存データとの互換のため変えないこと。

export type StoreInfo = {
  id: string;              // 予約の storeName と一致させる
  label: string;           // 画面表示名
  emailLabel: string;      // メール署名などの呼び名
  staffed: boolean;        // 有人か（false＝24時間セルフ）
  address: string;
  access: string[];        // 最寄り駅など
  hoursLabel: string;      // 営業時間の表示
  hoursNote?: string;      // 期間限定の注記など
  keyboxUnitId?: string;   // セルフ店のKEYBOX（スマートロック）ユニットID
};

export const STORES: StoreInfo[] = [
  {
    id: "足立小台店",
    label: "足立小台店",
    emailLabel: "足立小台 本店",
    staffed: true,
    address: "東京都足立区小台2-9-7 1階",
    access: [
      "舎人ライナー『足立小台』駅から徒歩15分",
      "都電荒川線(東京さくらトラム)『小台』駅から徒歩15分",
      "JR田端駅から・都バス【東43】荒川土手行き・江北駅前行き・豊島五丁目団地行き乗車・小台二丁目下車",
    ],
    hoursLabel: "10:00 〜 19:00（月曜・木曜定休）",
  },
  {
    id: "三ノ輪店",
    label: "三ノ輪店",
    emailLabel: "三ノ輪 セルフ店",
    staffed: false,
    address: "東京都台東区下谷3ー16ー14",
    access: [
      "東京メトロ日比谷線 三ノ輪駅 徒歩4分",
      "東京メトロ日比谷線 入谷駅 徒歩7分",
    ],
    hoursLabel: "24時間営業",
    hoursNote: "（3月まで10:00 〜 19:00 （月曜・木曜定休）となります）",
    keyboxUnitId: "65ba13340cc4545240154f6c",
  },
];

export const getStoreInfo = (storeId?: string | null): StoreInfo | null =>
  storeId ? STORES.find((s) => s.id === storeId) ?? null : null;

/** セルフ（無人）店か。メールの入庫情報（解錠コード）を載せるかどうかの判定に使う */
export const isSelfStore = (storeId?: string | null): boolean =>
  getStoreInfo(storeId)?.staffed === false;

/** セルフ店のKEYBOXユニットID（該当が無ければ null） */
export const keyboxUnitIdOf = (storeId?: string | null): string | null =>
  getStoreInfo(storeId)?.keyboxUnitId ?? null;
