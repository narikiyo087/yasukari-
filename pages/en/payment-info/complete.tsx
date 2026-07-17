import Head from "next/head";
import Link from "next/link";

export default function PaymentInfoCompletePage() {
  return (
    <>
      <Head>
        <title>Payment Info Confirmed | ヤスカリ</title>
      </Head>
      <main className="min-h-screen bg-slate-50 pb-16">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
          <header className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Payment Info Complete</p>
            <h1 className="text-3xl font-bold text-slate-900">Your payment information is confirmed</h1>
            <p className="text-sm text-slate-600">
              You can review your saved payment details anytime from your My Page dashboard.
            </p>
          </header>

          <section className="space-y-4">
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-100 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next Action</p>
                  <p className="text-lg font-semibold text-slate-900">Check your reservation status</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                  <Link
                    href="/en/mypage"
                    className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-red-700"
                  >
                    Go to My Page
                  </Link>
                  <Link
                    href="/en"
                    className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>

              <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="font-semibold">Next steps</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Review your reservation status and payment information on My Page.</li>
                  <li>Contact support if any updates are needed.</li>
                  <li>Visit the Help page if you have questions.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
