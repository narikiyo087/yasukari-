import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import type { RegistrationData } from '../../../types/registration';
import { REQUIRED_REGISTRATION_FIELDS } from '../../../types/registration';
import type { Reservation } from '../../../lib/reservations';
import { formatDisplayPhoneNumber } from '../../../lib/phoneNumber';
import { prepareImageForUpload } from '../../../lib/imageProcessing';

type SessionUser = {
  id: string;
  email?: string;
  username?: string;
};

type UserAttributes = {
  phone_number?: string;
  'custom:handle'?: string;
  'custom:locale'?: string;
  name?: string;
};

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

export default function MyPageEn() {
  const paymentInfoUrl = process.env.NEXT_PUBLIC_PAYMENT_INFO_URL ?? '/en/notifications';
  const rentalContractBaseUrl = process.env.NEXT_PUBLIC_RENTAL_CONTRACT_URL;

  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [attributes, setAttributes] = useState<UserAttributes | null>(null);
  const [attributesError, setAttributesError] = useState('');
  const [loadingAttributes, setLoadingAttributes] = useState(true);
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [registrationError, setRegistrationError] = useState('');
  const [loadingRegistration, setLoadingRegistration] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsError, setReservationsError] = useState('');
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [showCancelNotice, setShowCancelNotice] = useState(false);
  const [showAccidentModal, setShowAccidentModal] = useState(false);
  const [accidentFile, setAccidentFile] = useState<File | null>(null);
  const [accidentError, setAccidentError] = useState('');
  const [accidentUploading, setAccidentUploading] = useState(false);
  const [accidentSubmitted, setAccidentSubmitted] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnFile, setReturnFile] = useState<File | null>(null);
  const [returnError, setReturnError] = useState('');
  const [returnUploading, setReturnUploading] = useState(false);
  const [returnStep, setReturnStep] = useState<'check' | 'survey' | 'done'>('check');
  const [returnRating, setReturnRating] = useState(0);
  const [returnSurvey, setReturnSurvey] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const router = useRouter();

  const resetAccidentModal = () => {
    setAccidentFile(null);
    setAccidentError('');
    setAccidentUploading(false);
    setAccidentSubmitted(false);
  };

  const resetReturnModal = () => {
    setReturnFile(null);
    setReturnError('');
    setReturnUploading(false);
    setReturnStep('check');
    setReturnRating(0);
    setReturnSurvey('');
    setReturnSubmitting(false);
  };

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

        const data = (await response.json().catch(() => ({}))) as { user?: SessionUser | null };
        if (!data.user) {
          await router.replace('/login');
          return;
        }

        setUser({
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
        });
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err);
          setError('Failed to confirm your session. Please try again later.');
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
    const fetchAttributes = async () => {
      try {
        const response = await fetch('/api/user/attributes', {
          credentials: 'include',
          signal: controller.signal,
        });

        if (response.status === 401) {
          await router.replace('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('failed to load attributes');
        }

        const data = (await response.json()) as { attributes?: UserAttributes };
        setAttributes(data.attributes ?? {});
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err);
          setAttributesError('Could not load your profile details. Please try again later.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingAttributes(false);
        }
      }
    };

    void fetchAttributes();
    return () => controller.abort();
  }, [loading, router]);

  useEffect(() => {
    if (loading) return;

    const controller = new AbortController();
    const fetchRegistration = async () => {
      try {
        const response = await fetch('/api/register/user', {
          credentials: 'include',
          signal: controller.signal,
        });

        if (response.status === 401) {
          await router.replace('/login');
          return;
        }

        if (response.status === 404) {
          setRegistration(null);
          return;
        }

        if (!response.ok) {
          throw new Error('failed to load registration');
        }

        const data = (await response.json()) as { registration?: RegistrationData | null };
        setRegistration(data.registration ?? null);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err);
          setRegistrationError('Could not load your full registration. Please try again later.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingRegistration(false);
        }
      }
    };

    void fetchRegistration();
    return () => controller.abort();
  }, [loading, router]);

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
        const canceledReservations = allReservations.filter(
          (reservation) => isCanceledStatus(reservation.status)
        );
        const activeReservations = allReservations.filter((reservation) => {
          const isCompleted =
            reservation.reservationCompletedFlag || isCompletedStatus(reservation.status);
          return !isCompleted && !isCanceledStatus(reservation.status);
        });

        if (canceledReservations.length > 0 && typeof window !== 'undefined') {
          const storageKey = 'yasukari-cancelled-reservation-ids';
          let seenIds: string[] = [];

          try {
            const stored = window.localStorage.getItem(storageKey);
            if (stored) {
              const parsed = JSON.parse(stored) as unknown;
              if (Array.isArray(parsed)) {
                seenIds = parsed.filter((value): value is string => typeof value === 'string');
              }
            }
          } catch (storageError) {
            console.warn('Failed to parse cancelled reservation cache', storageError);
          }

          const canceledIds = canceledReservations.map((reservation) => reservation.id);
          const unseenIds = canceledIds.filter((id) => !seenIds.includes(id));

          if (unseenIds.length > 0) {
            setShowCancelNotice(true);
          }

          const mergedIds = Array.from(new Set([...seenIds, ...canceledIds]));
          window.localStorage.setItem(storageKey, JSON.stringify(mergedIds));
        }

        setReservations(activeReservations);
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

  const localeLabel = (value: string | undefined) => {
    if (!value) return 'Not set';
    const normalized = value.toLowerCase();
    if (normalized.startsWith('ja') || normalized.startsWith('jp')) return 'Japanese region';
    if (normalized.startsWith('en')) return 'English-speaking region';
    return value;
  };

  const formatPhoneLabel = (value?: string) => {
    const formatted = formatDisplayPhoneNumber(value);
    return formatted || 'Not set';
  };

  const sexLabel = (value: string | undefined) => {
    if (value === '1') return 'Male';
    if (value === '2') return 'Female';
    return 'Not set';
  };

  const isRegistrationComplete = useMemo(() => {
    if (!registration) return false;
    return REQUIRED_REGISTRATION_FIELDS.every((field) => Boolean(registration[field]));
  }, [registration]);

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

  const markVehicleChangeSeen = async (reservationId: string) => {
    try {
      await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleChangeNotified: true }),
      });

      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.id === reservationId
            ? { ...reservation, vehicleChangeNotified: true }
            : reservation
        )
      );
    } catch (error) {
      console.error('Failed to mark vehicle change as seen', error);
    }
  };

  useEffect(() => {
    reservations.forEach((reservation) => {
      if (reservation.vehicleChangedAt && !reservation.vehicleChangeNotified) {
        void markVehicleChangeSeen(reservation.id);
      }
    });
  }, [reservations]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const response = await fetch('/api/logout', { method: 'POST', credentials: 'include' });
      if (!response.ok) {
        throw new Error(`failed to logout: ${response.status}`);
      }

      await router.replace('/login');
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError('Failed to log out. Please try again later.');
      setLoggingOut(false);
    }
  };

  const handleAccidentOpen = () => {
    resetAccidentModal();
    setShowAccidentModal(true);
  };

  const handleAccidentClose = () => {
    setShowAccidentModal(false);
    resetAccidentModal();
  };

  const handleAccidentSubmit = async () => {
    if (!accidentFile) {
      setAccidentError('Please upload a photo.');
      return;
    }

    setAccidentError('');
    setAccidentUploading(true);

    try {
      const { base64, fileName, contentType } = await prepareImageForUpload(accidentFile);
      const response = await fetch('/api/accident-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: base64,
          fileName,
          contentType,
        }),
      });

      if (!response.ok) {
        const message = (await response.json())?.message ?? 'Submission failed.';
        throw new Error(message);
      }

      setAccidentSubmitted(true);
    } catch (error) {
      console.error('Failed to submit accident report', error);
      setAccidentError(error instanceof Error ? error.message : 'Submission failed.');
    } finally {
      setAccidentUploading(false);
    }
  };

  const activeReturnReservation =
    reservations.find((reservation) => !reservation.reservationCompletedFlag) ?? null;
  const hasActiveReservation = reservations.length > 0;

  const handleReturnOpen = () => {
    resetReturnModal();
    setShowReturnModal(true);
  };

  const handleReturnClose = () => {
    setShowReturnModal(false);
    resetReturnModal();
  };

  const handleReturnComplete = async () => {
    if (!returnFile) {
      setReturnError('Please upload a photo.');
      return;
    }

    setReturnError('');
    setReturnUploading(true);

    try {
      const { base64, fileName, contentType } = await prepareImageForUpload(returnFile);
      const response = await fetch('/api/return-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: base64,
          fileName,
          contentType,
        }),
      });

      if (!response.ok) {
        const message = (await response.json())?.message ?? 'Submission failed.';
        throw new Error(message);
      }

      setReturnStep('survey');
    } catch (error) {
      console.error('Failed to submit return report', error);
      setReturnError(error instanceof Error ? error.message : 'Submission failed.');
    } finally {
      setReturnUploading(false);
    }
  };

  const handleReturnSubmit = async () => {
    if (!activeReturnReservation) {
      setReturnError('We could not find the active reservation to return.');
      return;
    }

    setReturnSubmitting(true);
    setReturnError('');

    try {
      const response = await fetch(`/api/reservations/${activeReturnReservation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: '予約完了',
          reservationCompletedFlag: true,
          returnRating,
          returnSurvey,
        }),
      });

      if (!response.ok) {
        const message = (await response.json())?.error ?? 'Failed to update reservation status.';
        throw new Error(message);
      }

      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.id === activeReturnReservation.id
            ? { ...reservation, status: '予約完了', reservationCompletedFlag: true }
            : reservation
        )
      );
      setReturnStep('done');
    } catch (error) {
      console.error('Failed to submit return survey', error);
      setReturnError(error instanceof Error ? error.message : 'Submission failed.');
    } finally {
      setReturnSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>My Page</title>
      </Head>
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-12">
        <header className="space-y-2 text-sm text-gray-600">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <a href="/en" className="text-red-600 hover:underline">
                  Home
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-600">My Page</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-semibold text-gray-900">My Page</h1>
          <p className="text-sm text-gray-500">View and manage your current profile details.</p>
          <div className="mt-3 rounded-lg border border-rose-300 bg-gradient-to-r from-rose-50 via-rose-100 to-rose-50 p-4 text-xs text-rose-900 shadow-sm ring-1 ring-rose-200/70">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-200 text-lg text-rose-700 shadow-sm"
              >
                ⚠️
              </span>
              <div>
                <p className="text-sm font-semibold text-rose-900">Guidance for breakdowns</p>
                <p className="mt-2">
                  If your bike breaks down while riding within 180 km of the rental store, you can use our 24/7 roadside
                  assistance at no extra cost. Please call the store during business hours, or contact roadside assistance
                  directly outside business hours.
                </p>
                <p className="mt-2 font-semibold">Roadside assistance: 0120-024-024</p>
                <p className="mt-2 font-semibold">Yasukari phone: 03-5856-8075</p>
                <Link
                  href="/en/help"
                  className="mt-3 inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100"
                >
                  View the FAQ
                </Link>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-700">Checking your sign-in status…</p>
          </section>
        ) : (
          <>
            {error ? (
              <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
                <p className="text-sm text-red-700">{error}</p>
              </section>
            ) : null}

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Reservations</h2>
                  <p className="mt-1 text-sm text-gray-600">Your latest bookings and usage will appear here.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/en/mypage/past-reservations"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                  >
                    Past reservations
                  </Link>
                  {hasActiveReservation ? (
                    <button
                      type="button"
                      className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200"
                    >
                      Reservation details
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-md ring-2 ring-inset ring-sky-200 ring-offset-1 ring-offset-white transition hover:bg-sky-700"
                >
                  Extend rental
                </button>
                <button
                  type="button"
                  onClick={handleReturnOpen}
                  disabled={!activeReturnReservation}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md ring-2 ring-inset ring-emerald-200 ring-offset-1 ring-offset-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300 disabled:text-white disabled:ring-emerald-100"
                >
                  Return
                </button>
                <button
                  type="button"
                  onClick={handleAccidentOpen}
                  className="inline-flex items-center justify-center rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md ring-2 ring-inset ring-rose-200 ring-offset-1 ring-offset-white transition hover:bg-rose-700"
                >
                  Accident / fall
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-gray-700">
                {reservationsError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">{reservationsError}</p>
                ) : loadingReservations ? (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">Loading reservation data…</p>
                ) : reservations.length === 0 ? (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
                    You have no active reservations right now. Completed bookings are listed under Past reservations.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {reservations.map((reservation) => {
                      const manualVideoUrl = reservation.videoUrl?.trim();

                      return (
                        <li
                          key={reservation.id}
                          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm ring-1 ring-gray-100"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <img
                                src={
                                  reservation.vehicleThumbnailUrl ||
                                  '/image/vehicle-thumbnail-placeholder.svg'
                                }
                                alt={
                                  reservation.vehicleModel
                                    ? `${reservation.vehicleModel} thumbnail`
                                    : 'Vehicle thumbnail'
                                }
                                className="h-12 w-12 rounded-md border border-gray-200 bg-white object-cover shadow-sm"
                                loading="lazy"
                              />
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {reservation.storeName} / {reservation.vehicleModel}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {reservation.vehicleCode} {reservation.vehiclePlate}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                                {statusLabel(reservation.status)}
                              </span>
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
                              The vehicle has been updated by our staff. New vehicle: {reservation.vehicleCode} /{' '}
                              {reservation.vehiclePlate || 'Not set'}
                            </p>
                          )}
                          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                              <dt className="text-xs text-gray-500">Pickup → Return</dt>
                              <dd className="font-semibold text-gray-900">
                                {formatReservationDatetime(reservation.pickupAt)} → {formatReservationDatetime(reservation.returnAt)}
                              </dd>
                            </div>
                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                              <dt className="text-xs text-gray-500">Reservation details</dt>
                              <dd className="font-semibold text-gray-900">
                                Vehicle code: {reservation.vehicleCode || '-'} / Plate number: {reservation.vehiclePlate || 'Not set'}
                              </dd>
                            </div>
                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                              <dt className="text-xs text-gray-500">Payment amount</dt>
                              <dd className="font-semibold text-gray-900">{reservation.paymentAmount} yen</dd>
                            </div>
                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                              <dt className="text-xs text-gray-500">Payment date</dt>
                              <dd className="font-semibold text-gray-900">
                                {reservation.paymentDate ? formatReservationDatetime(reservation.paymentDate) : 'Not recorded'}
                              </dd>
                            </div>
                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                              <dt className="text-xs text-gray-500">Completion date (storage only)</dt>
                              <dd className="font-semibold text-gray-900">
                                {reservation.rentalCompletedAt ? formatReservationDatetime(reservation.rentalCompletedAt) : 'Not set'}
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

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Profile information</h2>
                </div>
                <Link
                  href="/en/mypage/profile-setup"
                  className="inline-flex items-center rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:text-red-800"
                >
                  Edit basic info
                </Link>
              </div>

              {attributesError ? (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{attributesError}</p>
              ) : null}

              {loadingAttributes ? (
                <p className="mt-3 text-sm text-gray-700">Loading your profile…</p>
              ) : attributes ? (
                <dl className="mt-4 grid gap-4 text-sm text-gray-700 md:grid-cols-2">
                  <div>
                    <dt className="font-medium text-gray-600">Phone number</dt>
                    <dd className="mt-1 text-gray-800">{formatPhoneLabel(attributes.phone_number)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-600">Handle name</dt>
                    <dd className="mt-1 text-gray-800">{attributes['custom:handle'] ?? 'Not set'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-600">Location / language</dt>
                    <dd className="mt-1 text-gray-800">{localeLabel(attributes['custom:locale'])}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-600">Nickname</dt>
                    <dd className="mt-1 text-gray-800">{attributes.name ?? 'Not set'}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-3 text-sm text-gray-700">We couldn&apos;t load your profile details.</p>
              )}
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Full registration</h2>
                  <p className="mt-1 text-sm text-gray-600">Enter the required details for rentals.</p>
                  {loadingRegistration ? null : registration ? (
                    isRegistrationComplete ? (
                      <p className="mt-2 inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-200">
                        Registration complete
                      </p>
                    ) : (
                      <p className="mt-2 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                        Registration incomplete
                      </p>
                    )
                  ) : (
                    <p className="mt-2 inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-200">
                      No registration saved yet
                    </p>
                  )}
                </div>
                <Link
                  href="/en/mypage/registration"
                  className="inline-flex items-center rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Go to registration form
                </Link>
              </div>
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                {registrationError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">{registrationError}</p>
                ) : null}

                {loadingRegistration ? (
                  <p>Loading your registration details…</p>
                ) : registration ? (
                  <div className="space-y-3">
                    {!isRegistrationComplete ? (
                      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                        Some required fields are missing. Please review and complete your registration.
                      </p>
                    ) : null}
                    <dl className="grid gap-4 md:grid-cols-2">
                      <div>
                        <dt className="text-xs font-semibold text-gray-500">Name</dt>
                        <dd className="mt-1 text-gray-900">{`${registration.name1} ${registration.name2}`}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-gray-500">Furigana</dt>
                        <dd className="mt-1 text-gray-900">{`${registration.kana1} ${registration.kana2}`}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-gray-500">Gender</dt>
                        <dd className="mt-1 text-gray-900">{sexLabel(registration.sex)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-gray-500">Address</dt>
                        <dd className="mt-1 text-gray-900">{`〒${registration.zip} ${registration.address1} ${registration.address2}`}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-gray-500">Birthday</dt>
                        <dd className="mt-1 text-gray-900">{registration.birth}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-gray-500">License number</dt>
                        <dd className="mt-1 text-gray-900">{registration.license ? 'Registered (number hidden)' : 'Not registered'}</dd>
                      </div>
                    </dl>
                  </div>
                ) : (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
                    No registration details yet. Please fill out the form to proceed.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Log out</h2>
              <p className="mt-2 text-sm text-gray-600">
                Logging out will hide My Page until you sign in again.
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                disabled={!user || loggingOut}
              >
                {loggingOut ? 'Processing…' : 'Log out'}
              </button>
            </section>
          </>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Helpful links</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li>
              <Link className="text-red-600 hover:underline" href="/en/pricing">
                View pricing
              </Link>
            </li>
            <li>
              <Link className="text-red-600 hover:underline" href="/en/help">
                Help center
              </Link>
            </li>
          </ul>
        </section>
      </main>
      {showCancelNotice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Reservation cancellation notice</h2>
            <p className="mt-3 text-sm text-gray-700">
              Your reservation has been marked as cancelled by our staff. If you have any
              questions, please contact support.
            </p>
            <button
              type="button"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              onClick={() => setShowCancelNotice(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
      {showAccidentModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-rose-200 bg-white p-6 shadow-2xl ring-1 ring-rose-100">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Accident / fall report</h2>
                <p className="mt-2 text-sm text-gray-600">Please send a photo of the bike&apos;s condition.</p>
              </div>
              <button
                type="button"
                onClick={handleAccidentClose}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-gray-600">Photo upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  setAccidentSubmitted(false);
                  setAccidentError('');
                  const file = event.target.files?.[0] ?? null;
                  setAccidentFile(file);
                }}
                className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
              />
              <label className="block text-xs font-semibold text-gray-600 sm:hidden">
                Take a photo on your phone and upload
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(event) => {
                    setAccidentSubmitted(false);
                    setAccidentError('');
                    const file = event.target.files?.[0] ?? null;
                    setAccidentFile(file);
                  }}
                  className="mt-2 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                />
              </label>
              {accidentError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {accidentError}
                </p>
              ) : null}
              <button
                type="button"
                onClick={handleAccidentSubmit}
                disabled={accidentUploading}
                className="inline-flex w-full items-center justify-center rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {accidentUploading ? 'Sending…' : 'Send'}
              </button>
              {accidentSubmitted ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  <p className="font-semibold">Your report has been submitted.</p>
                  <div className="mt-3 space-y-2 text-xs text-emerald-900">
                    <p>① Roadside assistance contact details</p>
                    <p>② Insurance coverage information</p>
                    <p className="pl-4 text-[11px] text-emerald-800">
                      → Please confirm details with the insurance company handling the tow.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {showReturnModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-amber-200 bg-white p-6 shadow-2xl ring-1 ring-amber-100">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Bike return</h2>
                {returnStep === 'survey' ? (
                  <p className="mt-2 text-sm text-gray-600">Thank you for riding with us!</p>
                ) : returnStep === 'done' ? (
                  <p className="mt-2 text-sm text-gray-600">Submission complete.</p>
                ) : (
                  <p className="mt-2 text-sm text-gray-600">Were you able to park inside the designated area?</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleReturnClose}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
              >
                Close
              </button>
            </div>
            {returnStep === 'check' ? (
              <div className="mt-4 space-y-3">
                <label className="block text-xs font-semibold text-gray-600">Photo upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    setReturnError('');
                    const file = event.target.files?.[0] ?? null;
                    setReturnFile(file);
                  }}
                  className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                />
                <label className="block text-xs font-semibold text-gray-600 sm:hidden">
                  Take a photo on your phone and upload
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) => {
                      setReturnError('');
                      const file = event.target.files?.[0] ?? null;
                      setReturnFile(file);
                    }}
                    className="mt-2 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                  />
                </label>
                {returnError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{returnError}</p>
                ) : null}
                <button
                  type="button"
                  onClick={handleReturnComplete}
                  disabled={returnUploading}
                  className="inline-flex w-full items-center justify-center rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  {returnUploading ? 'Sending…' : 'Complete return'}
                </button>
              </div>
            ) : null}
            {returnStep === 'survey' ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">Overall rating</p>
                  <p className="mt-1 text-xs text-gray-600">How was the bike?</p>
                  <div className="mt-3 flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setReturnRating(value)}
                        aria-label={`${value} star`}
                        className={`text-2xl transition ${
                          returnRating >= value ? 'text-amber-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">Survey</p>
                  <p className="mt-1 text-xs text-gray-600">Is there a bike you&apos;d like to try next?</p>
                  <textarea
                    value={returnSurvey}
                    onChange={(event) => setReturnSurvey(event.target.value)}
                    rows={3}
                    className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    placeholder="Example: I&apos;m interested in an electric bike"
                  />
                </div>
                {returnError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{returnError}</p>
                ) : null}
                <button
                  type="button"
                  onClick={handleReturnSubmit}
                  disabled={returnSubmitting}
                  className="inline-flex w-full items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                >
                  {returnSubmitting ? 'Sending…' : 'Send'}
                </button>
              </div>
            ) : null}
            {returnStep === 'done' ? (
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
                  Thanks for your cooperation. Your reservation status has been updated.
                </p>
                <button
                  type="button"
                  onClick={handleReturnClose}
                  className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Close
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
