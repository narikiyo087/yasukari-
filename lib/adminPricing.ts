/**
 * 料金設計の補間ロジック（クラス料金/車種料金 共通）。
 * 6つの基準日（1/2/4/7/14/31日）の料金から、間の日数を線形補間（¥10単位で切り捨て）。
 * 参照: admin-proto-v2.html の料金プレビュー。
 */

export const BASE_DAYS = [1, 2, 4, 7, 14, 31] as const;
export const BASE_LABELS = ['24時間', '2日間', '4日間', '1週間', '2週間', '1ヶ月'] as const;

/** 指定日数の料金と内訳メモを返す（prices は BASE_DAYS と同順） */
export function priceForDay(prices: number[], day: number): { price: number; note: string } {
  // 基準日ちょうど
  const bi = BASE_DAYS.indexOf(day as (typeof BASE_DAYS)[number]);
  if (bi >= 0) return { price: prices[bi], note: '基準' };
  // 範囲外（下限・上限）はクランプ
  if (day <= BASE_DAYS[0]) return { price: prices[0], note: '基準' };
  const last = BASE_DAYS.length - 1;
  if (day >= BASE_DAYS[last]) return { price: prices[last], note: '基準' };
  // 補間区間を探す
  for (let i = 0; i < last; i++) {
    const d0 = BASE_DAYS[i];
    const d1 = BASE_DAYS[i + 1];
    if (day > d0 && day < d1) {
      const p0 = prices[i];
      const p1 = prices[i + 1];
      const raw = p0 + ((p1 - p0) * (day - d0)) / (d1 - d0);
      const price = Math.floor(raw / 10) * 10;
      return { price, note: `${BASE_LABELS[i]}↔${BASE_LABELS[i + 1]}を補間` };
    }
  }
  return { price: prices[0], note: '基準' };
}

/** プレビュー用の代表的な日数（1〜31日から抜粋） */
export const PREVIEW_DAYS = [1, 2, 3, 4, 5, 7, 10, 14, 21, 31];

export const yen = (n: number) => `¥${n.toLocaleString()}`;
