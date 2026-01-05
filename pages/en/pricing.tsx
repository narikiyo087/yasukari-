import Head from 'next/head'

const categories = [
  {
    name: '50cc Moped Scooter',
    prices: [
      { period: '24 hours', price: '5,970 JPY〜' },
      { period: '2 days', price: '10,740 JPY〜' },
      { period: '4 days', price: '11,970 JPY〜' },
      { period: '1 week', price: '13,470 JPY〜' },
      { period: '2 weeks', price: '22,470 JPY〜' },
      { period: '1 month', price: '37,470 JPY〜' },
      { period: 'Per additional day', price: '11,940 JPY〜' },
    ],
  },
  {
    name: 'Gyro Canopy Moped',
    prices: [
      { period: '24 hours', price: '7,470 JPY〜' },
      { period: '2 days', price: '12,420 JPY〜' },
      { period: '4 days', price: '13,470 JPY〜' },
      { period: '1 week', price: '15,720 JPY〜' },
      { period: '2 weeks', price: '25,470 JPY〜' },
      { period: '1 month', price: '44,970 JPY〜' },
      { period: 'Per additional day', price: '14,940 JPY〜' },
    ],
  },
  {
    name: 'Gyro Canopy Minicar',
    prices: [
      { period: '24 hours', price: '8,220 JPY〜' },
      { period: '2 days', price: '12,720 JPY〜' },
      { period: '4 days', price: '14,970 JPY〜' },
      { period: '1 week', price: '15,720 JPY〜' },
      { period: '2 weeks', price: '28,470 JPY〜' },
      { period: '1 month', price: '45,720 JPY〜' },
      { period: 'Per additional day', price: '16,440 JPY〜' },
    ],
  },
  {
    name: 'Class 2 Scooter / Manual Moped',
    prices: [
      { period: '24 hours', price: '8,970 JPY〜' },
      { period: '2 days', price: '13,800 JPY〜' },
      { period: '4 days', price: '16,200 JPY〜' },
      { period: '1 week', price: '19,200 JPY〜' },
      { period: '2 weeks', price: '29,700 JPY〜' },
      { period: '1 month', price: '44,700 JPY〜' },
      { period: 'Per additional day', price: '17,940 JPY〜' },
    ],
  },
  {
    name: 'Class 2 Manual',
    prices: [
      { period: '24 hours', price: '10,470 JPY〜' },
      { period: '2 days', price: '13,800 JPY〜' },
      { period: '4 days', price: '19,200 JPY〜' },
      { period: '1 week', price: '23,700 JPY〜' },
      { period: '2 weeks', price: '32,700 JPY〜' },
      { period: '1 month', price: '50,700 JPY〜' },
      { period: 'Per additional day', price: '20,940 JPY〜' },
    ],
  },
  {
    name: '126–250cc',
    prices: [
      { period: '24 hours', price: '11,970 JPY〜' },
      { period: '2 days', price: '16,470 JPY〜' },
      { period: '4 days', price: '22,200 JPY〜' },
      { period: '1 week', price: '29,700 JPY〜' },
      { period: '2 weeks', price: '47,700 JPY〜' },
      { period: '1 month', price: '59,700 JPY〜' },
      { period: 'Per additional day', price: '28,440 JPY〜' },
    ],
  },
  {
    name: '251–400cc',
    prices: [
      { period: '24 hours', price: '17,970 JPY〜' },
      { period: '2 days', price: '20,970 JPY〜' },
      { period: '4 days', price: '28,200 JPY〜' },
      { period: '1 week', price: '35,700 JPY〜' },
      { period: '2 weeks', price: '56,700 JPY〜' },
      { period: '1 month', price: '82,200 JPY〜' },
      { period: 'Per additional day', price: '38,940 JPY〜' },
    ],
  },
  {
    name: 'Over 400cc',
    prices: [
      { period: '24 hours', price: '22,470 JPY〜' },
      { period: '2 days', price: '25,470 JPY〜' },
      { period: '4 days', price: '34,200 JPY〜' },
      { period: '1 week', price: '41,700 JPY〜' },
      { period: '2 weeks', price: '65,700 JPY〜' },
      { period: '1 month', price: '86,700 JPY〜' },
      { period: 'Per additional day', price: '44,940 JPY〜' },
    ],
  },
]

export default function PricingPageEn() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Head>
        <title>Models & Pricing - yasukari</title>
      </Head>
      <h1 className="text-2xl font-bold mb-4 text-center">Vehicle Types & Rates</h1>
      <p className="mb-6 text-sm text-gray-700">
        Photos of the listed bikes are examples. Actual rental vehicles may differ in color or model year.
      </p>
      {categories.map((c) => (
        <section key={c.name} className="mb-8">
          <h2 className="text-xl font-semibold mb-2">{c.name}</h2>
          <table className="w-full text-sm border-collapse border">
            <tbody>
              {c.prices.map((p) => (
                <tr key={p.period}>
                  <th className="w-32 p-2 border text-left bg-gray-50">{p.period}</th>
                  <td className="p-2 border">{p.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  )
}
