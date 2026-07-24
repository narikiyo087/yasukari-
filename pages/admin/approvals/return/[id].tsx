import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../../components/admin/AdminV2Shell';
import AdminModal from '../../../../components/admin/AdminModal';
import styles from '../../../../styles/AdminV2.module.css';

/** 返却確認（実装 / ダミー）。参照: admin-proto-v2.html #returndetail */

const PHOTOS = ['車両全体（必須）', 'メーター（必須）', '給油口', '傷の有無'];

const AdminReturnDetail: NextPage = () => {
  const [result, setResult] = useState('問題なし');
  const [modal, setModal] = useState<null | 'approve' | 'reject' | 'noc'>(null);

  return (
    <>
      <Head>
        <title>返却確認 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="approvals" title="返却確認">
        <div className={styles.screen}>
          <p className={styles.crumb}>
            <Link href="/admin/approvals">承認待ち</Link> / 返却完了
          </p>
          <div className={styles.pgh}>
            <h1>返却写真の確認：PCX</h1>
            <span className={`${styles.badge} ${styles.bInfo}`} style={{ fontSize: 13 }}>
              写真待ち
            </span>
          </div>

          <div className={styles.detailCols}>
            <div>
              <div className={styles.card} style={{ marginBottom: 18 }}>
                <h3>返却写真</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
                <h3>返却情報</h3>
                <dl className={styles.kv}>
                  <dt>車両</dt>
                  <dd>PCX（MW-0125）</dd>
                  <dt>会員</dt>
                  <dd>#10231 山田 太郎</dd>
                  <dt>返却日時</dt>
                  <dd className="mono">7/14 08:02</dd>
                  <dt>ガソリン</dt>
                  <dd>満タン</dd>
                  <dt>走行距離</dt>
                  <dd className="mono">+142 km</dd>
                  <dt>傷</dt>
                  <dd>なし</dd>
                </dl>
              </div>
            </div>

            <div>
              <div className={styles.card}>
                <h3>スタッフ確認</h3>
                <div className={styles.amFld}>
                  <label>メーター（走行距離 km）</label>
                  <input placeholder="例：12482" />
                </div>
                <div className={styles.amFld}>
                  <label>確認結果</label>
                  <select value={result} onChange={(e) => setResult(e.target.value)}>
                    <option>問題なし</option>
                    <option>問題あり</option>
                  </select>
                </div>
                {result === '問題あり' && (
                  <div className={styles.amFld}>
                    <textarea rows={2} placeholder="問題の理由（写真不足・破損 等）。顧客の予約履歴に残ります" />
                  </div>
                )}
                <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.fullBtn}`} style={{ marginBottom: 8 }} onClick={() => setModal('approve')}>
                  返却を承認・完了
                </button>
                <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.fullBtn}`} style={{ marginBottom: 8 }} onClick={() => setModal('reject')}>
                  差し戻し（再撮影依頼）
                </button>
                <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.fullBtn}`} style={{ color: 'var(--brand)' }} onClick={() => setModal('noc')}>
                  NOC / 追加請求
                </button>
                <p className={styles.fineNote}>
                  ※「問題あり」は顧客の予約履歴に記録し、次回の返却前に注意を表示します。メーター値は<b>整備基準（距離）</b>にも活用。
                </p>
              </div>
            </div>
          </div>
        </div>
      </AdminV2Shell>

      <AdminModal open={modal !== null} title={modal === 'approve' ? '返却を承認' : modal === 'noc' ? 'NOC / 追加請求' : '差し戻し'} onClose={() => setModal(null)}>
        <div className={styles.amNote}>
          {modal === 'approve' && 'この返却を完了として記録します。会員へ完了通知を送ります。'}
          {modal === 'reject' && '再撮影を依頼し、顧客へ理由とともに通知します。'}
          {modal === 'noc' && '追加請求（休車補償・清掃・破損）を作成し、Pay.jp で決済リンクを送ります。'}
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal(null)}>
            戻る
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(null)}>
            実行
          </button>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminReturnDetail;
