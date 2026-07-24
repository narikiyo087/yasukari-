import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../../components/admin/AdminV2Shell';
import AdminModal from '../../../../components/admin/AdminModal';
import styles from '../../../../styles/AdminV2.module.css';
import { BASE_LABELS, PREVIEW_DAYS, priceForDay, yen } from '../../../../lib/adminPricing';

/** 日毎料金設定（車種の個別料金）。参照: admin-proto-v2.html #pricingdetail */

const MODEL_INFO: Record<string, { name: string; klass: string }> = {
  'M-PCX': { name: 'PCX', klass: '125ccスクーター' },
  'M-REBEL': { name: 'レブル250', klass: '126–250cc' },
  'M-TACT': { name: 'タクト', klass: '50ccスクーター' },
  'M-CROSS': { name: 'クロスカブ', klass: '原付二種MT' },
};
const DEFAULT_PRICES = [4000, 7000, 10000, 14000, 23000, 40000];
const SAVED_ROWS = [
  { day: '1日', price: 4000, updated: '7/10' },
  { day: '2日', price: 7000, updated: '7/10' },
  { day: '7日', price: 14000, updated: '7/10' },
];

const AdminModelPricing: NextPage = () => {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : 'M-PCX';
  const info = MODEL_INFO[id] ?? { name: 'PCX', klass: '125ccスクーター' };
  const [prices, setPrices] = useState<number[]>(DEFAULT_PRICES);
  const [modal, setModal] = useState<null | 'save' | 'fromClass'>(null);

  const setPrice = (i: number, v: string) => {
    setPrices((prev) => prev.map((p, idx) => (idx === i ? Number(v) || 0 : p)));
  };

  return (
    <>
      <Head>
        <title>日毎料金設定 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="pricing" title="日毎料金設定">
        <div className={styles.screen}>
          <p className={styles.crumb}>
            <Link href="/admin/pricing?tab=model">料金設計</Link> / 日毎料金設定
          </p>
          <div className={styles.pgh}>
            <h1>日毎料金設定：{info.name}</h1>
            <span className={styles.sub}>
              車種ID {id} ／ {info.klass} ／ 適用中：<b style={{ color: 'var(--info)' }}>個別料金</b>
            </span>
          </div>

          <div className={styles.detailCols}>
            <div>
              <div className={styles.card} style={{ marginBottom: 18 }}>
                <h3>基準となる日数の料金を入力</h3>
                <p className={styles.fineNote} style={{ marginTop: 0, marginBottom: 12 }}>
                  6つの基準日を入れると、間の日数は自動で補間（¥10単位で切り捨て）されます。
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {BASE_LABELS.map((lbl, i) => (
                    <div className={styles.amFld} key={lbl}>
                      <label>{lbl}</label>
                      <input type="number" value={prices[i]} onChange={(e) => setPrice(i, e.target.value)} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal('save')}>
                    自動計算した料金を保存
                  </button>
                  <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal('fromClass')}>
                    クラスの料金から自動登録
                  </button>
                </div>
              </div>

              <div className={styles.card}>
                <h3>自動計算結果（プレビュー）</h3>
                <div className={styles.tblWrap} style={{ border: 0 }}>
                  <table className={styles.tbl}>
                    <thead>
                      <tr>
                        <th>日数</th>
                        <th>料金</th>
                        <th>内訳</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PREVIEW_DAYS.map((d) => {
                        const { price, note } = priceForDay(prices, d);
                        return (
                          <tr key={d}>
                            <td className="mono">{d}日</td>
                            <td className="mono strong">{yen(price)}</td>
                            <td style={{ color: 'var(--t3)', fontSize: 12 }}>{note}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className={styles.fineNote}>※ 実際は全31日分を自動計算（一部を抜粋表示）。</p>
              </div>
            </div>

            <div>
              <div className={styles.card}>
                <h3>設定済みの料金</h3>
                <div className={styles.tblWrap} style={{ border: 0 }}>
                  <table className={styles.tbl}>
                    <thead>
                      <tr>
                        <th>日数</th>
                        <th>料金</th>
                        <th>更新日</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SAVED_ROWS.map((r) => (
                        <tr key={r.day}>
                          <td className="mono">{r.day}</td>
                          <td className="mono strong">{yen(r.price)}</td>
                          <td className="mono">{r.updated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminV2Shell>

      <AdminModal open={modal !== null} title={modal === 'fromClass' ? 'クラス料金から自動登録' : '保存しました'} onClose={() => setModal(null)}>
        <div className={styles.amNote}>
          {modal === 'fromClass'
            ? `${info.klass} のクラス料金（デフォルト）を、この車種の基準料金に読み込みます。上書きしてよろしいですか？`
            : `6つの基準日から全31日分を自動計算し、${info.name} の個別料金として保存しました。`}
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal(null)}>
            {modal === 'fromClass' ? 'キャンセル' : '閉じる'}
          </button>
          {modal === 'fromClass' && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => {
                setPrices([2500, 4300, 6000, 9000, 15000, 28000]);
                setModal(null);
              }}
            >
              読み込む
            </button>
          )}
        </div>
      </AdminModal>
    </>
  );
};

export default AdminModelPricing;
