import Head from 'next/head'

export default function ExternalDisclosureEn() {
  return (
    <>
      <Head>
        <title>External Data Transmission - ヤスカリ</title>
        <meta name="description" content="About external data transmission on the Yasukari website." />
        <link rel="canonical" href="https://yasukari.com/en/external" />
        <link rel="alternate" hrefLang="ja" href="https://yasukari.com/external" />
        <link rel="alternate" hrefLang="en" href="https://yasukari.com/en/external" />
        <link rel="alternate" hrefLang="x-default" href="https://yasukari.com/external" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yasukari" />
        <meta property="og:title" content="External Data Transmission - ヤスカリ" />
        <meta property="og:description" content="About external data transmission on the Yasukari website." />
        <meta property="og:url" content="https://yasukari.com/en/external" />
        <meta property="og:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="External Data Transmission - ヤスカリ" />
        <meta name="twitter:description" content="About external data transmission on the Yasukari website." />
        <meta name="twitter:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
      </Head>
      <main className="max-w-3xl mx-auto p-6 text-sm leading-relaxed">
        <h1 className="text-xl font-bold mb-4 text-center">External Data Transmission</h1>
        <section className="space-y-4">
          <p>
            To improve usability and access analytics, this website uses third-party services. Information about your device and
            browsing activity may be transmitted to service providers.
          </p>
          <h2 className="font-semibold">Third-party services in use</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Google Fonts (font delivery)</li>
            <li>jsDelivr CDN (Tailwind CSS delivery)</li>
            <li>Unsplash (image delivery)</li>
            <li>Other access analytics tools</li>
          </ul>
          <h2 className="font-semibold">Information that may be transmitted</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Device information such as IP address</li>
            <li>Visited page URLs and access timestamps</li>
            <li>Browser and OS environment details</li>
          </ul>
          <p>
            We use this information solely for improving the quality of the website and do not use it to identify individuals.
          </p>
        </section>
      </main>
    </>
  )
}
