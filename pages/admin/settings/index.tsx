import { useState } from 'react';
import Head from 'next/head';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import styles from '../../../styles/AdminV2.module.css';

/** 公開/メンテナンス（実装 / ダミー）。参照: admin-proto-v2.html #settings */

type Row = { key: string; title: string; desc?: string; on: boolean };
const INITIAL: Row[] = [
  { key: 'site', title: 'サイト公開', desc: 'OFFでメンテナンス画面を表示', on: true },
  { key: 'booking', title: '新規予約の受付', desc: '一時停止できます', on: true },
  { key: 'banner', title: '告知バーの表示', on: true },
  {
    key: 'autocancel',
    title: 'キャンセルの自動化',
    desc:
      'ON：顧客がマイページからキャンセル料を確認して自分でキャンセル（Pay.jp部分返金を自動処理・履歴とアクティビティに記録）。OFF：問い合わせ経由でスタッフが対応（今日のタスクに表示）。',
    on: false,
  },
];

const AdminSettings: NextPage = () => {
  const [rows, setRows] = useState<Row[]>(INITIAL);
  const toggle = (key: string) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, on: !r.on } : r)));

  return (
    <>
      <Head>
        <title>公開/メンテナンス | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="settings" title="公開/メンテナンス">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>公開/メンテナンス</h1>
          </div>

          <div className={styles.card} style={{ maxWidth: 620 }}>
            {rows.map((r) => (
              <div className={styles.prRow} key={r.key} style={{ padding: '14px 0', alignItems: 'flex-start' }}>
                <div className={styles.m}>
                  <b>{r.title}</b>
                  {r.desc && (
                    <div style={{ color: 'var(--t3)', fontSize: 12, marginTop: 2, lineHeight: 1.6 }}>{r.desc}</div>
                  )}
                </div>
                <button
                  type="button"
                  className={`${styles.tg} ${r.on ? styles.tgOn : ''}`}
                  aria-pressed={r.on}
                  aria-label={`${r.title}を切り替え`}
                  onClick={() => toggle(r.key)}
                />
              </div>
            ))}
          </div>

          <p className={styles.tipNote} style={{ maxWidth: 620 }}>
            💡 「サイト公開」OFF でメンテナンス画面に切り替わります（管理画面は影響なし）。予約受付の一時停止や告知バーもここから即時切替できます。
          </p>
        </div>
      </AdminV2Shell>
    </>
  );
};

export default AdminSettings;
