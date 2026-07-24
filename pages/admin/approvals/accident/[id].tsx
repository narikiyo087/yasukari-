import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../../components/admin/AdminV2Shell';
import AdminModal from '../../../../components/admin/AdminModal';
import styles from '../../../../styles/AdminV2.module.css';

/** 事故・転倒報告（実装 / ダミー）。参照: admin-proto-v2.html #accidentdetail */

const PHOTOS = ['全体', '損傷部①', '損傷部②'];

const AdminAccidentDetail: NextPage = () => {
  const [modal, setModal] = useState<null | 'accept' | 'notify' | 'insurer' | 'reject'>(null);

  const modalTitle =
    modal === 'accept' ? '受理して記録' : modal === 'notify' ? '店舗責任者へ通知' : modal === 'insurer' ? '保険会社の連絡先' : '却下';

  return (
    <>
      <Head>
        <title>事故・転倒報告 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="approvals" title="事故・転倒報告">
        <div className={styles.screen}>
          <p className={styles.crumb}>
            <Link href="/admin/approvals">承認待ち</Link> / 事故・転倒報告
          </p>
          <div className={styles.pgh}>
            <h1>事故・転倒報告 #A-0012</h1>
            <span className={`${styles.badge} ${styles.bBad}`} style={{ fontSize: 13 }}>
              要確認
            </span>
          </div>

          <div className={styles.detailCols}>
            <div>
              <div className={styles.card} style={{ marginBottom: 18 }}>
                <h3>報告写真</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {PHOTOS.map((p) => (
                    <div
                      key={p}
                      style={{
                        height: 120,
                        borderRadius: 8,
                        background: 'repeating-linear-gradient(135deg,#e2e8f0,#e2e8f0 10px,#eef2f7 10px,#eef2f7 20px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {p}
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.card}>
                <h3>状況</h3>
                <dl className={styles.kv}>
                  <dt>車両</dt>
                  <dd>レブル250（RB-0007）</dd>
                  <dt>会員</dt>
                  <dd>#10244 佐藤 花子</dd>
                  <dt>発生日時</dt>
                  <dd className="mono">7/13 17:10</dd>
                  <dt>場所</dt>
                  <dd>都内・交差点</dd>
                  <dt>ケガ</dt>
                  <dd>なし</dd>
                  <dt>レッカー</dt>
                  <dd>不要（自走可）</dd>
                  <dt>状況メモ</dt>
                  <dd>低速走行中に転倒。外装に擦り傷。</dd>
                </dl>
              </div>
            </div>

            <div>
              <div className={styles.card}>
                <h3>対応</h3>
                <div className={styles.amFld}>
                  <label>対応メモ</label>
                  <textarea rows={3} />
                </div>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.fullBtn}`} style={{ marginBottom: 8 }} onClick={() => setModal('accept')}>
                  受理して記録
                </button>
                <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.fullBtn}`} style={{ marginBottom: 8 }} onClick={() => setModal('notify')}>
                  店舗責任者へ通知
                </button>
                <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.fullBtn}`} style={{ marginBottom: 8 }} onClick={() => setModal('insurer')}>
                  保険会社の連絡先
                </button>
                <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.fullBtn}`} style={{ color: 'var(--brand)' }} onClick={() => setModal('reject')}>
                  却下
                </button>
              </div>
            </div>
          </div>
        </div>
      </AdminV2Shell>

      <AdminModal open={modal !== null} title={modalTitle} onClose={() => setModal(null)}>
        {modal === 'insurer' ? (
          <div className={styles.amBox}>
            あいおいニッセイ同和損保 事故受付
            <div className="mono" style={{ marginTop: 6, color: 'var(--ink)', fontWeight: 800 }}>
              0120-000-000（24時間）
            </div>
          </div>
        ) : (
          <div className={styles.amNote}>
            {modal === 'accept' && 'この報告を受理し、車両・会員の履歴に記録します。'}
            {modal === 'notify' && '車両が紐づく店舗の責任者へメールで通知します。'}
            {modal === 'reject' && 'この報告を却下します（重複・誤報告など）。'}
          </div>
        )}
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal(null)}>
            {modal === 'insurer' ? '閉じる' : '戻る'}
          </button>
          {modal !== 'insurer' && (
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(null)}>
              実行
            </button>
          )}
        </div>
      </AdminModal>
    </>
  );
};

export default AdminAccidentDetail;
