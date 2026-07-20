import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import type { Reservation } from '../../../lib/reservations';
import ReservationStatusBadge from '../../../components/ReservationStatusBadge';

const statusLabel = (status?: string) => {
  if (!status) return '-';
  if (status === '予約完了') return 'Completed';
  if (status === 'キャンセル') return 'Canceled';
  return status;
};

const isCompletedStatus = (status?: string) =>
  status === '予約完了' || status?.toLowerCase() === 'completed';

const isCanceledStatus = (status?: string) =>
  status === 'キャンセル' ||
  status?.toLowerCase() === 'canceled' ||
  status?.toLowerCase() === 'cancelled';

export default function PastReservationsPage() {
  const paymentInfoUrl = process.env.NEXT_PUBLIC_PAYMENT_INFO_URL ?? '/en/notifications';
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
          setError('Could not confirm your sign-in status. Please try again later.');
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
            reservation.reservationCompletedFlag || isCompletedStatus(reservation.status);
          return isCompleted || isCanceledStatus(reservation.status);
        });

        setReservations(pastReservations);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err);
          setReservationsError('Could not load your reservations. Please try again later.');
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

    return parsed.toLocaleString('en-US', {
      timeZone: 'Asia/Tokyo',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const reservationCompletionLabel = (flag: boolean) => (flag ? 'Reservation complete' : 'In use');

  return (
    <>
      <Head>
        <title>Past Reservations</title>
      </Head>
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-12">
        <header className="space-y-2 text-sm text-slate-600">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <a href="/en" className="text-red-600 hover:underline">
                  Home
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/en/mypage" className="text-red-600 hover:underline">
                  My Page
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-600">Past Reservations</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-semibold text-slate-900">Past Reservations</h1>
          <p className="text-sm text-slate-500">Review completed and canceled bookings.</p>
        </header>

        {loading ? (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-700">Checking your sign-in status…</p>
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
                  <h2 className="text-lg font-semibold text-slate-900">Reservation history</h2>
                  <p className="mt-1 text-sm text-slate-600">A list of previous bookings appears below.</p>
                </div>
                <Link
                  href="/en/mypage"
                  className="inline-flex items-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Back to reservations
                </Link>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-700">
                {reservationsError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                    {reservationsError}
                  </p>
                ) : loadingReservations ? (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                    Loading reservation data…
                  </p>
                ) : reservations.length === 0 ? (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                    You do not have any past reservations yet.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {reservations.map((reservation) => {
                      const manualVideoUrl = reservation.videoUrl?.trim();

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
                              <ReservationStatusBadge
                                status={reservation.status}
                                label={statusLabel(reservation.status)}
                              />
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                  reservation.reservationCompletedFlag
                                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                                }`}
                              >
                                {reservationCompletionLabel(reservation.reservationCompletedFlag)}
                              </span>
                            </div>
                          </div>
                          {reservation.vehicleChangedAt && !reservation.vehicleChangeNotified && (
                            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                              The vehicle has been changed by the administrator. New vehicle: {reservation.vehicleCode} /{' '}
                              {reservation.vehiclePlate || 'Not set'}
                            </p>
                          )}
                          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                              <dt className="text-xs text-slate-500">Pickup → Return</dt>
                              <dd className="font-semibold text-slate-900">
                                {formatReservationDatetime(reservation.pickupAt)} →{' '}
                                {formatReservationDatetime(reservation.returnAt)}
                              </dd>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                              <dt className="text-xs text-slate-500">Reservation details</dt>
                              <dd className="font-semibold text-slate-900">
                                Vehicle code: {reservation.vehicleCode || '-'} / Plate number:{' '}
                                {reservation.vehiclePlate || 'Not set'}
                              </dd>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                              <dt className="text-xs text-slate-500">Payment amount</dt>
                              <dd className="font-semibold text-slate-900">
                                {reservation.paymentAmount} yen
                              </dd>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                              <dt className="text-xs text-slate-500">Payment date</dt>
                              <dd className="font-semibold text-slate-900">
                                {reservation.paymentDate
                                  ? formatReservationDatetime(reservation.paymentDate)
                                  : 'Not recorded'}
                              </dd>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                              <dt className="text-xs text-slate-500">Completion date (storage only)</dt>
                              <dd className="font-semibold text-slate-900">
                                {reservation.rentalCompletedAt
                                  ? formatReservationDatetime(reservation.rentalCompletedAt)
                                  : 'Not set'}
                              </dd>
                            </div>
                          </dl>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {manualVideoUrl ? (
                              <Link
                                href={manualVideoUrl}
                                className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-100"
                                target="_blank"
                                rel="noreferrer"
                              >
                                Watch manual video
                              </Link>
                            ) : null}
                            <Link
                              href={paymentInfoUrl}
                              className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Check payment info
                            </Link>
                            <Link
                              href={rentalContractBaseUrl ?? `/rental-contract/${reservation.id}`}
                              className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 transition hover:border-amber-300 hover:bg-amber-100"
                              target="_blank"
                              rel="noreferrer"
                            >
                              View rental contract
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
