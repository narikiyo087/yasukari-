import Head from 'next/head'

export default function TokusyouhouEn() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Head>
        <title>Act on Specified Commercial Transactions - ヤスカリ</title>
      </Head>
      <h1 className="text-xl font-bold mb-4 text-center">Act on Specified Commercial Transactions</h1>
      <table className="w-full border border-collapse text-sm">
        <tbody>
          <tr>
            <th className="text-left w-40 p-2 border">Seller</th>
            <td className="p-2 border">Keijet Co., Ltd.</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">Representative</th>
            <td className="p-2 border">Masaki Kanamori</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">Address</th>
            <td className="p-2 border">1F, 2-9-7 Odai, Adachi-ku, Tokyo</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">Phone</th>
            <td className="p-2 border">03-5856-8200</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">Payment methods</th>
            <td className="p-2 border">Credit card</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">Sales price</th>
            <td className="p-2 border">As stated on each product page</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">Additional fees</th>
            <td className="p-2 border">Optional services and insurance</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">Payment timing</th>
            <td className="p-2 border">Based on the payment processor&apos;s schedule</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">New reservations</th>
            <td className="p-2 border">By 5:00 p.m. the day before use (or the previous business day if closed)</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">Reservation changes</th>
            <td className="p-2 border">By 5:00 p.m. the day before use (or the previous business day if closed)</td>
          </tr>
          <tr>
            <th className="text-left w-40 p-2 border">Cancellations</th>
            <td className="p-2 border">
              No cancellation fee up to 4 days before the reservation date. From 3 days prior to the day of use, a 50% cancellation
              fee applies.
            </td>
          </tr>
        </tbody>
      </table>
      <p className="mt-6 text-center text-gray-500 text-sm">Copyright Rental Bike &quot;Yasukari&quot;.</p>
    </div>
  )
}
