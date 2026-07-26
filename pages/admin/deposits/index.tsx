import { useState } from 'react';
import Head from 'next/head';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';

/** デポジット管理（海外・預かりリスト）。参照: admin-proto-v2.html #deposits */

const STATS = [
  { icon: '💰', lbl: '預かり中', num: '3', unit: '件', sub: '合計 ¥60,000', kind: '' },
  { icon: '⏳', lbl: '返金予定（残15日以内）', num: '2', unit: '件', sub: '被害確認は今のうちに', kind: 'warn' },
  { icon: '✅', lbl: '今月 返金済', num: '5', unit: '件', sub: '', kind: '' },
  { icon: '⚠', lbl: '被害あり・保留', num: '1', unit: '件', sub: '返金しない対応', kind: 'bad' },
];

type Row = { name: string; country: string; reservation: string; deposit: string; returned: string; refundDate: string; remain: string; danger: boolean; state: string; badge: string; damaged: boolean };
const ROWS: Row[] = [
  { name: 'Wendt Tim', country: 'ドイツ', reservation: 'YK-…0030', deposit: '¥20,000', returned: '5/27', refundDate: '7/26', remain: '残 12日', danger: true, state: '返金間近', badge: styles.bWarn, damaged: false },
  { name: 'Chen Wei', country: '台湾', reservation: 'YK-…0051', deposit: '¥20,000', returned: '5/23', refundDate: '7/22', remain: '残 8日', danger: true, state: '返金間近', badge: styles.bWarn, damaged: false },
  { name: 'Smith John', country: 'アメリカ(IDP)', reservation: 'YK-…0047', deposit: '¥20,000', returned: '6/20', refundDate: '8/19', remain: '残 36日', danger: false, state: '被害あり・保留', badge: styles.bBad, damaged: true },
];

const AdminDeposits: NextPage = () => {
  const [modal, setModal] = useState<null | { kind: 'refund' | 'ng'; name: string }>(null);
  const [csvOpen, setCsvOpen] = useState(false);

  return (
    <>
      <Head>
        <title>デポジット管理 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="deposits" title="デポジット管理">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>デポジット預かりリスト</h1>
            <span className={styles.sub}>海外のお客様のデポジット。返却の60日後に自動返金（駐禁等の後日連絡に備え保持）。</span>
            <div className={styles.act}>
              <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setCsvOpen(true)}>
                CSV出力
              </button>
            </div>
          </div>

          <div className={styles.statRow}>
            {STATS.map((s) => (
              <div key={s.lbl} className={`${styles.stat} ${s.kind === 'bad' ? styles.bad : s.kind === 'warn' ? styles.warn : ''}`}>
                <span className={styles.statIcon}>{s.icon}</span>
                <div>
                  <div className={styles.statLbl}>{s.lbl}</div>
                  <div className={styles.statNum}>
                    {s.num}
                    <span>{s.unit}</span>
                  </div>
                  {s.sub && <div className={styles.statSub}>{s.sub}</div>}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.tblWrap}>
            <table className={styles.tbl} style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>会員 / 居住国</th>
                  <th>予約</th>
                  <th>デポジット</th>
                  <th>返却日</th>
                  <th>返金予定日</th>
                  <th>残り</th>
                  <th>状態</th>
                  <th aria-label="操作" />
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.reservation}>
                    <td>
                      <span className="strong">{r.name}</span> <span className={`${styles.badge} ${styles.bInfo}`}>{r.country}</span>
                    </td>
                    <td className="mono">{r.reservation}</td>
                    <td className="mono">{r.deposit}</td>
                    <td className="mono">{r.returned}</td>
                    <td className="mono">{r.refundDate}</td>
                    <td className="mono" style={r.danger ? { color: 'var(--brand)' } : undefined}>
                      {r.remain}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${r.badge}`}>{r.state}</span>
                    </td>
                    <td className={styles.tblActions}>
                      {r.damaged ? (
                        <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} onClick={() => setModal({ kind: 'ng', name: r.name })}>
                          返金不可メール送信
                        </button>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={() => setModal({ kind: 'refund', name: r.name })}>
                            今すぐ返金
                          </button>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                            style={{ color: 'var(--brand)', borderColor: 'var(--brand)' }}
                            onClick={() => setModal({ kind: 'ng', name: r.name })}
                          >
                            被害で返金しない
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.tipNote}>
            💡 返金予定日＝返却日＋60日。日次バッチで期日到来分を自動で部分返金（Pay.jp・180日以内）。被害・違反金があれば差引 or 返金不可にして顧客へメール。
          </p>
        </div>
      </AdminV2Shell>

      <AdminModal open={modal?.kind === 'refund'} title="デポジットを返金" onClose={() => setModal(null)}>
        <div className={styles.amNote}>
          <b>{modal?.name}</b> のデポジット ¥20,000 を Pay.jp で部分返金します。返却から60日以内のため部分返金が可能です。
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal(null)}>
            キャンセル
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(null)}>
            返金する
          </button>
        </div>
      </AdminModal>

      <AdminModal open={modal?.kind === 'ng'} title="デポジット返金不可のご連絡（メール送信）" onClose={() => setModal(null)}>
        <div className={styles.amNote}>被害・違反金が発生したため、デポジットを返金しない旨を顧客へ通知します。金額・理由を差し込みます。</div>
        <div className={styles.amFld}>
          <label>理由 / 差引内容</label>
          <select>
            <option>車両の破損・傷</option>
            <option>駐車違反・反則金</option>
            <option>返却遅延・無断延長</option>
            <option>盗難・紛失</option>
            <option>その他（自由記入）</option>
          </select>
        </div>
        <div className={styles.amFld}>
          <label>差引額（円・全額で返金なし）</label>
          <input type="number" defaultValue={20000} />
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal(null)}>
            下書き保存
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(null)}>
            この内容で送信
          </button>
        </div>
      </AdminModal>

      <AdminModal open={csvOpen} title="CSVを生成しました" onClose={() => setCsvOpen(false)}>
        <div className={styles.amBox} style={{ textAlign: 'center' }}>📄 deposits_202607.csv</div>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.fullBtn}`} onClick={() => setCsvOpen(false)}>
          ダウンロード
        </button>
      </AdminModal>
    </>
  );
};

export default AdminDeposits;
