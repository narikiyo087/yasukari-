import { useState } from 'react';
import Head from 'next/head';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';

/**
 * 用品・オプション（実装 / ダミーデータ）。移植メモ準拠：
 *  - 本部で追加・編集 → 顧客のオプション追加画面へ自動反映（マスタ→顧客連動）
 *  - 「全店既定 ＋ 店舗別で上書き」方式（店舗追加時も自動で候補に出る）
 * 参照: admin-proto-v2.html #accessories / accessoryreg
 */

const STORES = ['足立小台', '三ノ輪', '(加盟)綾瀬'] as const;
type Store = (typeof STORES)[number];

type Accessory = {
  id: string;
  name: string;
  pricePerDay: number;
  defaultOn: boolean; // 全店既定
  overrides: Partial<Record<Store, boolean>>; // 店舗別上書き（未設定＝既定に従う）
};

const INITIAL: Accessory[] = [
  { id: 'a-jet', name: 'ジェットヘル', pricePerDay: 300, defaultOn: true, overrides: { 三ノ輪: false } },
  { id: 'a-glove', name: 'グローブ', pricePerDay: 200, defaultOn: true, overrides: {} },
  { id: 'a-halfcap', name: '半キャップ', pricePerDay: 0, defaultOn: true, overrides: {} },
  { id: 'a-rain', name: 'レインウェア', pricePerDay: 400, defaultOn: false, overrides: { 三ノ輪: true } },
  { id: 'a-holder', name: 'スマホホルダー', pricePerDay: 150, defaultOn: true, overrides: { '(加盟)綾瀬': false } },
];

const Toggle = ({ on, onClick, title }: { on: boolean; onClick: () => void; title?: string }) => (
  <button type="button" className={`${styles.tg} ${on ? styles.tgOn : ''}`} aria-pressed={on} onClick={onClick} title={title} />
);

const AdminAccessories: NextPage = () => {
  const [items, setItems] = useState<Accessory[]>(INITIAL);
  const [regOpen, setRegOpen] = useState(false);
  const [edit, setEdit] = useState<Accessory | null>(null);

  const effectiveOn = (a: Accessory, s: Store) => (s in a.overrides ? Boolean(a.overrides[s]) : a.defaultOn);

  const toggleDefault = (id: string) =>
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, defaultOn: !a.defaultOn } : a)));

  const toggleStore = (id: string, s: Store) =>
    setItems((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const cur = effectiveOn(a, s);
        return { ...a, overrides: { ...a.overrides, [s]: !cur } };
      }),
    );

  return (
    <>
      <Head>
        <title>用品・オプション | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="accessories" title="用品・オプション">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>用品・オプション</h1>
            <span className={styles.sub}>全店既定 ＋ 店舗ごとに表示ON/OFF</span>
            <div className={styles.act}>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setRegOpen(true)}>
                ＋ 用品を追加
              </button>
            </div>
          </div>

          <div className={styles.infoBar}>
            ここで追加・編集した用品は<b>顧客のオプション追加画面へ自動反映</b>されます。表示は<b>「全店既定」を基準に、店舗ごとに上書き</b>（加盟店を追加しても自動で候補に出ます）。料金は6基準日で日数補間、当日分は追加料金で計算。
          </div>

          <div className={styles.tblWrap}>
            <table className={styles.tbl} style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <th>用品</th>
                  <th>料金/日</th>
                  <th>全店既定</th>
                  {STORES.map((s) => (
                    <th key={s}>{s}</th>
                  ))}
                  <th aria-label="操作" />
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id}>
                    <td className="strong">{a.name}</td>
                    <td className="mono">{a.pricePerDay === 0 ? '無料' : `+${a.pricePerDay}/日`}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Toggle on={a.defaultOn} onClick={() => toggleDefault(a.id)} title="全店既定のON/OFF" />
                        <span className={`${styles.badge} ${a.defaultOn ? styles.bOk : styles.bMute}`}>{a.defaultOn ? 'ON' : 'OFF'}</span>
                      </div>
                    </td>
                    {STORES.map((s) => {
                      const on = effectiveOn(a, s);
                      const overridden = s in a.overrides;
                      return (
                        <td key={s}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Toggle on={on} onClick={() => toggleStore(a.id, s)} title={`${s}の表示`} />
                            {overridden && <span className={styles.cellSub} style={{ marginTop: 0 }}>上書</span>}
                          </div>
                        </td>
                      );
                    })}
                    <td className={styles.tblActions}>
                      <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={() => setEdit(a)}>
                        編集
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className={styles.tipNote}>
            💡 「上書」と表示された店舗は全店既定と異なる設定です。既定と同じに戻すには、既定と同じ状態までトグルすると自動的に既定へ追従します（実データ移植時：店舗マスタを単一source-of-truthにし、店舗追加で自動的に候補化）。
          </p>
        </div>
      </AdminV2Shell>

      {/* 用品の登録 */}
      <AdminModal open={regOpen} title="用品の登録" onClose={() => setRegOpen(false)}>
        <div className={styles.amFld}>
          <label>用品名</label>
          <input placeholder="例：グローブ" />
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--t3)', margin: '2px 0 6px' }}>料金（6基準日）</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {['24時間', '2日間', '4日間', '1週間', '2週間', '1ヶ月'].map((l) => (
            <div className={styles.amFld} key={l}>
              <label>{l}</label>
              <input type="number" placeholder="例：1240" />
            </div>
          ))}
        </div>
        <div className={styles.amFld}>
          <label>追加料金（24時間ごと）</label>
          <input type="number" />
        </div>
        <div className={styles.amFld}>
          <label>初期表示</label>
          <select>
            <option>全店で表示（ON）</option>
            <option>全店で非表示（OFF・店舗ごとに有効化）</option>
          </select>
        </div>
        <div className={styles.amNote} style={{ fontSize: 11.5, color: 'var(--t3)' }}>
          登録すると顧客のオプション追加画面に自動で反映されます。
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setRegOpen(false)}>
            キャンセル
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setRegOpen(false)}>
            登録する
          </button>
        </div>
      </AdminModal>

      {/* 用品の編集 */}
      <AdminModal open={edit !== null} title={`用品を編集：${edit?.name ?? ''}`} onClose={() => setEdit(null)}>
        <div className={styles.amFld}>
          <label>用品名</label>
          <input defaultValue={edit?.name} />
        </div>
        <div className={styles.amFld}>
          <label>料金/日（円・0で無料）</label>
          <input type="number" defaultValue={edit?.pricePerDay} />
        </div>
        <div className={styles.amFld}>
          <label>追加料金（24時間ごと）</label>
          <input type="number" />
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setEdit(null)}>
            キャンセル
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setEdit(null)}>
            保存
          </button>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminAccessories;
