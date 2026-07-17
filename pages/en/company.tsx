import Head from 'next/head'

export default function CompanyPageEn() {
  return (
    <div className="max-w-3xl mx-auto p-6 text-sm leading-relaxed">
      <Head>
        <title>Company Information - ヤスカリ</title>
        <meta name="description" content="Company information for Yasukari, the affordable Tokyo motorcycle rental service operated by K-JET Inc." />
        <link rel="canonical" href="https://yasukari.com/en/company" />
        <link rel="alternate" hrefLang="ja" href="https://yasukari.com/company" />
        <link rel="alternate" hrefLang="en" href="https://yasukari.com/en/company" />
        <link rel="alternate" hrefLang="x-default" href="https://yasukari.com/company" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yasukari" />
        <meta property="og:title" content="Company Information - ヤスカリ" />
        <meta property="og:description" content="Company information for Yasukari, the affordable Tokyo motorcycle rental service operated by K-JET Inc." />
        <meta property="og:url" content="https://yasukari.com/en/company" />
        <meta property="og:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Company Information - ヤスカリ" />
        <meta name="twitter:description" content="Company information for Yasukari, the affordable Tokyo motorcycle rental service operated by K-JET Inc." />
        <meta name="twitter:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
      </Head>
      <h1 className="text-xl font-bold mb-4 text-center">Company Information</h1>
      <table className="w-full border border-collapse mb-6">
        <tbody>
          <tr>
            <th className="text-left w-40 p-2 border">Company name</th>
            <td className="p-2 border">Keijet Co., Ltd.</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">Representative</th>
            <td className="p-2 border">Masaki Kanamori</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">Address</th>
            <td className="p-2 border">1F, 2-9-7 Odai, Adachi-ku, Tokyo</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">Phone</th>
            <td className="p-2 border">03-5856-8200</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">Email</th>
            <td className="p-2 border">info@yasukari.com</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">Business</th>
            <td className="p-2 border">Motorcycle rental services and related operations</td>
          </tr>
        </tbody>
      </table>
      <p className="text-center text-slate-500">Copyright © 2025 ヤスカリ Inc.</p>
    </div>
  )
}
