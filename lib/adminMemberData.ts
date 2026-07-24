/**
 * 会員一覧のダミーデータ（決定的生成）。プロト(admin-proto-v2.html)の memRow を移植。
 * DynamoDB 不要。1,290件を決定的に生成する。
 */

export type MemberStatus = '本登録' | '仮登録' | '退会済' | 'ブラックリスト';
export type LicState = '確認済' | '未確認' | '再提出待ち';

export type MemberRow = {
  index: number;
  id: string; // 会員ID（YK-…）
  name: string;
  kana: string;
  status: MemberStatus;
  licType: string;
  licState: LicState;
  country: string; // 居住国
  rank: string;
  use: 'レンタル中' | '予約あり' | 'none';
  mag: '受信' | '停止';
  reg: string; // 登録日
  upd: string; // 最終更新
};

const SN = ['山田', '佐藤', '鈴木', '田中', '高橋', '伊藤', '渡辺', '中村', '小林', '加藤'];
const GN = ['太郎', '花子', '一郎', '美咲', '健太', '奈々', '裕子', '大輔'];
const KS = ['ヤマダ', 'サトウ', 'スズキ', 'タナカ', 'タカハシ', 'イトウ', 'ワタナベ', 'ナカムラ', 'コバヤシ', 'カトウ'];
const KG = ['タロウ', 'ハナコ', 'イチロウ', 'ミサキ', 'ケンタ', 'ナナ', 'ユウコ', 'ダイスケ'];
const LIC_TYPES = ['原付', '小型限定', '普通二輪', '大型二輪'];
const COUNTRIES = ['台湾', 'アメリカ', 'ドイツ', '韓国', 'ベトナム'];
const RANKS = ['新規', 'リピーター', '常連/VIP', '休眠'];

export const MEMBER_TOTAL = 1290;
export const MEMBER_PER_PAGE = 25;

export function memberAt(i: number): MemberRow {
  const sn = i % 10;
  const gn = Math.floor(i / 10) % 8;
  const name = `${SN[sn]} ${GN[gn]}`;
  const kana = `${KS[sn]} ${KG[gn]}`;
  const id = `YK-${10001 + i}`;

  let status: MemberStatus;
  if (i % 50 === 0) status = 'ブラックリスト';
  else if (i % 37 === 0) status = '退会済';
  else if (i % 3 === 0) status = '仮登録';
  else status = '本登録';

  const licType = LIC_TYPES[i % 4];
  const licState: LicState = status === '仮登録' ? '未確認' : i % 9 === 0 ? '再提出待ち' : '確認済';
  const country = i % 11 === 0 ? COUNTRIES[i % 5] : '日本';
  const rank = RANKS[i % 4];
  const use = i % 13 === 0 ? 'レンタル中' : i % 7 === 0 ? '予約あり' : 'none';
  const mag = i % 5 === 0 ? '停止' : '受信';
  const reg = `2026/${1 + (i % 9)}/${1 + (i % 27)}`;
  const upd = `2026/${1 + ((i + 3) % 9)}/${1 + ((i + 5) % 27)}`;

  return { index: i, id, name, kana, status, licType, licState, country, rank, use, mag, reg, upd };
}

export function genMembers(n = MEMBER_TOTAL): MemberRow[] {
  const rows: MemberRow[] = [];
  for (let i = 0; i < n; i++) rows.push(memberAt(i));
  return rows;
}
