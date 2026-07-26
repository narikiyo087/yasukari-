import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';

/** クーポン詳細（実装 / ダミー）。参照: admin-proto-v2.html #coupondetail */

const STATS = [
  { icon: '🎫', lbl: '発行', num: '480' },
  { icon: '✅', lbl: '使用', num: '213' },
  { icon: '📈', lbl: '使用率', num: '44%' },
];

const AdminCouponDetail: NextPage = () => {
  const router = useRouter();
  const code = typeof router.query.code === 'string' ? router.query.code : 'HAJIME500';
  const [modal, setModal] = useState<null | 'notify' | 'stop'>(null);

  return (
    <>
      <Head>
        <title>クーポン詳細 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="coupons" title="クーポン詳細">
        <div className={styles.screen}>
          <p className={styles.crumb}>
            <Link href="/admin/coupons">クーポン</Link> / 詳細
          </p>
          <div className={styles.pgh}>
            <h1>{code}</h1>
            <span className={`${styles.badge} ${styles.bInfo}`} style={{ fontSize: 13 }}>
              初回限定
            </span>
            <div className={styles.act}>
              <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal('notify')}>
                顧客へ通知
              </button>
            </div>
          </div>

          <div className={styles.detailCols}>
            <div>
              <div className={styles.card} style={{ marginBottom: 18 }}>
                <h3>内容</h3>
                <dl className={styles.kv}>
                  <dt>割引</dt>
                  <dd>初回500円引</dd>
                  <dt>対象セグメント</dt>
                  <dd>初回未利用の会員</dd>
                  <dt>店舗</dt>
                  <dd>全店</dd>
                  <dt>期間</dt>
                  <dd className="mono">〜2026/08/31</dd>
                </dl>
              </div>
              <div className={styles.card}>
                <h3>利用実績</h3>
                <div className={styles.statRow} style={{ marginBottom: 0 }}>
                  {STATS.map((s) => (
                    <div key={s.lbl} className={styles.stat}>
                      <span className={styles.statIcon}>{s.icon}</span>
                      <div>
                        <div className={styles.statLbl}>{s.lbl}</div>
                        <div className={styles.statNum}>{s.num}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className={styles.card}>
                <h3>操作</h3>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.fullBtn}`} style={{ marginBottom: 10 }} onClick={() => setModal('notify')}>
                  顧客へ通知する
                </button>
                <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.fullBtn}`} style={{ marginBottom: 10 }} disabled>
                  複製
                </button>
                <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.fullBtn}`} style={{ color: 'var(--brand)' }} onClick={() => setModal('stop')}>
                  停止する
                </button>
              </div>
            </div>
          </div>
        </div>
      </AdminV2Shell>

      <AdminModal open={modal !== null} title={modal === 'stop' ? 'クーポンを停止' : '顧客へ通知'} onClose={() => setModal(null)}>
        <div className={styles.amNote}>
          {modal === 'stop'
            ? 'このクーポンを停止します。以降は新規利用ができなくなります（発行済みの利用は集計に残ります）。'
            : 'メール配信/キャンペーンから対象セグメントへ、このクーポンを案内します。'}
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal(null)}>
            戻る
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => {
              if (modal === 'notify') router.push('/admin/campaign');
              else setModal(null);
            }}
          >
            {modal === 'stop' ? '停止する' : '配信へ進む'}
          </button>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminCouponDetail;
