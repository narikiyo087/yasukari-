import { useState } from 'react';
import Head from 'next/head';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';

/** 売上・精算（実装 / ダミー）。参照: admin-proto-v2.html #revenue */

const MONTHS = [
  { m: '8月', v: 780 },
  { m: '9月', v: 820 },
  { m: '10月', v: 900 },
  { m: '11月', v: 870 },
  { m: '12月', v: 950 },
  { m: '1月', v: 1010 },
  { m: '2月', v: 1080 },
  { m: '3月', v: 1120 },
  { m: '4月', v: 1050 },
  { m: '5月', v: 1160 },
  { m: '6月', v: 1200 },
  { m: '7月', v: 1240 },
];
// SVG polyline（モックの座標を移植）
const THIS_YEAR = '30,100 90,94 150,81 210,86 270,73 330,63 390,52 450,45 510,56 570,38 630,32 690,25';
const LAST_YEAR = '30,127 90,122 150,114 210,115 270,104 330,97 390,89 450,84 510,91 570,79 630,73 690,68';
const AREA = '30,100 90,94 150,81 210,86 270,73 330,63 390,52 450,45 510,56 570,38 630,32 690,25 690,150 30,150';

const KPIS = [
  { icon: '💰', lbl: '今月の売上（全店）', num: '1,240', unit: '千円', sub: '前月比 +14%' },
  { icon: '🏢', lbl: '足立小台', num: '520', unit: '千円', sub: '' },
  { icon: '🏢', lbl: '三ノ輪', num: '720', unit: '千円', sub: '' },
  { icon: '🧾', lbl: '決済件数', num: '217', unit: '件', sub: '' },
];

const SETTLE = [
  { store: '足立小台（直営）', sales: '520,000', fee: '15,600', royalty: '—', net: '504,400', state: '直営', badge: styles.bMute },
  { store: '三ノ輪（直営）', sales: '720,000', fee: '21,600', royalty: '—', net: '698,400', state: '直営', badge: styles.bMute },
  { store: '（例）加盟店A', sales: '300,000', fee: '9,000', royalty: '30,000', net: '261,000', state: '精算待ち', badge: styles.bWarn },
];

const FRANCHISE = [
  { store: '（加盟）北千住店', sales: '420,000', fee: '12,600', royalty: '42,000', net: '365,400', bank: '○○銀行 ****1234', ready: true },
  { store: '（加盟）王子店', sales: '180,000', fee: '5,400', royalty: '18,000', net: '156,600', bank: '○○銀行 ****5678', ready: true },
  { store: '（加盟）綾瀬店', sales: '—', fee: '—', royalty: '—', net: '—', bank: '未登録', ready: false },
];

const AdminRevenue: NextPage = () => {
  const [csvOpen, setCsvOpen] = useState(false);
  const [closeTarget, setCloseTarget] = useState<string | null>(null);

  return (
    <>
      <Head>
        <title>売上・精算 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="revenue" title="売上・精算">
        <div className={styles.screen}>
          <div className={styles.linechart}>
            <div className={styles.lcHead}>
              <h3>売上推移（過去12ヶ月・全店）</h3>
              <span className={styles.sub}>単位：千円</span>
              <span className={styles.gtLegend} style={{ marginLeft: 'auto' }}>
                <span>
                  <i style={{ background: '#0284c7' }} />
                  今年
                </span>
                <span>
                  <i style={{ background: '#94a3b8' }} />
                  昨年（点線）
                </span>
              </span>
            </div>
            <div className={styles.lcVals}>
              {MONTHS.map((m, i) => (
                <span key={m.m}>
                  {m.m} <b style={i === MONTHS.length - 1 ? { color: 'var(--brand)' } : undefined}>{m.v.toLocaleString()}</b>
                </span>
              ))}
            </div>
            <svg viewBox="0 0 720 150" preserveAspectRatio="none">
              <polyline fill="rgba(2,132,199,.10)" stroke="none" points={AREA} />
              <polyline fill="none" stroke="#94a3b8" strokeWidth={1.6} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" points={LAST_YEAR} />
              <polyline fill="none" stroke="#0284c7" strokeWidth={2.5} vectorEffect="non-scaling-stroke" points={THIS_YEAR} />
            </svg>
            <p className={styles.fineNote} style={{ margin: '2px 4px 0' }}>※ 昨年の同月データが揃うと、自動で昨対比（点線）を表示します。</p>
            <div className={styles.lcAxis}>
              {MONTHS.map((m) => (
                <span key={m.m}>{m.m.replace('月', '')}</span>
              ))}
            </div>
          </div>

          <div className={styles.pgh}>
            <h1>売上・精算</h1>
            <span className={styles.sub}>店舗別の売上とフランチャイズ精算</span>
            <div className={styles.act}>
              <select className={styles.storeSel} defaultValue="2026年7月">
                <option>2026年7月</option>
                <option>2026年6月</option>
              </select>
              <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setCsvOpen(true)}>
                明細CSV
              </button>
            </div>
          </div>

          <div className={styles.statRow}>
            {KPIS.map((k) => (
              <div key={k.lbl} className={styles.stat}>
                <span className={styles.statIcon}>{k.icon}</span>
                <div>
                  <div className={styles.statLbl}>{k.lbl}</div>
                  <div className={styles.statNum}>
                    {k.num}
                    <span>{k.unit}</span>
                  </div>
                  {k.sub && <div className={styles.statSub}>{k.sub}</div>}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.tblWrap}>
            <table className={styles.tbl}>
              <thead>
                <tr>
                  <th>店舗</th>
                  <th>売上</th>
                  <th>決済手数料</th>
                  <th>ロイヤリティ(10%)</th>
                  <th>店舗受取</th>
                  <th>精算状態</th>
                </tr>
              </thead>
              <tbody>
                {SETTLE.map((s) => (
                  <tr key={s.store}>
                    <td className="strong">{s.store}</td>
                    <td className="mono">{s.sales}</td>
                    <td className="mono">{s.fee}</td>
                    <td className="mono">{s.royalty}</td>
                    <td className="mono strong">{s.net}</td>
                    <td>
                      <span className={`${styles.badge} ${s.badge}`}>{s.state}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.tipNote}>💡 加盟店には売上からロイヤリティ・手数料を差し引いた金額を精算。店舗オーナーは自店分のみ閲覧。</p>

          <div className={`${styles.panel} ${styles.panelRed}`} style={{ marginTop: 22 }}>
            <div className={styles.ph}>
              <h2>月次締め・フランチャイズ精算</h2>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select className={styles.storeSel} defaultValue="2026年7月">
                  <option>2026年7月</option>
                  <option>2026年6月</option>
                </select>
                <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={() => setCsvOpen(true)}>
                  振込CSVを出力
                </button>
              </div>
            </div>
            <div className={styles.panelNote}>
              加盟店ごとに <b>売上 −決済手数料 −ロイヤリティ ＝ 店舗受取</b> を自動集計。締めると確定し、振込CSVを出力します。
            </div>
            <div className={styles.tblWrap} style={{ border: 0 }}>
              <table className={styles.tbl} style={{ minWidth: 760 }}>
                <thead>
                  <tr>
                    <th>加盟店</th>
                    <th>売上</th>
                    <th>手数料</th>
                    <th>ロイヤリティ</th>
                    <th>店舗受取</th>
                    <th>振込先</th>
                    <th>締め</th>
                  </tr>
                </thead>
                <tbody>
                  {FRANCHISE.map((f) => (
                    <tr key={f.store}>
                      <td className="strong">{f.store}</td>
                      <td className="mono">{f.sales}</td>
                      <td className="mono">{f.fee}</td>
                      <td className="mono">{f.royalty}</td>
                      <td className="mono strong">{f.net}</td>
                      <td className="mono">{f.bank}</td>
                      <td>
                        {f.ready ? (
                          <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} onClick={() => setCloseTarget(f.store)}>
                            締めて確定
                          </button>
                        ) : (
                          <span className={`${styles.badge} ${styles.bMute}`}>準備中</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.fineNote} style={{ padding: '0 20px 12px' }}>※ 締め後は金額が確定（監査ログに記録）。振込CSVは銀行フォーマットで出力。直営はロイヤリティ対象外。</p>
          </div>
        </div>
      </AdminV2Shell>

      <AdminModal open={csvOpen} title="CSVを生成しました" onClose={() => setCsvOpen(false)}>
        <div className={styles.amBox} style={{ textAlign: 'center' }}>📄 settlement_202607.csv</div>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.fullBtn}`} onClick={() => setCsvOpen(false)}>
          ダウンロード
        </button>
      </AdminModal>

      <AdminModal open={closeTarget !== null} title="月次締め・確定" onClose={() => setCloseTarget(null)}>
        <div className={styles.amNote}>
          <b>{closeTarget}</b> の当月精算額を確定します。確定後は金額が変更できません（監査ログに記録）。振込CSVを出力できます。
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setCloseTarget(null)}>
            キャンセル
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setCloseTarget(null)}>
            締めて確定
          </button>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminRevenue;
