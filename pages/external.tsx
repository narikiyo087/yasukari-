import Head from 'next/head';

export default function ExternalDisclosure() {
  return (
    <>
      <Head>
        <title>情報の外部送信について - ヤスカリ</title>
      </Head>
      <main className="max-w-3xl mx-auto p-6 text-sm leading-relaxed">
        <h1 className="text-xl font-bold mb-4 text-center">情報の外部送信について</h1>
        <section className="space-y-4">
          <p>
            当サイトでは利便性向上およびアクセス解析のため、以下の外部サービスを利用
            しています。サービス提供事業者に対し、利用者の端末情報や閲覧データが送信
            される場合があります。
          </p>
          <h2 className="font-semibold">利用している外部サービス</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Google Fonts（フォントの配信）</li>
            <li>jsDelivr CDN（Tailwind CSSの配信）</li>
            <li>Unsplash（一部画像の配信）</li>
            <li>その他アクセス解析ツール</li>
          </ul>
          <h2 className="font-semibold">送信される可能性のある情報</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>IPアドレスなどの端末情報</li>
            <li>閲覧したページのURLや利用日時</li>
            <li>ブラウザやOS等の利用環境</li>
          </ul>
          <p>
            これらの情報はサイトの品質向上を目的とした範囲で利用し、個人を特定する
            目的では使用いたしません。
          </p>
        </section>
      </main>
    </>
  );
}
