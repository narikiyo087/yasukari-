import { useMemo, useState } from 'react';
import Head from 'next/head';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';

/** 監査ログ（実装 / ダミー）。参照: admin-proto-v2.html #audit */

type Log = { at: string; who: string; op: string; target: string; ip: string; role: string; kind: string };
const LOGS: Log[] = [
  { at: '7/14 10:02', who: '三ノ輪 スタッフ', op: '免許確認を承認', target: '会員#10231', ip: '203.0.•.•', role: 'スタッフ', kind: '承認' },
  { at: '7/14 09:40', who: '本部管理者', op: '料金を変更（PCX 個別）', target: 'M-PCX', ip: '203.0.•.•', role: '本部管理者', kind: '料金変更' },
  { at: '7/14 09:10', who: '足立 店長', op: '店舗クーポンを作成', target: 'MINOWA24', ip: '203.0.•.•', role: '店舗オーナー', kind: '会員操作' },
  { at: '7/13 18:30', who: '本部管理者', op: 'ブラックリスト登録', target: '会員#10188', ip: '203.0.•.•', role: '本部管理者', kind: '会員操作' },
  { at: '7/13 10:01', who: 'バイト（タイミー）', op: 'KEYBOX 暗証番号を発行', target: 'YK-…0031', ip: '203.0.•.•', role: 'バイト', kind: 'KEYBOX' },
];

const AdminAudit: NextPage = () => {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('全操作者');
  const [kind, setKind] = useState('全種別');
  const [csvOpen, setCsvOpen] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LOGS.filter((l) => {
      if (q && !`${l.who} ${l.op} ${l.target}`.toLowerCase().includes(q)) return false;
      if (role !== '全操作者' && l.role !== role) return false;
      if (kind !== '全種別' && l.kind !== kind) return false;
      return true;
    });
  }, [query, role, kind]);

  return (
    <>
      <Head>
        <title>監査ログ | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="audit" title="監査ログ">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>監査ログ</h1>
            <span className={styles.sub}>誰がいつ何を操作したか</span>
            <div className={styles.act}>
              <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setCsvOpen(true)}>
                CSV出力
              </button>
            </div>
          </div>

          <div className={styles.toolbar}>
            <input className="grow" placeholder="🔍 操作者・対象で検索" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {['全操作者', '本部管理者', '店舗オーナー', 'スタッフ', 'バイト'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              {['全種別', '承認', '料金変更', '会員操作', 'KEYBOX', 'ログイン'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <input type="date" aria-label="日付" />
          </div>

          <div className={styles.tblWrap}>
            <table className={styles.tbl} style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <th>日時</th>
                  <th>操作者</th>
                  <th>操作</th>
                  <th>対象</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l, i) => (
                  <tr key={i}>
                    <td className="mono">{l.at}</td>
                    <td>{l.who}</td>
                    <td>{l.op}</td>
                    <td>{l.target}</td>
                    <td className="mono">{l.ip}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--t3)', padding: 28 }}>
                      条件に一致するログはありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className={styles.tipNote}>💡 バイト/タイミー運用の統制に。金額・個人情報・マスタ操作は特に記録。</p>
        </div>
      </AdminV2Shell>

      <AdminModal open={csvOpen} title="CSVを生成しました" onClose={() => setCsvOpen(false)}>
        <div className={styles.amBox} style={{ textAlign: 'center' }}>📄 audit_log.csv</div>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.fullBtn}`} onClick={() => setCsvOpen(false)}>
          ダウンロード
        </button>
      </AdminModal>
    </>
  );
};

export default AdminAudit;
