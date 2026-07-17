import Head from 'next/head'

import { formatAdjustedYenPrice } from '../lib/pricing'
import useInternationalPricingMultiplier from '../lib/useInternationalPricingMultiplier'

const categories = [
  {
    name: '50cc原付',
    prices: [
      { period: '基本24h', price: 4480 },
      { period: '基本2日', price: 7160 },
      { period: '基本4日', price: 7980 },
      { period: '基本1週', price: 9480 },
      { period: '基本2週', price: 15480 },
      { period: '基本1ヶ月', price: 25480 },
      { period: '追加24h', price: 8760 },
    ],
  },
  {
    name: 'ジャイロキャノピー（原付）',
    prices: [
      { period: '基本24h', price: 5480 },
      { period: '基本2日', price: 8810 },
      { period: '基本4日', price: 9480 },
      { period: '基本1週', price: 10980 },
      { period: '基本2週', price: 17480 },
      { period: '基本1ヶ月', price: 30480 },
      { period: '追加24h', price: 10960 },
    ],
  },
  {
    name: 'ジャイロキャノピー（ミニカー）',
    prices: [
      { period: '基本24h', price: 5980 },
      { period: '基本2日', price: 8980 },
      { period: '基本4日', price: 10480 },
      { period: '基本1週', price: 11480 },
      { period: '基本2週', price: 19980 },
      { period: '基本1ヶ月', price: 31480 },
      { period: '追加24h', price: 11960 },
    ],
  },
  {
    name: '原付50ccミッション',
    prices: [
      { period: '基本24h', price: 6480 },
      { period: '基本2日', price: 9420 },
      { period: '基本4日', price: 11300 },
      { period: '基本1週', price: 13300 },
      { period: '基本2週', price: 20300 },
      { period: '基本1ヶ月', price: 30300 },
      { period: '追加24h', price: 12960 },
    ],
  },
  {
    name: '2種スクーター',
    prices: [
      { period: '基本24h', price: 6480 },
      { period: '基本2日', price: 9420 },
      { period: '基本4日', price: 11300 },
      { period: '基本1週', price: 13300 },
      { period: '基本2週', price: 20300 },
      { period: '基本1ヶ月', price: 30300 },
      { period: '追加24h', price: 12960 },
    ],
  },
  {
    name: '原付2種ミッション',
    prices: [
      { period: '基本24h', price: 7480 },
      { period: '基本2日', price: 9420 },
      { period: '基本4日', price: 13300 },
      { period: '基本1週', price: 16300 },
      { period: '基本2週', price: 22300 },
      { period: '基本1ヶ月', price: 34300 },
      { period: '追加24h', price: 14960 },
    ],
  },
  {
    name: '126-250cc',
    prices: [
      { period: '基本24h', price: 8480 },
      { period: '基本2日', price: 10750 },
      { period: '基本4日', price: 15300 },
      { period: '基本1週', price: 20300 },
      { period: '基本2週', price: 32300 },
      { period: '基本1ヶ月', price: 40300 },
      { period: '追加24h', price: 19960 },
    ],
  },
  {
    name: '251-400cc',
    prices: [
      { period: '基本24h', price: 12480 },
      { period: '基本2日', price: 14750 },
      { period: '基本4日', price: 19300 },
      { period: '基本1週', price: 24300 },
      { period: '基本2週', price: 38300 },
      { period: '基本1ヶ月', price: 55300 },
      { period: '追加24h', price: 26960 },
    ],
  },
  {
    name: '400cc超',
    prices: [
      { period: '基本24h', price: 15980 },
      { period: '基本2日', price: 20250 },
      { period: '基本4日', price: 28800 },
      { period: '基本1週', price: 33800 },
      { period: '基本2週', price: 44800 },
      { period: '基本1ヶ月', price: 58800 },
      { period: '追加24h', price: 30960 },
    ],
  },
]

export default function PricingPage() {
  const priceMultiplier = useInternationalPricingMultiplier("ja")

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Head>
        <title>車種・料金 - ヤスカリ</title>
        <meta name="description" content="ヤスカリのレンタルバイク料金一覧。原付から大型まで、24時間・2日・1週間・1ヶ月などクラス別の料金をまとめています。" />
        <link rel="canonical" href="https://yasukari.com/pricing" />
      </Head>
      <h1 className="text-2xl font-bold mb-6 text-center text-slate-900">車種・料金一覧</h1>
      <p className="mb-6 text-sm text-slate-600">
        掲載されている車種の写真はイメージとしての参考例です。実際にご提供する車両は、色や年式などが異なる場合がございますので、あらかじめご了承ください。
      </p>
      {categories.map((c) => (
        <section key={c.name} className="mb-8">
          <h2 className="text-xl font-semibold mb-2 text-slate-900">{c.name}</h2>
          <table className="w-full text-sm border-collapse border border-slate-200 text-slate-700">
            <tbody>
              {c.prices.map((p) => (
                <tr key={p.period}>
                  <th className="w-40 p-3 border border-slate-200 text-left bg-slate-50 font-semibold text-slate-900">{p.period}</th>
                  <td className="p-3 border border-slate-200 text-right font-bold text-slate-900 tabular-nums">
                    {(() => {
                      const formatted = formatAdjustedYenPrice(p.price, priceMultiplier)
                      return formatted ? `${formatted}〜` : `${p.price}円〜`
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  )
}
