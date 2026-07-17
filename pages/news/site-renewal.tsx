import Head from 'next/head'
import Link from 'next/link'

export default function SiteRenewalPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 text-sm leading-relaxed">
      <Head>
        <title>サイトリニューアルのお知らせ - ヤスカリ</title>
        <meta
          name="description"
          content="ヤスカリ公式サイトは8月1日にデザインを刷新しました。新機能の追加やコンテンツ拡充を順次行い、本サイトを中心に情報発信してまいります。"
        />
        <link rel="canonical" href="https://yasukari.com/news/site-renewal" />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="ヤスカリ" />
        <meta property="og:title" content="サイトリニューアルのお知らせ - ヤスカリ" />
        <meta
          property="og:description"
          content="ヤスカリ公式サイトは8月1日にデザインを刷新しました。今後は本サイトを中心に情報発信してまいります。"
        />
        <meta property="og:url" content="https://yasukari.com/news/site-renewal" />
        <meta name="twitter:card" content="summary" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'NewsArticle',
              headline: 'サイトリニューアルのお知らせ',
              datePublished: '2025-08-01',
              dateModified: '2025-08-01',
              author: { '@type': 'Organization', name: 'ヤスカリ' },
              publisher: {
                '@type': 'Organization',
                name: 'ヤスカリ',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/1769056104573-d731196a-700f-4cc2-948b-68cfdb40d14a-yasukari-logo.jpg',
                },
              },
              mainEntityOfPage: 'https://yasukari.com/news/site-renewal',
              description:
                'ヤスカリ公式サイトは8月1日にデザインを刷新しました。今後は本サイトを中心に情報発信してまいります。',
            }),
          }}
        />
      </Head>
      <h1 className="text-2xl font-bold mb-6 text-center text-slate-900">サイトリニューアルのお知らせ</h1>
      <p className="mb-4">いつもご利用いただきありがとうございます。ヤスカリ公式サイトは8月1日にデザインを刷新し、より快適に情報をお届けできるよう生まれ変わりました。今後は新機能の追加やコンテンツ拡充を順次行い、本サイトを中心に情報発信してまいります。</p>
      <p className="mb-4">
        旧サイトはこちら →{' '}
        <a href="https://yasukari.com/" className="text-red-600 underline">
          https://yasukari.com/
        </a>
      </p>
      <p className="mb-4">移行期間中は旧サイトもご利用いただけますが、順次本サイトへ切り替えていきますのでブックマークの更新をお願いいたします。これからも変わらぬご愛顧を賜りますようお願い申し上げます。</p>
      <p className="text-center">
        <Link href="/news" className="text-red-600 underline">
          新着情報一覧へ戻る
        </Link>
      </p>
    </div>
  )
}
