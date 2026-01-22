import Head from 'next/head';
import Link from 'next/link';

export default function Custom404() {
  return (
    <main className="flex items-center justify-center min-h-[70vh] bg-gray-50 py-16 px-6">
      <Head>
        <title>ページが見つかりません - ヤスカリ</title>
      </Head>
      <section className="max-w-xl w-full bg-white shadow-lg rounded-xl p-10 text-center space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-red-500">404 Not Found</p>
          <h1 className="text-3xl font-bold">ページが見つかりませんでした</h1>
        </div>
        <p className="text-gray-600">
          ご指定のURLは存在しないか、移動した可能性があります。入力したアドレスに誤りがないかをご確認ください。
        </p>
        <div className="bg-gray-100 rounded-lg p-6 text-left space-y-3">
          <h2 className="text-lg font-semibold">次のステップ</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>ブラウザの戻るボタンで前のページに戻る</li>
            <li>下記リンクから目的の情報を探す</li>
          </ul>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-red-500 bg-red-500 px-6 py-2 text-white transition hover:bg-red-600"
          >
            ホームへ戻る
          </Link>
          <Link
            href="/help"
            className="inline-flex items-center justify-center rounded-full border border-red-500 px-6 py-2 text-red-500 transition hover:bg-red-50"
          >
            よくある質問を見る
          </Link>
        </div>
      </section>
    </main>
  );
}
