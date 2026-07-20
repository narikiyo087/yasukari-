import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import type { Reservation } from '../../lib/reservations';

export default function PastReservationsPage() {
  const paymentInfoUrl = process.env.NEXT_PUBLIC_PAYMENT_INFO_URL ?? '/notifications';
  const rentalContractBaseUrl = process.env.NEXT_PUBLIC_RENTAL_CONTRACT_URL;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsError, setReservationsError] = useState('');
  const [loadingReservations, setLoadingReservations] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/me', {
          credentials: 'include',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('failed to load profile');
        }

        const data = (await response.json().catch(() => ({}))) as { user?: { id?: string } | null };
        if (!data.user) {
          await router.replace('/login');
          return;
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err);
          setError('ログイン状態の確認に失敗しました。時間をおいて再度お試しください。');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchUser();
    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    if (loading) return;

    const controller = new AbortController();
    const fetchReservations = async () => {
      try {
        const response = await fetch('/api/reservations/me', {
          credentials: 'include',
          signal: controller.signal,
        });

        if (response.status === 401) {
          await router.replace('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('failed to load reservations');
        }

        const data = (await response.json()) as { reservations?: Reservation[] };
        const allReservations = data.reservations ?? [];
        const pastReservations = allReservations.filter((reservation) => {
          const isCompleted =
            reservation.reservationCompletedFlag || reservation.status === '予約完了';
          return isCompleted || reservation.status === 'キャンセル';
        });

        setReservations(pastReservations);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err);
          setReservationsError('予約状況の取得に失敗しました。時間をおいて再度お試しください。');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingReservations(false);
        }
      }
    };

    void fetchReservations();
    return () => controller.abort();
  }, [loading, router]);

  const formatReservationDatetime = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';

    return parsed.toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const reservationCompletionLabel = (flag: boolean) => (flag ? '予約完了' : '利用中');

  return (
    <>
      <Head>
        <title>過去の予約</title>
      </Head>
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-12">
        <header className="space-y-2 text-sm text-slate-600">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <a href="/" className="text-red-600 hover:underline">
                  ホーム
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/mypage" className="text-red-600 hover:underline">
                  マイページ
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-600">過去の予約</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-semibold text-slate-900">過去の予約</h1>
          <p className="text-sm text-slate-500">完了した予約やキャンセル済みの予約を確認できます。</p>
        </header>

        {loading ? (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-700">ログイン状態を確認しています…</p>
          </section>
        ) : (
          <>
            {error ? (
              <section className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
                <p className="text-sm text-red-700">{error}</p>
              </section>
            ) : null}

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">予約履歴</h2>
                  <p className="mt-1 text-sm text-slate-600">これまでのご利用履歴を表示します。</p>
                </div>
                <Link
                  href="/mypage"
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  予約状況へ戻る
                </Link>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-700">
                {reservationsError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                    {reservationsError}
                  </p>
                ) : loadingReservations ? (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                    予約データを読み込み中です…
                  </p>
                ) : reservations.length === 0 ? (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                    過去の予約はまだありません。
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {reservations.map((reservation) => {
                      const manualVideoUrl = reservation.videoUrl?.trim();
                      const isMinowaStore = reservation.storeName?.includes('三ノ輪');
                      const hasKeyboxInfo =
                        Boolean(reservation.keyboxPinCode) ||
                        Boolean(reservation.keyboxQrCode) ||
                        Boolean(reservation.keyboxQrImageUrl);

                      return (
                        <li
                          key={reservation.id}
                          className="rounded-md border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {reservation.storeName} / {reservation.vehicleModel}
                              </p>
                              <p className="text-xs text-slate-600">
                                {reservation.vehicleCode} {reservation.vehiclePlate}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="inline-flex items-center rounded bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                                {reservation.status}
                              </span>
                              {reservationCompletionLabel(reservation.reservationCompletedFlag) !==
                                reservation.status && (
                                <span
                                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                    reservation.reservationCompletedFlag
                                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                      : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                                  }`}
                                >
                                  {reservationCompletionLabel(reservation.reservationCompletedFlag)}
                                </span>
                              )}
                            </div>
                          </div>
                          {reservation.vehicleChangedAt && !reservation.vehicleChangeNotified && (
                            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                              管理側で車両が変更されました。新しい車両: {reservation.vehicleCode} /{' '}
                              {reservation.vehiclePlate || '未設定'}
                            </p>
                          )}
                          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                              <dt className="text-xs text-slate-500">貸出〜返却</dt>
                              <dd className="font-semibold text-slate-900">
                                {formatReservationDatetime(reservation.pickupAt)} →{' '}
                                {formatReservationDatetime(reservation.returnAt)}
                              </dd>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                              <dt className="text-xs text-slate-500">ご予約情報</dt>
                              <dd className="font-semibold text-slate-900">
                                車両コード: {reservation.vehicleCode || '-'} / ナンバープレート:{' '}
                                {reservation.vehiclePlate || '未設定'}
                              </dd>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                              <dt className="text-xs text-slate-500">決済金額</dt>
                              <dd className="font-semibold text-slate-900">
                                {reservation.paymentAmount} 円
                              </dd>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                              <dt className="text-xs text-slate-500">決済日時</dt>
                              <dd className="font-semibold text-slate-900">
                                {reservation.paymentDate
                                  ? formatReservationDatetime(reservation.paymentDate)
                                  : '未登録'}
                              </dd>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                              <dt className="text-xs text-slate-500">完了日時（保管のみ）</dt>
                              <dd className="font-semibold text-slate-900">
                                {reservation.rentalCompletedAt
                                  ? formatReservationDatetime(reservation.rentalCompletedAt)
                                  : '未設定'}
                              </dd>
                            </div>
                            {isMinowaStore ? (
                              <div className="rounded-lg bg-slate-50 px-3 py-2 sm:col-span-2">
                                <dt className="text-xs text-slate-500">三ノ輪店：発行済みPIN/QR履歴</dt>
                                {hasKeyboxInfo ? (
                                  <dd className="mt-2 space-y-2 text-slate-900">
                                    <p className="font-semibold">
                                      PINコード: {reservation.keyboxPinCode || '未発行'}
                                    </p>
                                    <p className="break-all text-xs text-slate-700">
                                      QRコード: {reservation.keyboxQrCode || '未発行'}
                                    </p>
                                    {reservation.keyboxQrImageUrl ? (
                                      <a
                                        href={reservation.keyboxQrImageUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:underline"
                                      >
                                        <img
                                          src={reservation.keyboxQrImageUrl}
                                          alt="過去の解錠用QRコード"
                                          className="h-20 w-20 rounded border border-slate-200 bg-white p-1"
                                        />
                                        QR画像を拡大表示
                                      </a>
                                    ) : null}
                                  </dd>
                                ) : (
                                  <dd className="mt-1 text-xs text-slate-600">発行履歴はありません。</dd>
                                )}
                              </div>
                            ) : null}
                          </dl>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {manualVideoUrl ? (
                              <Link
                                href={manualVideoUrl}
                                className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-100"
                                target="_blank"
                                rel="noreferrer"
                              >
                                マニュアル動画を見る
                              </Link>
                            ) : null}
                            <Link
                              href={paymentInfoUrl}
                              className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
                              target="_blank"
                              rel="noreferrer"
                            >
                              決済情報を確認
                            </Link>
                            <Link
                              href={rentalContractBaseUrl ?? `/rental-contract/${reservation.id}`}
                              className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 transition hover:border-amber-300 hover:bg-amber-100"
                              target="_blank"
                              rel="noreferrer"
                            >
                              貸渡契約書を見る
                            </Link>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
