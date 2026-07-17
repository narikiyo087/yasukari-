import Head from 'next/head';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>プライバシーポリシー - ヤスカリ</title>
        <meta name="description" content="レンタルバイク「ヤスカリ」のプライバシーポリシー。個人情報の取り扱いについてご説明します。" />
        <link rel="canonical" href="https://yasukari.com/privacy" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ヤスカリ" />
        <meta property="og:title" content="プライバシーポリシー - ヤスカリ" />
        <meta property="og:description" content="レンタルバイク「ヤスカリ」のプライバシーポリシー。個人情報の取り扱いについてご説明します。" />
        <meta property="og:url" content="https://yasukari.com/privacy" />
        <meta property="og:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="プライバシーポリシー - ヤスカリ" />
        <meta name="twitter:description" content="レンタルバイク「ヤスカリ」のプライバシーポリシー。個人情報の取り扱いについてご説明します。" />
        <meta name="twitter:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
      </Head>
      <main className="max-w-3xl mx-auto p-6 text-sm leading-relaxed">
        <h1 className="text-xl font-bold mb-4 text-center">プライバシーポリシー</h1>
        <section className="space-y-4">
          <p>
            ヤスカリ運営会社 株式会社ケイジェット（以下、
            「弊社」）は、お客様の個人情報をお預かりするにあたり、
            関連法令を遵守し、適切に取り扱います。
          </p>
          <h2 className="font-semibold">個人情報の取得について</h2>
          <p>弊社は、偽りその他不正の手段によらず適正に個人情報を取得します。</p>
          <h2 className="font-semibold">個人情報の利用について</h2>
          <p>
            取得した個人情報は以下の目的の範囲内で利用します。
            目的外で利用する場合は事前にご本人の同意を得ます。
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>お見積のご依頼・ご相談への回答および資料送付</li>
            <li>ご注文いただいた商品の発送</li>
            <li>各種商品・サービスに関する情報提供</li>
          </ol>
          <h2 className="font-semibold">個人情報の安全管理について</h2>
          <p>
            弊社は、取り扱う個人情報の漏洩、滅失またはき損の防止その他の安全管理に
            必要かつ適切な措置を講じます。
          </p>
          <h2 className="font-semibold">個人情報の第三者提供について</h2>
          <p>
            法令で定める場合を除き、ご本人の同意なく第三者に提供しません。
          </p>
          <h2 className="font-semibold">個人情報の開示・訂正等について</h2>
          <p>
            ご本人からの請求により、個人情報の開示・訂正・削除を速やかに行います。
            ご本人確認ができない場合には応じられません。
          </p>
          <h2 className="font-semibold">お問い合わせ窓口</h2>
          <p>
            個人情報の取扱いに関するお問い合わせは下記までご連絡ください。
            <br />株式会社ケイジェット 金森 真佐樹
            <br />メール: info[at]yasukari.com
            <br />電話: 03-5856-8200
          </p>
          <h2 className="font-semibold">組織・体制</h2>
          <p>弊社は、金森 真佐樹を個人情報管理責任者として適切に管理します。</p>
          <h2 className="font-semibold">本方針の変更</h2>
          <p>
            本方針は予告なく変更することがあります。変更後は当サイトに掲載した時から効力を生じます。
          </p>
        </section>
      </main>
    </>
  );
}
