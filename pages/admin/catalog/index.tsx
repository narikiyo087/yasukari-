import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import Gantt from '../../../components/admin/Gantt';
import { genBikes } from '../../../lib/adminGanttData';
import styles from '../../../styles/AdminV2.module.css';

/**
 * 車両登録・編集（商品マスタ）。移植メモ準拠で再設計：
 *  - エンティティ切替（クラス / 車種 / 車両）を「タイトル右の主タブ」に
 *  - 表示モード（一覧 / ボード / ガント）は車両レベルの副次トグルに
 * 参照: admin-proto-v2.html #catalog
 */

type Entity = 'class' | 'model' | 'vehicle';
type VView = 'list' | 'board' | 'gantt';

type ClassRow = { id: string; name: string; count: number; base: string; registered: boolean };
const CLASSES: ClassRow[] = [
  { id: 'C-50S', name: '50ccスクーター', count: 14, base: '¥2,000〜', registered: true },
  { id: 'C-125S', name: '125ccスクーター', count: 18, base: '¥2,500〜', registered: true },
  { id: 'C-MT2', name: '原付二種MT', count: 9, base: '¥2,800〜', registered: true },
  { id: 'C-250', name: '126–250cc', count: 16, base: '¥4,000〜', registered: true },
  { id: 'C-400', name: '251–400cc', count: 12, base: '¥5,000〜', registered: false },
  { id: 'C-GY', name: 'ジャイロ（3輪）', count: 6, base: '¥3,000〜', registered: true },
];

type ModelRow = { id: string; name: string; klass: string; count: number; pricing: 'individual' | 'inherit'; published: string };
const MODELS: ModelRow[] = [
  { id: 'M-PCX', name: 'PCX', klass: '125ccスクーター', count: 8, pricing: 'individual', published: '掲載' },
  { id: 'M-REBEL', name: 'レブル250', klass: '126–250cc', count: 6, pricing: 'inherit', published: '掲載' },
  { id: 'M-TACT', name: 'タクト', klass: '50ccスクーター', count: 7, pricing: 'inherit', published: '一部非掲載' },
  { id: 'M-CROSS', name: 'クロスカブ', klass: '原付二種MT', count: 5, pricing: 'individual', published: '掲載' },
  { id: 'M-CB400', name: 'CB400', klass: '251–400cc', count: 4, pricing: 'inherit', published: '掲載' },
];

type VehicleRow = { id: string; name: string; klass: string; store: string; maint: 'good' | 'candidate'; pub: 'on' | 'off' };
const VEHICLES: VehicleRow[] = [
  { id: 'MW-0125', name: 'PCX', klass: '125ccスクーター', store: '三ノ輪', maint: 'good', pub: 'on' },
  { id: 'RB-0007', name: 'レブル250', klass: '126–250cc', store: '三ノ輪', maint: 'good', pub: 'on' },
  { id: 'AD-0031', name: 'タクト', klass: '50ccスクーター', store: '足立', maint: 'candidate', pub: 'off' },
  { id: 'CR-0110', name: 'クロスカブ', klass: '原付二種MT', store: '足立', maint: 'good', pub: 'on' },
  { id: 'CB-1004', name: 'CB400', klass: '251–400cc', store: '（加盟）綾瀬', maint: 'good', pub: 'on' },
];

type RegKind = null | 'class' | 'model' | 'vehicle';

const AdminCatalog: NextPage = () => {
  const router = useRouter();
  const [entity, setEntity] = useState<Entity>('vehicle');
  const [vview, setVview] = useState<VView>('list');
  const [reg, setReg] = useState<RegKind>(null);
  const bikes = useMemo(() => genBikes(75), []);

  useEffect(() => {
    const q = router.query.tab;
    if (q === 'class' || q === 'model' || q === 'vehicle') setEntity(q);
  }, [router.query.tab]);

  const sub = entity === 'class' ? 'クラス（排気量帯）一覧' : entity === 'model' ? '車種（モデル）一覧' : '車両（個体）一覧';

  return (
    <>
      <Head>
        <title>車両登録・編集 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="catalog" title="車両登録・編集">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>車両登録・編集</h1>
            <span className={styles.sub}>{sub}</span>
            <div className={styles.act}>
              <div className={styles.viewtoggle} role="tablist" aria-label="エンティティ切替">
                {(['class', 'model', 'vehicle'] as Entity[]).map((e) => (
                  <button
                    key={e}
                    type="button"
                    role="tab"
                    aria-selected={entity === e}
                    className={`${styles.vt} ${entity === e ? styles.vtOn : ''}`}
                    onClick={() => setEntity(e)}
                  >
                    {e === 'class' ? `クラス ${CLASSES.length}` : e === 'model' ? `車種 ${MODELS.length}` : `車両 75`}
                  </button>
                ))}
              </div>
              <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setReg('class')}>
                ＋クラス
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setReg('model')}>
                ＋車種
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setReg('vehicle')}>
                ＋車両
              </button>
            </div>
          </div>

          <div className={styles.infoBar}>
            クラス（排気量帯）＞ 車種（モデル）＞ 車両（個体・管理番号）の3階層。料金・車種ベースは本部管理、店舗別料金は例外設定（フランチャイズ）。
          </div>

          {/* クラス */}
          {entity === 'class' && (
            <div className={styles.tblWrap}>
              <table className={styles.tbl}>
                <thead>
                  <tr>
                    <th>クラスID</th>
                    <th>クラス名</th>
                    <th>台数</th>
                    <th>料金〜</th>
                    <th>状態</th>
                    <th aria-label="操作" />
                  </tr>
                </thead>
                <tbody>
                  {CLASSES.map((c) => (
                    <tr key={c.id} className="clickable" onClick={() => router.push(`/admin/catalog/class/${c.id}`)}>
                      <td className="mono">{c.id}</td>
                      <td className="strong">{c.name}</td>
                      <td className="mono">{c.count}</td>
                      <td className="mono">{c.base}</td>
                      <td>
                        <span className={`${styles.badge} ${c.registered ? styles.bOk : styles.bWarn}`}>{c.registered ? '登録済' : '未登録'}</span>
                      </td>
                      <td className={styles.tblActions}>
                        <Link href={`/admin/catalog/class/${c.id}`} className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={(e) => e.stopPropagation()}>
                          詳細
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 車種 */}
          {entity === 'model' && (
            <>
              <div className={styles.tblWrap}>
                <table className={styles.tbl}>
                  <thead>
                    <tr>
                      <th>車種ID</th>
                      <th>車種（モデル）</th>
                      <th>クラス</th>
                      <th>台数</th>
                      <th>料金</th>
                      <th>掲載</th>
                      <th aria-label="操作" />
                    </tr>
                  </thead>
                  <tbody>
                    {MODELS.map((mm) => (
                      <tr key={mm.id} className="clickable" onClick={() => router.push(`/admin/catalog/model/${mm.id}`)}>
                        <td className="mono">{mm.id}</td>
                        <td className="strong">{mm.name}</td>
                        <td>{mm.klass}</td>
                        <td className="mono">{mm.count}</td>
                        <td>
                          <span className={`${styles.badge} ${mm.pricing === 'individual' ? styles.bInfo : styles.bMute}`}>
                            {mm.pricing === 'individual' ? '個別料金' : 'クラス継承'}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${mm.published === '掲載' ? styles.bOk : styles.bMute}`}>{mm.published}</span>
                        </td>
                        <td className={styles.tblActions}>
                          <Link href={`/admin/catalog/model/${mm.id}`} className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={(e) => e.stopPropagation()}>
                            詳細
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={styles.fineNote}>※ 車種＝モデル。各車種の下に個体（車両）がぶら下がります。</p>
            </>
          )}

          {/* 車両（表示モードの副次トグルあり） */}
          {entity === 'vehicle' && (
            <>
              <div className={styles.subToolbar}>
                <div className={styles.viewtoggle} role="tablist" aria-label="表示切替">
                  {(['list', 'board', 'gantt'] as VView[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      role="tab"
                      aria-selected={vview === v}
                      className={`${styles.vt} ${vview === v ? styles.vtOn : ''}`}
                      onClick={() => setVview(v)}
                    >
                      {v === 'list' ? '一覧' : v === 'board' ? 'ボード' : 'ガント'}
                    </button>
                  ))}
                </div>
              </div>

              {vview === 'list' && (
                <div className={styles.tblWrap}>
                  <table className={styles.tbl}>
                    <thead>
                      <tr>
                        <th>管理番号</th>
                        <th>車種</th>
                        <th>クラス</th>
                        <th>店舗</th>
                        <th>整備状態</th>
                        <th>掲載</th>
                        <th aria-label="操作" />
                      </tr>
                    </thead>
                    <tbody>
                      {VEHICLES.map((v) => (
                        <tr key={v.id} className="clickable" onClick={() => router.push(`/admin/catalog/vehicle/${v.id}`)}>
                          <td className="mono">{v.id}</td>
                          <td className="strong">{v.name}</td>
                          <td>{v.klass}</td>
                          <td>{v.store}</td>
                          <td>
                            <span className={`${styles.badge} ${v.maint === 'good' ? styles.bOk : styles.bWarn}`}>{v.maint === 'good' ? '良好' : '整備候補'}</span>
                          </td>
                          <td>
                            <span className={`${styles.badge} ${v.pub === 'on' ? styles.bOk : styles.bMute}`}>{v.pub === 'on' ? '掲載中' : '非掲載'}</span>
                          </td>
                          <td className={styles.tblActions}>
                            <Link href={`/admin/catalog/vehicle/${v.id}`} className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={(e) => e.stopPropagation()}>
                              詳細
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {vview === 'board' && (
                <div className={styles.board}>
                  <div className={styles.bcol}>
                    <div className={styles.bcolH} style={{ background: 'var(--ok)' }}>掲載中（{VEHICLES.filter((v) => v.pub === 'on').length}）</div>
                    <div className={styles.bcards}>
                      {VEHICLES.filter((v) => v.pub === 'on').map((v) => (
                        <div key={v.id} className={styles.bcard} onClick={() => router.push(`/admin/catalog/vehicle/${v.id}`)}>
                          <b>{v.name}</b>
                          <div className={styles.bmeta}>{v.id} ／ {v.store} ／ {v.maint === 'good' ? '良好' : '整備候補'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.bcol}>
                    <div className={styles.bcolH} style={{ background: 'var(--warn)' }}>整備候補（{VEHICLES.filter((v) => v.maint === 'candidate').length}）</div>
                    <div className={styles.bcards}>
                      {VEHICLES.filter((v) => v.maint === 'candidate').map((v) => (
                        <div key={v.id} className={styles.bcard} onClick={() => router.push('/admin/maint')}>
                          <b>{v.name}</b>
                          <div className={styles.bmeta}>{v.id} ／ {v.store}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.bcol}>
                    <div className={styles.bcolH} style={{ background: 'var(--t3)' }}>非掲載（{VEHICLES.filter((v) => v.pub === 'off').length}）</div>
                    <div className={styles.bcards}>
                      {VEHICLES.filter((v) => v.pub === 'off').map((v) => (
                        <div key={v.id} className={styles.bcard} onClick={() => router.push(`/admin/catalog/vehicle/${v.id}`)}>
                          <b>{v.name}</b>
                          <div className={styles.bmeta}>{v.id} ／ 整備中のため</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {vview === 'gantt' && <Gantt rows={bikes} defaultRange="30,90" />}
            </>
          )}
        </div>
      </AdminV2Shell>

      {/* 登録モーダル */}
      <AdminModal open={reg === 'class'} title="クラスの登録" onClose={() => setReg(null)}>
        <div className={styles.amFld}>
          <label>ID</label>
          <input placeholder="例：#1（class_1 として保存）" />
        </div>
        <div className={styles.amFld}>
          <label>クラス名</label>
          <input placeholder="例：スクーター" />
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--t3)', margin: '2px 0 6px' }}>基本料金（6基準日）</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {['24時間', '2日間', '4日間', '1週間', '2週間', '1ヶ月'].map((l) => (
            <div className={styles.amFld} key={l}>
              <label>{l}</label>
              <input type="number" />
            </div>
          ))}
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setReg(null)}>
            キャンセル
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setReg(null)}>
            登録する
          </button>
        </div>
      </AdminModal>

      <AdminModal open={reg === 'model'} title="車種の登録" onClose={() => setReg(null)}>
        <div className={styles.amFld}>
          <label>所属クラス</label>
          <select>
            {CLASSES.map((c) => (
              <option key={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.amFld}>
          <label>車種名</label>
          <input placeholder="例：PCX" />
        </div>
        <div className={styles.amFld}>
          <label>この車種に乗れる免許種別（複数選択可）</label>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13, padding: '2px 0' }}>
            {['原付', '小型限定普通二輪', '普通二輪', '大型二輪'].map((l, i) => (
              <label key={l} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="checkbox" defaultChecked={i >= 2} style={{ accentColor: 'var(--brand)' }} />
                {l}
              </label>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className={styles.amFld}>
            <label>排気量(cc)</label>
            <input type="number" />
          </div>
          <div className={styles.amFld}>
            <label>掲載状態</label>
            <select>
              <option>公開（ON）</option>
              <option>非公開（OFF）</option>
            </select>
          </div>
        </div>
        <div className={styles.amFld}>
          <label>メイン画像</label>
          <input type="file" />
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setReg(null)}>
            キャンセル
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setReg(null)}>
            登録する
          </button>
        </div>
      </AdminModal>

      <AdminModal open={reg === 'vehicle'} title="車両の登録" onClose={() => setReg(null)}>
        <div className={styles.amFld}>
          <label>管理番号</label>
          <input placeholder="例：MW-0125" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className={styles.amFld}>
            <label>車種</label>
            <select>
              {MODELS.map((mm) => (
                <option key={mm.id}>{mm.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.amFld}>
            <label>店舗</label>
            <select>
              <option>三ノ輪</option>
              <option>足立小台</option>
              <option>（加盟）綾瀬</option>
            </select>
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--t3)', margin: '6px 0 4px' }}>車両設備</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', marginBottom: 8 }}>
          {['スマホホルダー', 'USB充電', 'ETC', 'ABS', 'リアボックス', 'グリップヒーター'].map((l) => (
            <label key={l} style={{ display: 'flex', gap: 7, padding: '5px 0', fontSize: 13 }}>
              <input type="checkbox" style={{ accentColor: 'var(--brand)' }} /> {l}
            </label>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className={styles.amFld}>
            <label>車検満了日</label>
            <input type="date" />
          </div>
          <div className={styles.amFld}>
            <label>自賠責満了日</label>
            <input type="date" />
          </div>
          <div className={styles.amFld}>
            <label>ナンバープレート</label>
            <input />
          </div>
          <div className={styles.amFld}>
            <label>掲載状態</label>
            <select>
              <option>公開（ON）</option>
              <option>非公開（OFF）</option>
            </select>
          </div>
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setReg(null)}>
            キャンセル
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setReg(null)}>
            登録する
          </button>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminCatalog;
