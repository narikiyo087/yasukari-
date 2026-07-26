import { useState } from 'react';
import Head from 'next/head';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';

/** APIキー管理（実装 / ダミー）。参照: admin-proto-v2.html #apikeys */

type Row = { name: string; use: string; key: string; state: '有効' | '未設定' | '任意'; updated: string };
const ROWS: Row[] = [
  { name: 'Pay.jp', use: '決済・返金', key: 'sk_live_••••2f9a', state: '有効', updated: '2026/02/10' },
  { name: 'KEYVOX', use: 'スマートロック', key: 'kv_••••7c31', state: '有効', updated: '2026/03/01' },
  { name: 'Amazon SES', use: 'メール配信', key: 'AKIA••••••', state: '未設定', updated: '—' },
  { name: '天気API', use: '雨の日クーポン', key: 'wx_••••', state: '未設定', updated: '—' },
  { name: 'GA4 / GTM', use: 'アクセス計測', key: 'G-••••••', state: '有効', updated: '2026/07/01' },
  { name: 'Meta / TikTok Pixel', use: '広告計測', key: '••••', state: '任意', updated: '—' },
];
const BADGE: Record<Row['state'], string> = { 有効: styles.bOk, 未設定: styles.bWarn, 任意: styles.bMute };

const AdminApiKeys: NextPage = () => {
  const [target, setTarget] = useState<Row | null>(null);

  return (
    <>
      <Head>
        <title>APIキー管理 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="apikeys" title="APIキー管理">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>APIキー管理</h1>
            <span className={styles.sub}>外部連携（本部のみ）</span>
          </div>

          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 8, padding: '10px 14px', fontSize: 12, marginBottom: 14 }}>
            ⚠ 本番キーはサーバーの環境変数で管理します。画面ではマスク表示・更新のみ（キー全文は表示しません）。
          </div>

          <div className={styles.tblWrap}>
            <table className={styles.tbl}>
              <thead>
                <tr>
                  <th>連携先</th>
                  <th>用途</th>
                  <th>キー</th>
                  <th>状態</th>
                  <th>最終更新</th>
                  <th aria-label="操作" />
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.name}>
                    <td className="strong">{r.name}</td>
                    <td>{r.use}</td>
                    <td className="mono">{r.key}</td>
                    <td>
                      <span className={`${styles.badge} ${BADGE[r.state]}`}>{r.state}</span>
                    </td>
                    <td className="mono">{r.updated}</td>
                    <td className={styles.tblActions}>
                      <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={() => setTarget(r)}>
                        {r.state === '有効' ? '更新' : '設定'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AdminV2Shell>

      <AdminModal open={target !== null} title={`${target?.name ?? ''} のキーを更新`} onClose={() => setTarget(null)}>
        <div className={styles.amNote}>新しいキーを入力して保存します。既存キーは上書きされ、全文は表示されません（マスク保存）。</div>
        <div className={styles.amFld}>
          <label>新しいキー</label>
          <input type="password" placeholder="キーを貼り付け" />
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setTarget(null)}>
            キャンセル
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setTarget(null)}>
            保存
          </button>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminApiKeys;
