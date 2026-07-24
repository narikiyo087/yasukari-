import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { NextPage } from 'next';
import AdminV2Shell from '../../components/admin/AdminV2Shell';
import InfoPopover from '../../components/admin/InfoPopover';
import AdminTutorial from '../../components/admin/AdminTutorial';
import styles from '../../styles/AdminV2.module.css';

/**
 * 管理画面 v2 — ダッシュボード（実装 / ダミーデータ）
 * デザイン見本帳(UI Design Foundation)準拠。プロト埋め込みではなく React 実装。
 */

const TUTORIAL_KEY = 'adminV2TutorialDone';

type IconName = 'users' | 'key' | 'return' | 'bike' | 'check';
type Kpi = { lbl: string; num: string; unit?: string; hint?: string; icon: IconName };
const KPIS: Kpi[] = [
  { lbl: '会員数', num: '1,290', hint: '本登録 715 / 仮登録 575', icon: 'users' },
  { lbl: '本日の貸出', num: '3', unit: '台', hint: '鍵・車両チェック', icon: 'key' },
  { lbl: '本日の返却', num: '2', unit: '件', hint: '返却写真の承認待ち', icon: 'return' },
  { lbl: '稼働台数', num: '41', unit: '/ 75', hint: '貸出中 + 予約', icon: 'bike' },
  { lbl: '承認待ち', num: '7', unit: '件', hint: '免許・返却・事故', icon: 'check' },
];

const ICON_PATHS: Record<IconName, ReactNode> = {
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c0-3 2.6-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 5.4a3 3 0 0 1 0 6" />
      <path d="M20.5 19c0-2.4-1.2-4.1-3-4.8" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="8" r="4" />
      <path d="M11 11l8.5 8.5" />
      <path d="M16.5 16.5l2-2" />
      <path d="M19 19l1.6-1.6" />
    </>
  ),
  return: (
    <>
      <path d="M9 7h6a4 4 0 0 1 0 8H7" />
      <path d="M10.5 4L7 7l3.5 3" />
    </>
  ),
  bike: (
    <>
      <circle cx="6" cy="16.5" r="3" />
      <circle cx="18" cy="16.5" r="3" />
      <path d="M6 16.5l4-6.5h4.5l1.8 6.5" />
      <path d="M10 10L8.7 7.5H6.4" />
      <path d="M14.5 10H18l1.2 3.4" />
    </>
  ),
  check: (
    <>
      <rect x="5.5" y="4" width="13" height="16" rx="2.2" />
      <path d="M9 4V3h6v1" />
      <path d="M9.3 12.2l2 2 3.6-4.2" />
    </>
  ),
};

// タスク種類の色（名前はタグではなくプレーン太字＋色ドットで表現）
const DOT_COLOR: Record<string, string> = {
  bBad: 'var(--bad)',
  bOk: 'var(--ok)',
  bInk: 'var(--ink)',
  bInfo: 'var(--info)',
  bWarn: 'var(--warn)',
};

const KpiIcon = ({ name }: { name: IconName }) => (
  <span className={styles.kpiIcon}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      {ICON_PATHS[name]}
    </svg>
  </span>
);

type Task = { no: string; badge: string; label: string; body: string; cta: string; primary?: boolean; href?: string };
// 並びは左メニュー順（予約管理 → 承認待ち → 免許確認 → その他）
const TASKS: Task[] = [
  { no: '①', badge: 'bBad', label: '新規予約・契約書印刷', body: '<b>3件</b>の新規予約｜<b>貸渡契約書を印刷</b>（現場で顧客に記入・保管）', cta: '印刷タスクへ', primary: true, href: '/admin/reservations' },
  { no: '②', badge: 'bOk', label: '受取準備', body: '<b>3台</b>本日の受取（鍵・車両チェック・KEYBOX発行）', cta: '一覧', href: '/admin/reservations' },
  { no: '③', badge: 'bInk', label: 'キャンセル希望', body: '<b>2件</b>のキャンセル希望（問い合わせ経由・キャンセル料判定）', cta: '対応', primary: true, href: '/admin/reservations' },
  { no: '④', badge: 'bInfo', label: '返却承認', body: '<b>2件</b>の返却写真を承認', cta: '承認へ', primary: true, href: '/admin/approvals' },
  { no: '⑤', badge: 'bBad', label: '事故報告', body: '<b>1件</b>の転倒報告を確認', cta: '確認', href: '/admin/approvals' },
  { no: '⑥', badge: 'bWarn', label: '免許確認', body: '<b>3件</b>の予約が免許確認待ち（予約停止中）', cta: '確認する', primary: true, href: '/admin/license' },
  { no: '⑦', badge: 'bWarn', label: '問い合わせ/チャット', body: '<b>3件</b>の未対応メッセージに返信', cta: '返信', primary: true },
];

const AdminV2Dashboard: NextPage = () => {
  const [tutOpen, setTutOpen] = useState(false);

  // 初回アクセス時は自動でチュートリアルを表示
  useEffect(() => {
    try {
      if (!localStorage.getItem(TUTORIAL_KEY)) setTutOpen(true);
    } catch {
      /* localStorage 不可でも無視 */
    }
  }, []);

  const closeTutorial = () => {
    setTutOpen(false);
    try {
      localStorage.setItem(TUTORIAL_KEY, '1');
    } catch {
      /* noop */
    }
  };

  return (
    <>
      <Head>
        <title>ダッシュボード | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="dash">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>ダッシュボード</h1>
            <span className={styles.sub}>本日の運用状況とタスク</span>
            <div className={styles.act}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                onClick={() => setTutOpen(true)}
              >
                ▶ チュートリアル
              </button>
            </div>
          </div>

          <div className={styles.kpiRow}>
            {KPIS.map((k) => (
              <div className={styles.kpi} key={k.lbl}>
                <KpiIcon name={k.icon} />
                <div className={styles.kpiText}>
                  <div className={styles.lbl}>{k.lbl}</div>
                  <div className={styles.num}>
                    {k.num}
                    {k.unit && <span>{k.unit}</span>}
                  </div>
                  {k.hint && <div className={styles.hint}>{k.hint}</div>}
                </div>
              </div>
            ))}
          </div>

          <div className={`${styles.panel} ${styles.panelRed}`}>
            <div className={styles.ph}>
              <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                今日のタスク
                <InfoPopover title="今日のタスクとは">
                  上から順に対応すれば、当日の運用は完了します。契約書の印刷など現場作業も見落とさないよう集約しています。
                  <div style={{ marginTop: 8 }}>
                    <a href="#" style={{ color: 'var(--brand-strong)', fontWeight: 700, textDecoration: 'none' }}>
                      業務マニュアルを見る ›
                    </a>
                  </div>
                </InfoPopover>
              </h2>
            </div>
            {TASKS.map((t) => (
              <div className={styles.row} key={t.no}>
                <span className={styles.taskName}>
                  <span className={styles.dot} style={{ background: DOT_COLOR[t.badge] }} />
                  {t.no} {t.label}
                </span>
                <div className={styles.m} dangerouslySetInnerHTML={{ __html: t.body }} />
                {t.href ? (
                  <Link
                    href={t.href}
                    className={`${styles.btn} ${styles.btnSm} ${styles.rowBtn} ${
                      t.primary ? styles.btnPrimary : styles.btnOutline
                    }`}
                  >
                    {t.cta}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnSm} ${styles.rowBtn} ${
                      t.primary ? styles.btnPrimary : styles.btnOutline
                    }`}
                  >
                    {t.cta}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </AdminV2Shell>

      <AdminTutorial open={tutOpen} onClose={closeTutorial} />
    </>
  );
};

export default AdminV2Dashboard;
