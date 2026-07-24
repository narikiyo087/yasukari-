import { useMemo, useState } from 'react';
import Head from 'next/head';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';

/**
 * 免許確認（実装 / ダミーデータ）— 目視確認 → OK承認 or 再撮影依頼。
 * 承認まで予約は「停止中」。参照: admin-proto-v2.html #license
 */

type Region = 'jp' | 'intl';
type Row = {
  customer: string;
  reservation: string;
  region: Region;
  upload: { label: string; ok: boolean };
  store: string;
  deadline: string;
};

const ROWS: Row[] = [
  { customer: '田中 次郎', reservation: 'YK-…0038', region: 'jp', upload: { label: '1/1 受信', ok: true }, store: '足立', deadline: '7/10 15:00' },
  { customer: '佐藤 花子', reservation: 'YK-…0044', region: 'jp', upload: { label: '1/1 受信', ok: true }, store: '三ノ輪', deadline: '8/02 15:00' },
  { customer: 'Wendt Tim', reservation: 'YK-…0030', region: 'intl', upload: { label: '2/3 未完', ok: false }, store: '三ノ輪', deadline: '8/02 15:00' },
];

const CHIPS: Array<{ key: 'all' | Region; label: string }> = [
  { key: 'all', label: 'すべて' },
  { key: 'jp', label: '日本' },
  { key: 'intl', label: '海外' },
];

const AdminLicense: NextPage = () => {
  const [filter, setFilter] = useState<'all' | Region>('all');
  const [modal, setModal] = useState<null | Region>(null);
  const [reason, setReason] = useState('');

  const counts = useMemo(
    () => ({ all: ROWS.length, jp: ROWS.filter((r) => r.region === 'jp').length, intl: ROWS.filter((r) => r.region === 'intl').length }),
    [],
  );
  const rows = filter === 'all' ? ROWS : ROWS.filter((r) => r.region === filter);

  const openReason = (v: string, opts: number, idx: number) => setReason(idx === opts - 1 ? 'show' : '');

  return (
    <>
      <Head>
        <title>免許確認 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="license" title="免許確認">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>免許確認</h1>
            <span className={styles.sub}>目視確認 → OK承認 or 再撮影依頼。承認まで予約は「停止中」</span>
          </div>

          <div className={styles.toolbar}>
            {CHIPS.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`${styles.chip} ${filter === c.key ? styles.chipOn : ''}`}
                onClick={() => setFilter(c.key)}
              >
                {c.label} {counts[c.key]}
              </button>
            ))}
          </div>

          <div className={styles.tblWrap}>
            <table className={styles.tbl}>
              <thead>
                <tr>
                  <th>顧客</th>
                  <th>予約</th>
                  <th>区分</th>
                  <th>アップロード</th>
                  <th>受取</th>
                  <th>期限(前日15:00)</th>
                  <th aria-label="操作" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.reservation}>
                    <td className="strong">{r.customer}</td>
                    <td className="mono">{r.reservation}</td>
                    <td>{r.region === 'intl' ? <span className={`${styles.badge} ${styles.bBad}`}>海外</span> : '日本'}</td>
                    <td>
                      <span className={`${styles.badge} ${r.upload.ok ? styles.bOk : styles.bWarn}`}>{r.upload.label}</span>
                    </td>
                    <td>{r.store}</td>
                    <td className="mono">{r.deadline}</td>
                    <td className={styles.tblActions}>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                        onClick={() => {
                          setReason('');
                          setModal(r.region);
                        }}
                      >
                        確認
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className={styles.tipNote}>
            💡 承認すると<b>予約確定メール</b>が届き無人受取が可能に。NGは<b>再撮影依頼＋理由</b>を自動通知。免許番号は
            <b>貸渡簿に記録</b>（51cc以上の法令記録義務）。海外は IDP／JAF翻訳文＋パスポートを確認し、
            <b>中国本土・ベトナムは貸出不可</b>。
          </p>
        </div>
      </AdminV2Shell>

      {/* 日本の免許確認 */}
      <AdminModal open={modal === 'jp'} title="免許証の確認（目視）" onClose={() => setModal(null)}>
        <div className={styles.amNote}>田中 次郎 ／ 予約 YK-…0038 ／ 車両 クロスカブ（原付二種MT）</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          {['免許証（表）', '免許証（裏）'].map((l) => (
            <div key={l} className={styles.amBox} style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, color: 'var(--t3)', fontWeight: 700 }}>
              {l}
            </div>
          ))}
        </div>
        <div className={styles.amFld}>
          <label>免許証番号</label>
          <input defaultValue="1234 5678 9012" />
        </div>
        <div className={styles.amFld}>
          <label>免許種別</label>
          <select defaultValue="普通二輪（中型）">
            <option>原付</option>
            <option>小型限定普通二輪</option>
            <option>普通二輪（中型）</option>
            <option>大型二輪</option>
            <option>その他（自由入力）</option>
          </select>
        </div>
        <div className={styles.amFld}>
          <label>確認結果</label>
          <select onChange={(e) => openReason(e.target.value, e.target.options.length, e.target.selectedIndex)}>
            <option>画像と入力内容が一致（承認）</option>
            <option>画像が不鮮明</option>
            <option>番号が一致しない</option>
            <option>有効期限切れ</option>
            <option>その他</option>
          </select>
        </div>
        {reason === 'show' && (
          <div className={styles.amFld}>
            <input placeholder="理由を入力（その他）" />
          </div>
        )}
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal(null)}>
            再撮影・再提出を依頼して通知
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(null)}>
            OK・承認して予約確定
          </button>
        </div>
        <p className={styles.fineNote}>※ 当日までに再提出がない場合はレンタル不可（前払い＝キャンセル料100%）。</p>
      </AdminModal>

      {/* 海外の免許確認 */}
      <AdminModal open={modal === 'intl'} title="免許証の確認（海外）" onClose={() => setModal(null)}>
        <div className={styles.amNote}>Wendt Tim ／ 予約 YK-…0030 ／ 三ノ輪</div>
        <div className={styles.amFld}>
          <label>免許発行国</label>
          <select>
            <option>ドイツ（翻訳文ルート）</option>
            <option>台湾（翻訳文ルート）</option>
            <option>アメリカ（IDP）</option>
            <option>中国本土（貸出不可）</option>
            <option>ベトナム（貸出不可）</option>
          </select>
        </div>
        <div className={styles.okNote} style={{ background: '#ecfdf5' }}>貸出可否：翻訳文ルート → JAF翻訳文があれば可</div>
        <div style={{ fontSize: 12, fontWeight: 800, margin: '12px 0 6px' }}>必要書類のアップロード状況（追加のたびに通知）</div>
        {[
          { label: '本国免許', ok: true },
          { label: 'JAF翻訳文', ok: true },
          { label: 'パスポート', ok: false },
        ].map((d) => (
          <div key={d.label} className={styles.prRow} style={{ padding: '8px 0' }}>
            <div className={styles.m}>{d.label}</div>
            <span className={`${styles.badge} ${d.ok ? styles.bOk : styles.bWarn}`}>{d.ok ? '受信済' : '未提出'}</span>
          </div>
        ))}
        <div className={styles.amFld} style={{ marginTop: 10 }}>
          <label>確認結果</label>
          <select onChange={(e) => openReason(e.target.value, e.target.options.length, e.target.selectedIndex)}>
            <option>一致（承認できる）</option>
            <option>画像が不鮮明</option>
            <option>番号が一致しない</option>
            <option>種別が不適合</option>
            <option>書類が不足</option>
            <option>その他</option>
          </select>
        </div>
        {reason === 'show' && (
          <div className={styles.amFld}>
            <input placeholder="理由を入力（その他）" />
          </div>
        )}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 8, padding: 10, fontSize: 11.5, marginBottom: 12 }}>
          前日15:00までに全書類が揃わないと三ノ輪の解錠QRは表示されず実質レンタル不可。前払いのため間に合わなければキャンセル料100%。
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal(null)}>
            追加書類・再提出を依頼
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(null)}>
            OK・承認して予約確定
          </button>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminLicense;
