import Head from 'next/head'
import Link from 'next/link'
import { FaArrowDown } from 'react-icons/fa'

export default function BeginnerGuidePageEn() {
  return (
    <div className="max-w-[1440px] mx-auto p-6 space-y-6 text-sm leading-relaxed">
      <Head>
        <title>Beginner&apos;s Guide - ヤスカリ</title>
      </Head>

      <img
        src="https://yasukari.com/static/images/guide/barner.jpg"
        alt="Beginner guide banner"
        className="w-full h-[300px] object-cover mb-6"
      />

      <div className="text-center space-y-2">
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600">
          Beginner Guide
        </span>
        <h1 className="text-2xl font-bold text-indigo-700">Beginner&apos;s Guide</h1>
        <p className="text-slate-600">
          We&apos;ve summarized each step from booking to return so you can rent with confidence.
        </p>
      </div>

      <section className="border rounded p-4 space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">01. Making a reservation</h2>
        <p>Check availability and book from each vehicle detail page. *Customers under 18 cannot use the service.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Booking window: From 90 days before the rental date until 5:00 p.m. on the previous business day</li>
          <li>Payment method: Credit card only</li>
          <li>
            To modify your reservation dates or details, please contact us via
            <Link href="/en/contact" className="text-red-600 underline ml-1">
              the inquiry form
            </Link>
            , then place a new reservation.
          </li>
          <li>
            For cancellations, please reach out through
            <Link href="/en/contact" className="text-red-600 underline ml-1">
              the inquiry form
            </Link>
            . Cancellations are free up to 4 days in advance; from 3 days before to the rental day, a 50% fee applies.
          </li>
        </ul>
      </section>
      <FaArrowDown className="mx-auto text-2xl text-gray-500" />

      <section className="border rounded p-4 space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">02. Visiting the store</h2>
        <p>Please bring the following. If you did not add a helmet option, bring your own helmet.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Driver&apos;s license</li>
          <li>Helmet</li>
        </ul>
        <p>Please arrive between 10:00 and 18:30 on your reservation date (time is needed for paperwork).</p>
        <p>
          Yasukari is operated by Rebike K-JET. When you arrive, please speak with the Rebike K-JET staff.
        </p>
      </section>
      <FaArrowDown className="mx-auto text-2xl text-gray-500" />

      <section className="border rounded p-4 space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">03. During your rental</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>The contract holder must pick up and return the bike in person and within business hours.</li>
          <li>Only the contract holder may ride the bike. (Corporate rentals can be discussed separately.)</li>
          <li>
            For parking violations, report to the police station listed on the notice and pay the fine. Then call us and show the
            receipt when returning the bike. If we cannot confirm payment, a fee of ¥20,000 per violation will be charged.
          </li>
        </ul>
        <h3 className="font-semibold text-amber-600">Suggested mileage limits</h3>
        <p>
          Maintenance may be required to ride beyond the distances below. For safe riding, oil changes and maintenance are
          necessary. If damage occurs because maintenance was not performed, we may charge the vehicle&apos;s market value.
        </p>
        <table className="w-full border text-center text-xs">
          <thead>
            <tr>
              <th className="border p-1">Class</th>
              <th className="border p-1">1 day</th>
              <th className="border p-1">3 days</th>
              <th className="border p-1">2 weeks</th>
              <th className="border p-1">1 month</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className="border p-1 text-left">50cc moped</th>
              <td className="border p-1">200km</td>
              <td className="border p-1">600km</td>
              <td className="border p-1">800km</td>
              <td className="border p-1">Bring in once for +800km</td>
            </tr>
            <tr>
              <th className="border p-1 text-left">Up to 125cc</th>
              <td className="border p-1">300km</td>
              <td className="border p-1">800km</td>
              <td className="border p-1">1000km</td>
              <td className="border p-1">Bring in once for +1000km</td>
            </tr>
            <tr>
              <th className="border p-1 text-left">126cc and above</th>
              <td className="border p-1">500km</td>
              <td className="border p-1">1000km</td>
              <td className="border p-1">1500km</td>
              <td className="border p-1">-</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2">If you experience issues while riding, please contact the store during business hours.</p>
        <p>If the bike cannot be ridden outside business hours, please use roadside assistance.</p>
      </section>
      <FaArrowDown className="mx-auto text-2xl text-gray-500" />

      <section className="border rounded p-4 space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">04. Returning the bike</h2>
        <p>Please return between 10:00 and 18:30 on your return date (time is needed for paperwork).</p>
        <p>If the fuel tank is not full upon return, a fee will be charged according to our policy.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>50cc moped: ¥3,000</li>
          <li>Class 2 / Gyro Canopy: ¥5,000</li>
          <li>126cc and above: ¥5,000</li>
        </ul>
      </section>
    </div>
  )
}
