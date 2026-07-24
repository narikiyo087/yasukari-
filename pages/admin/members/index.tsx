import { useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import AdminModal from '../../../components/admin/AdminModal';
import styles from '../../../styles/AdminV2.module.css';
import { genMembers, MEMBER_PER_PAGE, type MemberRow, type MemberStatus } from '../../../lib/adminMemberData';

/**
 * 会員一覧（実装 / ダミーデータ）— 検索・絞り込み・ページング。
 * 参照: admin-proto-v2.html #members。詳細な住所/生年月日/免許番号は会員詳細で。
 */

const STATUS_BADGE: Record<MemberStatus, string> = {
  本登録: styles.bOk,
  仮登録: styles.bInfo,
  退会済: styles.bMute,
  ブラックリスト: styles.bBad,
};

const AdminMembers: NextPage = () => {
  const router = useRouter();
  const all = useMemo(() => genMembers(), []);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('全状態');
  const [lic, setLic] = useState('免許：全て');
  const [rank, setRank] = useState('ランク：全て');
  const [country, setCountry] = useState('居住国：全て');
  const [mag, setMag] = useState('メルマガ：全て');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((m) => {
      if (q && !`${m.name} ${m.kana} ${m.id}`.toLowerCase().includes(q)) return false;
      if (status !== '全状態' && m.status !== status) return false;
      if (lic !== '免許：全て' && m.licState !== lic) return false;
      if (rank !== 'ランク：全て' && m.rank !== rank) return false;
      if (country === '日本' && m.country !== '日本') return false;
      if (country === '日本以外のみ' && m.country === '日本') return false;
      if (['台湾', 'アメリカ', 'ドイツ', '韓国', 'ベトナム'].includes(country) && m.country !== country) return false;
      if (mag !== 'メルマガ：全て' && m.mag !== mag) return false;
      return true;
    });
  }, [all, query, status, lic, rank, country, mag]);

  const pages = Math.max(1, Math.ceil(filtered.length / MEMBER_PER_PAGE));
  const cur = Math.min(page, pages);
  const start = (cur - 1) * MEMBER_PER_PAGE;
  const rows = filtered.slice(start, start + MEMBER_PER_PAGE);

  // フィルタ変更時は1ページ目へ
  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const [csvOpen, setCsvOpen] = useState(false);

  const renderLic = (m: MemberRow) =>
    m.licState === '確認済' ? (
      <span>{m.licType}</span>
    ) : (
      <span className={`${styles.badge} ${m.licState === '未確認' ? styles.bWarn : styles.bBad}`}>{m.licState}</span>
    );

  const renderUse = (m: MemberRow) =>
    m.use === 'レンタル中' ? (
      <span className={`${styles.badge} ${styles.bOk}`}>レンタル中</span>
    ) : m.use === '予約あり' ? (
      <span className={`${styles.badge} ${styles.bInfo}`}>予約あり</span>
    ) : (
      <span style={{ color: 'var(--t3)' }}>—</span>
    );

  return (
    <>
      <Head>
        <title>会員管理 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="members" title="会員管理">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>会員一覧</h1>
            <span className={styles.sub}>該当: {filtered.length.toLocaleString()} 件（全 1,290 / 本登録 715 / 仮登録 575）</span>
            <div className={styles.act}>
              <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setCsvOpen(true)}>
                全会員CSVをダウンロード
              </button>
            </div>
          </div>

          <div className={styles.infoBar}>
            表示項目：会員（名前・カナ・ID）／連絡先／状態／免許確認／居住国／ランク／現在の利用／メルマガ／登録日／最終更新。詳細な住所・生年月日・免許番号は行クリックの会員詳細で。
          </div>

          <div className={styles.toolbar}>
            <input className="grow" placeholder="🔍 氏名・カナ・メール・電話・会員IDで検索" value={query} onChange={(e) => resetPage(setQuery)(e.target.value)} />
            <select value={status} onChange={(e) => resetPage(setStatus)(e.target.value)}>
              {['全状態', '本登録', '仮登録', '退会済', 'ブラックリスト'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <select value={lic} onChange={(e) => resetPage(setLic)(e.target.value)}>
              {['免許：全て', '確認済', '未確認', '再提出待ち'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <select value={rank} onChange={(e) => resetPage(setRank)(e.target.value)}>
              {['ランク：全て', '新規', 'リピーター', '常連/VIP', '休眠'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <select value={country} onChange={(e) => resetPage(setCountry)(e.target.value)}>
              {['居住国：全て', '日本', '日本以外のみ', '台湾', 'アメリカ', 'ドイツ', '韓国', 'ベトナム'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <select value={mag} onChange={(e) => resetPage(setMag)(e.target.value)}>
              {['メルマガ：全て', '受信', '停止'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>

          <div className={styles.tblWrap}>
            <table className={styles.tbl} style={{ minWidth: 960 }}>
              <thead>
                <tr>
                  <th>会員</th>
                  <th>連絡先</th>
                  <th>状態</th>
                  <th>免許</th>
                  <th>居住国</th>
                  <th>ランク</th>
                  <th>現在の利用</th>
                  <th>メルマガ</th>
                  <th>登録日</th>
                  <th>最終更新</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id} className="clickable" onClick={() => router.push(`/admin/members/${m.id}`)}>
                    <td>
                      <div className={styles.cellMain}>{m.name}</div>
                      <div className={styles.cellSub}>
                        {m.kana} ・ {m.id}
                      </div>
                    </td>
                    <td>
                      <div className="mono" style={{ fontSize: 12 }}>
                        （メール マスク）
                      </div>
                      <div className={styles.cellSub}>（電話 マスク）</div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${STATUS_BADGE[m.status]}`}>{m.status}</span>
                    </td>
                    <td>{renderLic(m)}</td>
                    <td>{m.country === '日本' ? <span>日本</span> : <span className={`${styles.badge} ${styles.bInfo}`}>{m.country}</span>}</td>
                    <td>{m.rank}</td>
                    <td>{renderUse(m)}</td>
                    <td>
                      <span className={`${styles.badge} ${m.mag === '停止' ? styles.bMute : styles.bOk}`}>{m.mag}</span>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {m.reg}
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {m.upd}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: 'var(--t3)', padding: 28 }}>
                      条件に一致する会員はいません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.pager}>
            <span>
              {filtered.length === 0 ? 0 : start + 1}-{Math.min(start + MEMBER_PER_PAGE, filtered.length)}件 / 全 {filtered.length.toLocaleString()}件
            </span>
            <div className={styles.pagerNav}>
              <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} disabled={cur <= 1} onClick={() => setPage(cur - 1)}>
                前へ
              </button>
              <span>
                {cur} / {pages}
              </span>
              <button type="button" className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} disabled={cur >= pages} onClick={() => setPage(cur + 1)}>
                次へ
              </button>
            </div>
          </div>
        </div>
      </AdminV2Shell>

      <AdminModal open={csvOpen} title="CSVを生成しました" onClose={() => setCsvOpen(false)}>
        <div className={styles.amBox} style={{ textAlign: 'center' }}>📄 members_export.csv（{filtered.length.toLocaleString()}件）</div>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.fullBtn}`} onClick={() => setCsvOpen(false)}>
          ダウンロード
        </button>
      </AdminModal>
    </>
  );
};

export default AdminMembers;
