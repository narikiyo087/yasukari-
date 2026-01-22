import Head from 'next/head';

export default function CompanyPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 text-sm leading-relaxed">
      <Head>
        <title>運営会社情報 - ヤスカリ</title>
      </Head>
      <h1 className="text-xl font-bold mb-4 text-center">運営会社情報</h1>
      <table className="w-full border border-collapse mb-6">
        <tbody>
          <tr>
            <th className="text-left w-40 p-2 border">会社名</th>
            <td className="p-2 border">株式会社ケイジェット</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">代表者</th>
            <td className="p-2 border">金森 真佐樹</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">所在地</th>
            <td className="p-2 border">東京都足立区小台2-9-7 1階</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">電話番号</th>
            <td className="p-2 border">03-5856-8200</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">メール</th>
            <td className="p-2 border">info@yasukari.com</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">事業内容</th>
            <td className="p-2 border">バイクレンタル事業、関連サービスの運営</td>
          </tr>
        </tbody>
      </table>
      <p className="text-center text-gray-500">Copyright © 2025 ヤスカリ Inc.</p>
    </div>
  );
}
