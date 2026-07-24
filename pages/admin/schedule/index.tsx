import { useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import Gantt from '../../../components/admin/Gantt';
import { genBikes } from '../../../lib/adminGanttData';
import styles from '../../../styles/AdminV2.module.css';

/**
 * バイクスケジュール（実装 / ダミーデータ）。移植メモ準拠：ガントは1画面に
 * 収める＋縦スクロール（compact）、既定範囲 7日前〜30日後。車両行は 店舗別→cc昇順。
 * 参照: admin-proto-v2.html #schedule
 */

type View = 'gantt' | 'board' | 'list';

type Card = { title: string; meta: string; href: string };
const BOARD: Array<{ label: string; color: string; cards: Card[] }> = [
  {
    label: '本日受取',
    color: 'var(--info)',
    cards: [
      { title: 'PCX', meta: '10:00 ／ #10231 ／ 三ノ輪', href: '/admin/reservations/YK-20260720-0031' },
      { title: 'クロスカブ', meta: '11:30 ／ #10250 ／ 足立 ・免許未確認', href: '/admin/license' },
      { title: 'レブル250', meta: '13:00 ／ #10244 ／ 三ノ輪', href: '/admin/reservations/YK-20260803-0044' },
    ],
  },
  {
    label: '貸出中',
    color: 'var(--ok)',
    cards: [
      { title: 'PCX', meta: '〜7/21 ／ #10231', href: '/admin/reservations/YK-20260720-0031' },
      { title: 'タクト', meta: '〜7/16 ／ #10222', href: '/admin/reservations/YK-20260612-0022' },
    ],
  },
  {
    label: '返却待ち',
    color: 'var(--warn)',
    cards: [{ title: 'リード125', meta: '18:00返却予定 ／ 写真待ち', href: '/admin/approvals' }],
  },
  {
    label: '整備',
    color: 'var(--brand)',
    cards: [
      { title: 'タクト', meta: 'AD-0031 ／ 整備候補', href: '/admin/maint' },
      { title: 'ジャイロ', meta: 'MW-0102 ／ 整備中', href: '/admin/maint' },
    ],
  },
];

type ListRow = { id: string; customer: string; vehicle: string; store: string; period: string; badge: string; label: string; href: string };
const LIST: ListRow[] = [
  { id: 'YK-…0031', customer: '山田 太郎', vehicle: 'PCX', store: '三ノ輪', period: '7/20〜7/21', badge: 'bOk', label: '貸出中', href: '/admin/reservations/YK-20260720-0031' },
  { id: 'YK-…0044', customer: '佐藤 花子', vehicle: 'レブル250', store: '足立', period: '8/03〜8/05', badge: 'bInfo', label: '予約完了', href: '/admin/reservations/YK-20260803-0044' },
  { id: 'YK-…0038', customer: '田中 次郎', vehicle: 'クロスカブ', store: '足立', period: '7/11〜7/13', badge: 'bWarn', label: '免許未確認', href: '/admin/license' },
];
const BADGE: Record<string, string> = { bOk: styles.bOk, bInfo: styles.bInfo, bWarn: styles.bWarn };

const AdminSchedule: NextPage = () => {
  const router = useRouter();
  const [view, setView] = useState<View>('gantt');
  const bikes = useMemo(() => genBikes(75), []);

  return (
    <>
      <Head>
        <title>バイクスケジュール | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="schedule" title="バイクスケジュール">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>バイクスケジュール</h1>
            <div className={styles.act}>
              <div className={styles.viewtoggle} role="tablist" aria-label="表示切替">
                {(['gantt', 'board', 'list'] as View[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="tab"
                    aria-selected={view === v}
                    className={`${styles.vt} ${view === v ? styles.vtOn : ''}`}
                    onClick={() => setView(v)}
                  >
                    {v === 'gantt' ? 'ガント' : v === 'board' ? 'ボード' : '一覧'}
                  </button>
                ))}
              </div>
              <select className={styles.storeSel} aria-label="店舗">
                <option>全店</option>
                <option>足立</option>
                <option>三ノ輪</option>
              </select>
            </div>
          </div>

          {/* ガント：1画面に収める＋縦スクロール、既定 7日前〜30日後 */}
          {view === 'gantt' && <Gantt rows={bikes} defaultRange="7,30" compact />}

          {view === 'board' && (
            <div className={styles.board}>
              {BOARD.map((col) => (
                <div key={col.label} className={styles.bcol}>
                  <div className={styles.bcolH} style={{ background: col.color }}>
                    {col.label}（{col.cards.length}）
                  </div>
                  <div className={styles.bcards}>
                    {col.cards.map((c) => (
                      <div key={c.title + c.meta} className={styles.bcard} onClick={() => router.push(c.href)}>
                        <b>{c.title}</b>
                        <div className={styles.bmeta}>{c.meta}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'list' && (
            <div className={styles.tblWrap}>
              <table className={styles.tbl}>
                <thead>
                  <tr>
                    <th>予約ID</th>
                    <th>顧客</th>
                    <th>車両</th>
                    <th>店舗</th>
                    <th>期間</th>
                    <th>状態</th>
                    <th aria-label="操作" />
                  </tr>
                </thead>
                <tbody>
                  {LIST.map((r) => (
                    <tr key={r.id} className="clickable" onClick={() => router.push(r.href)}>
                      <td className="mono">{r.id}</td>
                      <td className="strong">{r.customer}</td>
                      <td>{r.vehicle}</td>
                      <td>{r.store}</td>
                      <td className="mono">{r.period}</td>
                      <td>
                        <span className={`${styles.badge} ${BADGE[r.badge]}`}>{r.label}</span>
                      </td>
                      <td className={styles.tblActions}>
                        <button
                          type="button"
                          className={`${styles.btn} ${r.badge === 'bWarn' ? styles.btnPrimary : styles.btnOutline} ${styles.btnSm}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(r.href);
                          }}
                        >
                          {r.badge === 'bWarn' ? '確認' : '詳細'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className={styles.tipNote}>
            💡 同じ予約データを ガント（車両×日付）／ ボード（状態別カード）／ 一覧 で切替。カードや行から詳細へ。
          </p>
        </div>
      </AdminV2Shell>
    </>
  );
};

export default AdminSchedule;
