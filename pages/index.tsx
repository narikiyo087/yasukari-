import Head from 'next/head';
import Link from 'next/link';

/**
 * ルート（localhost:3000）= 全画面ハブ（開発用ナビ）
 * ここから顧客・管理の各画面へすぐ飛べる。実装が進むにつれ、
 * 「プロト参照」のリンクを実ページに置き換えていく。
 */

type L = { label: string; href: string; ext?: boolean; note?: string };

const ADMIN: L[] = [
  { label: '管理ダッシュボード', href: '/admin', note: '新・実装済み' },
  { label: '予約管理', href: '/admin/reservations', note: '新・実装済み' },
  { label: '承認待ち', href: '/admin/approvals', note: '新・実装済み' },
  { label: '免許確認', href: '/admin/license', note: '新・実装済み' },
  { label: 'KEYBOX', href: '/admin/keybox', note: '新・実装済み' },
  { label: 'バイクスケジュール', href: '/admin/schedule', note: '新・実装済み' },
  { label: '整備アラート', href: '/admin/maint', note: '新・実装済み' },
  { label: '会員管理', href: '/admin/members', note: '新・実装済み' },
  { label: '料金設計', href: '/admin/pricing', note: '新・実装済み' },
];

const CUSTOMER: L[] = [
  { label: 'トップLP（現行）', href: '/lp' },
  { label: '車種一覧', href: '/products' },
  { label: '料金', href: '/pricing' },
  { label: '店舗', href: '/stores' },
  { label: 'はじめてガイド', href: '/beginner' },
  { label: 'ご利用ガイド', href: '/guide' },
  { label: 'お知らせ', href: '/news' },
  { label: '会社概要', href: '/company' },
  { label: 'ヘルプ', href: '/help' },
  { label: 'お問い合わせ', href: '/contact' },
  { label: 'ログイン', href: '/login' },
  { label: '新規登録', href: '/signup' },
];

const PROTO: L[] = [
  { label: 'モック一覧', href: '/mock/index.html', ext: true },
  { label: 'トップLP v4', href: '/mock/top-lp-v4.html', ext: true },
  { label: '車種一覧', href: '/mock/bikes-list.html', ext: true },
  { label: 'レンタル詳細', href: '/mock/rental-detail.html', ext: true },
  { label: '予約フロー', href: '/mock/reserve-flow.html', ext: true },
  { label: 'マイページ', href: '/mock/mypage.html', ext: true },
  { label: '管理プロト', href: '/mock/admin-proto-v2.html', ext: true },
];

function Card({ item }: { item: L }) {
  const cls =
    'block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:shadow-sm';
  const body = (
    <>
      {item.label}
      {item.note && <span className="ml-2 text-xs font-normal text-red-600">{item.note}</span>}
    </>
  );
  return item.ext ? (
    <a href={item.href} className={cls} target="_blank" rel="noreferrer">
      {body}
    </a>
  ) : (
    <Link href={item.href} className={cls}>
      {body}
    </Link>
  );
}

function Section({ title, items, desc }: { title: string; items: L[]; desc?: string }) {
  return (
    <section className="mb-8">
      <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-red-600">{title}</h2>
      {desc && <p className="mb-3 text-xs text-slate-500">{desc}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((i) => (
          <Card key={i.label + i.href} item={i} />
        ))}
      </div>
    </section>
  );
}

export default function ScreenHub() {
  return (
    <>
      <Head>
        <title>画面一覧 | ヤスカリ（開発ハブ）</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">ヤスカリ 画面一覧</h1>
        <p className="mb-8 text-sm text-slate-500">
          開発用のハブです。ここから各画面へ移動できます。実装が進むにつれ「プロト参照」を実ページへ置き換えます。
        </p>
        <Section title="管理画面" items={ADMIN} desc="ログインが必要です（初期値 yasukari / yasukari2022）。" />
        <Section title="顧客画面（現行の実装）" items={CUSTOMER} />
        <Section title="プロト参照（実装待ち・HTMLモック）" items={PROTO} desc="別タブで開きます。順次、実ページに置き換えます。" />
      </div>
    </>
  );
}
