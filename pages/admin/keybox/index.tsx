import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';

/**
 * KEYBOX（実装 / ダミーデータ）。移植メモ準拠：手動「発行」タブ・発行フォーム・
 * サイドバー子項目は廃止し、予約時に自動発行。ここは **実行ログ / 再発行** のみ。
 * 参照: admin-proto-v2.html #keybox
 */

type Tab = 'log' | 'reissue';

type LogRow = { at: string; who: string; pin: string; window: string; status: string; note: string };
const LOGS: LogRow[] = [
  { at: '7/14 10:01', who: 'YK-…0031 / 山田 太郎 / 三ノ輪', pin: 'PIN 4821 / unit MW-0125', window: '10:00〜18:30', status: '成功', note: '解錠' },
  { at: '7/14 09:58', who: 'YK-…0031 / 山田 太郎 / 三ノ輪', pin: 'PIN 4821 / 発行', window: '10:00〜18:30', status: '成功', note: 'PIN発行' },
  { at: '7/13 20:10', who: 'YK-…0022 / 鈴木 一郎 / 三ノ輪', pin: 'PIN 7788 / unit AD-0031', window: '10:00〜20:00', status: '成功', note: '施錠（返却）' },
];

const AdminKeybox: NextPage = () => {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('log');
  const [resultOpen, setResultOpen] = useState(false);

  // サイドバー子項目（?tab=）から初期タブを反映
  useEffect(() => {
    const q = router.query.tab;
    if (q === 'reissue' || q === 'log') setTab(q);
  }, [router.query.tab]);

  return (
    <>
      <Head>
        <title>KEYBOX | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="keybox" title="KEYBOX">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>KEYBOX</h1>
            <div className={styles.act}>
              <div className={styles.viewtoggle} role="tablist" aria-label="表示切替">
                {(['log', 'reissue'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={tab === t}
                    className={`${styles.vt} ${tab === t ? styles.vtOn : ''}`}
                    onClick={() => setTab(t)}
                  >
                    {t === 'log' ? '実行ログ' : '再発行'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {tab === 'log' && (
            <>
              <div className={styles.statRow}>
                <div className={styles.stat}>
                  <span className={styles.statIcon}>🔓</span>
                  <div>
                    <div className={styles.statLbl}>最新の実行</div>
                    <div className={styles.statNum} style={{ fontSize: 20, color: 'var(--ok)' }}>
                      成功
                    </div>
                  </div>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statIcon}>📊</span>
                  <div>
                    <div className={styles.statLbl}>成功 / 全体</div>
                    <div className={styles.statNum}>
                      12<span>/12</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.tblWrap}>
                <table className={styles.tbl} style={{ minWidth: 760 }}>
                  <thead>
                    <tr>
                      <th>実行日時</th>
                      <th>予約ID / 顧客 / 店舗</th>
                      <th>PIN情報</th>
                      <th>有効時間</th>
                      <th>QR</th>
                      <th>ステータス</th>
                      <th>備考</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LOGS.map((r, i) => (
                      <tr key={i}>
                        <td className="mono">{r.at}</td>
                        <td className="mono">{r.who}</td>
                        <td className="mono">{r.pin}</td>
                        <td className="mono">{r.window}</td>
                        <td>🔳</td>
                        <td>
                          <span className={`${styles.badge} ${styles.bOk}`}>{r.status}</span>
                        </td>
                        <td>{r.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={styles.tipNote}>
                💡 予約確定時に<b>PIN・QRを自動発行</b>し、貸出ウィンドウで有効化。ここは実行結果の監査ログです。異常時は
                <b>店舗責任者へ通知</b>（店舗設定の通知先）。
              </p>
            </>
          )}

          {tab === 'reissue' && (
            <>
              <p className={styles.tipNote} style={{ marginTop: 0, marginBottom: 12 }}>
                PIN・QRの再発行。会員へ割り当てて再発行できます。
              </p>
              <div className={styles.reissueGrid}>
                <div className={styles.card}>
                  <h3>解錠ウィンドウ・PIN</h3>
                  <div className={styles.amFld}>
                    <label>有効開始</label>
                    <input type="datetime-local" />
                  </div>
                  <div className={styles.amFld}>
                    <label>有効終了</label>
                    <input type="datetime-local" />
                  </div>
                  <div className={styles.amFld}>
                    <label>PINコード（任意）</label>
                    <input placeholder="未入力で自動生成" />
                  </div>
                  <div className={styles.amFld}>
                    <label>ターゲット名（任意）</label>
                    <input defaultValue="管理者発行PIN" />
                  </div>
                </div>
                <div className={styles.card}>
                  <h3>ユニット・店舗・割り当て</h3>
                  <div className={styles.amFld}>
                    <label>ユニットID（任意）</label>
                    <input />
                  </div>
                  <div className={styles.amFld}>
                    <label>店舗名・備考（任意）</label>
                    <input placeholder="三ノ輪店" />
                  </div>
                  <div className={styles.amFld}>
                    <label>会員への割り当て</label>
                    <select>
                      <option>選択しない</option>
                      <option>山田 太郎（YK-10231）</option>
                      <option>佐藤 花子（YK-10244）</option>
                    </select>
                  </div>
                </div>
              </div>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginTop: 12 }} onClick={() => setResultOpen(true)}>
                再発行する
              </button>
              <p className={styles.tipNote}>再発行結果：ステータス／PIN／pinId／有効時間／割り当て／ユニットID／署名方式／QR。</p>
            </>
          )}
        </div>
      </AdminV2Shell>

      <AdminModal open={resultOpen} title="KEYBOX 再発行結果" onClose={() => setResultOpen(false)}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 130,
              height: 130,
              margin: '0 auto 10px',
              border: '1px solid var(--line)',
              borderRadius: 10,
              background: 'repeating-linear-gradient(135deg,#e2e8f0,#e2e8f0 8px,#eef2f7 8px,#eef2f7 16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            QR
          </div>
          <div className="mono" style={{ fontWeight: 800, fontSize: 28, letterSpacing: '0.2em' }}>
            4821
          </div>
        </div>
        <dl className={styles.kv} style={{ marginTop: 12 }}>
          <dt>ステータス</dt>
          <dd>
            <span className={`${styles.badge} ${styles.bOk}`}>成功</span>
          </dd>
          <dt>pinId</dt>
          <dd className="mono">pin_7c1a9</dd>
          <dt>有効時間</dt>
          <dd className="mono">10:00〜18:30</dd>
          <dt>割り当て</dt>
          <dd>山田 太郎（YK-10231）</dd>
          <dt>ユニットID</dt>
          <dd className="mono">MW-0125</dd>
          <dt>署名方式</dt>
          <dd className="mono">HMAC-SHA256</dd>
        </dl>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.fullBtn}`} style={{ marginTop: 14 }} onClick={() => setResultOpen(false)}>
          発行・顧客へ通知
        </button>
      </AdminModal>
    </>
  );
};

export default AdminKeybox;
