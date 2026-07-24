import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../../components/admin/AdminV2Shell';
import AdminModal from '../../../../components/admin/AdminModal';
import styles from '../../../../styles/AdminV2.module.css';

/** 車種詳細（実装 / ダミー）。参照: admin-proto-v2.html #modeldetail */

const MODEL_INFO: Record<string, { name: string; klass: string; cc: string; seats: string; weight: string; fuel: string; lic: string[]; pricingId: string }> = {
  'M-PCX': { name: 'PCX', klass: '125ccスクーター', cc: '124cc', seats: '2名', weight: '132kg', fuel: 'レギュラー', lic: ['小型限定普通二輪', '普通二輪', '大型二輪'], pricingId: 'M-PCX' },
  'M-REBEL': { name: 'レブル250', klass: '126–250cc', cc: '249cc', seats: '2名', weight: '170kg', fuel: 'レギュラー', lic: ['普通二輪', '大型二輪'], pricingId: 'M-REBEL' },
  'M-TACT': { name: 'タクト', klass: '50ccスクーター', cc: '49cc', seats: '1名', weight: '80kg', fuel: 'レギュラー', lic: ['原付', '小型限定普通二輪', '普通二輪', '大型二輪'], pricingId: 'M-TACT' },
  'M-CROSS': { name: 'クロスカブ', klass: '原付二種MT', cc: '110cc', seats: '2名', weight: '106kg', fuel: 'レギュラー', lic: ['小型限定普通二輪', '普通二輪', '大型二輪'], pricingId: 'M-CROSS' },
  'M-CB400': { name: 'CB400', klass: '251–400cc', cc: '399cc', seats: '2名', weight: '201kg', fuel: 'レギュラー', lic: ['普通二輪', '大型二輪'], pricingId: 'M-CB400' },
};
const VEHICLES = [
  { code: 'MW-0125', store: '三ノ輪', badge: styles.bOk, state: '掲載中' },
  { code: 'MW-0126', store: '三ノ輪', badge: styles.bOk, state: '掲載中' },
  { code: 'AD-0210', store: '足立小台', badge: styles.bOk, state: '掲載中' },
  { code: 'FR-0088', store: '（加盟）北千住店', badge: styles.bWarn, state: '整備中' },
];

const AdminModelDetail: NextPage = () => {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : 'M-PCX';
  const info = MODEL_INFO[id] ?? MODEL_INFO['M-PCX'];
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <Head>
        <title>車種詳細 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="catalog" title="車種詳細">
        <div className={styles.screen}>
          <p className={styles.crumb}>
            <Link href="/admin/catalog?tab=model">車両登録・編集</Link> / 車種 / 車種詳細
          </p>
          <div className={styles.pgh}>
            <h1>車種詳細：{info.name}</h1>
            <span className={styles.sub}>
              車種ID {id} ／ クラス：{info.klass}
            </span>
            <div className={styles.act}>
              <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setEditOpen(true)}>
                車種を編集
              </button>
              <Link href={`/admin/pricing/model/${info.pricingId}`} className={`${styles.btn} ${styles.btnOutline}`}>
                料金設計
              </Link>
            </div>
          </div>

          <div className={styles.cols2}>
            <div className={styles.card}>
              <h3>車種情報</h3>
              <dl className={styles.kv}>
                <dt>クラス</dt>
                <dd>{info.klass}</dd>
                <dt>排気量</dt>
                <dd>{info.cc}</dd>
                <dt>乗車定員</dt>
                <dd>{info.seats}</dd>
                <dt>車両重量</dt>
                <dd>{info.weight}</dd>
                <dt>燃料</dt>
                <dd>{info.fuel}</dd>
                <dt>掲載</dt>
                <dd>
                  <span className={`${styles.badge} ${styles.bOk}`}>掲載中</span>
                </dd>
              </dl>
              <div style={{ marginTop: 14, fontSize: 12.5, fontWeight: 800 }}>この車種に乗れる免許種別</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {info.lic.map((l) => (
                  <span key={l} className={`${styles.badge} ${styles.bInfo}`}>
                    {l}
                  </span>
                ))}
              </div>
              <p className={styles.fineNote}>予約時に顧客の免許種別と自動照合（免許確認とは別軸）。</p>
            </div>

            <div className={styles.card}>
              <h3>
                この車種の車両（個体）<span className={styles.sub} style={{ fontWeight: 400 }}> {VEHICLES.length}台</span>
              </h3>
              {VEHICLES.map((v) => (
                <div className={styles.prRow} key={v.code} style={{ padding: '10px 0', cursor: 'pointer' }} onClick={() => router.push(`/admin/catalog/vehicle/${v.code}`)}>
                  <span className={`${styles.tm} mono`}>{v.code}</span>
                  <div className={styles.m}>{v.store}</div>
                  <span className={`${styles.badge} ${v.badge}`}>{v.state}</span>
                </div>
              ))}
              <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} style={{ marginTop: 12 }} onClick={() => setEditOpen(true)}>
                ＋ この車種に車両を追加
              </button>
            </div>
          </div>
        </div>
      </AdminV2Shell>

      <AdminModal open={editOpen} title="車種を編集" onClose={() => setEditOpen(false)}>
        <div className={styles.amFld}>
          <label>車種名</label>
          <input defaultValue={info.name} />
        </div>
        <div className={styles.amFld}>
          <label>掲載状態</label>
          <select>
            <option>公開（ON）</option>
            <option>非公開（OFF）</option>
          </select>
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setEditOpen(false)}>
            キャンセル
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setEditOpen(false)}>
            保存
          </button>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminModelDetail;
