import Head from 'next/head'

export default function CompanyPageEn() {
  return (
    <div className="max-w-3xl mx-auto p-6 text-sm leading-relaxed">
      <Head>
        <title>Company Information - ヤスカリ</title>
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
      <p className="text-center text-gray-500">Copyright © 2025 ヤスカリ Inc.</p>
    </div>
  )
}
