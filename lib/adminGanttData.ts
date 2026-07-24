/**
 * 管理画面ガント用のダミー車両データ（決定的生成）。
 * 予約管理・バイクスケジュール・商品マスタのガントで共有する。
 * DynamoDB 不要。プロト(admin-proto-v2.html)の genBikes を React 向けに移植。
 */

export type SpanType = 'out' | 'resv' | 'maint';
/** [今日基準のオフセット(日), 期間(日), 種別] */
export type GanttSpan = [number, number, SpanType];

export type GanttRow = {
  code: string; // 管理番号
  name: string; // 車種名
  store: string;
  cc: number; // 排気量
  spans: GanttSpan[];
  jib: number; // 自賠責 満了（今日基準オフセット）
  sha: number | null; // 車検 満了（大型のみ／なければ null）
};

const GT_STORES = ['足立小台', '三ノ輪', '(加盟)北千住', '(加盟)王子', '(加盟)綾瀬'];
const GT_MODELS: Array<[string, string, number]> = [
  ['PCX', 'MW', 125],
  ['レブル250', 'RB', 250],
  ['タクト', 'AD', 50],
  ['クロスカブ', 'CR', 110],
  ['CB400', 'CB', 400],
  ['リード125', 'LD', 125],
  ['ジャイロ', 'GY', 50],
  ['アドレス125', 'AS', 125],
  ['グロム', 'GR', 125],
  ['GB350', 'GB', 350],
];
const BIG_MODELS = ['CB400', 'GB350', 'レブル250'];

/** n 台の車両を決定的に生成（乱数なし＝SSRでも同一） */
export function genBikes(n = 75): GanttRow[] {
  const rows: GanttRow[] = [];
  for (let i = 0; i < n; i++) {
    const m = GT_MODELS[i % GT_MODELS.length];
    const store = GT_STORES[i % GT_STORES.length];
    const code = `${m[1]}-${1000 + i}`;
    const spans: GanttSpan[] = [];
    const s1 = ((i * 7) % 110) - 25;
    spans.push([s1, 1 + (i % 3), (['out', 'resv', 'resv'] as SpanType[])[i % 3]]);
    const s2 = s1 + 5 + (i % 9);
    spans.push([s2, 2 + (i % 4), 'resv']);
    if (i % 8 === 0) spans.push([i % 40, 2, 'maint']);
    if (i % 5 === 0) spans.push([s2 + 12 + (i % 20), 3, 'resv']);
    const jib = ((i * 13) % 135) - 10;
    const big = BIG_MODELS.indexOf(m[0]) >= 0;
    const sha = big ? ((i * 19) % 150) - 5 : null;
    rows.push({ code, name: m[0], store, cc: m[2], spans, jib, sha });
  }
  // 店舗別 → 排気量(cc)昇順（移植メモの並び順）
  rows.sort((a, b) => {
    const s = GT_STORES.indexOf(a.store) - GT_STORES.indexOf(b.store);
    return s !== 0 ? s : a.cc - b.cc;
  });
  return rows;
}

export const GANTT_RANGES: Array<{ value: string; label: string }> = [
  { value: '30,90', label: '30日前 〜 90日後（120日）' },
  { value: '7,30', label: '7日前 〜 30日後' },
  { value: '0,14', label: '今日 〜 14日後' },
  { value: '0,30', label: '今日 〜 30日後' },
];
