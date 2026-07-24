import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../../components/admin/AdminV2Shell';
import AdminModal from '../../../../components/admin/AdminModal';
import styles from '../../../../styles/AdminV2.module.css';
import { BASE_LABELS, PREVIEW_DAYS, priceForDay, yen } from '../../../../lib/adminPricing';

/** クラス料金（デフォルト）詳細。参照: admin-proto-v2.html #classpricing */

const CLASS_NAME: Record<string, string> = {
  'C-50S': '50ccスクーター',
  'C-125S': '125ccスクーター',
  'C-MT2': '原付二種MT',
  'C-250': '126–250cc',
  'C-400': '251–400cc',
};
const DEFAULT_PRICES = [2500, 4300, 6000, 9000, 15000, 28000];
const MODELS_IN_CLASS = [
  { name: 'PCX', pricing: 'individual' as const },
  { name: 'アドレス125', pricing: 'inherit' as const },
  { name: 'リード125', pricing: 'inherit' as const },
];

const AdminClassPricing: NextPage = () => {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : 'C-125S';
  const name = CLASS_NAME[id] ?? '125ccスクーター';
  const [prices, setPrices] = useState<number[]>(DEFAULT_PRICES);
  const [saved, setSaved] = useState(false);

  const setPrice = (i: number, v: string) => {
    setPrices((prev) => prev.map((p, idx) => (idx === i ? Number(v) || 0 : p)));
  };

  return (
    <>
      <Head>
        <title>クラス料金 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="pricing" title="クラス料金">
        <div className={styles.screen}>
          <p className={styles.crumb}>
            <Link href="/admin/pricing">料金設計</Link> / クラス料金（デフォルト）
          </p>
          <div className={styles.pgh}>
            <h1>クラス料金：{name}</h1>
            <span className={styles.sub}>
              クラスID {id} ／ このクラスの車種のデフォルト料金
            </span>
          </div>

          <div className={styles.cols2}>
            <div>
              <div className={styles.card} style={{ marginBottom: 18 }}>
                <h3>基準となる日数の料金を入力</h3>
                <p className={styles.fineNote} style={{ marginTop: 0, marginBottom: 12 }}>
                  クラスのデフォルト。車種で個別登録が無い場合はこの料金が適用されます。6つの基準日→間の日数は自動補間（¥10単位で切り捨て）。
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {BASE_LABELS.map((lbl, i) => (
                    <div className={styles.amFld} key={lbl}>
                      <label>{lbl}</label>
                      <input type="number" value={prices[i]} onChange={(e) => setPrice(i, e.target.value)} />
                    </div>
                  ))}
                </div>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginTop: 8 }} onClick={() => setSaved(true)}>
                  自動計算した料金を保存
                </button>
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
                <h3>このクラスの車種</h3>
                {MODELS_IN_CLASS.map((mm) => (
                  <div className={styles.prRow} key={mm.name} style={{ padding: '9px 0' }}>
                    <div className={styles.m}>{mm.name}</div>
                    <span className={`${styles.badge} ${mm.pricing === 'individual' ? styles.bInfo : styles.bMute}`}>
                      {mm.pricing === 'individual' ? '個別料金' : 'クラス継承'}
                    </span>
                  </div>
                ))}
                <p className={styles.fineNote}>「クラス継承」の車種は、このクラス料金が自動適用されます。</p>
              </div>
            </div>
          </div>
        </div>
      </AdminV2Shell>

      <AdminModal open={saved} title="保存しました" onClose={() => setSaved(false)}>
        <div className={styles.amNote}>
          6つの基準日から全31日分の料金を自動計算し、<b>{name}</b> のクラス料金として保存しました。クラス継承の車種に自動適用されます。
        </div>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.fullBtn}`} onClick={() => setSaved(false)}>
          OK
        </button>
      </AdminModal>
    </>
  );
};

export default AdminClassPricing;
