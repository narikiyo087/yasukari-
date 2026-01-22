import Head from 'next/head'
import Link from 'next/link'

export default function SupportPolicyEn() {
  return (
    <div className="max-w-3xl mx-auto p-6 text-sm leading-relaxed">
      <Head>
        <title>Contact &amp; Support Policy - ヤスカリ</title>
      </Head>
      <h1 className="text-xl font-bold mb-4 text-center">Contact &amp; Support Policy</h1>
      <section className="space-y-4">
        <p>
          We aim to provide timely and helpful support. Please review the guidelines below to ensure smooth communication.
        </p>
        <div className="space-y-2">
          <h2 className="font-semibold">Contact methods</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Phone: 03-5856-8200 (for current rentals only)</li>
            <li>Email: info@yasukari.com</li>
            <li>Online inquiries: <Link href="/en/contact" className="text-red-600 underline">Contact page</Link></li>
          </ul>
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold">Support hours</h2>
          <p>Business days 10:00 a.m. - 5:00 p.m. (closed on Mondays and holidays).</p>
          <p>Messages received after 5:00 p.m. or on closed days will be handled on the next business day.</p>
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold">Response timeline</h2>
          <p>We typically respond within one business day. During peak seasons, responses may take longer.</p>
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold">When contacting us</h2>
          <p>Please include your name, reservation number, and desired bike model to help us assist you quickly.</p>
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold">Emergencies and roadside assistance</h2>
          <p>
            If an accident or breakdown occurs during your rental, contact us immediately and follow the instructions in your
            rental documents.
          </p>
        </div>
      </section>
    </div>
  )
}
