import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../../components/admin/AdminV2Shell';
import AdminModal from '../../../../components/admin/AdminModal';
import styles from '../../../../styles/AdminV2.module.css';

/** 車両詳細（実装 / ダミー）。参照: admin-proto-v2.html #vehicle */

const SCHEDULE = [
  { time: '7/20 10:00〜7/21 18:00', label: '#10231 山田', badge: styles.bInfo, state: '予約中' },
  { time: '8/02', label: '定期整備（走行距離基準）', badge: styles.bWarn, state: '整備予定' },
  { time: '〜8/29', label: '自賠責 満了', badge: styles.bBad, state: '期限' },
];

const AdminVehicleDetail: NextPage = () => {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : 'MW-0125';
  const [modal, setModal] = useState<null | 'edit' | 'mileage' | 'inspect'>(null);

  return (
    <>
      <Head>
        <title>車両詳細 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="catalog" title="車両詳細">
        <div className={styles.screen}>
          <p className={styles.crumb}>
            <Link href="/admin/catalog?tab=vehicle">車両登録・編集</Link> / 車両詳細
          </p>
          <div className={styles.pgh}>
            <h1>PCX（{id}）</h1>
            <span className={`${styles.badge} ${styles.bOk}`} style={{ fontSize: 13 }}>
              掲載中
            </span>
            <div className={styles.act}>
              <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal('edit')}>
                編集
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal('edit')}>
                複製
              </button>
            </div>
          </div>

          <div className={styles.cols2}>
            <div>
              <div className={styles.card} style={{ marginBottom: 18 }}>
                <h3>車両情報</h3>
                <dl className={styles.kv}>
                  <dt>管理番号</dt>
                  <dd className="mono">{id}</dd>
                  <dt>車種</dt>
                  <dd>PCX</dd>
                  <dt>クラス</dt>
                  <dd>125ccスクーター</dd>
                  <dt>店舗</dt>
                  <dd>三ノ輪</dd>
                  <dt>登録番号</dt>
                  <dd className="mono">足立 あ ・・・</dd>
                  <dt>車体番号</dt>
                  <dd className="mono">JF81-・・・</dd>
                  <dt>走行距離</dt>
                  <dd className="mono">
                    12,340 km{' '}
                    <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} style={{ marginLeft: 6, padding: '3px 8px' }} onClick={() => setModal('mileage')}>
                      更新
                    </button>
                  </dd>
                  <dt>車両設備</dt>
                  <dd>スマホホルダー・USB充電・ETC</dd>
                </dl>
              </div>

              <div className={styles.card}>
                <h3>整備・点検</h3>
                <dl className={styles.kv}>
                  <dt>整備状態</dt>
                  <dd>
                    <span className={`${styles.badge} ${styles.bOk}`}>良好</span>
                  </dd>
                  <dt>次回点検</dt>
                  <dd className="mono">2026/09/01</dd>
                  <dt>自賠責</dt>
                  <dd className="mono">2027/03 まで</dd>
                  <dt>最終稼働</dt>
                  <dd className="mono">2026/07/14</dd>
                </dl>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={() => setModal('inspect')}>
                    点検日を登録
                  </button>
                  <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={() => router.push('/admin/maint')}>
                    整備候補にする（レンタル不可）
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className={styles.card}>
                <h3>この車両のスケジュール</h3>
                {SCHEDULE.map((s) => (
                  <div className={styles.prRow} key={s.time} style={{ padding: '10px 0' }}>
                    <span className={styles.tm}>{s.time}</span>
                    <div className={styles.m}>{s.label}</div>
                    <span className={`${styles.badge} ${s.badge}`}>{s.state}</span>
                  </div>
                ))}
                <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm} ${styles.fullBtn}`} style={{ marginTop: 10 }} onClick={() => router.push('/admin/schedule')}>
                  全体のガントで見る
                </button>
              </div>
            </div>
          </div>
        </div>
      </AdminV2Shell>

      <AdminModal open={modal === 'mileage'} title="走行距離を更新" onClose={() => setModal(null)}>
        <div className={styles.amNote}>返却メーターの値をスタッフが入力します。整備の距離基準にも使われます。</div>
        <div className={styles.amFld}>
          <label>走行距離（km）</label>
          <input type="number" defaultValue={12340} />
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal(null)}>
            キャンセル
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(null)}>
            更新
          </button>
        </div>
      </AdminModal>

      <AdminModal open={modal === 'inspect'} title="点検日を登録" onClose={() => setModal(null)}>
        <div className={styles.amFld}>
          <label>次回点検日</label>
          <input type="date" />
        </div>
        <div className={styles.amFld}>
          <label>メモ</label>
          <textarea rows={2} />
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal(null)}>
            キャンセル
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(null)}>
            登録
          </button>
        </div>
      </AdminModal>

      <AdminModal open={modal === 'edit'} title="車両を編集" onClose={() => setModal(null)}>
        <div className={styles.amFld}>
          <label>管理番号</label>
          <input defaultValue={id} />
        </div>
        <div className={styles.amFld}>
          <label>店舗</label>
          <select>
            <option>三ノ輪</option>
            <option>足立小台</option>
          </select>
        </div>
        <div className={styles.amFld}>
          <label>掲載状態</label>
          <select>
            <option>公開（ON）</option>
            <option>非公開（OFF）</option>
          </select>
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

export default AdminVehicleDetail;
