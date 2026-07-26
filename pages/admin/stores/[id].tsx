import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';

/** 店舗設定 個別（実装 / ダミー）。店舗ごとの設定を1画面に集約。参照: admin-proto-v2.html #storedetail */

const STORE_NAMES: Record<string, string> = {
  adachi: '足立小台店',
  minowa: '三ノ輪店',
  kitasenju: '（加盟）北千住店',
  oji: '（加盟）王子店',
  ayase: '（加盟）綾瀬店',
};
const WD = ['月', '火', '水', '木', '金', '土', '日'];
const NOTIFY = [
  ['整備アラート（塩漬け・点検）', true],
  ['事故・転倒報告', true],
  ['免許確認待ち', true],
  ['返却写真待ち', true],
  ['新規予約', false],
  ['キャンセル', true],
  ['KEYBOX異常', true],
  ['自賠責・車検の期限接近', true],
] as const;

const AdminStoreDetail: NextPage = () => {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : 'adachi';
  const name = STORE_NAMES[id] ?? '足立小台店';
  const [holidays, setHolidays] = useState<Set<string>>(new Set(['月', '木']));
  const [self24, setSelf24] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleWd = (w: string) =>
    setHolidays((prev) => {
      const n = new Set(prev);
      if (n.has(w)) n.delete(w);
      else n.add(w);
      return n;
    });

  return (
    <>
      <Head>
        <title>店舗設定：{name} | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="stores" title="店舗設定">
        <div className={styles.screen}>
          <p className={styles.crumb}>
            <Link href="/admin/stores">店舗設定</Link> / 個別設定
          </p>
          <div className={styles.pgh}>
            <h1>店舗設定</h1>
            <span className={styles.sub}>店舗ごとの設定をここに集約（フランチャイズ対応）</span>
            <div className={styles.act}>
              <select className={styles.storeSel} value={id} onChange={(e) => router.push(`/admin/stores/${e.target.value}`)}>
                {Object.entries(STORE_NAMES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setSaved(true)}>
                保存
              </button>
            </div>
          </div>

          <div className={styles.cols2}>
            <div className={styles.card}>
              <h3>店舗情報</h3>
              <div className={styles.amFld}>
                <label>店舗名</label>
                <input defaultValue={name} />
              </div>
              <div className={styles.amFld}>
                <label>受取方式</label>
                <div>
                  <label style={{ display: 'flex', gap: 7, padding: '5px 0', fontSize: 13 }}>
                    <input type="radio" name="rcv" defaultChecked /> スタッフ常駐
                  </label>
                  <label style={{ display: 'flex', gap: 7, padding: '5px 0', fontSize: 13 }}>
                    <input type="radio" name="rcv" /> 24時間セルフ（KEYBOX）
                  </label>
                </div>
              </div>
              <div className={styles.amFld}>
                <label>住所</label>
                <input defaultValue="足立区小台2-9-7 1階" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className={styles.amFld}>
                  <label>問い合わせ電話</label>
                  <input defaultValue="03-5856-8200" />
                </div>
                <div className={styles.amFld}>
                  <label>問い合わせメール</label>
                  <input defaultValue="adachi@yasukari.com" />
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3>営業時間・曜日固定休日</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className={styles.amFld}>
                  <label>受付開始</label>
                  <input defaultValue="10:00" />
                </div>
                <div className={styles.amFld}>
                  <label>受付終了</label>
                  <input defaultValue="18:30" />
                </div>
              </div>
              <div className={styles.prRow} style={{ padding: '10px 0' }}>
                <div className={styles.m}>
                  <b>24時間セルフ営業</b>
                </div>
                <button type="button" className={`${styles.tg} ${self24 ? styles.tgOn : ''}`} aria-pressed={self24} onClick={() => setSelf24((v) => !v)} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--t3)', margin: '6px 0' }}>曜日固定休日</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {WD.map((w) => (
                  <button key={w} type="button" className={`${styles.chip} ${holidays.has(w) ? styles.chipOn : ''}`} onClick={() => toggleWd(w)}>
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.card} style={{ marginTop: 18 }}>
            <h3>臨時休業日</h3>
            {['お盆休業 8/13〜8/15', '年末年始 12/29〜1/3'].map((h) => (
              <div className={styles.prRow} key={h} style={{ padding: '9px 0' }}>
                <div className={styles.m}>{h}</div>
                <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}>
                  編集
                </button>
              </div>
            ))}
            <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} style={{ marginTop: 8 }}>
              ＋ 臨時休業日を追加
            </button>
          </div>

          <div className={styles.card} style={{ marginTop: 18 }}>
            <h3>メール通知先（店舗責任者）</h3>
            <p className={styles.fineNote} style={{ marginTop: 0 }}>
              この店舗のバイクで下記イベントが発生したとき、店舗責任者へメール通知します（バイクは店舗に紐付き）。
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className={styles.amFld}>
                <label>店舗責任者メール</label>
                <input defaultValue="adachi-manager@yasukari.com" />
              </div>
              <div className={styles.amFld}>
                <label>追加の通知先（カンマ区切り）</label>
                <input placeholder="sub@..., owner@..." />
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--t3)', margin: '8px 0 4px' }}>通知する種別</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              {NOTIFY.map(([l, checked]) => (
                <label key={l} style={{ display: 'flex', gap: 7, padding: '5px 0', fontSize: 13 }}>
                  <input type="checkbox" defaultChecked={checked} style={{ accentColor: 'var(--brand)' }} /> {l}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.cols2} style={{ marginTop: 18 }}>
            <div className={styles.card}>
              <h3>ハイシーズン（この店舗）</h3>
              {[
                ['夏季 8/10〜8/18', '+550/日'],
                ['年末年始 12/28〜1/3', '+550/日'],
              ].map(([l, v]) => (
                <div className={styles.prRow} key={l} style={{ padding: '9px 0' }}>
                  <div className={styles.m}>{l}</div>
                  <span className={`${styles.badge} ${styles.bWarn}`}>{v}</span>
                </div>
              ))}
              <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} style={{ marginTop: 8 }}>
                ＋ ハイシーズン期間を追加
              </button>
            </div>
            <div className={styles.card}>
              <h3>用品（オプション）表示・在庫</h3>
              {[
                ['ジェットヘル', '在庫 8', true],
                ['グローブ', '在庫 12', true],
                ['ブランドヘル', '在庫 0', false],
              ].map(([n, stock, show]) => (
                <div className={styles.prRow} key={n as string} style={{ padding: '9px 0' }}>
                  <div className={styles.m}>{n}</div>
                  <span className="mono" style={{ fontSize: 12 }}>
                    {stock} ・ <span className={`${styles.badge} ${show ? styles.bOk : styles.bMute}`}>{show ? '表示' : '非表示'}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.cols2} style={{ marginTop: 18 }}>
            <div className={styles.card}>
              <h3>店舗クーポン</h3>
              <div className={styles.prRow} style={{ padding: '9px 0' }}>
                <div className={styles.m}>MINOWA24 ／ 10%OFF</div>
                <span className={`${styles.badge} ${styles.bOk}`}>有効</span>
              </div>
              <Link href="/admin/coupons" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} style={{ marginTop: 8 }}>
                ＋ 店舗クーポンを作成
              </Link>
            </div>
            <div className={styles.card}>
              <h3>この店舗のスタッフ</h3>
              <div className={styles.prRow} style={{ padding: '9px 0' }}>
                <div className={styles.m}>足立 店長</div>
                <span className={`${styles.badge} ${styles.bInfo}`}>店舗オーナー</span>
              </div>
              <div className={styles.prRow} style={{ padding: '9px 0' }}>
                <div className={styles.m}>バイト（タイミー）</div>
                <span className={`${styles.badge} ${styles.bMute}`}>最小権限</span>
              </div>
              <Link href="/admin/stores" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} style={{ marginTop: 8 }}>
                ＋ スタッフ追加・権限付与
              </Link>
            </div>
          </div>

          <p className={styles.tipNote}>
            💡 店舗オーナーは自店のみ編集可・本部は全店。休日/ハイシーズン/用品/クーポン/スタッフを1画面で管理。
          </p>
        </div>
      </AdminV2Shell>

      <AdminModal open={saved} title="保存しました" onClose={() => setSaved(false)}>
        <div className={styles.amNote}>
          <b>{name}</b> の設定を保存しました。営業時間・休日・通知先などは即時反映されます。
        </div>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.fullBtn}`} onClick={() => setSaved(false)}>
          OK
        </button>
      </AdminModal>
    </>
  );
};

export default AdminStoreDetail;
