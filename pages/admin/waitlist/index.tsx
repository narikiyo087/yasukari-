import { useState } from 'react';
import Head from 'next/head';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';

/** 空き通知リクエスト（実装 / ダミー）。参照: admin-proto-v2.html #waitlist */

type Row = { vehicle: string; store: string; wish: string; user: string; at: string };
const ROWS: Row[] = [
  { vehicle: 'CB400', store: '足立', wish: '7/20〜', user: '会員#10233', at: '7/13 21:04' },
  { vehicle: 'レブル250', store: '三ノ輪', wish: '8/01〜', user: '会員#10251', at: '7/12 12:30' },
  { vehicle: 'CB400', store: '足立', wish: '7/25〜', user: '仮登録#7781', at: '7/11 08:15' },
];

const AdminWaitlist: NextPage = () => {
  const [target, setTarget] = useState<Row | null>(null);

  return (
    <>
      <Head>
        <title>空き通知リクエスト | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="waitlist" title="空き通知リクエスト">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>空き通知リクエスト</h1>
            <span className={styles.sub}>満車・貸出中の車両に「空いたら教えて」の登録</span>
          </div>

          <div className={styles.tblWrap}>
            <table className={styles.tbl}>
              <thead>
                <tr>
                  <th>車種</th>
                  <th>希望店舗</th>
                  <th>希望日</th>
                  <th>登録者</th>
                  <th>登録日時</th>
                  <th aria-label="操作" />
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r, i) => (
                  <tr key={i}>
                    <td className="strong">{r.vehicle}</td>
                    <td>{r.store}</td>
                    <td className="mono">{r.wish}</td>
                    <td>{r.user}</td>
                    <td className="mono">{r.at}</td>
                    <td className={styles.tblActions}>
                      <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={() => setTarget(r)}>
                        空き通知を送る
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className={styles.tipNote}>💡 需要の見える化にも活用（人気車種・不足店舗が分かる）。お気に入り♥と連携可能。</p>
        </div>
      </AdminV2Shell>

      <AdminModal open={target !== null} title="空き通知を送る" onClose={() => setTarget(null)}>
        <div className={styles.amNote}>
          <b>{target?.vehicle}</b>（{target?.store}）が空いた旨を <b>{target?.user}</b> へ通知します。予約導線付きのメールを送信します。
        </div>
        <div className={styles.amFld}>
          <label>メッセージ（任意）</label>
          <textarea rows={3} defaultValue="ご希望の車種に空きが出ました。下記より優先的にご予約いただけます。" />
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setTarget(null)}>
            キャンセル
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setTarget(null)}>
            通知を送る
          </button>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminWaitlist;
