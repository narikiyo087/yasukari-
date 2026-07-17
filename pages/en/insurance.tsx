import Head from 'next/head'

export default function InsurancePageEn() {
  const baseInsurances = [
    { label: 'Bodily injury liability', description: 'Unlimited per person' },
    { label: 'Property damage liability', description: 'Up to 10,000,000 JPY per accident (50,000 JPY deductible)' },
    { label: 'Passenger personal accident', description: 'Up to 5,000,000 JPY per person (death/permanent disability only; mopeds excluded)' },
  ]

  const vehicleCoverage = [
    ['50cc – 125cc', '1,650 JPY', '2,200 JPY', '3,300 JPY', '6,600 JPY'],
    ['126cc – 250cc', '2,200 JPY', '4,400 JPY', '5,500 JPY', '11,000 JPY'],
    ['251cc and above', '2,750 JPY', '5,500 JPY', '6,875 JPY', '13,750 JPY'],
  ]

  const theftCoverage = [
    ['50cc scooter, Gyro Canopy', '1,100 JPY', 'Not covered'],
    ['50cc manual, 125cc', '2,200 JPY', ''],
    ['Big scooter, 250cc manual', '3,300 JPY', ''],
    ['256–400cc', '4,400 JPY', ''],
    ['401cc and above', '5,500 JPY', ''],
  ]

  const exclusions = [
    'Driving without a valid license',
    'Driving under the influence of alcohol',
    'Riding without a helmet',
    'Accidents caused by anyone other than the driver listed in the contract',
    'Failing to notify the police from the accident scene (no police accident report)',
    'Settling with the other party without our approval',
    'Failing to contact the rental store (or headquarters) from the accident scene',
    'Causing an accident after extending the rental time without permission',
    'Vehicle damage caused by theft',
    'Carrying more passengers than allowed',
    'Driving off public roads',
    'Repair costs for damage or corrosion caused by improper use',
    'Using the vehicle for tests, competitions, towing, or pushing other vehicles',
    'Damaging other vehicles or signs within the rental store',
    'Breakdowns caused by operational error',
    'Using the vehicle in violation of our rental agreement clauses',
    'Other accidents that fall under policy exclusions',
  ]

  return (
    <div className="max-w-3xl mx-auto p-6 text-sm leading-relaxed space-y-6">
      <Head>
        <title>Insurance Coverage - ヤスカリ</title>
        <meta name="description" content="Insurance and optional vehicle/theft coverage included with Yasukari motorcycle rentals, with pricing and deductibles." />
        <link rel="canonical" href="https://yasukari.com/en/insurance" />
        <link rel="alternate" hrefLang="ja" href="https://yasukari.com/insurance" />
        <link rel="alternate" hrefLang="en" href="https://yasukari.com/en/insurance" />
        <link rel="alternate" hrefLang="x-default" href="https://yasukari.com/insurance" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yasukari" />
        <meta property="og:title" content="Insurance Coverage - ヤスカリ" />
        <meta property="og:description" content="Insurance and optional vehicle/theft coverage included with Yasukari motorcycle rentals, with pricing and deductibles." />
        <meta property="og:url" content="https://yasukari.com/en/insurance" />
        <meta property="og:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Insurance Coverage - ヤスカリ" />
        <meta name="twitter:description" content="Insurance and optional vehicle/theft coverage included with Yasukari motorcycle rentals, with pricing and deductibles." />
        <meta name="twitter:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
      </Head>
      <h1 className="text-xl font-bold mb-4 text-center">Insurance Coverage Details</h1>

      <section className="space-y-4">
        <p>The basic rental fee for ヤスカリ bikes includes the following voluntary insurance.</p>
        <ul className="list-disc list-inside space-y-1">
          {baseInsurances.map((item) => (
            <li key={item.label}>{item.label}: {item.description}</li>
          ))}
        </ul>
        <p>Adding optional vehicle damage coverage (deductible applies per accident) is up to you. If you do not add it, you will be responsible for the full repair cost in the event of an accident, tip-over, or other damage.</p>
        <p>A deductible is the maximum amount you pay per accident. For example, if repairs cost 200,000 JPY, you pay up to the 50,000 JPY deductible and vehicle coverage pays the remaining 150,000 JPY.</p>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Vehicle damage coverage</h2>
        <table className="w-full border border-collapse text-center">
          <thead>
            <tr>
              <th className="border p-2">Class</th>
              <th className="border p-2">1 day</th>
              <th className="border p-2">1 week</th>
              <th className="border p-2">2 weeks</th>
              <th className="border p-2">1 month</th>
            </tr>
          </thead>
          <tbody>
            {vehicleCoverage.map((row, idx) => (
              <tr key={idx}>
                {row.map((cell, i) => (
                  <td key={i} className="border p-2">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2">A business interruption fee applies whether or not you add vehicle damage coverage. The standard follows the same deductible amounts: 20,000 JPY if the bike can be ridden, and 50,000 JPY if it cannot be ridden or requires towing.</p>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Theft coverage option</h2>
        <p>If you add this option, 50% of the bike\'s market value is covered in the event of theft. Without it, you must pay 100% of the market value.</p>
        <table className="w-full border border-collapse text-center mt-2">
          <thead>
            <tr>
              <th className="border p-2">Class</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">For overdue returns</th>
            </tr>
          </thead>
          <tbody>
            {theftCoverage.map((row, idx) => (
              <tr key={idx}>
                {row.map((cell, i) => (
                  <td key={i} className="border p-2">{cell || '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1">Roadside assistance is available up to 180 km.</p>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Common exclusions</h2>
        <ul className="list-disc list-inside space-y-1">
          {exclusions.map((ex, idx) => (
            <li key={idx}>{ex}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
