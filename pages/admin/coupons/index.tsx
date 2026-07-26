import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';

/** クーポン一覧（実装 / ダミー）。参照: admin-proto-v2.html #coupons / coupon modal */

type Coupon = { code: string; kind: string; badge: string; content: string; segment: string; store: string; period: string; active: boolean };
const COUPONS: Coupon[] = [
  { code: 'HAJIME500', kind: '初回限定', badge: styles.bInfo, content: '初回500円引', segment: '初回未利用の会員', store: '全店', period: '〜8/31', active: true },
  { code: 'REPEAT10', kind: 'リピーター限定', badge: styles.bOk, content: '2回目以降 10%OFF', segment: 'リピーター（2〜4回）', store: '全店', period: '〜9/30', active: true },
  { code: 'FRIEND1000', kind: '友達紹介', badge: styles.bBad, content: '紹介者・被紹介者に各1,000円', segment: '紹介コード保有者', store: '全店', period: '常時', active: true },
  { code: 'RAIN300', kind: '雨の日', badge: styles.bInfo, content: '雨天予報の日 300円引', segment: '全会員', store: '三ノ輪', period: '常時', active: false },
];

const CHIPS = ['すべて', '初回限定', '友達紹介', 'ツーリング', 'オプション無料', '雨の日'];

const AdminCoupons: NextPage = () => {
  const [filter, setFilter] = useState('すべて');
  const [createOpen, setCreateOpen] = useState(false);
  const [discountType, setDiscountType] = useState('amount');

  const rows = filter === 'すべて' ? COUPONS : COUPONS.filter((c) => c.kind.includes(filter));

  return (
    <>
      <Head>
        <title>クーポン | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="coupons" title="クーポン">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>クーポン</h1>
            <span className={styles.sub}>種別・対象セグメントを指定して発行</span>
            <div className={styles.act}>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setCreateOpen(true)}>
                ＋ クーポン作成
              </button>
            </div>
          </div>

          <div className={styles.toolbar}>
            {CHIPS.map((c) => (
              <button key={c} type="button" className={`${styles.chip} ${filter === c ? styles.chipOn : ''}`} onClick={() => setFilter(c)}>
                {c}
              </button>
            ))}
          </div>

          <div className={styles.tblWrap}>
            <table className={styles.tbl} style={{ minWidth: 820 }}>
              <thead>
                <tr>
                  <th>コード</th>
                  <th>種別</th>
                  <th>内容</th>
                  <th>対象セグメント</th>
                  <th>店舗</th>
                  <th>期間</th>
                  <th>状態</th>
                  <th aria-label="操作" />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.code}>
                    <td className="mono">{c.code}</td>
                    <td>
                      <span className={`${styles.badge} ${c.badge}`}>{c.kind}</span>
                    </td>
                    <td className="strong">{c.content}</td>
                    <td>{c.segment}</td>
                    <td>{c.store}</td>
                    <td className="mono">{c.period}</td>
                    <td>
                      <span className={`${styles.badge} ${c.active ? styles.bOk : styles.bMute}`}>{c.active ? '有効' : '停止'}</span>
                    </td>
                    <td className={styles.tblActions}>
                      <Link href={`/admin/coupons/${c.code}`} className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}>
                        編集
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AdminV2Shell>

      <AdminModal open={createOpen} title="クーポン作成" onClose={() => setCreateOpen(false)}>
        <div className={styles.amFld}>
          <label>種別</label>
          <select>
            <option>初回限定</option>
            <option>友達紹介</option>
            <option>ツーリング（2名同日程）</option>
            <option>オプション無料</option>
            <option>雨の日</option>
            <option>通常</option>
          </select>
        </div>
        <div className={styles.amFld}>
          <label>割引タイプ</label>
          <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
            <option value="amount">定額（円引き）</option>
            <option value="percent">定率（％OFF）</option>
            <option value="option">オプション無料</option>
          </select>
        </div>
        {discountType === 'amount' && (
          <div className={styles.amFld}>
            <label>割引額（円）</label>
            <input type="number" defaultValue={500} />
          </div>
        )}
        {discountType === 'percent' && (
          <div className={styles.amFld}>
            <label>割引率（％）</label>
            <input type="number" defaultValue={10} />
          </div>
        )}
        {discountType === 'option' && (
          <div className={styles.amFld}>
            <label>無料にするオプション</label>
            <select>
              <option>ヘルメット</option>
              <option>グローブ</option>
              <option>スマホホルダー</option>
              <option>レインウェア</option>
            </select>
          </div>
        )}
        <div className={styles.amFld}>
          <label>対象セグメント</label>
          <select>
            <option>全会員</option>
            <option>本登録のみ</option>
            <option>初回未利用</option>
            <option>リピーター（2〜4回）</option>
            <option>常連/VIP（5回〜）</option>
            <option>休眠（復帰狙い）</option>
            <option>外国籍の会員</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className={styles.amFld}>
            <label>対象店舗</label>
            <select>
              <option>全店</option>
              <option>足立小台</option>
              <option>三ノ輪</option>
            </select>
          </div>
          <div className={styles.amFld}>
            <label>有効期限</label>
            <input type="date" />
          </div>
        </div>
        <div className={styles.amNote} style={{ fontSize: 11.5, color: 'var(--t3)' }}>
          ※ 割引はこの設定値で自動計算・適用されます（自由記入では計算できないため構造化）。
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setCreateOpen(false)}>
            キャンセル
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setCreateOpen(false)}>
            作成
          </button>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminCoupons;
