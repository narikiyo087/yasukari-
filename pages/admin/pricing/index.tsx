import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';

/**
 * 料金設計（実装 / ダミーデータ）— クラス料金 / 車種料金 / 海外 の3タブ構成。
 * 移植メモ準拠：海外向け設定を独立タブに分離。
 * 参照: admin-proto-v2.html #pricing
 */

type Tab = 'class' | 'model' | 'intl';

type ClassRow = { id: string; name: string; base: string; registered: boolean };
const CLASSES: ClassRow[] = [
  { id: 'C-50S', name: '50ccスクーター', base: '¥2,000〜', registered: true },
  { id: 'C-125S', name: '125ccスクーター', base: '¥2,500〜', registered: true },
  { id: 'C-MT2', name: '原付二種MT', base: '¥2,800〜', registered: true },
  { id: 'C-250', name: '126–250cc', base: '¥4,000〜', registered: true },
  { id: 'C-400', name: '251–400cc', base: '¥5,000〜', registered: false },
];

type ModelRow = { id: string; name: string; klass: string; pricing: 'individual' | 'inherit'; published: boolean };
const MODELS: ModelRow[] = [
  { id: 'M-PCX', name: 'PCX', klass: '125ccスクーター', pricing: 'individual', published: true },
  { id: 'M-REBEL', name: 'レブル250', klass: '126–250cc', pricing: 'inherit', published: true },
  { id: 'M-TACT', name: 'タクト', klass: '50ccスクーター', pricing: 'inherit', published: false },
  { id: 'M-CROSS', name: 'クロスカブ', klass: '原付二種MT', pricing: 'individual', published: true },
];

const COUNTRIES = [
  '国際運転免許証 IDP（ジュネーブ条約加盟国）',
  'スイス（翻訳文）',
  'ドイツ（翻訳文）',
  'フランス（翻訳文）',
  '台湾（翻訳文）',
  'ベルギー（翻訳文）',
  'モナコ／スロベニア（翻訳文）',
];

const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
  <button type="button" className={`${styles.tg} ${on ? styles.tgOn : ''}`} aria-pressed={on} onClick={onClick} />
);

const AdminPricing: NextPage = () => {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('class');
  const [rate, setRate] = useState(200);
  const [depositReq, setDepositReq] = useState(true);
  const [insReq, setInsReq] = useState(true);
  const [cancelStrict, setCancelStrict] = useState(true);
  const [editListOpen, setEditListOpen] = useState(false);

  useEffect(() => {
    const q = router.query.tab;
    if (q === 'class' || q === 'model' || q === 'intl') setTab(q);
  }, [router.query.tab]);

  return (
    <>
      <Head>
        <title>料金設計 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="pricing" title="料金設計">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>料金設計</h1>
            <span className={styles.sub}>クラス料金（デフォルト）／車種料金（個別）／海外（別建て）</span>
            <div className={styles.act}>
              <div className={styles.viewtoggle} role="tablist" aria-label="表示切替">
                {(['class', 'model', 'intl'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={tab === t}
                    className={`${styles.vt} ${tab === t ? styles.vtOn : ''}`}
                    onClick={() => setTab(t)}
                  >
                    {t === 'class' ? 'クラス料金' : t === 'model' ? '車種料金' : '海外'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {tab !== 'intl' && (
            <div className={styles.infoBar}>
              💡 <b>車種で個別料金を登録しなければ、そのクラスの料金が適用</b>されます（クラス＝デフォルト、車種＝個別上書き）。どちらも「6つの基準日→自動補間」で設計。
            </div>
          )}

          {/* クラス料金 */}
          {tab === 'class' && (
            <div className={styles.tblWrap}>
              <table className={styles.tbl}>
                <thead>
                  <tr>
                    <th>クラスID</th>
                    <th>クラス名</th>
                    <th>基準料金(24時間)</th>
                    <th>料金登録</th>
                    <th aria-label="操作" />
                  </tr>
                </thead>
                <tbody>
                  {CLASSES.map((c) => (
                    <tr key={c.id} className="clickable" onClick={() => router.push(`/admin/pricing/class/${c.id}`)}>
                      <td className="mono">{c.id}</td>
                      <td className="strong">{c.name}</td>
                      <td className="mono">{c.base}</td>
                      <td>
                        <span className={`${styles.badge} ${c.registered ? styles.bOk : styles.bWarn}`}>{c.registered ? '登録済み' : '未登録'}</span>
                      </td>
                      <td className={styles.tblActions}>
                        <Link
                          href={`/admin/pricing/class/${c.id}`}
                          className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          設定
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 車種料金 */}
          {tab === 'model' && (
            <div className={styles.tblWrap}>
              <table className={styles.tbl}>
                <thead>
                  <tr>
                    <th>車種ID</th>
                    <th>車種名</th>
                    <th>クラス</th>
                    <th>適用中の料金</th>
                    <th>掲載</th>
                    <th aria-label="操作" />
                  </tr>
                </thead>
                <tbody>
                  {MODELS.map((mm) => (
                    <tr key={mm.id} className="clickable" onClick={() => router.push(`/admin/pricing/model/${mm.id}`)}>
                      <td className="mono">{mm.id}</td>
                      <td className="strong">{mm.name}</td>
                      <td>{mm.klass}</td>
                      <td>
                        <span className={`${styles.badge} ${mm.pricing === 'individual' ? styles.bInfo : styles.bMute}`}>
                          {mm.pricing === 'individual' ? '個別料金' : 'クラス継承'}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${mm.published ? styles.bOk : styles.bMute}`}>{mm.published ? 'ON' : 'OFF'}</span>
                      </td>
                      <td className={styles.tblActions}>
                        <Link
                          href={`/admin/pricing/model/${mm.id}`}
                          className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          設定
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 海外 */}
          {tab === 'intl' && (
            <div className={`${styles.card} ${styles.panelRed}`} style={{ borderLeftWidth: 4 }}>
              <h3>海外向け設定（居住国が日本以外の会員に自動適用）</h3>
              <div className={styles.cols2}>
                <div className={styles.amFld}>
                  <label>海外レート倍率（基準価格 × 倍率）</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value) || 0)} style={{ maxWidth: 120 }} />
                    <b>%</b>
                  </div>
                  <div className={styles.fineNote}>
                    基準 ¥2,000 → <b className="mono">¥{Math.round(2000 * (rate / 100)).toLocaleString()}</b>（{rate}%）。
                    <b>別料金表は作らず</b>、この倍率だけを調整。全クラス/車種の基準価格に自動で掛かります。
                  </div>
                </div>
                <div className={styles.amFld}>
                  <label>事前予約リードタイム</label>
                  <select>
                    <option>前日15:00まで（当日予約不可）</option>
                    <option>前々日まで</option>
                    <option>3日前まで</option>
                  </select>
                  <div className={styles.fineNote}>海外の方は当日予約を不可にし、書類確認の時間を確保。</div>
                </div>
              </div>

              <div className={styles.cols2} style={{ marginTop: 6 }}>
                <div className={styles.amFld}>
                  <label>デポジット（保証金）</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <input type="number" defaultValue={20000} style={{ maxWidth: 120 }} />
                    <b>円</b>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12.5, marginLeft: 4 }}>
                      <Toggle on={depositReq} onClick={() => setDepositReq((v) => !v)} /> 必須
                    </label>
                    <span style={{ fontSize: 12.5, color: 'var(--t3)' }}>・返却の</span>
                    <input type="number" defaultValue={60} style={{ maxWidth: 64 }} />
                    <b style={{ fontSize: 12.5 }}>日後に自動返金</b>
                  </div>
                  <div className={styles.fineNote}>
                    💳 <b>決済は1回</b>（レンタル料＋補償＋デポジットを合算）。<b>返却の約60日後にデポジット分だけ自動で部分返金</b>（Pay.jpは180日以内なら部分返金可）。損害・違反金があれば差し引いて返金。
                  </div>
                </div>
                <div className={styles.amFld}>
                  <label>その他の必須化</label>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, padding: '4px 0' }}>
                    <Toggle on={insReq} onClick={() => setInsReq((v) => !v)} /> 補償（車両/盗難）を加入必須
                  </label>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, padding: '4px 0' }}>
                    <Toggle on={cancelStrict} onClick={() => setCancelStrict((v) => !v)} /> キャンセル規定を厳格化
                  </label>
                </div>
              </div>

              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>
                  貸出できる国・免許ルート（<span style={{ color: 'var(--brand)' }}>許可制</span>）
                </div>
                <p className={styles.fineNote} style={{ margin: '4px 0 8px' }}>
                  下記の国/ルートのみ貸出可。<b>リストに無い国は自動で貸出不可</b>（中国本土・ベトナム・タイ 等、条約非加盟＆翻訳文対象外は全て不可）。
                </p>
                <div style={{ display: 'flex', gap: '8px 14px', flexWrap: 'wrap', fontSize: 12.5 }}>
                  {COUNTRIES.map((c) => (
                    <label key={c} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="checkbox" defaultChecked style={{ accentColor: 'var(--brand)' }} />
                      {c}
                    </label>
                  ))}
                </div>
                <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} style={{ marginTop: 10 }} onClick={() => setEditListOpen(true)}>
                  許可リストを編集
                </button>
              </div>

              <p className={styles.fineNote} style={{ marginTop: 10 }}>
                ※ 許可国以外は登録可・予約不可（目視フローでも確認）。言語は登録時の居住国に基づき固定表示。
              </p>
              <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} style={{ marginTop: 6 }} disabled title="デポジット管理は「売上・分析」で実装予定">
                💰 デポジット預かりリスト（売上・分析で実装予定）
              </button>
            </div>
          )}
        </div>
      </AdminV2Shell>

      <AdminModal open={editListOpen} title="貸出許可リストを編集" onClose={() => setEditListOpen(false)}>
        <div className={styles.amNote}>チェックした国・ルートのみ貸出可。リストに無い国は自動で貸出不可になります。</div>
        {COUNTRIES.map((c) => (
          <label key={c} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--brand)' }} /> {c}
          </label>
        ))}
        <div className={styles.amRow} style={{ marginTop: 14 }}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setEditListOpen(false)}>
            キャンセル
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setEditListOpen(false)}>
            保存
          </button>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminPricing;
