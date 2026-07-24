import { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import Gantt from '../../../components/admin/Gantt';
import { genBikes } from '../../../lib/adminGanttData';
import styles from '../../../styles/AdminV2.module.css';

/**
 * 予約管理（実装 / ダミーデータ）— 一覧 / ボード / ガント の3ビュー。
 * 参照: public/mock/admin-proto-v2.html #reservations、docs/admin-port-notes.md
 */

type View = 'list' | 'board' | 'gantt';
type StatusKey = 'ok' | 'info' | 'warn' | 'mute';

const STATUS: Record<StatusKey, { label: string; badge: string; color: string }> = {
  info: { label: '予約完了', badge: styles.bInfo, color: 'var(--info)' },
  ok: { label: '貸出中', badge: styles.bOk, color: 'var(--ok)' },
  warn: { label: '免許未確認', badge: styles.bWarn, color: 'var(--warn)' },
  mute: { label: '返却済', badge: styles.bMute, color: 'var(--t3)' },
};

type Reservation = {
  id: string; // 予約ID（表示用の短縮）
  fullId: string; // 詳細ページ用
  customer: string;
  vehicle: string;
  store: string;
  period: string;
  status: StatusKey;
  needsLicense?: boolean; // 免許確認へ誘導
};

const RESERVATIONS: Reservation[] = [
  { id: 'YK-…0031', fullId: 'YK-20260720-0031', customer: '山田 太郎', vehicle: 'PCX', store: '三ノ輪', period: '7/20 10:00〜7/21 18:00', status: 'ok' },
  { id: 'YK-…0044', fullId: 'YK-20260803-0044', customer: '佐藤 花子', vehicle: 'レブル250', store: '足立', period: '8/03 09:00〜8/05 18:00', status: 'info' },
  { id: 'YK-…0038', fullId: 'YK-20260711-0038', customer: '田中 次郎', vehicle: 'クロスカブ', store: '足立', period: '7/11 10:00〜7/13 18:00', status: 'warn', needsLicense: true },
  { id: 'YK-…0022', fullId: 'YK-20260612-0022', customer: '鈴木 一郎', vehicle: 'タクト', store: '三ノ輪', period: '6/12 10:00〜6/12 20:00', status: 'mute' },
];

type PrintTask = { time: string; label: string };
const PRINT_TASKS: PrintTask[] = [
  { time: '受取 10:00', label: '#10231 山田 太郎 ／ PCX ／ 三ノ輪' },
  { time: '受取 11:30', label: '#10250 田中 次郎 ／ クロスカブ ／ 足立' },
  { time: '受取 14:00', label: '#10244 佐藤 花子 ／ レブル250 ／ 三ノ輪' },
];

const AdminReservations: NextPage = () => {
  const router = useRouter();
  const [view, setView] = useState<View>('list');
  const [query, setQuery] = useState('');
  const [store, setStore] = useState('全店');
  const [status, setStatus] = useState('全ステータス');
  const [printedIdx, setPrintedIdx] = useState<Set<number>>(new Set());
  const [csvOpen, setCsvOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);

  const bikes = useMemo(() => genBikes(75), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RESERVATIONS.filter((r) => {
      if (q && !(`${r.id} ${r.fullId} ${r.customer} ${r.vehicle}`.toLowerCase().includes(q))) return false;
      if (store !== '全店' && !(store.includes(r.store) || r.store.includes(store))) return false;
      if (status !== '全ステータス' && STATUS[r.status].label !== status) return false;
      return true;
    });
  }, [query, store, status]);

  const remaining = PRINT_TASKS.length - printedIdx.size;

  // 免許確認画面は未実装のため、当面は予約詳細へ（詳細に免許ステータスを表示）
  const openDetail = (r: Reservation) => {
    router.push(`/admin/reservations/${r.fullId}`);
  };

  const boardCols: Array<{ status: StatusKey; items: Reservation[] }> = (['info', 'ok', 'warn', 'mute'] as StatusKey[]).map(
    (s) => ({ status: s, items: RESERVATIONS.filter((r) => r.status === s) }),
  );

  return (
    <>
      <Head>
        <title>予約管理 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="reservations" title="予約管理">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>予約管理</h1>
            <span className={styles.sub}>全 128 件</span>
            <div className={styles.act}>
              <div className={styles.viewtoggle} role="tablist" aria-label="表示切替">
                {(['list', 'board', 'gantt'] as View[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="tab"
                    aria-selected={view === v}
                    className={`${styles.vt} ${view === v ? styles.vtOn : ''}`}
                    onClick={() => setView(v)}
                  >
                    {v === 'list' ? '一覧' : v === 'board' ? 'ボード' : 'ガント'}
                  </button>
                ))}
              </div>
              <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setCsvOpen(true)}>
                CSV出力
              </button>
            </div>
          </div>

          {/* 貸渡契約書 印刷タスク（現場作業・見落とし防止） */}
          <div className={`${styles.panel} ${styles.panelRed}`}>
            <div className={styles.ph}>
              <h2 className={styles.phGrow}>
                貸渡契約書の印刷タスク（本日の新規予約）
                <span className={`${styles.badge} ${remaining ? styles.bBad : styles.bOk}`}>
                  {remaining ? `${remaining}件 未印刷` : 'すべて印刷済み'}
                </span>
              </h2>
            </div>
            <div className={styles.panelNote}>
              現場で契約書を印刷し、顧客に記入・保管してもらう作業です。印刷が済んだら「印刷済みにする」を押してください。
              <b>ログイン操作が難しいスタッフでも見落とさないよう、予約管理の最上部に固定表示しています。</b>
            </div>
            {PRINT_TASKS.map((t, i) => {
              const done = printedIdx.has(i);
              return (
                <div key={t.time} className={`${styles.prRow} ${done ? styles.done : ''}`}>
                  <span className={styles.tm}>{t.time}</span>
                  <div className={styles.m}>
                    <b>{t.label}</b>
                  </div>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                    onClick={() => setContractOpen(true)}
                  >
                    契約書を印刷
                  </button>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnSm} ${done ? styles.btnOutline : styles.btnPrimary}`}
                    style={{ marginLeft: 8, minWidth: 120, justifyContent: 'center' }}
                    disabled={done}
                    onClick={() => setPrintedIdx((prev) => new Set(prev).add(i))}
                  >
                    {done ? '✓ 印刷済み' : '印刷済みにする'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* 一覧ビュー */}
          {view === 'list' && (
            <>
              <div className={styles.toolbar}>
                <input
                  className="grow"
                  placeholder="🔍 予約ID・顧客名で検索"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <select value={store} onChange={(e) => setStore(e.target.value)}>
                  <option>全店</option>
                  <option>足立小台</option>
                  <option>三ノ輪</option>
                </select>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option>全ステータス</option>
                  <option>予約完了</option>
                  <option>貸出中</option>
                  <option>返却済</option>
                  <option>免許未確認</option>
                </select>
                <input type="date" aria-label="日付で絞り込み" />
              </div>
              <div className={styles.tblWrap}>
                <table className={styles.tbl}>
                  <thead>
                    <tr>
                      <th>予約ID</th>
                      <th>顧客</th>
                      <th>車両</th>
                      <th>店舗</th>
                      <th>貸出〜返却</th>
                      <th>ステータス</th>
                      <th aria-label="操作" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.fullId} className="clickable" onClick={() => openDetail(r)}>
                        <td className="mono">{r.id}</td>
                        <td className="strong">{r.customer}</td>
                        <td>{r.vehicle}</td>
                        <td>{r.store}</td>
                        <td className="mono">{r.period}</td>
                        <td>
                          <span className={`${styles.badge} ${STATUS[r.status].badge}`}>{STATUS[r.status].label}</span>
                        </td>
                        <td className={styles.tblActions}>
                          <Link
                            href={`/admin/reservations/${r.fullId}`}
                            className={`${styles.btn} ${r.needsLicense ? styles.btnPrimary : styles.btnOutline} ${styles.btnSm}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {r.needsLicense ? '確認' : '詳細'}
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--t3)', padding: 28 }}>
                          条件に一致する予約はありません
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ボードビュー */}
          {view === 'board' && (
            <div className={styles.board}>
              {boardCols.map(({ status: s, items }) => (
                <div key={s} className={styles.bcol}>
                  <div className={styles.bcolH} style={{ background: STATUS[s].color }}>
                    {STATUS[s].label}（{items.length}）
                  </div>
                  <div className={styles.bcards}>
                    {items.map((r) => (
                      <div key={r.fullId} className={styles.bcard} onClick={() => openDetail(r)}>
                        <b>{r.vehicle}</b>
                        <div className={styles.bmeta}>
                          {r.period.split('〜')[0]} ／ {r.customer} ／ {r.store}
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && <div className={styles.bmeta}>なし</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ガントビュー（今日基準・据え置き 30日前〜90日後） */}
          {view === 'gantt' && <Gantt rows={bikes} defaultRange="30,90" />}
        </div>
      </AdminV2Shell>

      <AdminModal open={csvOpen} title="CSVを生成しました" onClose={() => setCsvOpen(false)}>
        <div className={styles.amBox} style={{ textAlign: 'center' }}>📄 reservations_export.csv</div>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.fullBtn}`} onClick={() => setCsvOpen(false)}>
          ダウンロード
        </button>
      </AdminModal>

      <AdminModal open={contractOpen} title="貸渡契約書（自動発行）" onClose={() => setContractOpen(false)}>
        <div className={styles.amNote}>
          予約確定時に顧客情報から<b>自動発行</b>され、予約と顧客に紐付けて保管されます（利用規約への同意とは別に、レンタルのたびに1通発行）。
        </div>
        <div className={styles.amBox}>
          <b>貸渡契約書（A4 1枚）</b>
          <div style={{ color: 'var(--t3)', marginTop: 4 }}>
            氏名・住所・車両・料金・補償・延長欄・事業者情報を差込済み。現場では本書を印刷してご利用ください。
          </div>
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setContractOpen(false)}>
            閉じる
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => {
              setContractOpen(false);
              if (typeof window !== 'undefined') window.print();
            }}
          >
            A4で印刷 / PDF保存
          </button>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminReservations;
