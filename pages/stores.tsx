import Head from 'next/head';

export default function StoresPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 text-sm leading-relaxed">
      <Head>
        <title>店舗一覧 - ヤスカリ</title>
        <meta name="description" content="ヤスカリの店舗一覧。足立小台本店（足立区）と三ノ輪店（台東区・24時間セルフ）のアクセス・営業時間・地図をご案内します。" />
        <link rel="canonical" href="https://yasukari.com/stores" />
      </Head>
      <h1 className="text-2xl font-bold mb-6 text-center text-slate-900">店舗一覧</h1>

      <section id="adachi" className="mb-8 space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">足立小台本店</h2>
        <p>足立区にある格安バイク屋です。</p>
        <ul className="list-disc list-inside space-y-1">
          <li>舎人ライナー『足立小台』駅から徒歩15分</li>
          <li>都電荒川線(東京さくらトラム)『小台』駅から徒歩15分</li>
          <li>JR田端駅から・都バス【東43】荒川土手行き・江北駅前行き・豊島五丁目団地行き乗車・小台二丁目下車</li>
        </ul>
        <table className="w-full border border-slate-200 border-collapse text-slate-700">
          <tbody>
            <tr>
              <th className="text-left w-32 p-3 border border-slate-200 bg-slate-50 font-semibold text-slate-900">屋号</th>
              <td className="p-3 border border-slate-200">ヤスカリ</td>
            </tr>
            <tr>
              <th className="text-left w-32 p-3 border border-slate-200 bg-slate-50 font-semibold text-slate-900">運営会社</th>
              <td className="p-3 border border-slate-200">株式会社ケイジェット</td>
            </tr>
            <tr>
              <th className="text-left w-32 p-3 border border-slate-200 bg-slate-50 font-semibold text-slate-900">郵便番号</th>
              <td className="p-3 border border-slate-200">〒120-0046</td>
            </tr>
            <tr>
              <th className="text-left w-32 p-3 border border-slate-200 bg-slate-50 font-semibold text-slate-900">所在地</th>
              <td className="p-3 border border-slate-200">東京都足立区小台2-9-7 1階</td>
            </tr>
            <tr>
              <th className="text-left w-32 p-3 border border-slate-200 bg-slate-50 font-semibold text-slate-900">メール</th>
              <td className="p-3 border border-slate-200">info[at]yasukari.com</td>
            </tr>
            <tr>
              <th className="text-left w-32 p-3 border border-slate-200 bg-slate-50 font-semibold text-slate-900">営業時間</th>
              <td className="p-3 border border-slate-200">10:00 〜 19:00 （月曜・木曜定休）</td>
            </tr>
          </tbody>
        </table>
        <div className="w-full h-64 mt-4 overflow-hidden rounded-lg border border-slate-200">
          <iframe
            src="https://maps.google.com/maps?q=%E6%9D%B1%E4%BA%AC%E9%83%BD%E8%B6%B3%E7%AB%8B%E5%8C%BA%E5%B0%8F%E5%8F%B02-9-7&output=embed"
            width="100%"
            height="100%"
            loading="lazy"
            style={{ border: 0 }}
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </section>

      <section id="minowa" className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">三ノ輪店</h2>
        <p>東京都台東区の国道4号線沿いにあるレンタルバイク店です。</p>
        <ul className="list-disc list-inside space-y-1">
          <li>東京メトロ日比谷線 三ノ輪駅 徒歩4分</li>
          <li>東京メトロ日比谷線 入谷駅 徒歩7分</li>
        </ul>
        <table className="w-full border border-slate-200 border-collapse text-slate-700">
          <tbody>
            <tr>
              <th className="text-left w-32 p-3 border border-slate-200 bg-slate-50 font-semibold text-slate-900">店名</th>
              <td className="p-3 border border-slate-200">ヤスカリ 三ノ輪店</td>
            </tr>
            <tr>
              <th className="text-left w-32 p-3 border border-slate-200 bg-slate-50 font-semibold text-slate-900">郵便番号</th>
              <td className="p-3 border border-slate-200">〒110-0004</td>
            </tr>
            <tr>
              <th className="text-left w-32 p-3 border border-slate-200 bg-slate-50 font-semibold text-slate-900">所在地</th>
              <td className="p-3 border border-slate-200">東京都台東区下谷3ー16ー14</td>
            </tr>
            <tr>
              <th className="text-left w-32 p-3 border border-slate-200 bg-slate-50 font-semibold text-slate-900">メール</th>
              <td className="p-3 border border-slate-200">info[at]yasukari.com</td>
            </tr>
            <tr>
              <th className="text-left w-32 p-3 border border-slate-200 bg-slate-50 font-semibold text-slate-900">営業時間</th>
              <td className="p-3 border border-slate-200">10:00 〜 19:00 （月曜・木曜定休）</td>
            </tr>
          </tbody>
        </table>
        <div className="w-full h-64 mt-4 overflow-hidden rounded-lg border border-slate-200">
          <iframe
            src="https://maps.google.com/maps?q=%E6%9D%B1%E4%BA%AC%E9%83%BD%E5%8F%B0%E6%9D%B1%E5%8C%BA%E4%B8%8B%E8%B0%B73%E3%83%BC16%E3%83%BC14&output=embed"
            width="100%"
            height="100%"
            loading="lazy"
            style={{ border: 0 }}
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </section>

      <p className="mt-6 text-center text-slate-400">Copyright レンタルバイク『ヤスカリ』.</p>
    </div>
  );
}
