import Head from 'next/head'
import Link from 'next/link'

export default function NewsPage() {
  const posts = [
    {
      title: '三ノ輪店｜24時間レンタルの流れと注意事項',
      date: '2026-04-28',
      excerpt:
        '三ノ輪店（無人店舗）をご利用いただくお客様向けに、予約から返却までの手順と注意事項をまとめました。',
      href: '/news/minowa-24hour-rental',
    },
    {
      title: 'サイトリニューアルのお知らせ',
      date: '2025-08-01',
      excerpt:
        '8月1日に公式サイトをリニューアルしました。旧サイトから順次こちらへ移行してまいります。',
      href: '/news/site-renewal',
    },
    {
      title: 'お盆休業および繁忙期料金のお知らせ',
      date: '2025-07-20',
      excerpt:
        '8/11（月）〜8/15（金）は休業、8/6（水）〜8/15（金）は1日550円の繁忙期料金を頂戴します。',
    },
    {
      title: '新サービス開始のお知らせ',
      date: '2025-07-01',
      excerpt: 'バイクレンタルの新プランをスタートしました。',
    },
    {
      title: '夏季休業について',
      date: '2025-07-15',
      excerpt: 'お盆期間中の営業スケジュールを掲載しています。',
    },
    {
      title: '店舗リニューアル',
      date: '2025-06-20',
      excerpt: '内装を一新し、より快適にご利用いただけるようになりました。',
    },
  ]

  return (
    <div className="max-w-3xl mx-auto p-6 text-sm leading-relaxed">
      <Head>
        <title>新着情報 - ヤスカリ</title>
      </Head>
      <h1 className="text-2xl font-bold mb-6 text-center text-slate-900">新着情報</h1>
      <div className="space-y-4">
        {posts.map((post, idx) => {
          const content = (
            <>
              <h2 className="font-semibold text-slate-900">{post.title}</h2>
              <p className="text-slate-400 text-xs mb-1">{post.date}</p>
              <p>{post.excerpt}</p>
            </>
          )
          return post.href ? (
            <Link
              key={idx}
              href={post.href}
              className="block p-4 bg-white rounded-lg border border-slate-200 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              {content}
            </Link>
          ) : (
            <div key={idx} className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}
