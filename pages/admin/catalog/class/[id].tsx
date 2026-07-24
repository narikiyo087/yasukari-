import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AdminV2Shell from '../../../../components/admin/AdminV2Shell';
import styles from '../../../../styles/AdminV2.module.css';

/** クラス詳細（実装 / ダミー）。参照: admin-proto-v2.html #classdetail */

const CLASS_INFO: Record<string, { name: string; cc: string; lic: string; base: string }> = {
  'C-50S': { name: '50ccスクーター', cc: '〜50cc', lic: '原付 以上', base: '¥2,000/日〜' },
  'C-125S': { name: '125ccスクーター', cc: '51〜125cc', lic: '小型限定 普通二輪 以上', base: '¥2,500/日〜' },
  'C-MT2': { name: '原付二種MT', cc: '51〜125cc', lic: '小型限定 普通二輪 以上', base: '¥2,800/日〜' },
  'C-250': { name: '126–250cc', cc: '126〜250cc', lic: '普通二輪 以上', base: '¥4,000/日〜' },
  'C-400': { name: '251–400cc', cc: '251〜400cc', lic: '普通二輪 以上', base: '¥5,000/日〜' },
  'C-GY': { name: 'ジャイロ（3輪）', cc: '〜50cc', lic: '原付 以上', base: '¥3,000/日〜' },
};
const MODELS = [
  { name: 'PCX', pricing: 'individual' as const },
  { name: 'アドレス125', pricing: 'inherit' as const },
  { name: 'リード125', pricing: 'inherit' as const },
];

const AdminClassDetail: NextPage = () => {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : 'C-125S';
  const info = CLASS_INFO[id] ?? CLASS_INFO['C-125S'];

  return (
    <>
      <Head>
        <title>クラス詳細 | ヤスカリ管理</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminV2Shell active="catalog" title="クラス詳細">
        <div className={styles.screen}>
          <p className={styles.crumb}>
            <Link href="/admin/catalog?tab=class">車両登録・編集</Link> / クラス詳細
          </p>
          <div className={styles.pgh}>
            <h1>クラス詳細：{info.name}</h1>
            <span className={styles.sub}>クラスID {id}</span>
          </div>

          <div className={styles.cols2}>
            <div className={styles.card}>
              <h3>クラス情報</h3>
              <dl className={styles.kv}>
                <dt>クラスID</dt>
                <dd className="mono">{id}</dd>
                <dt>クラス名</dt>
                <dd>{info.name}</dd>
                <dt>排気量帯</dt>
                <dd>{info.cc}</dd>
                <dt>必要免許</dt>
                <dd>{info.lic}</dd>
                <dt>基準料金</dt>
                <dd className="mono">{info.base}</dd>
              </dl>
              <Link href={`/admin/pricing/class/${id}`} className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} style={{ marginTop: 12 }}>
                クラス料金を設計
              </Link>
            </div>
            <div className={styles.card}>
              <h3>このクラスの車種（{MODELS.length}）</h3>
              {MODELS.map((mm) => (
                <div className={styles.prRow} key={mm.name} style={{ padding: '9px 0' }}>
                  <div className={styles.m}>{mm.name}</div>
                  <span className={`${styles.badge} ${mm.pricing === 'individual' ? styles.bInfo : styles.bMute}`}>
                    {mm.pricing === 'individual' ? '個別料金' : 'クラス継承'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminV2Shell>
    </>
  );
};

export default AdminClassDetail;
