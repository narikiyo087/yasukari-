import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';

/**
 * 予約詳細（実装 / ダミーデータ）。参照: admin-proto-v2.html #reservation
 * ダミーのため id は表示用に使うのみ（実データ連携は移植時）。
 */

type ModalKind = null | 'keybox' | 'approve' | 'contract' | 'extend' | 'cancel';

const AdminReservationDetail: NextPage = () => {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : 'YK-20260720-0031';
  const [modal, setModal] = useState<ModalKind>(null);

  return (
    <>
      <Head>
        <title>予約詳細 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="reservations" title="予約詳細">
        <div className={styles.screen}>
          <p className={styles.crumb}>
            <Link href="/admin/reservations">予約管理</Link> / 詳細
          </p>
          <div className={styles.pgh}>
            <h1>予約詳細</h1>
            <span className={`${styles.badge} ${styles.bOk}`} style={{ fontSize: 13 }}>
              貸出中
            </span>
            <div className={styles.act}>
              <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal('extend')}>
                延長登録
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal('cancel')}>
                キャンセル
              </button>
            </div>
          </div>

          <div className={styles.detailCols}>
            <div>
              <div className={styles.card} style={{ marginBottom: 18 }}>
                <h3>予約情報</h3>
                <dl className={styles.kv}>
                  <dt>予約ID</dt>
                  <dd className="mono">{id}</dd>
                  <dt>車両</dt>
                  <dd>PCX（MW-0125）</dd>
                  <dt>受取店舗</dt>
                  <dd>三ノ輪店（セルフ）</dd>
                  <dt>貸出〜返却</dt>
                  <dd className="mono">7/20 10:00 〜 7/21 18:00</dd>
                  <dt>補償</dt>
                  <dd>車両補償あり</dd>
                  <dt>用品</dt>
                  <dd>半キャップ×1</dd>
                </dl>
              </div>
              <div className={styles.card}>
                <h3>料金・決済</h3>
                <dl className={styles.kv}>
                  <dt>レンタル</dt>
                  <dd className="mono">5,000円</dd>
                  <dt>補償</dt>
                  <dd className="mono">2,200円</dd>
                  <dt>合計</dt>
                  <dd className="mono" style={{ color: 'var(--brand)' }}>
                    7,200円（Pay.jp 決済済）
                  </dd>
                </dl>
              </div>
            </div>

            <div>
              <div className={styles.card} style={{ marginBottom: 18 }}>
                <h3>顧客</h3>
                <dl className={styles.kv}>
                  <dt>氏名</dt>
                  <dd>山田 太郎</dd>
                  <dt>会員ID</dt>
                  <dd className="mono">YK-10231</dd>
                  <dt>免許証</dt>
                  <dd>
                    <span className={`${styles.badge} ${styles.bOk}`}>確認済</span>
                  </dd>
                </dl>
                <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm} ${styles.fullBtn}`} style={{ marginTop: 12 }} disabled title="会員詳細は準備中">
                  会員情報へ
                </button>
              </div>

              <div className={styles.card} style={{ marginBottom: 18 }}>
                <h3>免許種別 自動判定</h3>
                <dl className={styles.kv}>
                  <dt>顧客の免許</dt>
                  <dd>普通二輪（中型）</dd>
                  <dt>車種の必要種別</dt>
                  <dd>小型限定／普通／大型 のいずれか</dd>
                </dl>
                <div className={styles.okNote}>✓ 適合：この車種をレンタル可能</div>
                <p className={styles.fineNote}>
                  車種登録の「乗れる免許種別」と顧客の免許種別を自動照合します（免許画像の確認とは別軸。両方の確認が必要）。
                </p>
              </div>

              <div className={styles.card}>
                <h3>操作</h3>
                <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.fullBtn}`} style={{ marginBottom: 10 }} onClick={() => setModal('keybox')}>
                  KEYBOX 発行
                </button>
                <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.fullBtn}`} style={{ marginBottom: 10 }} onClick={() => setModal('approve')}>
                  返却承認
                </button>
                <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.fullBtn}`} onClick={() => setModal('contract')}>
                  貸渡契約書
                </button>
              </div>
            </div>
          </div>
        </div>
      </AdminV2Shell>

      <AdminModal open={modal === 'keybox'} title="KEYBOX 暗証番号を発行" onClose={() => setModal(null)}>
        <div style={{ textAlign: 'center' }}>
          <div className="mono" style={{ fontWeight: 800, fontSize: 30, letterSpacing: '0.2em', margin: '8px 0 2px' }}>
            4821
          </div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 14 }}>貸出時間から有効・顧客マイページにも表示</div>
        </div>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.fullBtn}`} onClick={() => setModal(null)}>
          発行・顧客へ通知
        </button>
      </AdminModal>

      <AdminModal open={modal === 'approve'} title="返却内容の確認・承認" onClose={() => setModal(null)}>
        <div
          style={{
            height: 150,
            borderRadius: 8,
            background: 'repeating-linear-gradient(135deg,#e2e8f0,#e2e8f0 10px,#eef2f7 10px,#eef2f7 20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          返却写真
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} style={{ color: 'var(--brand)' }} onClick={() => setModal(null)}>
            却下
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(null)}>
            承認
          </button>
        </div>
      </AdminModal>

      <AdminModal open={modal === 'contract'} title="貸渡契約書（自動発行）" onClose={() => setModal(null)}>
        <div className={styles.amBox}>
          <b>貸渡契約書（A4 1枚）</b>
          <div style={{ color: 'var(--t3)', marginTop: 4 }}>氏名・住所・車両・料金・補償・延長欄・事業者情報を差込済み。</div>
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal(null)}>
            閉じる
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => {
              setModal(null);
              if (typeof window !== 'undefined') window.print();
            }}
          >
            A4で印刷 / PDF保存
          </button>
        </div>
      </AdminModal>

      <AdminModal open={modal === 'extend'} title="延長登録" onClose={() => setModal(null)}>
        <div className={styles.amFld}>
          <label>新しい返却日時</label>
          <input type="datetime-local" />
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal(null)}>
            キャンセル
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(null)}>
            延長を登録
          </button>
        </div>
      </AdminModal>

      <AdminModal open={modal === 'cancel'} title="キャンセルの確定" onClose={() => setModal(null)}>
        <div className={styles.amNote}>
          キャンセル料を判定して確定します（4日前まで無料／3日前〜当日は50%）。
        </div>
        <div className={styles.amFld}>
          <label>キャンセル料</label>
          <select>
            <option>50%（3日前〜当日）</option>
            <option>無料（4日前まで）</option>
            <option>100%（書類不備・前日15時以降）</option>
          </select>
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal(null)}>
            戻る
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(null)}>
            確定して返金/請求
          </button>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminReservationDetail;
