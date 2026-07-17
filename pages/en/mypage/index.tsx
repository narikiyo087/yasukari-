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
  const rentalContractBaseUrl = process.env.NEXT_PUBLIC_RENTAL_CONTRACT_URL;
  const unmannedRentalGuideUrl = '/blog_for_custmor/2025-09-01-minowa-procedures';

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
  const [showReturnExpiredModal, setShowReturnExpiredModal] = useState(false);
  const [showUnlockQrModal, setShowUnlockQrModal] = useState(false);
  const [returnFile, setReturnFile] = useState<File | null>(null);
  const [returnError, setReturnError] = useState('');
  const [returnUploading, setReturnUploading] = useState(false);
  const [returnStep, setReturnStep] = useState<'check' | 'survey' | 'done'>('check');
  const [returnRating, setReturnRating] = useState(0);
  const [returnSurvey, setReturnSurvey] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [rentalTermsAgreed, setRentalTermsAgreed] = useState(false);
  const [loadingRentalTerms, setLoadingRentalTerms] = useState(true);
  const [rentalTermsError, setRentalTermsError] = useState('');
  const [savingRentalTerms, setSavingRentalTerms] = useState(false);
  const [rentalTermsUpdatedAt, setRentalTermsUpdatedAt] = useState<string | null>(null);
  const [mobileSectionsOpen, setMobileSectionsOpen] = useState({
    reservations: true,
    profile: false,
    registration: false,
    rentalTerms: true,
    logout: false,
    links: false,
  });
  const router = useRouter();
  const sectionActionClass = 'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold';

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

  const toggleMobileSection = (key: keyof typeof mobileSectionsOpen) => {
    setMobileSectionsOpen((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
    }));
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
    if (!user || error) return;

    const controller = new AbortController();
    const fetchRentalTerms = async () => {
      try {
        setRentalTermsError('');
        setLoadingRentalTerms(true);
        const response = await fetch('/api/user/rental-terms', { signal: controller.signal });

        if (response.status === 401) {
          await router.replace('/en/login');
          return;
        }

        if (response.status === 404) {
          setRentalTermsAgreed(false);
          setRentalTermsUpdatedAt(null);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to load rental terms status');
        }

        const data = (await response.json()) as { agreed?: boolean; agreedAt?: string | null };
        setRentalTermsAgreed(Boolean(data.agreed));
        setRentalTermsUpdatedAt(data.agreedAt ?? null);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err);
          setRentalTermsError('Unable to load your rental terms agreement status. Please try again later.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingRentalTerms(false);
        }
      }
    };

    void fetchRentalTerms();
    return () => controller.abort();
  }, [error, router, user]);

  useEffect(() => {
    if (loading) return;

    let active = true;
    const fetchReservations = async () => {
      try {
        const response = await fetch('/api/reservations/me', {
          credentials: 'include',
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
        const canceledReservations = allReservations.filter((reservation) =>
          isCanceledStatus(reservation.status)
        );
        const activeReservations = allReservations.filter((reservation) => {
          const isCompleted =
            reservation.reservationCompletedFlag || isCompletedStatus(reservation.status);
          return !isCompleted && !isCanceledStatus(reservation.status);
        });

        if (canceledReservations.length > 0 && typeof window !== 'undefined') {
          setShowCancelNotice(true);
        }

        setReservations(activeReservations);
      } catch (err) {
        if (active) {
          console.error(err);
          setReservationsError('Could not load your reservations. Please try again later.');
        }
      } finally {
        if (active) {
          setLoadingReservations(false);
        }
      }
    };

    void fetchReservations();
    const intervalId = window.setInterval(() => {
      void fetchReservations();
    }, 5 * 60 * 1000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
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

  useEffect(() => {
    if (loadingRegistration || !registration || isRegistrationComplete) return;
    if (typeof window === 'undefined') return;

    const storageKey = 'mypage.registration-incomplete-alert';
    if (window.sessionStorage.getItem(storageKey)) return;

    window.sessionStorage.setItem(storageKey, 'true');
    window.alert('Your registration is incomplete or needs to be updated.');
  }, [isRegistrationComplete, loadingRegistration, registration]);

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

  const formatAgreementTimestamp = (value: string | null) => {
    if (!value) return 'Not agreed yet.';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return parsed.toLocaleString('en-US', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const reservationCompletionLabel = (flag: boolean) => (flag ? 'Reservation complete' : 'In use');

  const activeKeyboxQrImageUrl = useMemo(() => {
    const withQr = reservations.find((reservation) => reservation.keyboxQrImageUrl);
    return withQr?.keyboxQrImageUrl ?? null;
  }, [reservations]);

  useEffect(() => {
    if (!activeKeyboxQrImageUrl) {
      setShowUnlockQrModal(false);
    }
  }, [activeKeyboxQrImageUrl]);

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

  const handleRentalTermsToggle = async () => {
    if (loadingRentalTerms || savingRentalTerms) return;

    setSavingRentalTerms(true);
    setRentalTermsError('');

    try {
      const nextAgreed = !rentalTermsAgreed;
      const response = await fetch('/api/user/rental-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreed: nextAgreed }),
      });

      if (response.status === 401) {
        await router.replace('/en/login');
        return;
      }

      const payload = (await response.json().catch(() => ({}))) as { agreedAt?: string | null; message?: string };

      if (response.status === 404) {
        throw new Error(payload.message ?? 'User data was not found. Please complete your registration first.');
      }

      if (!response.ok) {
        throw new Error(payload.message ?? 'Failed to update your rental terms agreement.');
      }

      setRentalTermsAgreed(nextAgreed);
      setRentalTermsUpdatedAt(nextAgreed ? payload.agreedAt ?? new Date().toISOString() : null);
    } catch (err) {
      console.error(err);
      setRentalTermsError(err instanceof Error ? err.message : 'Failed to update your rental terms agreement.');
    } finally {
      setSavingRentalTerms(false);
    }
  };

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
  const isRentalActive = useMemo(() => {
    if (!activeReturnReservation) return false;
    const pickupDate = new Date(activeReturnReservation.pickupAt);
    const returnDate = new Date(activeReturnReservation.returnAt);
    if (Number.isNaN(pickupDate.getTime()) || Number.isNaN(returnDate.getTime())) {
      return true;
    }
    const now = Date.now();
    return now >= pickupDate.getTime() && now <= returnDate.getTime();
  }, [activeReturnReservation]);
  const isReturnOverdue = useMemo(() => {
    if (!activeReturnReservation?.returnAt) return false;
    const returnDate = new Date(activeReturnReservation.returnAt);
    if (Number.isNaN(returnDate.getTime())) return false;
    return Date.now() > returnDate.getTime();
  }, [activeReturnReservation]);
  const extensionTargetReservationId = activeReturnReservation?.id ?? null;
  const reviewStore = useMemo(() => {
    const storeName = activeReturnReservation?.storeName ?? '';
    if (storeName.includes('足立小台')) {
      return {
        name: 'ヤスカリ足立小台本店',
        url: 'https://www.google.com/search?q=%E3%83%A4%E3%82%B9%E3%82%AB%E3%83%AA%E8%B6%B3%E7%AB%8B%E5%B0%8F%E5%8F%B0%E6%9C%AC%E5%BA%97&ludocid=7979404986309780694#lrd=0x60188d90c0ff8031:0x6ebc8a8eeff9a4d6,3,,,',
      };
    }
    if (storeName.includes('三ノ輪')) {
      return {
        name: 'ヤスカリ 三ノ輪店',
        url: 'https://www.google.com/search?q=%E3%83%A4%E3%82%B9%E3%82%AB%E3%83%AA%E4%B8%89%E3%83%8E%E8%BC%AA%E5%BA%97&ludocid=7113364738940764838#lrd=0x60188f4a72299455:0x62b7bf8ab65a82a6,3,,,',
      };
    }
    return null;
  }, [activeReturnReservation?.storeName]);
  const shouldShowRentalActions = useMemo(() => {
    if (!activeReturnReservation) return false;
    if (activeReturnReservation.status === '予約受付完了') return true;
    return isRentalActive;
  }, [activeReturnReservation, isRentalActive]);

  const handleReturnOpen = () => {
    resetReturnModal();
    if (isReturnOverdue) {
      setShowReturnExpiredModal(true);
      return;
    }
    setShowReturnModal(true);
  };

  const handleReturnClose = () => {
    setShowReturnModal(false);
    setShowReturnExpiredModal(false);
    resetReturnModal();
  };

  useEffect(() => {
    if (!isReturnOverdue || !activeReturnReservation) return;

    setShowReturnExpiredModal(true);

    if (typeof window === 'undefined') return;

    const storageKey = 'yasukari-return-overdue-ids';
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
      console.warn('Failed to parse overdue return cache', storageError);
    }

    const reservationId = activeReturnReservation.id;
    if (seenIds.includes(reservationId)) return;

    const notifyOverdue = async () => {
      try {
        await fetch('/api/notifications/overdue-return', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reservationId,
            returnAt: activeReturnReservation.returnAt,
            vehicleModel: activeReturnReservation.vehicleModel,
          }),
        });
      } catch (error) {
        console.error('Failed to notify overdue return', error);
      }
    };

    void notifyOverdue();

    const mergedIds = Array.from(new Set([...seenIds, reservationId]));
    window.localStorage.setItem(storageKey, JSON.stringify(mergedIds));
  }, [activeReturnReservation, isReturnOverdue]);

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
            ? {
                ...reservation,
                status: '予約完了',
                reservationCompletedFlag: true,
              }
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
        <header className="space-y-2 text-sm text-slate-600">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <a href="/en" className="text-red-600 hover:underline">
                  Home
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-600">My Page</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-semibold text-slate-900">My Page</h1>
          <p className="text-sm text-slate-500">View and manage your current profile details.</p>
          <div className="mt-3 rounded-lg border border-red-300 bg-gradient-to-r from-rose-50 via-rose-100 to-rose-50 p-4 text-xs text-red-900 shadow-sm ring-1 ring-red-200/70">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="flex h-8 w-8 items-center justify-center rounded-full bg-red-200 text-lg text-red-700 shadow-sm"
              >
                ⚠️
              </span>
              <div>
                <p className="text-sm font-semibold text-red-900">Guidance for breakdowns</p>
                <p className="mt-2">
                  If your bike breaks down while riding within 180 km of the rental store, you can use our 24/7 roadside
                  assistance at no extra cost. Please call the store during business hours, or contact roadside assistance
                  directly outside business hours.
                </p>
                <p className="mt-2 font-semibold">Roadside assistance: 0120-024-024</p>
                <p className="mt-2 font-semibold">Yasukari phone: 03-5856-8200</p>
                <Link
                  href="/en/help"
                  className="mt-3 inline-flex items-center justify-center rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100"
                >
                  View the FAQ
                </Link>
              </div>
            </div>
          </div>
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
                <button
                  type="button"
                  aria-expanded={mobileSectionsOpen.reservations}
                  onClick={() => toggleMobileSection('reservations')}
                  className="group flex flex-1 items-start justify-between gap-3 text-left md:pointer-events-none md:cursor-default"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Current rentals</h2>
                    <p className="mt-1 text-sm text-slate-600">Your active rental information appears here.</p>
                  </div>
                  <span
                    aria-hidden
                    className={`ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 transition-transform md:hidden ${
                      mobileSectionsOpen.reservations ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </button>
              </div>
              <div className={`${mobileSectionsOpen.reservations ? 'mt-4 block' : 'hidden'} md:mt-4 md:block`}>
                {shouldShowRentalActions ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {extensionTargetReservationId ? (
                        <Link
                          href={`/mypage/rentals/extend/${extensionTargetReservationId}`}
                          className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-md ring-2 ring-inset ring-red-500 ring-offset-1 ring-offset-white transition hover:bg-red-700"
                        >
                          Extend rental
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center justify-center rounded-full bg-red-200 px-4 py-2 text-xs font-semibold text-white/70 shadow-md ring-2 ring-inset ring-red-200 ring-offset-1 ring-offset-white"
                        >
                          Extend rental
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => activeKeyboxQrImageUrl && setShowUnlockQrModal(true)}
                        className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-md ring-2 ring-inset ring-slate-200 ring-offset-1 ring-offset-white transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:hidden"
                        disabled={!activeKeyboxQrImageUrl}
                      >
                        Show unlock QR
                      </button>
                      <button
                        type="button"
                        onClick={handleReturnOpen}
                        disabled={!activeReturnReservation}
                        className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-md ring-2 ring-inset ring-red-500 ring-offset-1 ring-offset-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-200 disabled:text-white/70 disabled:ring-red-200"
                      >
                        Return
                      </button>
                      <button
                        type="button"
                        onClick={handleAccidentOpen}
                        className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-md ring-2 ring-inset ring-red-500 ring-offset-1 ring-offset-white transition hover:bg-red-700"
                      >
                        Accident / fall
                      </button>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <Link
                        href={unmannedRentalGuideUrl}
                        className="text-sky-700 underline underline-offset-2 transition hover:text-sky-800"
                      >
                        About rentals at unmanned stores
                      </Link>
                    </div>
                  </>
                ) : null}

                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  {reservationsError ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">{reservationsError}</p>
                  ) : loadingReservations ? (
                    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">Loading reservation data…</p>
                  ) : reservations.length === 0 ? (
                    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                      You have no active reservations right now. Completed bookings are listed under Past reservations.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {reservations.map((reservation) => {
                        const manualVideoUrl = reservation.videoUrl?.trim();
                        const accessLink = reservation.storeName?.includes('三ノ輪')
                          ? 'https://yasukari.com/stores#minowa'
                          : reservation.storeName?.includes('足立小台')
                            ? 'https://yasukari.com/stores#adachi'
                            : null;

                        return (
                          <li
                            key={reservation.id}
                            className="rounded-md border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100"
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
                                  className="h-12 w-12 rounded-md border border-slate-200 bg-white object-cover shadow-sm"
                                  loading="lazy"
                                />
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {reservation.storeName} / {reservation.vehicleModel}
                                  </p>
                                  <p className="text-xs text-slate-600">
                                    {reservation.vehicleCode} {reservation.vehiclePlate}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                                <span className="inline-flex items-center rounded bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
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
                            {reservation.vehicleChangedAt && !reservation.vehicleChangeNotified ? (
                              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                                The vehicle has been updated by our staff. New vehicle: {reservation.vehicleCode} /{' '}
                                {reservation.vehiclePlate || 'Not set'}
                              </p>
                            ) : null}
                            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                              <div className="rounded-lg bg-slate-50 px-3 py-2">
                                <dt className="text-xs text-slate-500">Pickup → Return</dt>
                                <dd className="font-semibold text-slate-900">
                                  {formatReservationDatetime(reservation.pickupAt)} → {formatReservationDatetime(reservation.returnAt)}
                                </dd>
                              </div>
                              <div className="rounded-lg bg-slate-50 px-3 py-2">
                                <dt className="text-xs text-slate-500">Reservation details</dt>
                                <dd className="font-semibold text-slate-900">
                                  Vehicle code: {reservation.vehicleCode || '-'} / Plate number: {reservation.vehiclePlate || 'Not set'}
                                </dd>
                              </div>
                              <div className="rounded-lg bg-slate-50 px-3 py-2">
                                <dt className="text-xs text-slate-500">Payment amount</dt>
                                <dd className="font-semibold text-slate-900">{reservation.paymentAmount} yen</dd>
                              </div>
                              <div className="rounded-lg bg-slate-50 px-3 py-2">
                                <dt className="text-xs text-slate-500">Payment date</dt>
                                <dd className="font-semibold text-slate-900">
                                  {reservation.paymentDate ? formatReservationDatetime(reservation.paymentDate) : 'Not recorded'}
                                </dd>
                              </div>
                            </dl>
                            {reservation.keyboxPinCode ? (
                              <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-sky-900">Unmanned store unlock info</p>
                                  </div>
                                  <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-800 ring-1 ring-sky-200">
                                    PIN issued
                                  </span>
                                </div>
                                <div className="mt-3 grid gap-3">
                                  <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                                    <dt className="text-xs text-slate-600">PIN code</dt>
                                    <dd className="font-mono text-lg font-semibold text-slate-900">{reservation.keyboxPinCode}</dd>
                                  </div>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                  {reservation.keyboxQrImageUrl ? (
                                    <div className="flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm">
                                      <button
                                        type="button"
                                        onClick={() => setShowUnlockQrModal(true)}
                                        className="group rounded border border-transparent focus:outline-none focus:ring-2 focus:ring-sky-300"
                                      >
                                        <img
                                          src={reservation.keyboxQrImageUrl}
                                          alt="Unlock QR code"
                                          className="h-20 w-20 rounded border border-slate-200 object-contain transition group-hover:scale-105"
                                        />
                                      </button>
                                      <div className="text-xs text-slate-600">Hold it over the keybox reader to unlock.</div>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            ) : reservation.storeName === '三ノ輪店' ? (
                              <p className="mt-3 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">
                                We are preparing the keybox unlock information. Please check again soon.
                              </p>
                            ) : null}
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Link
                                href={`/mypage/rentals/${reservation.id}`}
                                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                              >
                                View details
                              </Link>
                              {accessLink ? (
                                <a
                                  href={accessLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                >
                                  Directions to the store
                                </a>
                              ) : null}
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
                <div
                  className={`${mobileSectionsOpen.reservations ? 'mt-4 flex' : 'hidden'} flex-wrap items-center justify-end gap-2 md:mt-6 md:flex`}
                >
                  <Link
                    href="/en/mypage/past-reservations"
                    target="_blank"
                    rel="noreferrer"
                    className={`${sectionActionClass} border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50`}
                  >
                    Past reservations
                  </Link>
                  {hasActiveReservation ? (
                    <button
                      type="button"
                      className={`${sectionActionClass} bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200`}
                    >
                      Reservation details
                    </button>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <button
                  type="button"
                  aria-expanded={mobileSectionsOpen.profile}
                  onClick={() => toggleMobileSection('profile')}
                  className="group flex flex-1 items-center justify-between gap-3 text-left md:pointer-events-none md:cursor-default"
                >
                  <h2 className="text-lg font-semibold text-slate-900">Profile information</h2>
                  <span
                    aria-hidden
                    className={`ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 transition-transform md:hidden ${
                      mobileSectionsOpen.profile ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </button>
                <Link
                  href="/en/mypage/profile-setup"
                  className={`${sectionActionClass} hidden border border-red-200 text-red-700 transition hover:border-red-300 hover:text-red-800 md:inline-flex`}
                >
                  Edit basic info
                </Link>
              </div>

              <div className={`${mobileSectionsOpen.profile ? 'mt-3 block' : 'hidden'} md:mt-3 md:block`}>
                {attributesError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{attributesError}</p>
                ) : null}

                {loadingAttributes ? (
                  <p className="mt-3 text-sm text-slate-700">Loading your profile…</p>
                ) : attributes ? (
                  <dl className="mt-4 grid gap-4 text-sm text-slate-700 md:grid-cols-2">
                    <div>
                      <dt className="font-medium text-slate-600">Phone number</dt>
                      <dd className="mt-1 text-slate-800">{formatPhoneLabel(attributes.phone_number)}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-600">Handle name</dt>
                      <dd className="mt-1 text-slate-800">{attributes['custom:handle'] ?? 'Not set'}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-600">Location / language</dt>
                      <dd className="mt-1 text-slate-800">{localeLabel(attributes['custom:locale'])}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-600">Nickname</dt>
                      <dd className="mt-1 text-slate-800">{attributes.name ?? 'Not set'}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-3 text-sm text-slate-700">We couldn&apos;t load your profile details.</p>
                )}
              </div>
              <div className={`${mobileSectionsOpen.profile ? 'mt-4 flex' : 'hidden'} justify-center md:hidden`}>
                <Link
                  href="/en/mypage/profile-setup"
                  className={`${sectionActionClass} border border-red-200 text-red-700 transition hover:border-red-300 hover:text-red-800`}
                >
                  Edit basic info
                </Link>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <button
                  type="button"
                  aria-expanded={mobileSectionsOpen.registration}
                  onClick={() => toggleMobileSection('registration')}
                  className="group flex flex-1 items-start justify-between gap-3 text-left md:pointer-events-none md:cursor-default"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Full registration</h2>
                    <p className="mt-1 text-sm text-slate-600">Enter the required details for rentals.</p>
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
                      <p className="mt-2 inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                        No registration saved yet
                      </p>
                    )}
                  </div>
                  <span
                    aria-hidden
                    className={`ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 transition-transform md:hidden ${
                      mobileSectionsOpen.registration ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </button>
                <Link
                  href="/en/mypage/registration"
                  className={`${sectionActionClass} hidden bg-red-600 text-white transition hover:bg-red-700 md:inline-flex`}
                >
                  Go to registration form
                </Link>
              </div>
              <div className={`${mobileSectionsOpen.registration ? 'mt-4 block' : 'hidden'} md:mt-4 md:block`}>
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
                        <dt className="text-xs font-semibold text-slate-500">Name</dt>
                        <dd className="mt-1 text-slate-900">{`${registration.name1} ${registration.name2}`}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">Furigana</dt>
                        <dd className="mt-1 text-slate-900">{`${registration.kana1} ${registration.kana2}`}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">Gender</dt>
                        <dd className="mt-1 text-slate-900">{sexLabel(registration.sex)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">Address</dt>
                        <dd className="mt-1 text-slate-900">{`〒${registration.zip} ${registration.address1} ${registration.address2}`}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">Birthday</dt>
                        <dd className="mt-1 text-slate-900">{registration.birth}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">License number</dt>
                        <dd className="mt-1 text-slate-900">{registration.license ? 'Registered (number hidden)' : 'Not registered'}</dd>
                      </div>
                    </dl>
                  </div>
                ) : (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                    No registration details yet. Please fill out the form to proceed.
                  </p>
                )}
              </div>
              <div className={`${mobileSectionsOpen.registration ? 'mt-4 flex' : 'hidden'} justify-center md:hidden`}>
                <Link
                  href="/en/mypage/registration"
                  className={`${sectionActionClass} bg-red-600 text-white transition hover:bg-red-700`}
                >
                  Go to registration form
                </Link>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <button
                type="button"
                aria-expanded={mobileSectionsOpen.rentalTerms}
                onClick={() => toggleMobileSection('rentalTerms')}
                className="group flex w-full items-start justify-between gap-3 text-left md:pointer-events-none md:cursor-default"
              >
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Rental terms agreement</h2>
                  <p className="mt-2 text-sm text-slate-600">Check and update your agreement to the motorcycle rental terms.</p>
                  {loadingRentalTerms ? null : rentalTermsAgreed ? (
                    <p className="mt-2 inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-200">
                      Agreed
                    </p>
                  ) : (
                    <p className="mt-2 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                      Not agreed
                    </p>
                  )}
                </div>
                <span
                  aria-hidden
                  className={`ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 transition-transform md:hidden ${
                    mobileSectionsOpen.rentalTerms ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </span>
              </button>
              <div className={`${mobileSectionsOpen.rentalTerms ? 'mt-4 block' : 'hidden'} md:mt-4 md:block`}>
                <p className="text-sm text-slate-700">
                  Tick the box below to save your agreement status in the database. You can read the full terms <Link className="text-red-600 underline underline-offset-2" href="/rental-bike-terms">here</Link>.
                </p>
                {rentalTermsError ? (
                  <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{rentalTermsError}</p>
                ) : null}

                {registration ? (
                  <label className="mt-4 inline-flex items-start gap-3 text-sm text-slate-900">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                      onChange={handleRentalTermsToggle}
                      checked={rentalTermsAgreed}
                      disabled={loadingRentalTerms || savingRentalTerms || loadingRegistration}
                    />
                    <span className="leading-relaxed">
                      Do you agree to the motorcycle rental terms?
                      <span className="mt-1 block text-xs text-slate-500">Unchecking will save you as not agreed.</span>
                    </span>
                  </label>
                ) : (
                  <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    You can set your agreement status after saving your registration details. Please complete the registration form first.
                  </p>
                )}

                <p className="mt-3 text-xs text-slate-500">
                  Last updated: {loadingRentalTerms ? 'Checking…' : formatAgreementTimestamp(rentalTermsUpdatedAt)}
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <button
                type="button"
                aria-expanded={mobileSectionsOpen.logout}
                onClick={() => toggleMobileSection('logout')}
                className="group flex w-full items-start justify-between gap-3 text-left md:pointer-events-none md:cursor-default"
              >
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Log out</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Logging out will hide My Page until you sign in again.
                  </p>
                </div>
                <span
                  aria-hidden
                  className={`ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 transition-transform md:hidden ${
                    mobileSectionsOpen.logout ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </span>
              </button>
              <div className={`${mobileSectionsOpen.logout ? 'mt-4 block' : 'hidden'} md:mt-4 md:block`}>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`${sectionActionClass} bg-red-600 text-white transition hover:bg-red-700`}
                  disabled={!user || loggingOut}
                >
                  {loggingOut ? 'Processing…' : 'Log out'}
                </button>
              </div>
            </section>
          </>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <button
            type="button"
            aria-expanded={mobileSectionsOpen.links}
            onClick={() => toggleMobileSection('links')}
            className="group flex w-full items-center justify-between gap-3 text-left md:pointer-events-none md:cursor-default"
          >
            <h2 className="text-lg font-semibold text-slate-900">Helpful links</h2>
            <span
              aria-hidden
              className={`ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 transition-transform md:hidden ${
                mobileSectionsOpen.links ? 'rotate-180' : ''
              }`}
            >
              ▼
            </span>
          </button>
          <div className={`${mobileSectionsOpen.links ? 'mt-3 block' : 'hidden'} md:mt-3 md:block`}>
            <ul className="space-y-2 text-sm text-slate-700">
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
          </div>
        </section>
      </main>
      {showCancelNotice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Reservation cancellation notice</h2>
            <p className="mt-3 text-sm text-slate-700">
              Your reservation has been marked as cancelled by our staff. If you have any questions, please contact support.
            </p>
            <button
              type="button"
              className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              onClick={() => setShowCancelNotice(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
      {showAccidentModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-lg border-2 border-red-200 bg-white p-6 shadow-xl ring-1 ring-red-100">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Accident / fall report</h2>
                <p className="mt-2 text-sm text-slate-600">Please send a photo of the bike&apos;s condition.</p>
              </div>
              <button
                type="button"
                onClick={handleAccidentClose}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-600">Photo upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  setAccidentSubmitted(false);
                  setAccidentError('');
                  const file = event.target.files?.[0] ?? null;
                  setAccidentFile(file);
                }}
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
              <label className="block text-xs font-semibold text-slate-600 sm:hidden">
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
                  className="mt-2 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
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
                className="inline-flex w-full items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {accidentUploading ? 'Sending…' : 'Send'}
              </button>
              {accidentSubmitted ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
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
          <div className="w-full max-w-md rounded-lg border-2 border-amber-200 bg-white p-6 shadow-xl ring-1 ring-amber-100">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Bike return</h2>
                {returnStep === 'survey' ? (
                  <p className="mt-2 text-sm text-slate-600">Thank you for riding with us!</p>
                ) : returnStep === 'done' ? (
                  <p className="mt-2 text-sm text-slate-600">Submission complete.</p>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">Were you able to park inside the designated area?</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleReturnClose}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
              >
                Close
              </button>
            </div>
            {returnStep === 'check' ? (
              <div className="mt-4 space-y-3">
                <label className="block text-xs font-semibold text-slate-600">Photo upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    setReturnError('');
                    const file = event.target.files?.[0] ?? null;
                    setReturnFile(file);
                  }}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
                <label className="block text-xs font-semibold text-slate-600 sm:hidden">
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
                    className="mt-2 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  />
                </label>
                {returnError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{returnError}</p>
                ) : null}
                <button
                  type="button"
                  onClick={handleReturnComplete}
                  disabled={returnUploading}
                  className="inline-flex w-full items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  {returnUploading ? 'Sending…' : 'Complete return'}
                </button>
              </div>
            ) : null}
            {returnStep === 'survey' ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Overall rating</p>
                  <p className="mt-1 text-xs text-slate-600">How was the bike?</p>
                  <div className="mt-3 flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setReturnRating(value)}
                        aria-label={`${value} star`}
                        className={`text-2xl transition ${
                          returnRating >= value ? 'text-amber-400' : 'text-slate-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Survey</p>
                  <p className="mt-1 text-xs text-slate-600">Is there a bike you&apos;d like to try next?</p>
                  <textarea
                    value={returnSurvey}
                    onChange={(event) => setReturnSurvey(event.target.value)}
                    rows={3}
                    className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
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
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
                  Thanks for your cooperation. Your reservation status has been updated.
                </p>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-sm font-semibold text-slate-900">We&apos;d love it if you shared your experience.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        reviewStore ? `Rented from ${reviewStore.name}!` : 'I rented from Yasukari!'
                      )}&url=${encodeURIComponent(reviewStore?.url ?? 'https://yasukari.com')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
                    >
                      Share on Twitter
                    </a>
                    <a
                      href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
                        reviewStore?.url ?? 'https://yasukari.com'
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
                    >
                      Share on LINE
                    </a>
                  </div>
                </div>
                {reviewStore ? (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                    <p className="text-sm font-semibold text-slate-900">Leave a review here</p>
                    <a
                      href={reviewStore.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
                    >
                      {reviewStore.name}
                    </a>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={handleReturnClose}
                  className="inline-flex w-full items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Close
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {showReturnExpiredModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md overflow-hidden rounded-lg border-2 border-red-500 bg-yellow-50 shadow-xl ring-4 ring-yellow-200">
            <div className="flex items-start gap-3 bg-yellow-100 px-5 py-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-red-600 shadow-inner">
                <span className="text-xl font-bold">!</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-red-900">Return deadline notice</h2>
                <div className="mt-2 space-y-1 text-sm text-red-900">
                  <p className="font-semibold">Your return time has passed.</p>
                  <p>Please contact support for return or extension guidance.</p>
                  <p>We also shared the same details in your notifications.</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 px-6 pb-6 pt-4">
              <div className="rounded-md bg-yellow-100 px-4 py-3 text-sm text-red-900">
                <ul className="list-disc space-y-2 pl-4">
                  <li>Please keep the bike in a safe location until the return is complete.</li>
                  <li>If you need more time, use the Extend rental option.</li>
                  <li>Contact chat support or call us if you need assistance.</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={handleReturnClose}
                className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {showUnlockQrModal && activeKeyboxQrImageUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="w-full max-w-lg rounded-lg bg-white p-4 shadow-xl">
            <div className="flex justify-center">
              <img
                src={activeKeyboxQrImageUrl}
                alt="Unlock QR code"
                className="h-[70vh] w-full max-w-sm rounded-lg border border-slate-200 bg-white object-contain"
              />
            </div>
            <p className="mt-4 text-center text-sm text-slate-700">Hold it over the keybox reader.</p>
            <button
              type="button"
              onClick={() => setShowUnlockQrModal(false)}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
