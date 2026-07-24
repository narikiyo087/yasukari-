import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';
import { memberAt } from '../../../lib/adminMemberData';

/** 会員詳細（実装 / ダミー）。参照: admin-proto-v2.html #member */

type CrmType = '対応メモ' | '電話メモ' | 'メール送信' | 'メール受信';
type CrmItem = { type: CrmType; date: string; body: string };
const CRM_BADGE: Record<CrmType, string> = {
  メール送信: styles.bInfo,
  メール受信: styles.bOk,
  電話メモ: styles.bWarn,
  対応メモ: styles.bMute,
};

const INITIAL_CRM: CrmItem[] = [
  { type: 'メール送信', date: '2026/07/14 10:02', body: '予約確定メールを送信（YK-…0031 / PCX）。契約書PDFを添付。' },
  { type: 'メール受信', date: '2026/07/14 08:30', body: '「返却時間を過ぎそう」との問い合わせ。→ マイページから延長可能を案内。' },
  { type: '電話メモ', date: '2026/07/13 19:40', body: '延長希望の電話。延長手順を口頭案内。担当：三ノ輪 佐々木。' },
  { type: '対応メモ', date: '2026/07/10 15:20', body: '初回利用。装備レンタル（ヘルメット無料）を案内済み。丁寧な対応希望。' },
];

const HISTORY = [
  { period: '7/20〜7/21', vehicle: 'PCX / 三ノ輪', badge: styles.bOk, label: '貸出中' },
  { period: '6/12', vehicle: 'タクト / 三ノ輪', badge: styles.bMute, label: '返却済' },
  { period: '5/01〜5/03', vehicle: 'クロスカブ / 足立', badge: styles.bMute, label: '返却済' },
];

const pad = (n: number) => (n < 10 ? '0' + n : '' + n);

const AdminMemberDetail: NextPage = () => {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : 'YK-10231';
  const idx = Number(id.replace(/[^0-9]/g, '')) - 10001;
  const m = Number.isFinite(idx) && idx >= 0 ? memberAt(idx) : memberAt(230);

  const [crm, setCrm] = useState<CrmItem[]>(INITIAL_CRM);
  const [crmType, setCrmType] = useState<CrmType>('対応メモ');
  const [crmText, setCrmText] = useState('');
  const [modal, setModal] = useState<null | 'mail' | 'blacklist' | 'delete'>(null);

  const addCrm = () => {
    const t = crmText.trim();
    if (!t) return;
    const d = new Date();
    const date = `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setCrm((prev) => [{ type: crmType, date, body: t }, ...prev]);
    setCrmText('');
  };

  return (
    <>
      <Head>
        <title>会員詳細 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="members" title="会員詳細">
        <div className={styles.screen}>
          <p className={styles.crumb}>
            <Link href="/admin/members">会員管理</Link> / 詳細
          </p>
          <div className={styles.pgh}>
            <h1>
              {m.name}（{m.id}）
            </h1>
            <span className={`${styles.badge} ${m.status === '本登録' ? styles.bOk : styles.bMute}`} style={{ fontSize: 13 }}>
              {m.status}
            </span>
            <span className={`${styles.badge} ${styles.bOk}`} style={{ fontSize: 13 }}>
              {m.rank}
            </span>
          </div>

          <div className={styles.detailCols}>
            <div>
              <div className={styles.card} style={{ marginBottom: 18 }}>
                <h3>基本情報</h3>
                <dl className={styles.kv}>
                  <dt>会員ID</dt>
                  <dd className="mono">{m.id}</dd>
                  <dt>氏名 / フリガナ</dt>
                  <dd>
                    {m.name} / {m.kana}
                  </dd>
                  <dt>メール</dt>
                  <dd>（マスク表示）</dd>
                  <dt>電話</dt>
                  <dd>（マスク表示）</dd>
                  <dt>住所</dt>
                  <dd>（マスク表示）</dd>
                  <dt>登録日</dt>
                  <dd className="mono">{m.reg}</dd>
                  <dt>会員ランク</dt>
                  <dd>{m.rank}</dd>
                  <dt>メルマガ</dt>
                  <dd>
                    <span className={`${styles.badge} ${m.mag === '停止' ? styles.bMute : styles.bOk}`}>{m.mag === '停止' ? '停止' : '受信OK'}</span>
                  </dd>
                </dl>
              </div>

              <div className={styles.card} style={{ marginBottom: 18 }}>
                <h3>免許・書類</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  {['免許証（表）', '免許証（裏）'].map((l) => (
                    <div
                      key={l}
                      style={{
                        height: 104,
                        borderRadius: 8,
                        background: 'repeating-linear-gradient(135deg,#e2e8f0,#e2e8f0 10px,#eef2f7 10px,#eef2f7 20px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <dl className={styles.kv}>
                  <dt>免許確認</dt>
                  <dd>
                    <span className={`${styles.badge} ${m.licState === '確認済' ? styles.bOk : m.licState === '未確認' ? styles.bWarn : styles.bBad}`}>
                      {m.licState === '確認済' ? '確認済（表裏）' : m.licState}
                    </span>
                  </dd>
                  <dt>免許番号</dt>
                  <dd className="mono">（マスク）・貸渡簿に記録</dd>
                  <dt>貸渡約款</dt>
                  <dd>
                    <span className={`${styles.badge} ${styles.bOk}`}>同意済</span>
                  </dd>
                </dl>
              </div>

              <div className={styles.card} style={{ marginBottom: 18 }}>
                <h3>予約履歴</h3>
                {HISTORY.map((h) => (
                  <div className={styles.prRow} key={h.period} style={{ padding: '11px 0' }}>
                    <span className={styles.tm}>{h.period}</span>
                    <div className={styles.m}>{h.vehicle}</div>
                    <span className={`${styles.badge} ${h.badge}`}>{h.label}</span>
                  </div>
                ))}
                <p className={styles.fineNote}>※ 予約確定時に顧客情報から貸渡契約書を自動発行。各予約にPDFが紐づきます。</p>
              </div>

              <div className={styles.card}>
                <h3>対応履歴（CRM：メール・電話・メモ）</h3>
                <div className={styles.crmForm}>
                  <select value={crmType} onChange={(e) => setCrmType(e.target.value as CrmType)}>
                    <option>対応メモ</option>
                    <option>電話メモ</option>
                    <option>メール送信</option>
                    <option>メール受信</option>
                  </select>
                  <input
                    placeholder="内容を入力（日時は自動で記録）"
                    value={crmText}
                    onChange={(e) => setCrmText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCrm()}
                  />
                  <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} onClick={addCrm}>
                    ＋ 記録を追加
                  </button>
                </div>
                <div>
                  {crm.map((c, i) => (
                    <div className={styles.crmItem} key={i}>
                      <div className={styles.crmH}>
                        <span className={`${styles.badge} ${CRM_BADGE[c.type]}`}>{c.type}</span>
                        <span className={styles.crmD}>{c.date}</span>
                      </div>
                      <div className={styles.crmB}>{c.body}</div>
                    </div>
                  ))}
                </div>
                <p className={styles.fineNote}>※ この顧客と送受信したメールを自動で集約し、電話・対応メモと同じ時系列で保管（簡易CRM）。</p>
              </div>
            </div>

            <div>
              <div className={styles.card} style={{ marginBottom: 18 }}>
                <h3>お気に入り</h3>
                <div className={styles.prRow} style={{ padding: '9px 0' }}>
                  <div className={styles.m}>PCX</div>
                  <span className={styles.tm}>7/14</span>
                </div>
                <div className={styles.prRow} style={{ padding: '9px 0' }}>
                  <div className={styles.m}>レブル250</div>
                  <span className={styles.tm}>7/02</span>
                </div>
              </div>
              <div className={styles.card} style={{ marginBottom: 18 }}>
                <h3>空き通知</h3>
                <div className={styles.prRow} style={{ padding: '9px 0' }}>
                  <div className={styles.m}>CB400（足立）</div>
                  <span className={`${styles.badge} ${styles.bWarn}`}>ON</span>
                </div>
              </div>
              <div className={styles.card}>
                <h3>操作</h3>
                <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm} ${styles.fullBtn}`} style={{ marginBottom: 10 }} onClick={() => setModal('mail')}>
                  個別メールを作成
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm} ${styles.fullBtn}`}
                  style={{ marginBottom: 10, color: '#0f172a', borderColor: '#0f172a' }}
                  onClick={() => setModal('blacklist')}
                >
                  ブラックリスト登録
                </button>
                <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm} ${styles.fullBtn}`} style={{ color: 'var(--brand)' }} onClick={() => setModal('delete')}>
                  アカウント削除（退会処理）
                </button>
                <p className={styles.fineNote}>対応メモ・電話メモは左の「対応履歴（CRM）」に記録してください。</p>
              </div>
            </div>
          </div>
        </div>
      </AdminV2Shell>

      <AdminModal open={modal === 'mail'} title="個別メールを作成" onClose={() => setModal(null)}>
        <div className={styles.amFld}>
          <label>宛先</label>
          <input readOnly value={`${m.name}（${m.id}・マスク）`} />
        </div>
        <div className={styles.amFld}>
          <label>件名</label>
          <input />
        </div>
        <div className={styles.amFld}>
          <label>本文</label>
          <textarea rows={4} />
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal(null)}>
            キャンセル
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(null)}>
            送信
          </button>
        </div>
      </AdminModal>

      <AdminModal open={modal === 'blacklist'} title="ブラックリスト登録" onClose={() => setModal(null)}>
        <div className={styles.amBox}>
          登録すると、この会員の<b>新規予約・受取を自動でお断り</b>します（既存予約も停止）。規約の<b>貸渡注意者リスト</b>に基づく措置です。
        </div>
        <div className={styles.amFld}>
          <label>理由</label>
          <select>
            <option>駐車違反金の未払い</option>
            <option>無断遅滞・返却遅延</option>
            <option>約款違反</option>
            <option>反社会的勢力の疑い</option>
            <option>その他</option>
          </select>
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
            登録する
          </button>
        </div>
      </AdminModal>

      <AdminModal open={modal === 'delete'} title="アカウント削除（退会処理）" onClose={() => setModal(null)}>
        <div className={styles.amBox} style={{ background: 'color-mix(in srgb, var(--info) 8%, var(--card))', borderColor: 'color-mix(in srgb, var(--info) 25%, var(--card))', color: '#1e40af' }}>
          DBのレコードは<b>物理削除しません</b>（誤操作による他顧客データ消失を防止）。<b>論理削除（退会処理）</b>として次を実行します。
        </div>
        <ul style={{ fontSize: 13, lineHeight: 1.9, paddingLeft: 20, margin: '0 0 12px', color: 'var(--t2)' }}>
          <li>会員ステータスを<b>「退会済」</b>に変更（管理画面上は削除扱い）</li>
          <li><b>メルマガ配信先から除外</b>（オプトアウト）</li>
          <li><b>メールアドレスを登録解除</b>し、次回から<b>同じメールで新規登録（仮登録）が可能</b>に</li>
          <li>個人情報は<b>マスキング／最小化</b>（貸渡簿など法令保持義務のあるデータは保持）</li>
        </ul>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal(null)}>
            キャンセル
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(null)}>
            退会処理を実行
          </button>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminMemberDetail;
