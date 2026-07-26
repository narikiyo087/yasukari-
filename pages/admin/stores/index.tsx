import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';

/** 店舗設定 一覧（店舗/スタッフ）。参照: admin-proto-v2.html #stores */

type Store = { id: string; name: string; type?: '直営' | '加盟'; receive: string; owner: string; status: '営業中' | '準備中' };
const STORES: Store[] = [
  { id: 'adachi', name: '足立小台店', receive: 'スタッフ受付', owner: '本部直営', status: '営業中' },
  { id: 'minowa', name: '三ノ輪店', type: '直営', receive: '24hセルフ（電子通信版）', owner: '本部直営', status: '営業中' },
  { id: 'kitasenju', name: '（加盟）北千住店', type: '加盟', receive: '24hセルフ（有線版 WD1）', owner: '加盟オーナーA', status: '営業中' },
  { id: 'oji', name: '（加盟）王子店', type: '加盟', receive: '24hセルフ（有線版 WD1）', owner: '加盟オーナーB', status: '準備中' },
  { id: 'ayase', name: '（加盟）綾瀬店', type: '加盟', receive: '24hセルフ（有線版 WD1）', owner: '加盟オーナーC', status: '準備中' },
];

const STAFF = [
  { name: 'K-JET 管理者', role: '本部管理者', badge: styles.bBad, store: '全店', editable: false },
  { name: '足立 店長', role: '店舗オーナー', badge: styles.bInfo, store: '足立小台', editable: true },
  { name: '三ノ輪 スタッフ', role: '店舗スタッフ', badge: styles.bMute, store: '三ノ輪', editable: true },
  { name: '— バイト（タイミー）', role: '最小権限', badge: styles.bMute, store: '足立', editable: true },
];

const AdminStores: NextPage = () => {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  return (
    <>
      <Head>
        <title>店舗設定 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="stores" title="店舗設定">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>店舗 / スタッフ</h1>
            <span className={styles.sub}>フランチャイズ：本部が店舗とロールを管理</span>
            <div className={styles.act}>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setAddOpen(true)}>
                ＋ 加盟店を追加
              </button>
            </div>
          </div>

          <div className={styles.tblWrap} style={{ marginBottom: 18 }}>
            <table className={styles.tbl}>
              <thead>
                <tr>
                  <th>店舗</th>
                  <th>受取方式</th>
                  <th>オーナー</th>
                  <th>状態</th>
                  <th aria-label="操作" />
                </tr>
              </thead>
              <tbody>
                {STORES.map((s) => (
                  <tr key={s.id} className="clickable" onClick={() => router.push(`/admin/stores/${s.id}`)}>
                    <td className="strong">
                      {s.name} {s.type && <span className={`${styles.badge} ${s.type === '直営' ? styles.bMute : styles.bInfo}`}>{s.type}</span>}
                    </td>
                    <td>{s.receive}</td>
                    <td>{s.owner}</td>
                    <td>
                      <span className={`${styles.badge} ${s.status === '営業中' ? styles.bOk : styles.bWarn}`}>{s.status}</span>
                    </td>
                    <td className={styles.tblActions}>
                      <Link href={`/admin/stores/${s.id}`} className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={(e) => e.stopPropagation()}>
                        設定
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.card}>
            <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              スタッフ・ロール
              <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} style={{ color: '#fff' }} onClick={() => setRoleOpen(true)}>
                ＋ スタッフ追加・権限付与
              </button>
            </h3>
            <div className={styles.tblWrap} style={{ border: 0 }}>
              <table className={styles.tbl} style={{ minWidth: 540 }}>
                <thead>
                  <tr>
                    <th>名前</th>
                    <th>ロール</th>
                    <th>担当店舗</th>
                    <th aria-label="操作" />
                  </tr>
                </thead>
                <tbody>
                  {STAFF.map((s) => (
                    <tr key={s.name}>
                      <td className="strong">{s.name}</td>
                      <td>
                        <span className={`${styles.badge} ${s.badge}`}>{s.role}</span>
                      </td>
                      <td>{s.store}</td>
                      <td className={styles.tblActions}>
                        {s.editable && (
                          <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={() => setRoleOpen(true)}>
                            権限編集
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.fineNote}>※ 権限は<b>チェックボックスで付与</b>。店舗オーナーは自店の範囲内のみ付与可。</p>
          </div>
        </div>
      </AdminV2Shell>

      <AdminModal open={addOpen} title="加盟店を追加（オンボーディング）" onClose={() => setAddOpen(false)}>
        <div className={styles.amNote}>手順に沿って設定すれば、誰でも同じ品質で加盟店を追加できます。会員・商品マスタ・料金基準・連携基盤は本部共通を再利用します。</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className={styles.amFld}>
            <label>店舗名</label>
            <input placeholder="例：（加盟）綾瀬店" />
          </div>
          <div className={styles.amFld}>
            <label>区分</label>
            <select>
              <option>加盟（フランチャイズ）</option>
              <option>直営</option>
            </select>
          </div>
          <div className={styles.amFld}>
            <label>ロイヤリティ率(%)</label>
            <input type="number" defaultValue={10} />
          </div>
          <div className={styles.amFld}>
            <label>決済手数料率(%)</label>
            <input type="number" defaultValue={3} />
          </div>
        </div>
        <div className={styles.amFld}>
          <label>オーナーのメール（招待）</label>
          <input type="email" placeholder="owner@example.com" />
        </div>
        <div className={styles.amFld}>
          <label>受取方式</label>
          <select>
            <option>スタッフ受付</option>
            <option>24時間セルフ（スマートロック）</option>
          </select>
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setAddOpen(false)}>
            下書き保存
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setAddOpen(false)}>
            この内容で加盟店を作成
          </button>
        </div>
      </AdminModal>

      <AdminModal open={roleOpen} title="スタッフの権限を付与" onClose={() => setRoleOpen(false)}>
        <div className={styles.amFld}>
          <label>名前</label>
          <input placeholder="氏名" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className={styles.amFld}>
            <label>テンプレート</label>
            <select>
              <option>スタッフ</option>
              <option>店長</option>
              <option>アルバイト/タイミー</option>
              <option>カスタム</option>
            </select>
          </div>
          <div className={styles.amFld}>
            <label>担当店舗</label>
            <select>
              <option>足立小台</option>
              <option>三ノ輪</option>
            </select>
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--t3)', margin: '4px 0' }}>付与する権限（チェック）</div>
        {[
          ['今日のタスク（免許確認/受付/返却/KEYBOX）', true],
          ['予約の閲覧・詳細', true],
          ['予約のキャンセル・料金変更', false],
          ['会員情報の閲覧（確認用）', true],
          ['売上・精算の閲覧', false],
          ['マスタ・店舗設定・APIキー（本部のみ）', false],
        ].map(([l, checked], i) => (
          <label key={i} style={{ display: 'flex', gap: 9, padding: '7px 0', fontSize: 13, borderBottom: '1px solid var(--line)', color: i === 5 ? 'var(--t3)' : undefined }}>
            <input type="checkbox" defaultChecked={checked as boolean} disabled={i === 5} style={{ accentColor: 'var(--brand)' }} /> {l as string}
          </label>
        ))}
        <div className={styles.amRow} style={{ marginTop: 12 }}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setRoleOpen(false)}>
            キャンセル
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setRoleOpen(false)}>
            この権限で付与
          </button>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminStores;
