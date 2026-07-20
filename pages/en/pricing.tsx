import Head from 'next/head'

const categories = [
  {
    name: '50cc Moped',
    prices: [
      { period: 'Base 24h', price: '8,960 JPY〜' },
      { period: 'Base 2 days', price: '14,320 JPY〜' },
      { period: 'Base 4 days', price: '15,960 JPY〜' },
      { period: 'Base 1 week', price: '18,960 JPY〜' },
      { period: 'Base 2 weeks', price: '30,960 JPY〜' },
      { period: 'Base 1 month', price: '50,960 JPY〜' },
      { period: 'Extra 24h', price: '17,520 JPY〜' },
    ],
  },
  {
    name: 'Gyro Canopy (Moped)',
    prices: [
      { period: 'Base 24h', price: '10,960 JPY〜' },
      { period: 'Base 2 days', price: '17,620 JPY〜' },
      { period: 'Base 4 days', price: '18,960 JPY〜' },
      { period: 'Base 1 week', price: '21,960 JPY〜' },
      { period: 'Base 2 weeks', price: '34,960 JPY〜' },
      { period: 'Base 1 month', price: '60,960 JPY〜' },
      { period: 'Extra 24h', price: '21,920 JPY〜' },
    ],
  },
  {
    name: 'Gyro Canopy (Minicar)',
    prices: [
      { period: 'Base 24h', price: '11,960 JPY〜' },
      { period: 'Base 2 days', price: '17,960 JPY〜' },
      { period: 'Base 4 days', price: '20,960 JPY〜' },
      { period: 'Base 1 week', price: '22,960 JPY〜' },
      { period: 'Base 2 weeks', price: '39,960 JPY〜' },
      { period: 'Base 1 month', price: '62,960 JPY〜' },
      { period: 'Extra 24h', price: '23,920 JPY〜' },
    ],
  },
  {
    name: '50cc Manual',
    prices: [
      { period: 'Base 24h', price: '12,960 JPY〜' },
      { period: 'Base 2 days', price: '18,840 JPY〜' },
      { period: 'Base 4 days', price: '22,600 JPY〜' },
      { period: 'Base 1 week', price: '26,600 JPY〜' },
      { period: 'Base 2 weeks', price: '40,600 JPY〜' },
      { period: 'Base 1 month', price: '60,600 JPY〜' },
      { period: 'Extra 24h', price: '25,920 JPY〜' },
    ],
  },
  {
    name: 'Class 2 Scooter',
    prices: [
      { period: 'Base 24h', price: '12,960 JPY〜' },
      { period: 'Base 2 days', price: '18,840 JPY〜' },
      { period: 'Base 4 days', price: '22,600 JPY〜' },
      { period: 'Base 1 week', price: '26,600 JPY〜' },
      { period: 'Base 2 weeks', price: '40,600 JPY〜' },
      { period: 'Base 1 month', price: '60,600 JPY〜' },
      { period: 'Extra 24h', price: '25,920 JPY〜' },
    ],
  },
  {
    name: 'Class 2 Manual',
    prices: [
      { period: 'Base 24h', price: '14,960 JPY〜' },
      { period: 'Base 2 days', price: '18,840 JPY〜' },
      { period: 'Base 4 days', price: '26,600 JPY〜' },
      { period: 'Base 1 week', price: '32,600 JPY〜' },
      { period: 'Base 2 weeks', price: '44,600 JPY〜' },
      { period: 'Base 1 month', price: '68,600 JPY〜' },
      { period: 'Extra 24h', price: '29,920 JPY〜' },
    ],
  },
  {
    name: '126-250cc',
    prices: [
      { period: 'Base 24h', price: '16,960 JPY〜' },
      { period: 'Base 2 days', price: '21,500 JPY〜' },
      { period: 'Base 4 days', price: '30,600 JPY〜' },
      { period: 'Base 1 week', price: '40,600 JPY〜' },
      { period: 'Base 2 weeks', price: '64,600 JPY〜' },
      { period: 'Base 1 month', price: '80,600 JPY〜' },
      { period: 'Extra 24h', price: '39,920 JPY〜' },
    ],
  },
  {
    name: '251-400cc',
    prices: [
      { period: 'Base 24h', price: '24,960 JPY〜' },
      { period: 'Base 2 days', price: '29,500 JPY〜' },
      { period: 'Base 4 days', price: '38,600 JPY〜' },
      { period: 'Base 1 week', price: '48,600 JPY〜' },
      { period: 'Base 2 weeks', price: '76,600 JPY〜' },
      { period: 'Base 1 month', price: '110,600 JPY〜' },
      { period: 'Extra 24h', price: '53,920 JPY〜' },
    ],
  },
  {
    name: 'Over 400cc',
    prices: [
      { period: 'Base 24h', price: '31,960 JPY〜' },
      { period: 'Base 2 days', price: '40,500 JPY〜' },
      { period: 'Base 4 days', price: '57,600 JPY〜' },
      { period: 'Base 1 week', price: '67,600 JPY〜' },
      { period: 'Base 2 weeks', price: '89,600 JPY〜' },
      { period: 'Base 1 month', price: '117,600 JPY〜' },
      { period: 'Extra 24h', price: '61,920 JPY〜' },
    ],
  },
]

export default function PricingPageEn() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Head>
        <title>Models & Pricing - ヤスカリ</title>
        <meta name="description" content="Yasukari rental motorcycle pricing by class — 24 hours, 2 days, 1 week and 1 month rates for mopeds to large bikes." />
        <link rel="canonical" href="https://yasukari.com/en/pricing" />
        <link rel="alternate" hrefLang="ja" href="https://yasukari.com/pricing" />
        <link rel="alternate" hrefLang="en" href="https://yasukari.com/en/pricing" />
        <link rel="alternate" hrefLang="x-default" href="https://yasukari.com/pricing" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yasukari" />
        <meta property="og:title" content="Models & Pricing - ヤスカリ" />
        <meta property="og:description" content="Yasukari rental motorcycle pricing by class — 24 hours, 2 days, 1 week and 1 month rates for mopeds to large bikes." />
        <meta property="og:url" content="https://yasukari.com/en/pricing" />
        <meta property="og:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Models & Pricing - ヤスカリ" />
        <meta name="twitter:description" content="Yasukari rental motorcycle pricing by class — 24 hours, 2 days, 1 week and 1 month rates for mopeds to large bikes." />
        <meta name="twitter:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
      </Head>
      <h1 className="text-2xl font-bold mb-6 text-center text-slate-900">Vehicle Types & Rates</h1>
      <p className="mb-6 text-sm text-slate-700">
        Photos of the listed bikes are examples. Actual rental vehicles may differ in color or model year.
      </p>
      {categories.map((c) => (
        <section key={c.name} className="mb-8">
          <h2 className="text-xl font-semibold mb-2 text-slate-900">{c.name}</h2>
          <table className="w-full text-sm border-collapse border border-slate-200 text-slate-700">
            <tbody>
              {c.prices.map((p) => (
                <tr key={p.period}>
                  <th className="w-40 p-3 border border-slate-200 text-left bg-slate-50 font-semibold text-slate-900">{p.period}</th>
                  <td className="p-3 border border-slate-200 text-right font-bold text-slate-900 tabular-nums">{p.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  )
}
