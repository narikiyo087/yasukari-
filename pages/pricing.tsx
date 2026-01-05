import Head from 'next/head'

import { formatAdjustedYenPrice } from '../lib/pricing'
import useInternationalPricingMultiplier from '../lib/useInternationalPricingMultiplier'

const categories = [
  {
    name: '50cc 原付スクーター',
    prices: [
      { period: '24時間', price: '3,980円〜' },
      { period: '2日間', price: '7,160円〜' },
      { period: '4日間', price: '7,980円〜' },
      { period: '1週間', price: '8,980円〜' },
      { period: '2週間', price: '14,980円〜' },
      { period: '1ヶ月', price: '24,980円〜' },
      { period: '遅延1日につき', price: '7,960円〜' },
    ],
  },
  {
    name: 'ジャイロキャノビー原付',
    prices: [
      { period: '24時間', price: '4,980円〜' },
      { period: '2日間', price: '8,280円〜' },
      { period: '4日間', price: '8,980円〜' },
      { period: '1週間', price: '10,480円〜' },
      { period: '2週間', price: '16,980円〜' },
      { period: '1ヶ月', price: '29,980円〜' },
      { period: '遅延1日につき', price: '9,960円〜' },
    ],
  },
  {
    name: 'ジャイロキャノビーミニカー',
    prices: [
      { period: '24時間', price: '5,480円〜' },
      { period: '2日間', price: '8,480円〜' },
      { period: '4日間', price: '9,980円〜' },
      { period: '1週間', price: '10,480円〜' },
      { period: '2週間', price: '18,980円〜' },
      { period: '1ヶ月', price: '30,480円〜' },
      { period: '遅延1日につき', price: '10,960円〜' },
    ],
  },
  {
    name: '原付二種スクーター / 原付ミッション',
    prices: [
      { period: '24時間', price: '5,980円〜' },
      { period: '2日間', price: '9,200円〜' },
      { period: '4日間', price: '10,800円〜' },
      { period: '1週間', price: '12,800円〜' },
      { period: '2週間', price: '19,800円〜' },
      { period: '1ヶ月', price: '29,800円〜' },
      { period: '遅延1日につき', price: '11,960円〜' },
    ],
  },
  {
    name: '原付二種ミッション車',
    prices: [
      { period: '24時間', price: '6,980円〜' },
      { period: '2日間', price: '9,200円〜' },
      { period: '4日間', price: '12,800円〜' },
      { period: '1週間', price: '15,800円〜' },
      { period: '2週間', price: '21,800円〜' },
      { period: '1ヶ月', price: '33,800円〜' },
      { period: '遅延1日につき', price: '13,960円〜' },
    ],
  },
  {
    name: '126〜250cc',
    prices: [
      { period: '24時間', price: '7,980円〜' },
      { period: '2日間', price: '10,980円〜' },
      { period: '4日間', price: '14,800円〜' },
      { period: '1週間', price: '19,800円〜' },
      { period: '2週間', price: '31,800円〜' },
      { period: '1ヶ月', price: '39,800円〜' },
      { period: '遅延1日につき', price: '18,960円〜' },
    ],
  },
  {
    name: '251〜400cc',
    prices: [
      { period: '24時間', price: '11,980円〜' },
      { period: '2日間', price: '13,980円〜' },
      { period: '4日間', price: '18,800円〜' },
      { period: '1週間', price: '23,800円〜' },
      { period: '2週間', price: '37,800円〜' },
      { period: '1ヶ月', price: '54,800円〜' },
      { period: '遅延1日につき', price: '25,960円〜' },
    ],
  },
  {
    name: '400cc超',
    prices: [
      { period: '24時間', price: '14,980円〜' },
      { period: '2日間', price: '16,980円〜' },
      { period: '4日間', price: '22,800円〜' },
      { period: '1週間', price: '27,800円〜' },
      { period: '2週間', price: '43,800円〜' },
      { period: '1ヶ月', price: '57,800円〜' },
      { period: '遅延1日につき', price: '29,960円〜' },
    ],
  },
]

export default function PricingPage() {
  const priceMultiplier = useInternationalPricingMultiplier()

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Head>
        <title>車種・料金 - yasukari</title>
      </Head>
      <h1 className="text-2xl font-bold mb-4 text-center">車種・料金一覧</h1>
      <p className="mb-6 text-sm text-gray-700">
        掲載されている車種の写真はイメージとしての参考例です。実際にご提供する車両は、色や年式などが異なる場合がございますので、あらかじめご了承ください。
      </p>
      {categories.map((c) => (
        <section key={c.name} className="mb-8">
          <h2 className="text-xl font-semibold mb-2">{c.name}</h2>
          <table className="w-full text-sm border-collapse border">
            <tbody>
              {c.prices.map((p) => (
                <tr key={p.period}>
                  <th className="w-32 p-2 border text-left bg-gray-50">{p.period}</th>
                  <td className="p-2 border">
                    {formatAdjustedYenPrice(p.price, priceMultiplier) ?? p.price}
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
