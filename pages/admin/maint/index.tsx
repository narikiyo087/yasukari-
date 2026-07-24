import { useState } from 'react';
import Head from 'next/head';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';

/**
 * 整備アラート（実装 / ダミーデータ）— 塩漬け（未稼働）＋自賠責・車検の期限検知。
 * 参照: admin-proto-v2.html #maint。移植メモ: 「整備登録」は専用モーダルにする
 * （対象車両／整備区分／内容メモ／入庫・出庫予定／費用／担当）。
 */

type StatKind = 'bad' | 'mute' | 'warn';
type Stat = { icon: string; lbl: string; num: string; unit: string; sub: string; kind: StatKind };
const STATS: Stat[] = [
  { icon: '🛠', lbl: '整備候補', num: '2', unit: '台', sub: '60日以上 未稼働', kind: 'bad' },
  { icon: '📉', lbl: '低稼働', num: '3', unit: '台', sub: '30〜60日', kind: 'mute' },
  { icon: '🛡', lbl: '自賠責 切れ間近', num: '2', unit: '台', sub: '30日以内', kind: 'warn' },
  { icon: '🔧', lbl: '車検 切れ間近', num: '1', unit: '台', sub: '30日以内（251cc以上）', kind: 'warn' },
];

type Row = { code: string; model: string; store: string; last: string; elapsed: string; state: string; badge: string; cta: string };
const ROWS: Row[] = [
  { code: 'AD-0031', model: 'タクト', store: '足立', last: '2026/05/02', elapsed: '73日', state: '整備候補', badge: 'bBad', cta: '整備登録' },
  { code: 'MW-0102', model: 'ジャイロ', store: '三ノ輪', last: '2026/05/10', elapsed: '65日', state: '整備候補', badge: 'bBad', cta: '整備登録' },
  { code: 'AD-0044', model: 'タクト', store: '足立', last: '2026/06/05', elapsed: '39日', state: '低稼働', badge: 'bWarn', cta: '確認' },
  { code: 'RB-1001', model: 'レブル250', store: '三ノ輪', last: '自賠 〜7/29', elapsed: '残13日', state: '自賠責 切れ間近', badge: 'bWarn', cta: '更新登録' },
  { code: 'CB-1004', model: 'CB400', store: '（加盟）綾瀬', last: '車検 〜8/10', elapsed: '残25日', state: '車検 切れ間近', badge: 'bBad', cta: '車検登録' },
  { code: 'GB-1009', model: 'GB350', store: '（加盟）綾瀬', last: '自賠 〜8/05', elapsed: '残20日', state: '自賠責 切れ間近', badge: 'bWarn', cta: '更新登録' },
];

const BADGE: Record<string, string> = { bBad: styles.bBad, bWarn: styles.bWarn };

// 状態 → 整備区分の初期値
const KIND_DEFAULT: Record<string, string> = {
  整備候補: '定期点検',
  低稼働: '定期点検',
  '自賠責 切れ間近': '自賠責 更新',
  '車検 切れ間近': '車検',
};

const AdminMaint: NextPage = () => {
  const [target, setTarget] = useState<Row | null>(null);

  return (
    <>
      <Head>
        <title>整備アラート | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="maint" title="整備アラート">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>整備アラート</h1>
            <span className={styles.sub}>稼働のない車両（塩漬け）＋自賠責・車検の期限を検知</span>
          </div>

          <div className={styles.statRow}>
            {STATS.map((s) => (
              <div key={s.lbl} className={`${styles.stat} ${s.kind === 'bad' ? styles.bad : s.kind === 'warn' ? styles.warn : ''}`}>
                <span className={styles.statIcon}>{s.icon}</span>
                <div>
                  <div className={styles.statLbl}>{s.lbl}</div>
                  <div className={styles.statNum}>
                    {s.num}
                    <span>{s.unit}</span>
                  </div>
                  <div className={styles.statSub}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.tblWrap}>
            <table className={styles.tbl}>
              <thead>
                <tr>
                  <th>管理番号</th>
                  <th>車種</th>
                  <th>店舗</th>
                  <th>最終稼働 / 期限</th>
                  <th>経過 / 残</th>
                  <th>状態</th>
                  <th aria-label="操作" />
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.code}>
                    <td className="mono">{r.code}</td>
                    <td className="strong">{r.model}</td>
                    <td>{r.store}</td>
                    <td className="mono">{r.last}</td>
                    <td className="mono">{r.elapsed}</td>
                    <td>
                      <span className={`${styles.badge} ${BADGE[r.badge]}`}>{r.state}</span>
                    </td>
                    <td className={styles.tblActions}>
                      <button
                        type="button"
                        className={`${styles.btn} ${r.cta === '確認' ? styles.btnOutline : styles.btnPrimary} ${styles.btnSm}`}
                        onClick={() => setTarget(r)}
                      >
                        {r.cta}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className={styles.tipNote}>
            💡 既存の塩漬け検知（スプレッド／Chatwork通知）を管理画面に取り込み。返却時に記録した
            <b>メーター（走行距離）を距離ベースの点検基準</b>にも活用。アラート発生時は
            <b>バイクが紐づく店舗の責任者へメール通知</b>（店舗設定の通知先）。
          </p>
        </div>
      </AdminV2Shell>

      {/* 整備専用モーダル（移植メモ準拠） */}
      <AdminModal open={target !== null} title="整備を登録" onClose={() => setTarget(null)}>
        <div className={styles.amFld}>
          <label>対象車両</label>
          <input readOnly value={target ? `${target.model}（${target.code}）／ ${target.store}` : ''} />
        </div>
        <div className={styles.amFld}>
          <label>整備区分</label>
          <select defaultValue={target ? KIND_DEFAULT[target.state] ?? '定期点検' : '定期点検'}>
            <option>定期点検</option>
            <option>故障修理</option>
            <option>タイヤ交換</option>
            <option>オイル交換</option>
            <option>バッテリー</option>
            <option>自賠責 更新</option>
            <option>車検</option>
            <option>その他</option>
          </select>
        </div>
        <div className={styles.amFld}>
          <label>内容メモ</label>
          <textarea rows={2} placeholder="点検・交換の内容、症状など" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className={styles.amFld}>
            <label>入庫予定</label>
            <input type="date" />
          </div>
          <div className={styles.amFld}>
            <label>出庫予定</label>
            <input type="date" />
          </div>
          <div className={styles.amFld}>
            <label>費用（円）</label>
            <input type="number" placeholder="例：8000" />
          </div>
          <div className={styles.amFld}>
            <label>担当</label>
            <select>
              <option>本部整備</option>
              <option>店舗スタッフ</option>
              <option>外部委託（バイク店）</option>
            </select>
          </div>
        </div>
        <div className={styles.amNote} style={{ fontSize: 11.5, color: 'var(--t3)' }}>
          入庫予定を登録すると、その期間は<b>バイクスケジュールのガントに「整備」帯</b>として表示され、予約と重複しないよう保護されます。
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setTarget(null)}>
            キャンセル
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setTarget(null)}>
            整備を登録
          </button>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminMaint;
