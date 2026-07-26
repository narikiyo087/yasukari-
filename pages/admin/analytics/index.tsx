import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';

/** 全店分析（実装 / ダミー）— 予約分析 / 会員分析 / 車両分析。参照: admin-proto-v2.html #analytics */

type Tab = 'reservation' | 'member' | 'vehicle';

type Stat = { icon: string; lbl: string; num: string; unit: string; sub?: string; kind?: string };
type Bar = { label: string; value: string; pct: number };
type HBar = { label: string; value: string; pct: number };

const StatRow = ({ stats }: { stats: Stat[] }) => (
  <div className={styles.statRow}>
    {stats.map((s) => (
      <div key={s.lbl} className={`${styles.stat} ${s.kind === 'bad' ? styles.bad : s.kind === 'warn' ? styles.warn : ''}`}>
        <span className={styles.statIcon}>{s.icon}</span>
        <div>
          <div className={styles.statLbl}>{s.lbl}</div>
          <div className={styles.statNum}>
            {s.num}
            <span>{s.unit}</span>
          </div>
          {s.sub && <div className={styles.statSub}>{s.sub}</div>}
        </div>
      </div>
    ))}
  </div>
);

const Bars = ({ title, bars, note }: { title: string; bars: Bar[]; note?: string }) => (
  <div className={styles.card}>
    <h3>{title}</h3>
    <div className={styles.bars}>
      {bars.map((b) => (
        <div key={b.label} className={styles.bar} style={{ height: `${b.pct}%` }}>
          <span className={styles.barVal}>{b.value}</span>
          <em className={styles.barLabel}>{b.label}</em>
        </div>
      ))}
    </div>
    {note && (
      <p className={styles.sub} style={{ marginTop: 14 }}>
        {note}
      </p>
    )}
  </div>
);

const HBars = ({ title, bars }: { title: string; bars: HBar[] }) => (
  <div className={styles.card}>
    <h3>{title}</h3>
    {bars.map((b) => (
      <div className={styles.hbar} key={b.label}>
        <span className={styles.hbarLbl}>{b.label}</span>
        <div className={styles.hbarTrack}>
          <div className={styles.hbarFill} style={{ width: `${b.pct}%` }}>
            {b.value}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const AdminAnalytics: NextPage = () => {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('reservation');
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    const q = router.query.tab;
    if (q === 'reservation' || q === 'member' || q === 'vehicle') setTab(q);
  }, [router.query.tab]);

  return (
    <>
      <Head>
        <title>全店分析 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="analytics" title="全店分析">
        <div className={`${styles.screen} ${styles.analyticsBlue}`}>
          <div className={styles.pgh}>
            <h1>全店分析</h1>
            <div className={styles.act}>
              <div className={styles.viewtoggle} role="tablist" aria-label="分析切替">
                {(['reservation', 'member', 'vehicle'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={tab === t}
                    className={`${styles.vt} ${tab === t ? styles.vtOn : ''}`}
                    onClick={() => setTab(t)}
                  >
                    {t === 'reservation' ? '予約分析' : t === 'member' ? '会員分析' : '車両分析'}
                  </button>
                ))}
              </div>
              <select className={styles.storeSel} defaultValue="今月">
                <option>今月</option>
                <option>先月</option>
                <option>過去12ヶ月</option>
              </select>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setReportOpen(true)}>
                📄 月次レポート出力
              </button>
            </div>
          </div>

          {tab === 'reservation' && (
            <>
              <StatRow
                stats={[
                  { icon: '📈', lbl: '今月の予約成立', num: '42', unit: '件', sub: '前月比 +17%' },
                  { icon: '⚙', lbl: '稼働率', num: '68', unit: '%', sub: '保有75台', kind: '' },
                  { icon: '📅', lbl: '平均レンタル', num: '2.3', unit: '日' },
                  { icon: '↩', lbl: 'キャンセル率', num: '6', unit: '%', kind: 'warn' },
                ]}
              />
              <Bars
                title="予約成立の推移（月次）"
                note="2月の完全リニューアル以降、右肩上がり（V字回復）。"
                bars={[
                  { label: '1月', value: '15', pct: 35 },
                  { label: '2月', value: '21', pct: 50 },
                  { label: '3月', value: '28', pct: 66 },
                  { label: '4月', value: '32', pct: 76 },
                  { label: '5月', value: '36', pct: 85 },
                  { label: '6月', value: '42', pct: 100 },
                ]}
              />
              <div className={styles.cols2}>
                <HBars
                  title="店舗別 予約（今月）"
                  bars={[
                    { label: '三ノ輪', value: '31', pct: 100 },
                    { label: '足立小台', value: '11', pct: 35 },
                  ]}
                />
                <HBars
                  title="クラス別 予約（今月）"
                  bars={[
                    { label: '125cc', value: '16', pct: 100 },
                    { label: '50cc', value: '9', pct: 56 },
                    { label: '126–250', value: '8', pct: 50 },
                    { label: '原付二種MT', value: '6', pct: 37 },
                    { label: '251–400', value: '3', pct: 18 },
                  ]}
                />
              </div>
              <HBars
                title="人気車種 TOP5（予約数）"
                bars={[
                  { label: 'PCX', value: '12', pct: 100 },
                  { label: 'タクト', value: '8', pct: 66 },
                  { label: 'レブル250', value: '7', pct: 58 },
                  { label: 'クロスカブ', value: '6', pct: 50 },
                  { label: 'リード125', value: '5', pct: 41 },
                ]}
              />
            </>
          )}

          {tab === 'member' && (
            <>
              <StatRow
                stats={[
                  { icon: '👤', lbl: '本登録', num: '715', unit: '名', sub: '当月+38' },
                  { icon: '📝', lbl: '仮登録', num: '575', unit: '名' },
                  { icon: '🔁', lbl: 'リピート率', num: '14', unit: '%' },
                  { icon: '🌏', lbl: '海外（閲覧国）', num: '63', unit: '国', sub: '予約は少数', kind: 'warn' },
                ]}
              />
              <Bars
                title="本登録の累計推移（月次）"
                bars={[
                  { label: '1月', value: '300', pct: 41 },
                  { label: '2月', value: '417', pct: 58 },
                  { label: '3月', value: '520', pct: 72 },
                  { label: '4月', value: '600', pct: 83 },
                  { label: '5月', value: '670', pct: 93 },
                  { label: '6月', value: '715', pct: 100 },
                ]}
              />
              <div className={styles.cols2}>
                <HBars
                  title="会員ランク分布"
                  bars={[
                    { label: '新規', value: '560', pct: 100 },
                    { label: 'リピーター', value: '130', pct: 23 },
                    { label: '常連/VIP', value: '25', pct: 4 },
                    { label: '休眠', value: '80', pct: 14 },
                  ]}
                />
                <HBars
                  title="登録経路（当月新規）"
                  bars={[
                    { label: '自然/SEO', value: '18', pct: 100 },
                    { label: 'Meta広告', value: '9', pct: 50 },
                    { label: 'Google', value: '7', pct: 38 },
                    { label: '紹介', value: '4', pct: 22 },
                  ]}
                />
              </div>
            </>
          )}

          {tab === 'vehicle' && (
            <>
              <StatRow
                stats={[
                  { icon: '🏍', lbl: '保有台数', num: '75', unit: '台' },
                  { icon: '⚙', lbl: '平均稼働率', num: '68', unit: '%' },
                  { icon: '🛠', lbl: '整備候補', num: '2', unit: '台', sub: '60日以上', kind: 'warn' },
                  { icon: '❤', lbl: 'お気に入り', num: '340', unit: '件' },
                ]}
              />
              <HBars
                title="クラス別 稼働率"
                bars={[
                  { label: '125cc', value: '82%', pct: 100 },
                  { label: '原付二種MT', value: '74%', pct: 90 },
                  { label: '126–250', value: '66%', pct: 80 },
                  { label: '50cc', value: '58%', pct: 70 },
                  { label: '251–400', value: '41%', pct: 50 },
                ]}
              />
              <div className={styles.cols2}>
                <HBars
                  title="人気車種（お気に入り数）"
                  bars={[
                    { label: 'PCX', value: '96', pct: 100 },
                    { label: 'レブル250', value: '74', pct: 77 },
                    { label: 'CB400', value: '52', pct: 54 },
                    { label: 'クロスカブ', value: '43', pct: 44 },
                  ]}
                />
                <HBars
                  title="空き通知（需要の見える化）"
                  bars={[
                    { label: 'CB400', value: '14', pct: 100 },
                    { label: 'レブル250', value: '9', pct: 64 },
                    { label: 'PCX', value: '5', pct: 35 },
                  ]}
                />
              </div>
            </>
          )}
        </div>
      </AdminV2Shell>

      <AdminModal open={reportOpen} title="月次レポートの出力" onClose={() => setReportOpen(false)}>
        <div className={styles.amFld}>
          <label>対象月</label>
          <select>
            <option>2026年6月</option>
            <option>2026年5月</option>
            <option>2026年4月</option>
          </select>
        </div>
        <div className={styles.amFld}>
          <label>形式</label>
          <select>
            <option>PDF（A4・印刷用）</option>
            <option>CSV（数値データ）</option>
          </select>
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--t3)', margin: '6px 0 2px' }}>含める内容</div>
        {['予約分析（推移・店舗別・車種別）', '会員分析（登録推移・ランク）', '車両分析（稼働率・人気）', '売上・精算（消費税込・店舗別）'].map((l, i) => (
          <label key={l} style={{ display: 'flex', gap: 8, padding: '6px 0', fontSize: 13 }}>
            <input type="checkbox" defaultChecked={i < 3} style={{ accentColor: 'var(--brand)' }} /> {l}
          </label>
        ))}
        <div className={styles.amRow} style={{ marginTop: 12 }}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setReportOpen(false)}>
            閉じる
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setReportOpen(false)}>
            出力する
          </button>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminAnalytics;
