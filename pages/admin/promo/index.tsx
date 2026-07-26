import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../components/admin/AdminV2Shell';
import styles from '../../../styles/AdminV2.module.css';

/** お知らせ / ブログ 一覧（実装 / ダミー）。参照: admin-proto-v2.html #promo */

type Post = { id: string; kind: 'お知らせ' | 'ブログ'; title: string; date: string; status: '公開' | '下書き' };
const POSTS: Post[] = [
  { id: 'p-001', kind: 'お知らせ', title: '三ノ輪店 24時間セルフ受取に対応', date: '7/10', status: '公開' },
  { id: 'p-002', kind: 'ブログ', title: '初心者におすすめの125cc', date: '6/28', status: '公開' },
  { id: 'p-003', kind: 'お知らせ', title: 'お盆期間の営業について', date: '—', status: '下書き' },
];

const AdminPromo: NextPage = () => {
  const router = useRouter();
  return (
    <>
      <Head>
        <title>お知らせ / ブログ | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="promo" title="お知らせ / ブログ">
        <div className={styles.screen}>
          <div className={styles.pgh}>
            <h1>お知らせ / ブログ</h1>
            <div className={styles.act}>
              <Link href="/admin/promo/new" className={`${styles.btn} ${styles.btnPrimary}`}>
                ＋ 新規投稿
              </Link>
            </div>
          </div>

          <div className={styles.tblWrap}>
            <table className={styles.tbl}>
              <thead>
                <tr>
                  <th>種別</th>
                  <th>タイトル</th>
                  <th>公開日</th>
                  <th>状態</th>
                  <th aria-label="操作" />
                </tr>
              </thead>
              <tbody>
                {POSTS.map((p) => (
                  <tr key={p.id} className="clickable" onClick={() => router.push(`/admin/promo/${p.id}`)}>
                    <td>{p.kind}</td>
                    <td className="strong">{p.title}</td>
                    <td className="mono">{p.date}</td>
                    <td>
                      <span className={`${styles.badge} ${p.status === '公開' ? styles.bOk : styles.bMute}`}>{p.status}</span>
                    </td>
                    <td className={styles.tblActions}>
                      <Link href={`/admin/promo/${p.id}`} className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={(e) => e.stopPropagation()}>
                        編集
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AdminV2Shell>
    </>
  );
};

export default AdminPromo;
