import Head from 'next/head'
import Link from 'next/link'

export default function ContactPageEn() {
  return (
    <div className="max-w-2xl mx-auto p-6 text-sm leading-relaxed">
      <Head>
        <title>Contact - ヤスカリ</title>
        <meta name="description" content="Contact Yasukari — phone, email and address, with email hours and the details to include in your inquiry." />
        <link rel="canonical" href="https://yasukari.com/en/contact" />
        <link rel="alternate" hrefLang="ja" href="https://yasukari.com/contact" />
        <link rel="alternate" hrefLang="en" href="https://yasukari.com/en/contact" />
        <link rel="alternate" hrefLang="x-default" href="https://yasukari.com/contact" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yasukari" />
        <meta property="og:title" content="Contact - ヤスカリ" />
        <meta property="og:description" content="Contact Yasukari — phone, email and address, with email hours and the details to include in your inquiry." />
        <meta property="og:url" content="https://yasukari.com/en/contact" />
        <meta property="og:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact - ヤスカリ" />
        <meta name="twitter:description" content="Contact Yasukari — phone, email and address, with email hours and the details to include in your inquiry." />
        <meta name="twitter:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
      </Head>
      <h1 className="text-xl font-bold mb-4 text-center">Contact Us</h1>
      <p className="mb-4">Feel free to reach us using the contact details below.</p>
      <ul className="space-y-2">
        <li>Phone: 03-5856-8200</li>
        <li>Email: info@yasukari.com</li>
        <li>Address: 1F, 2-9-7 Odai, Adachi-ku, Tokyo</li>
      </ul>

      <section className="space-y-2 mt-6">
        <p>
          Except for customers currently renting, we do not take inquiries or reservations over the phone. Please register and
          place your reservation online.
        </p>
        <p>
          Email reception hours are 10:00 a.m. to 5:00 p.m. on business days. Messages sent after 5:00 p.m. or on store holidays
          (such as Mondays) will be handled on the next business day. When reaching out, please include your name, reservation
          number, and desired bike model.
        </p>
        <p>
          If you need a copy of the voluntary insurance certificate, email info@yasukari.com with the subject “Insurance
          certificate request” and include your reservation number, full name, reserved model, rental date and time, and email
          address.
        </p>
        <p>
          To request an extension, email info@yasukari.com by 5:00 p.m. with the subject “Extension request” and include your
          reservation number, name, reserved model, and rental date. Depending on timing, we may not be able to accommodate the
          request.
        </p>
      </section>

      <p className="mt-6">
        You can also find answers in the
        <Link href="/en/beginner" className="text-red-600 underline ml-1">
          Beginner&apos;s Guide
        </Link>
        .
      </p>
    </div>
  )
}
