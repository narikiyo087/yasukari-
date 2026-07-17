import Head from 'next/head';

export default function CompanyPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 text-sm leading-relaxed">
      <Head>
        <title>運営会社情報 - ヤスカリ</title>
        <meta name="description" content="レンタルバイク「ヤスカリ」を運営する株式会社ケイジェットの会社概要（所在地・連絡先・事業内容）。" />
        <link rel="canonical" href="https://yasukari.com/company" />
      </Head>
      <h1 className="text-2xl font-bold mb-6 text-center text-slate-900">運営会社情報</h1>
      <table className="w-full border border-slate-200 border-collapse mb-6 text-slate-700">
        <tbody>
          <tr>
            <th className="text-left w-40 p-3 border border-slate-200 bg-slate-50 font-semibold text-slate-900">会社名</th>
            <td className="p-3 border border-slate-200">株式会社ケイジェット</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-3 border border-slate-200 bg-slate-50 font-semibold text-slate-900">代表者</th>
            <td className="p-3 border border-slate-200">金森 真佐樹</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-3 border border-slate-200 bg-slate-50 font-semibold text-slate-900">所在地</th>
            <td className="p-3 border border-slate-200">東京都足立区小台2-9-7 1階</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-3 border border-slate-200 bg-slate-50 font-semibold text-slate-900">電話番号</th>
            <td className="p-3 border border-slate-200">03-5856-8200</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-3 border border-slate-200 bg-slate-50 font-semibold text-slate-900">メール</th>
            <td className="p-3 border border-slate-200">info@yasukari.com</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-3 border border-slate-200 bg-slate-50 font-semibold text-slate-900">事業内容</th>
            <td className="p-3 border border-slate-200">バイクレンタル事業、関連サービスの運営</td>
          </tr>
        </tbody>
      </table>
      <p className="text-center text-slate-400">Copyright © 2025 ヤスカリ Inc.</p>
    </div>
  );
}
