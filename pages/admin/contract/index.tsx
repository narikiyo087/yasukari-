import { useState } from 'react';
import Head from 'next/head';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';

/** 貸渡契約書・約款 書式（実装 / ダミー）。参照: admin-proto-v2.html #contract */

const AdminContract: NextPage = () => {
  const [modal, setModal] = useState<null | 'terms' | 'edit'>(null);

  return (
    <>
      <Head>
        <title>契約書・約款 書式 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="contract" title="契約書・約款 書式">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>貸渡契約書・約款 書式</h1>
            <span className={styles.sub}>契約書はレンタル確定時に顧客情報から自動発行</span>
            <div className={styles.act}>
              <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal('edit')}>
                書式を編集
              </button>
            </div>
          </div>

          <div className={styles.cols2}>
            <div className={styles.card}>
              <h3>差込項目（顧客情報から自動）</h3>
              <div style={{ lineHeight: 2, fontSize: 13, color: 'var(--t2)' }}>
                ふりがな／氏名／住所／生年月日／携帯・自宅電話／勤務先／店舗／返却期限・帰着日時／車両名・車体番号・登録番号／料金内訳・合計／支払い方法
              </div>
              <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} style={{ marginTop: 12 }} onClick={() => setModal('terms')}>
                約款を表示（令和7年6月15日施行）
              </button>
            </div>
            <div className={styles.card}>
              <h3>事業者情報 / 返金口座</h3>
              <dl className={styles.kv}>
                <dt>会社名</dt>
                <dd>株式会社ケイジェット</dd>
                <dt>所在地</dt>
                <dd>足立区小台2-9-7 1階</dd>
                <dt>電話</dt>
                <dd className="mono">03-5856-8200</dd>
                <dt>返金口座</dt>
                <dd>（設定）</dd>
              </dl>
              <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm} ${styles.fullBtn}`} style={{ marginTop: 12 }} onClick={() => setModal('edit')}>
                編集
              </button>
            </div>
          </div>
        </div>
      </AdminV2Shell>

      <AdminModal open={modal === 'terms'} title="貸渡約款（令和7年6月15日施行）" onClose={() => setModal(null)}>
        <div className={styles.amBox} style={{ maxHeight: '50vh', overflow: 'auto', lineHeight: 1.7 }}>
          第1章 総則／第1条（本規約の適用）…／第2章 保険・補償（あいおいニッセイ同和損保）／第3条（賠償及び営業補償）…（サンプル抜粋）
        </div>
        <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.fullBtn}`} onClick={() => setModal(null)}>
          閉じる
        </button>
      </AdminModal>

      <AdminModal open={modal === 'edit'} title="事業者情報を編集" onClose={() => setModal(null)}>
        <div className={styles.amFld}>
          <label>会社名</label>
          <input defaultValue="株式会社ケイジェット" />
        </div>
        <div className={styles.amFld}>
          <label>所在地</label>
          <input defaultValue="足立区小台2-9-7 1階" />
        </div>
        <div className={styles.amFld}>
          <label>電話</label>
          <input defaultValue="03-5856-8200" />
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal(null)}>
            キャンセル
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(null)}>
            保存
          </button>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminContract;
