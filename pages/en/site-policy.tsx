import Head from 'next/head'

export default function SitePolicyEn() {
  return (
    <div className="max-w-3xl mx-auto p-6 text-sm leading-relaxed">
      <Head>
        <title>Site Policy - ヤスカリ</title>
        <meta name="description" content="Yasukari site policy." />
        <link rel="canonical" href="https://yasukari.com/en/site-policy" />
        <link rel="alternate" hrefLang="en" href="https://yasukari.com/en/site-policy" />
        <link rel="alternate" hrefLang="x-default" href="https://yasukari.com/en/site-policy" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yasukari" />
        <meta property="og:title" content="Site Policy - ヤスカリ" />
        <meta property="og:description" content="Yasukari site policy." />
        <meta property="og:url" content="https://yasukari.com/en/site-policy" />
        <meta property="og:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Site Policy - ヤスカリ" />
        <meta name="twitter:description" content="Yasukari site policy." />
        <meta name="twitter:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
      </Head>
      <h1 className="text-xl font-bold mb-4 text-center">Site Policy</h1>
      <section className="space-y-4">
        <p>
          This site policy outlines the terms for using the Yasukari website. By using this site, you agree to the policies
          below.
        </p>
        <div className="space-y-2">
          <h2 className="font-semibold">Links</h2>
          <p>
            You may link to this website for personal or informational purposes, provided the content is not misrepresented and
            the source is clearly indicated.
          </p>
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold">Copyright</h2>
          <p>
            All content on this website is protected by copyright. Reproduction, modification, or redistribution without prior
            permission is prohibited.
          </p>
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold">Disclaimer</h2>
          <p>
            We strive to keep the information on this website accurate and up to date, but we do not guarantee its completeness
            or accuracy. We are not responsible for any damages arising from the use of this site.
          </p>
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold">Changes</h2>
          <p>
            This site policy may be updated without notice. Changes take effect once posted on this website.
          </p>
        </div>
      </section>
    </div>
  )
}
