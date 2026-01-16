import Head from 'next/head';

export default function Tokusyouhou() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Head>
        <title>特定商取引法に基づく表記 - yasukari</title>
      </Head>
      <h1 className="text-xl font-bold mb-4 text-center">特定商取引法に基づく表示</h1>
      <table className="w-full border border-collapse text-sm">
        <tbody>
          <tr>
            <th className="text-left w-40 p-2 border">販売業者</th>
            <td className="p-2 border">株式会社ケイジェット</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">運営代表者</th>
            <td className="p-2 border">金森　真佐樹</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">所在地</th>
            <td className="p-2 border">東京都足立区小台2-9-7　1階</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">電話番号</th>
            <td className="p-2 border">03-5856-8200</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">代金のお支払い方法</th>
            <td className="p-2 border">クレジットカード</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">販売価格</th>
            <td className="p-2 border">各商品ページに基づく</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">商品代金以外に必要な料金</th>
            <td className="p-2 border">各種オプションや保険</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">代金の支払時期</th>
            <td className="p-2 border">決済会社の支払い時期に基づく</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">新規予約</th>
            <td className="p-2 border">ご利用前日の１７時まで（前日が休業日の場合、前営業日の１７時まで)</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">予約変更</th>
            <td className="p-2 border">ご利用前日の１７時まで (前日が休業日の場合、前営業日の１７時まで)</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">キャンセルについて</th>
            <td className="p-2 border">キャンセル料金について、ご予約日の４日前まではキャンセル料なし、３日前から当日までのキャンセル料につきましては、50%のキャンセル料を頂戴いたします。</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-6 text-center text-gray-500 text-sm">Copyright レンタルバイク『ヤスカリ』.</p>
    </div>
  );
}
