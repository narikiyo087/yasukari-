import Head from "next/head";
import Link from "next/link";

export default function PaymentInfoCompletePage() {
  return (
    <>
      <Head>
        <title>決済情報の確認完了 | ヤスカリ</title>
      </Head>
      <main className="min-h-screen bg-gray-50 pb-16">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
          <header className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Payment Info Complete</p>
            <h1 className="text-3xl font-bold text-gray-900">決済情報の確認が完了しました</h1>
            <p className="text-sm text-gray-600">
              ご登録いただいた決済情報はマイページからいつでもご確認いただけます。
            </p>
          </header>

          <section className="space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Next Action</p>
                  <p className="text-lg font-semibold text-gray-900">予約状況の確認に進めます</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                  <Link
                    href="/mypage"
                    className="inline-flex items-center justify-center rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-red-600"
                  >
                    マイページへ
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:border-gray-300"
                  >
                    トップへ戻る
                  </Link>
                </div>
              </div>

              <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="font-semibold">次のステップ</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>マイページから予約状況や決済情報を確認できます。</li>
                  <li>変更が必要な場合はサポートまでご連絡ください。</li>
                  <li>ご不明点があればヘルプページをご覧ください。</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
