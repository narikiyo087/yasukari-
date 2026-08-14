import Head from 'next/head'
import Link from 'next/link'
import { FormEvent, useState } from 'react'

const CATEGORY_OPTIONS = [
  { value: 'reservation', label: 'Reservations' },
  { value: 'extension', label: 'Extension request' },
  { value: 'insurance', label: 'Insurance certificate request' },
  { value: 'trouble', label: 'Vehicle trouble / accident' },
  { value: 'other', label: 'Other' },
]

export default function ContactPageEn() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0].value)
  const [reservationId, setReservationId] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setNotice('')
    setError('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, category, reservationId, message, locale: 'en' }),
      })
      const payload = (await response.json()) as { message?: string }

      if (!response.ok) {
        throw new Error(payload.message || 'Failed to submit your inquiry.')
      }

      setNotice(payload.message ?? 'Your inquiry has been received.')
      setName('')
      setEmail('')
      setCategory(CATEGORY_OPTIONS[0].value)
      setReservationId('')
      setMessage('')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit your inquiry.')
    } finally {
      setSubmitting(false)
    }
  }

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

      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold mb-3">Contact Form</h2>
        {notice && (
          <p className="mb-3 rounded bg-green-50 border border-green-200 p-3 text-green-800">
            {notice}
          </p>
        )}
        {error && (
          <p className="mb-3 rounded bg-red-50 border border-red-200 p-3 text-red-700">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="contactName" className="block font-semibold mb-1">
              Name<span className="text-red-600 ml-1">*</span>
            </label>
            <input
              id="contactName"
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded border border-slate-300 p-2"
              placeholder="John Smith"
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="contactEmail" className="block font-semibold mb-1">
              Email<span className="text-red-600 ml-1">*</span>
            </label>
            <input
              id="contactEmail"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded border border-slate-300 p-2"
              placeholder="sample@example.com"
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="contactCategory" className="block font-semibold mb-1">
              Category
            </label>
            <select
              id="contactCategory"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded border border-slate-300 p-2 bg-white"
              disabled={submitting}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="contactReservationId" className="block font-semibold mb-1">
              Reservation ID (if you have one)
            </label>
            <input
              id="contactReservationId"
              type="text"
              value={reservationId}
              onChange={(event) => setReservationId(event.target.value)}
              className="w-full rounded border border-slate-300 p-2"
              placeholder="e.g. rs_1234567890"
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="contactMessage" className="block font-semibold mb-1">
              Message<span className="text-red-600 ml-1">*</span>
            </label>
            <textarea
              id="contactMessage"
              required
              rows={6}
              maxLength={4000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="w-full rounded border border-slate-300 p-2"
              placeholder="Please include your desired model, dates, and any questions."
              disabled={submitting}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-red-600 py-2.5 font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? 'Sending...' : 'Send'}
          </button>
          <p className="text-xs text-slate-500">
            A confirmation email will be sent automatically. Our staff will reply within business
            hours (10:00 a.m.-5:00 p.m. JST on business days).
          </p>
        </form>
      </section>

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
