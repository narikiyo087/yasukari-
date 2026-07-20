import Head from 'next/head'
import Link from 'next/link'

export default function SiteRenewalPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 text-sm leading-relaxed">
      <Head>
        <title>サイトリニューアルのお知らせ - ヤスカリ</title>
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
