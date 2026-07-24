import { useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import styles from '../../../styles/AdminV2.module.css';

/**
 * 承認待ち（実装 / ダミーデータ）— 免許・返却・事故・写真をまとめて処理。
 * 参照: admin-proto-v2.html #approvals
 */

type Kind = 'license' | 'return' | 'accident' | 'photo';
type Row = { kind: Kind; target: string; store: string; received: string; href: string; cta: string };

const KIND_META: Record<Kind, { label: string; badge: string; chip: string }> = {
  license: { label: '免許証', badge: styles.bWarn, chip: '免許証' },
  return: { label: '返却完了', badge: styles.bInfo, chip: '返却完了' },
  accident: { label: '事故報告', badge: styles.bBad, chip: '事故報告' },
  photo: { label: '写真', badge: styles.bInfo, chip: '写真' },
};

const ROWS: Row[] = [
  { kind: 'license', target: '会員#10231 免許証画像', store: '三ノ輪', received: '7/14 09:12', href: '/admin/license', cta: '確認・承認' },
  { kind: 'license', target: '会員#10244 免許証画像', store: '足立', received: '7/14 08:40', href: '/admin/license', cta: '確認・承認' },
  { kind: 'return', target: 'PCX 返却写真', store: '三ノ輪', received: '7/14 08:05', href: '/admin/approvals/return/MW-0125', cta: '確認・完了' },
  { kind: 'accident', target: 'レブル250 転倒報告', store: '三ノ輪', received: '7/13 17:22', href: '/admin/approvals/accident/A-0012', cta: '内容を確認' },
];

const CHIPS: Array<{ key: 'all' | Kind; label: string }> = [
  { key: 'all', label: 'すべて' },
  { key: 'license', label: '免許証' },
  { key: 'return', label: '返却完了' },
  { key: 'accident', label: '事故報告' },
  { key: 'photo', label: '写真' },
];

const AdminApprovals: NextPage = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | Kind>('all');

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: ROWS.length };
    (['license', 'return', 'accident', 'photo'] as Kind[]).forEach((k) => {
      c[k] = ROWS.filter((r) => r.kind === k).length;
    });
    // 写真はダミーで1件計上（プロト踏襲）
    c.photo = c.photo || 1;
    c.all = 7;
    return c;
  }, []);

  const rows = filter === 'all' ? ROWS : ROWS.filter((r) => r.kind === filter);

  return (
    <>
      <Head>
        <title>承認待ち | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="approvals" title="承認待ち">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>承認待ち</h1>
            <span className={styles.sub}>免許・事故・返却・写真をまとめて処理</span>
          </div>

          <div className={styles.toolbar}>
            {CHIPS.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`${styles.chip} ${filter === c.key ? styles.chipOn : ''}`}
                onClick={() => setFilter(c.key)}
              >
                {c.label} {counts[c.key] ?? 0}
              </button>
            ))}
          </div>

          <div className={styles.tblWrap}>
            <table className={styles.tbl}>
              <thead>
                <tr>
                  <th>種別</th>
                  <th>対象</th>
                  <th>店舗</th>
                  <th>受信</th>
                  <th aria-label="操作" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.target} className="clickable" onClick={() => router.push(r.href)}>
                    <td>
                      <span className={`${styles.badge} ${KIND_META[r.kind].badge}`}>{KIND_META[r.kind].label}</span>
                    </td>
                    <td className="strong">{r.target}</td>
                    <td>{r.store}</td>
                    <td className="mono">{r.received}</td>
                    <td className={styles.tblActions}>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(r.href);
                        }}
                      >
                        {r.cta}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AdminV2Shell>
    </>
  );
};

export default AdminApprovals;
