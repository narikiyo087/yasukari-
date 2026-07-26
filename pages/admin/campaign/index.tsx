import { useMemo, useState } from 'react';
import Head from 'next/head';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';

/** メール配信 / キャンペーン（実装 / ダミー）。参照: admin-proto-v2.html #campaign */

const TEMPLATES = [
  { icon: '🏍', title: '新しい車両を追加しました', desc: '新入荷の車種を案内' },
  { icon: '🎫', title: 'クーポン配信', desc: '初回/紹介/雨の日 等を案内' },
  { icon: '📢', title: 'お知らせ / 休業案内', desc: '営業・繁忙期料金など' },
];

const HISTORY = [
  { subject: '新車 レブル250 入荷', cat: '新車入荷', catBadge: styles.bInfo, date: '7/12', target: '250cc関心層', sent: '312', open: '42%', status: '送信済', statusBadge: styles.bOk },
  { subject: '初回500円引クーポン', cat: 'キャンペーン', catBadge: styles.bBad, date: '7/05', target: '初回未利用', sent: '480', open: '38%', status: '送信済', statusBadge: styles.bOk },
  { subject: 'お盆休業・繁忙期料金', cat: 'お知らせ', catBadge: styles.bMute, date: '—', target: '全会員 1,290', sent: '—', open: '—', status: '予約 8/1', statusBadge: styles.bInfo },
];

const SEGMENTS = [
  { label: '全会員', n: 1290 },
  { label: '本登録のみ', n: 715 },
  { label: '仮登録のみ', n: 575 },
  { label: '初回未利用', n: 480 },
  { label: '特定クラス利用者（例：250cc）', n: 360 },
  { label: '店舗別（足立）', n: 640 },
  { label: '店舗別（三ノ輪）', n: 650 },
  { label: '外国籍の会員', n: 120 },
  { label: 'リピーター / 休眠', n: 230 },
];

const AdminCampaign: NextPage = () => {
  const [checked, setChecked] = useState<Set<number>>(new Set([3])); // 初回未利用
  const [mode, setMode] = useState<'or' | 'and'>('or');
  const [createOpen, setCreateOpen] = useState(false);

  const total = useMemo(() => {
    const picked = SEGMENTS.filter((_, i) => checked.has(i)).map((s) => s.n);
    if (picked.length === 0) return 0;
    return mode === 'or' ? Math.min(1290, picked.reduce((a, b) => a + b, 0)) : Math.min(...picked);
  }, [checked, mode]);

  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <>
      <Head>
        <title>メール配信 / キャンペーン | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="campaign" title="メール配信 / キャンペーン">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>メール配信 / キャンペーン</h1>
            <span className={styles.sub}>セグメントを指定して一斉配信</span>
            <div className={styles.act}>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setCreateOpen(true)}>
                ＋ 新規配信を作成
              </button>
            </div>
          </div>

          <div className={styles.detailCols}>
            <div>
              <div className={styles.card} style={{ marginBottom: 18 }}>
                <h3>クイックテンプレート</h3>
                {TEMPLATES.map((t) => (
                  <div className={styles.prRow} key={t.title} style={{ padding: '12px 0' }}>
                    <div className={styles.m}>
                      <b>
                        {t.icon} {t.title}
                      </b>
                      <div className={styles.cellSub}>{t.desc}</div>
                    </div>
                    <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={() => setCreateOpen(true)}>
                      作成
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.panel}>
                <div className={styles.ph}>
                  <h2>配信履歴</h2>
                </div>
                <div className={styles.tblWrap} style={{ border: 0 }}>
                  <table className={styles.tbl} style={{ minWidth: 600 }}>
                    <thead>
                      <tr>
                        <th>件名</th>
                        <th>カテゴリ</th>
                        <th>配信日</th>
                        <th>対象</th>
                        <th>送信</th>
                        <th>開封率</th>
                        <th>状態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {HISTORY.map((h) => (
                        <tr key={h.subject}>
                          <td className="strong">{h.subject}</td>
                          <td>
                            <span className={`${styles.badge} ${h.catBadge}`}>{h.cat}</span>
                          </td>
                          <td className="mono">{h.date}</td>
                          <td>{h.target}</td>
                          <td className="mono">{h.sent}</td>
                          <td className="mono">{h.open}</td>
                          <td>
                            <span className={`${styles.badge} ${h.statusBadge}`}>{h.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <div className={styles.card}>
                <h3>配信対象セグメント</h3>
                <div className={styles.fineNote} style={{ marginTop: 0, marginBottom: 12 }}>
                  複数選択できます（組み合わせて絞り込み）
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {SEGMENTS.map((s, i) => (
                    <label key={s.label} className={`${styles.segchk} ${checked.has(i) ? styles.segchkOn : ''}`}>
                      <input type="checkbox" checked={checked.has(i)} onChange={() => toggle(i)} />
                      <span>{s.label}</span>
                      <span className="cnt">{s.n.toLocaleString()}</span>
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 12, fontSize: 12.5, fontWeight: 700, color: 'var(--t3)' }}>
                  絞り込み
                  <label style={{ display: 'flex', gap: 5, alignItems: 'center', fontWeight: 600, color: 'var(--ink)' }}>
                    <input type="radio" name="segmode" checked={mode === 'or'} onChange={() => setMode('or')} style={{ accentColor: 'var(--brand)' }} />
                    いずれか（OR）
                  </label>
                  <label style={{ display: 'flex', gap: 5, alignItems: 'center', fontWeight: 600, color: 'var(--ink)' }}>
                    <input type="radio" name="segmode" checked={mode === 'and'} onChange={() => setMode('and')} style={{ accentColor: 'var(--brand)' }} />
                    すべて（AND）
                  </label>
                </div>
                <div className={styles.segTotal}>
                  選択中の推定対象：<b className="mono">{total.toLocaleString()}</b> 名
                </div>
                <p className={styles.fineNote}>※ メルマガ受信に同意した会員のみに配信（オプトイン）。配信解除リンクを自動付与。</p>
              </div>
            </div>
          </div>
        </div>
      </AdminV2Shell>

      <AdminModal open={createOpen} title="メール配信を作成" onClose={() => setCreateOpen(false)}>
        <div className={styles.amFld}>
          <label>テンプレート</label>
          <select>
            <option>新しい車両を追加しました</option>
            <option>クーポン配信</option>
            <option>お知らせ / 休業案内</option>
            <option>空白から作成</option>
          </select>
        </div>
        <div className={styles.amFld}>
          <label>配信言語</label>
          <select>
            <option>自動翻訳（受信者の居住国/言語に合わせて配信）</option>
            <option>日本語のみ</option>
            <option>英語のみ</option>
          </select>
        </div>
        <div className={styles.amFld}>
          <label>件名</label>
          <input defaultValue="新車 レブル250 が入荷しました！" />
        </div>
        <div className={styles.amFld}>
          <label>本文</label>
          <textarea rows={3} defaultValue="この度、レブル250を新たに追加しました。ご予約はこちらから…" />
        </div>
        <div className={styles.amNote} style={{ background: 'color-mix(in srgb, var(--info) 8%, var(--card))', borderRadius: 8, padding: 10, fontSize: 12, color: '#1e40af', border: '1px solid color-mix(in srgb, var(--info) 25%, var(--card))' }}>
          送信対象：<b>{total.toLocaleString()}名</b>（メルマガ同意済のみ）／配信解除リンクを自動付与
        </div>
        <div className={styles.amRow}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setCreateOpen(false)}>
            予約送信
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setCreateOpen(false)}>
            今すぐ送信
          </button>
        </div>
      </AdminModal>
    </>
  );
};

export default AdminCampaign;
