import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import type { RegistrationData } from '../../types/registration';
import { REQUIRED_REGISTRATION_FIELDS } from '../../types/registration';
import type { Reservation } from '../../lib/reservations';
import { formatDisplayPhoneNumber } from '../../lib/phoneNumber';
import { prepareImageForUpload } from '../../lib/imageProcessing';

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

export default function MyPage() {
  const rentalContractBaseUrl = process.env.NEXT_PUBLIC_RENTAL_CONTRACT_URL;
  const unmannedRentalGuideUrl = '/blog_for_custmor/2025-09-10-minowa-unmanned';
  const unlockQrUrl = '/rental-status';

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
  const [showTroubleGuide, setShowTroubleGuide] = useState(true);
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
    howToUse: true,
    profile: false,
    registration: false,
    rentalTerms: true,
    logout: false,
    links: false,
  });
  const router = useRouter();
  const sectionActionClass = 'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold';
  const howToUseSteps = [
    {
      title: '1. 店舗を選ぶ',
      description:
        '足立小台本店（足立区の格安バイク屋）と三ノ輪店（東京都台東区の国道4号線沿いのレンタルバイク店）のどちらから借りるか選択します。三ノ輪店はセルフ店（セルフサービス）です。',
    },
    {
      title: '2. ご予約',
      description:
        '車両ページでスケジュールを確認しクレジットカードで予約。変更やキャンセルはお問い合わせから連絡してください。',
    },
    {
      title: '3. ご来店',
      description:
        '10:00〜18:30の間に免許証とヘルメットを持参し、リバイクルK-JETスタッフにお声かけください。',
    },
    {
      title: '4. ご利用・返却',
      description:
        '契約者本人のみが乗車・返却可能です。返却は10:00〜18:30の間にガソリン満タンでお願いします。',
    },
  ];

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
          setAttributesError('ユーザー属性の取得に失敗しました。時間をおいて再度お試しください。');
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
          setRegistrationError('本登録情報の取得に失敗しました。時間をおいて再度お試しください。');
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
          await router.replace('/login');
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
          setRentalTermsError('利用規約の同意状況を読み込めませんでした。時間をおいて再度お試しください。');
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
          (reservation) => reservation.status === 'キャンセル'
        );
        const activeReservations = allReservations.filter((reservation) => {
          const isCompleted =
            reservation.reservationCompletedFlag || reservation.status === '予約完了';
          return !isCompleted && reservation.status !== 'キャンセル';
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
          setReservationsError('レンタル中のバイク情報の取得に失敗しました。時間をおいて再度お試しください。');
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
    if (!value) return '未設定';
    const normalized = value.toLowerCase();
    if (normalized.startsWith('ja') || normalized.startsWith('jp')) return '日本語';
    if (normalized.startsWith('en')) return '英語圏';
    return value;
  };

  const formatPhoneLabel = (value?: string) => {
    const formatted = formatDisplayPhoneNumber(value);
    return formatted || '未設定';
  };

  const sexLabel = (value: string | undefined) => {
    if (value === '1') return '男性';
    if (value === '2') return '女性';
    return '未設定';
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
    window.alert('本登録が未完了、または更新が必要です。');
  }, [isRegistrationComplete, loadingRegistration, registration]);

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

  const formatAgreementTimestamp = (value: string | null) => {
    if (!value) return 'まだ同意されていません。';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return parsed.toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const reservationCompletionLabel = (flag: boolean) => (flag ? '予約完了' : '利用中');

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
        await router.replace('/login');
        return;
      }

      const payload = (await response.json().catch(() => ({}))) as { agreedAt?: string | null; message?: string };

      if (response.status === 404) {
        throw new Error(payload.message ?? 'ユーザーデータが見つかりません。本登録を完了してください。');
      }

      if (!response.ok) {
        throw new Error(payload.message ?? '利用規約への同意更新に失敗しました。');
      }

      setRentalTermsAgreed(nextAgreed);
      setRentalTermsUpdatedAt(nextAgreed ? payload.agreedAt ?? new Date().toISOString() : null);
    } catch (err) {
      console.error(err);
      setRentalTermsError(err instanceof Error ? err.message : '利用規約への同意更新に失敗しました。');
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
      setError('ログアウト処理に失敗しました。時間をおいて再度お試しください。');
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
      setAccidentError('写真をアップロードしてください。');
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
        const message = (await response.json())?.message ?? '送信に失敗しました。';
        throw new Error(message);
      }

      setAccidentSubmitted(true);
    } catch (error) {
      console.error('Failed to submit accident report', error);
      setAccidentError(error instanceof Error ? error.message : '送信に失敗しました。');
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
      setReturnError('写真をアップロードしてください。');
      return;
    }
    if (!activeReturnReservation) {
      setReturnError('返却対象の予約が見つかりませんでした。');
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
        const message = (await response.json())?.message ?? '送信に失敗しました。';
        throw new Error(message);
      }

      const completionResponse = await fetch(`/api/reservations/${activeReturnReservation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: '予約完了',
          reservationCompletedFlag: true,
        }),
      });

      if (!completionResponse.ok) {
        const message = (await completionResponse.json())?.error ?? '予約完了の更新に失敗しました。';
        throw new Error(message);
      }

      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.id === activeReturnReservation.id
            ? { ...reservation, status: '予約完了', reservationCompletedFlag: true }
            : reservation
        )
      );

      setReturnStep('survey');
    } catch (error) {
      console.error('Failed to submit return report', error);
      setReturnError(error instanceof Error ? error.message : '送信に失敗しました。');
    } finally {
      setReturnUploading(false);
    }
  };

  const handleReturnSubmit = async () => {
    if (!activeReturnReservation) {
      setReturnError('返却対象の予約が見つかりませんでした。');
      return;
    }

    setReturnSubmitting(true);
    setReturnError('');

    try {
      const response = await fetch(`/api/reservations/${activeReturnReservation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnRating,
          returnSurvey,
        }),
      });

      if (!response.ok) {
        const message = (await response.json())?.error ?? '予約完了の更新に失敗しました。';
        throw new Error(message);
      }

      setReturnStep('done');
    } catch (error) {
      console.error('Failed to submit return survey', error);
      setReturnError(error instanceof Error ? error.message : '送信に失敗しました。');
    } finally {
      setReturnSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>マイページ</title>
      </Head>
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-12">
        <header className="space-y-2 text-sm text-gray-600">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <a href="/" className="text-red-600 hover:underline">
                  ホーム
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-600">マイページ</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-semibold text-gray-900">マイページ</h1>
          <p className="text-sm text-gray-500">ログイン中のプロフィール情報を確認できます。</p>
          <div
            className={`mt-3 rounded-lg border border-rose-300 bg-gradient-to-r from-rose-50 via-rose-100 to-rose-50 p-4 text-xs text-rose-900 shadow-sm ring-1 ring-rose-200/70 ${
              showTroubleGuide ? 'block' : 'hidden md:block'
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-200 text-lg text-rose-700 shadow-sm"
              >
                ⚠️
              </span>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-rose-900">万が一の故障時のご案内</p>
                  <button
                    type="button"
                    onClick={() => setShowTroubleGuide(false)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 bg-white text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 md:hidden"
                    aria-label="故障時案内を閉じる"
                  >
                    ×
                  </button>
                </div>
                <p className="mt-2">
                  万が一、ご利用中のバイクが故障した場合は貸し出し店舗より 180キロ圏内でしたら無料で24時間ロードサービスが使えます。
                  弊社営業時間内であれば一度店へお電話いただき、営業時間外でしたらそのままロードサービスをご手配ください。
                </p>
                <p className="mt-2 font-semibold">ロードサービス連絡先：0120-024-024</p>
                <p className="mt-2 font-semibold">ヤスカリ電話番号：03-5856-8200</p>
                <Link
                  href="/help"
                  className="mt-3 inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100"
                >
                  よくある質問を見る
                </Link>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-700">ログイン状態を確認しています…</p>
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
                <button
                  type="button"
                  aria-expanded={mobileSectionsOpen.reservations}
                  onClick={() => toggleMobileSection('reservations')}
                  className="group flex flex-1 items-start justify-between gap-3 text-left md:pointer-events-none md:cursor-default"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">レンタル中のバイク</h2>
                    <p className="mt-1 text-sm text-gray-600">現在レンタル中のバイク情報を表示します。</p>
                  </div>
                  <span
                    aria-hidden
                    className={`ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 transition-transform md:hidden ${
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
                    className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-md ring-2 ring-inset ring-red-500 ring-offset-1 ring-offset-white transition hover:bg-red-700"
                  >
                    レンタル延長
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center rounded-full bg-red-200 px-4 py-2 text-xs font-semibold text-white/70 shadow-md ring-2 ring-inset ring-red-200 ring-offset-1 ring-offset-white"
                  >
                    レンタル延長
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => activeKeyboxQrImageUrl && setShowUnlockQrModal(true)}
                  className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-md ring-2 ring-inset ring-gray-200 ring-offset-1 ring-offset-white transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 sm:hidden"
                  disabled={!activeKeyboxQrImageUrl}
                >
                  解錠用のQRを表示
                </button>
                <button
                  type="button"
                  onClick={handleReturnOpen}
                  disabled={!activeReturnReservation}
                  className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-md ring-2 ring-inset ring-red-500 ring-offset-1 ring-offset-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-200 disabled:text-white/70 disabled:ring-red-200"
                >
                  返却
                </button>
                <button
                  type="button"
                  onClick={handleAccidentOpen}
                  className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-md ring-2 ring-inset ring-red-500 ring-offset-1 ring-offset-white transition hover:bg-red-700"
                >
                  事故・転倒
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-700">
                <Link
                  href="/blog_for_custmor/2025-09-01-minowa-procedures"
                  className="text-sky-700 underline underline-offset-2 transition hover:text-sky-800"
                >
                  セルフ店でのレンタルについて
                </Link>
                <p className="mt-2 text-xs text-gray-600">
                  セルフでのレンタルが難しそうな場合は、
                  <Link href="/stores#adachi" className="ml-1 font-semibold text-red-600 hover:underline">
                    足立小台本店の利用をお願いします。
                  </Link>
                </p>
              </div>
            </>
          ) : null}

          <div className="mt-4 space-y-3 text-sm text-gray-700">
                {reservationsError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">{reservationsError}</p>
                ) : loadingReservations ? (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">予約データを読み込み中です…</p>
                ) : reservations.length === 0 ? (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
                    まだ利用中の予約はありません。予約完了分は「過去の予約」から確認できます。
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {reservations.map((reservation) => {
                      const manualVideoUrl = reservation.videoUrl?.trim();
                      const accessLink = reservation.storeName?.includes('三ノ輪')
                        ? 'https://yasukaribike.com/stores#minowa'
                        : reservation.storeName?.includes('足立小台')
                          ? 'https://yasukaribike.com/stores#adachi'
                          : null;

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
                                    ? `${reservation.vehicleModel} のサムネイル`
                                    : '車両サムネイル'
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
                            <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                                {reservation.status}
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
                            管理側で車両が変更されました。新しい車両: {reservation.vehicleCode} /{' '}
                            {reservation.vehiclePlate || '未設定'}
                          </p>
                        )}
                        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                          <div className="rounded-lg bg-gray-50 px-3 py-2">
                            <dt className="text-xs text-gray-500">貸出〜返却</dt>
                            <dd className="font-semibold text-gray-900">
                              {formatReservationDatetime(reservation.pickupAt)} → {formatReservationDatetime(reservation.returnAt)}
                            </dd>
                          </div>
                          <div className="rounded-lg bg-gray-50 px-3 py-2">
                            <dt className="text-xs text-gray-500">ご予約情報</dt>
                            <dd className="font-semibold text-gray-900">
                              ナンバープレート: {reservation.vehiclePlate || '未設定'}
                            </dd>
                          </div>
                          <div className="rounded-lg bg-gray-50 px-3 py-2">
                            <dt className="text-xs text-gray-500">駐車No</dt>
                            <dd className="font-semibold text-gray-900">
                              {reservation.parkingNumber || '未設定'}
                            </dd>
                          </div>
                          <div className="rounded-lg bg-gray-50 px-3 py-2">
                            <dt className="text-xs text-gray-500">決済金額</dt>
                            <dd className="font-semibold text-gray-900">{reservation.paymentAmount} 円</dd>
                          </div>
                          <div className="rounded-lg bg-gray-50 px-3 py-2">
                            <dt className="text-xs text-gray-500">決済日時</dt>
                            <dd className="font-semibold text-gray-900">
                              {reservation.paymentDate ? formatReservationDatetime(reservation.paymentDate) : '未登録'}
                            </dd>
                          </div>
                        </dl>
                        {reservation.keyboxPinCode ? (
                          <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-sky-900">セルフ店の解錠情報</p>
                              </div>
                            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-800 ring-1 ring-sky-200">
                              PIN発行済み
                            </span>
                          </div>
                          <div className="mt-3 grid gap-3">
                            <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                              <dt className="text-xs text-gray-600">PINコード</dt>
                              <dd className="font-mono text-lg font-semibold text-gray-900">{reservation.keyboxPinCode}</dd>
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
                                    alt="解錠用QRコード"
                                    className="h-20 w-20 rounded border border-gray-200 object-contain transition group-hover:scale-105"
                                  />
                                </button>
                                <div className="text-xs text-gray-600">QRをタップして、鍵ボックスのリーダーにかざして解錠してください。</div>
                              </div>
                            ) : null}
                          </div>
                          </div>
                        ) : reservation.storeName === '三ノ輪店' ? (
                          <p className="mt-3 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">
                            鍵ボックスの解錠情報を準備しています。しばらくしてから再度ご確認ください。
                          </p>
                        ) : null}
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                              href={`/mypage/rentals/${reservation.id}`}
                              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                            >
                              詳細を見る
                            </Link>
                            {manualVideoUrl ? (
                              <Link
                                href={manualVideoUrl}
                                className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-100"
                                target="_blank"
                                rel="noreferrer"
                              >
                                マニュアル動画
                              </Link>
                            ) : (
                              <span className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-400">
                                マニュアル動画
                              </span>
                            )}
                            {accessLink ? (
                              <a
                                href={accessLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                            >
                              店舗までのアクセス
                            </a>
                          ) : null}
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
              <div
                className={`${mobileSectionsOpen.reservations ? 'mt-4 flex' : 'hidden'} flex-wrap items-center justify-end gap-2 md:mt-6 md:flex`}
              >
                <Link
                  href="/mypage/past-reservations"
                  target="_blank"
                  rel="noreferrer"
                  className={`${sectionActionClass} border border-gray-200 bg-white text-gray-700 transition hover:border-gray-300 hover:bg-gray-50`}
                >
                  過去の予約
                </Link>
                {hasActiveReservation ? (
                  <button
                    type="button"
                    className={`${sectionActionClass} bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200`}
                  >
                    予約詳細
                  </button>
                ) : null}
              </div>
            </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <button
                  type="button"
                  aria-expanded={mobileSectionsOpen.howToUse}
                  onClick={() => toggleMobileSection('howToUse')}
                  className="group flex flex-1 items-center justify-between gap-3 text-left md:pointer-events-none md:cursor-default"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">ヤスカリの利用方法</h2>
                    <p className="mt-1 text-sm text-gray-600">ホームページに掲載している利用方法を確認できます。</p>
                  </div>
                  <span
                    aria-hidden
                    className={`ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 transition-transform md:hidden ${
                      mobileSectionsOpen.howToUse ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </button>
              </div>

              <div className={`${mobileSectionsOpen.howToUse ? 'mt-4 block' : 'hidden'} md:mt-4 md:block`}>
                <ul className="grid gap-3 md:grid-cols-2">
                  {howToUseSteps.map((step) => (
                    <li key={step.title} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                      <p className="mt-2 text-sm leading-relaxed text-gray-700">{step.description}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p>
                    ※三ノ輪店は無人セルフ店舗のため、店員のサポートがありませんので不明点は事前にご確認ください
                  </p>
                  <p>
                    ※返却写真の登録が完了しないと次回予約ができません。「返却」ボタンからバイクの写真を登録してください
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <button
                  type="button"
                  aria-expanded={mobileSectionsOpen.profile}
                  onClick={() => toggleMobileSection('profile')}
                  className="group flex flex-1 items-center justify-between gap-3 text-left md:pointer-events-none md:cursor-default"
                >
                  <h2 className="text-lg font-semibold text-gray-900">プロフィール情報</h2>
                  <span
                    aria-hidden
                    className={`ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 transition-transform md:hidden ${
                      mobileSectionsOpen.profile ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </button>
                <Link
                  href="/mypage/profile-setup"
                  className={`${sectionActionClass} hidden border border-red-200 text-red-700 transition hover:border-red-300 hover:text-red-800 md:inline-flex`}
                >
                  基本情報を編集
                </Link>
              </div>

              <div className={`${mobileSectionsOpen.profile ? 'mt-3 block' : 'hidden'} md:mt-3 md:block`}>
                {attributesError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{attributesError}</p>
                ) : null}

                {loadingAttributes ? (
                  <p className="mt-3 text-sm text-gray-700">属性を取得しています…</p>
                ) : attributes ? (
                  <dl className="mt-4 grid gap-4 text-sm text-gray-700 md:grid-cols-2">
                    <div>
                      <dt className="font-medium text-gray-600">電話番号</dt>
                      <dd className="mt-1 text-gray-800">{formatPhoneLabel(attributes.phone_number)}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-600">ハンドルネーム</dt>
                      <dd className="mt-1 text-gray-800">{attributes['custom:handle'] ?? '未設定'}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-600">ロケーション / 言語</dt>
                      <dd className="mt-1 text-gray-800">{localeLabel(attributes['custom:locale'])}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-600">ニックネーム</dt>
                      <dd className="mt-1 text-gray-800">{attributes.name ?? '未設定'}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-3 text-sm text-gray-700">プロフィール情報を取得できませんでした。</p>
                )}
              </div>
              <div className={`${mobileSectionsOpen.profile ? 'mt-4 flex' : 'hidden'} justify-center md:hidden`}>
                <Link
                  href="/mypage/profile-setup"
                  className={`${sectionActionClass} border border-red-200 text-red-700 transition hover:border-red-300 hover:text-red-800`}
                >
                  基本情報を編集
                </Link>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <button
                  type="button"
                  aria-expanded={mobileSectionsOpen.registration}
                  onClick={() => toggleMobileSection('registration')}
                  className="group flex flex-1 items-start justify-between gap-3 text-left md:pointer-events-none md:cursor-default"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">本登録</h2>
                    <p className="mt-1 text-sm text-gray-600">レンタルに必要な基本情報を入力するフォームです。</p>
                    {loadingRegistration ? null : registration ? (
                      isRegistrationComplete ? (
                        <p className="mt-2 inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-200">
                          本登録済み
                        </p>
                      ) : (
                        <p className="mt-2 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                          本登録が未完了です
                        </p>
                      )
                    ) : (
                      <p className="mt-2 inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-200">
                        本登録がまだ保存されていません
                      </p>
                    )}
                  </div>
                  <span
                    aria-hidden
                    className={`ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 transition-transform md:hidden ${
                      mobileSectionsOpen.registration ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </button>
                <Link
                  href="/mypage/registration"
                  className={`${sectionActionClass} hidden bg-red-600 text-white transition hover:bg-red-700 md:inline-flex`}
                >
                  本登録フォームへ進む
                </Link>
              </div>
              <div className={`${mobileSectionsOpen.registration ? 'mt-4 block' : 'hidden'} md:mt-4 md:block`}>
                {registrationError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">{registrationError}</p>
                ) : null}

                {loadingRegistration ? (
                  <p>本登録情報を読み込み中です…</p>
                ) : registration ? (
                  <div className="space-y-3">
                    {!isRegistrationComplete ? (
                      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                        未入力の必須項目があります。内容を確認して本登録を完了してください。
                      </p>
                    ) : null}
                    <dl className="grid gap-4 md:grid-cols-2">
                      <div>
                        <dt className="text-xs font-semibold text-gray-500">氏名</dt>
                        <dd className="mt-1 text-gray-900">{`${registration.name1} ${registration.name2}`}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-gray-500">フリガナ</dt>
                        <dd className="mt-1 text-gray-900">{`${registration.kana1} ${registration.kana2}`}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-gray-500">性別</dt>
                        <dd className="mt-1 text-gray-900">{sexLabel(registration.sex)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-gray-500">住所</dt>
                        <dd className="mt-1 text-gray-900">{`〒${registration.zip} ${registration.address1} ${registration.address2}`}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-gray-500">誕生日</dt>
                        <dd className="mt-1 text-gray-900">{registration.birth}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-gray-500">免許証番号</dt>
                        <dd className="mt-1 text-gray-900">{registration.license ? '登録済み（番号は非表示）' : '未登録'}</dd>
                      </div>
                    </dl>
                  </div>
                ) : (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
                    本登録情報がまだありません。フォームから登録を進めてください。
                  </p>
                )}
              </div>
              <div className={`${mobileSectionsOpen.registration ? 'mt-4 flex' : 'hidden'} justify-center md:hidden`}>
                <Link
                  href="/mypage/registration"
                  className={`${sectionActionClass} bg-red-600 text-white transition hover:bg-red-700`}
                >
                  本登録フォームへ進む
                </Link>
              </div>
            </section>

            

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <button
                type="button"
                aria-expanded={mobileSectionsOpen.rentalTerms}
                onClick={() => toggleMobileSection('rentalTerms')}
                className="group flex w-full items-start justify-between gap-3 text-left md:pointer-events-none md:cursor-default"
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">利用規約への同意</h2>
                  <p className="mt-2 text-sm text-gray-600">バイクレンタル利用規約への同意状況を確認・更新できます。</p>
                  {loadingRentalTerms ? null : rentalTermsAgreed ? (
                    <p className="mt-2 inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-200">
                      同意済み
                    </p>
                  ) : (
                    <p className="mt-2 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                      未同意
                    </p>
                  )}
                </div>
                <span
                  aria-hidden
                  className={`ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 transition-transform md:hidden ${
                    mobileSectionsOpen.rentalTerms ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </span>
              </button>
              <div className={`${mobileSectionsOpen.rentalTerms ? 'mt-4 block' : 'hidden'} md:mt-4 md:block`}>
                <p className="text-sm text-gray-700">
                  下記のチェックボックスにチェックを入れると、バイクレンタル利用規約への同意がデータベースに保存されます。
                  規約の内容は <Link className="text-red-600 underline underline-offset-2" href="/rental-bike-terms">こちら</Link> から確認できます。
                </p>
                {rentalTermsError ? (
                  <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{rentalTermsError}</p>
                ) : null}

                {registration ? (
                  <label className="mt-4 inline-flex items-start gap-3 text-sm text-gray-900">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      onChange={handleRentalTermsToggle}
                      checked={rentalTermsAgreed}
                      disabled={loadingRentalTerms || savingRentalTerms || loadingRegistration}
                    />
                    <span className="leading-relaxed">
                      バイクレンタル利用規約に同意しますか？
                      <span className="mt-1 block text-xs text-gray-500">
                        チェックを外すと未同意の状態として保存されます。
                      </span>
                    </span>
                  </label>
                ) : (
                  <p className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    本登録情報が保存されてから利用規約への同意を設定できます。まずは本登録フォームから登録を完了してください。
                  </p>
                )}

                <p className="mt-3 text-xs text-gray-500">
                  最終更新: {loadingRentalTerms ? '確認中…' : formatAgreementTimestamp(rentalTermsUpdatedAt)}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <button
                type="button"
                aria-expanded={mobileSectionsOpen.logout}
                onClick={() => toggleMobileSection('logout')}
                className="group flex w-full items-start justify-between gap-3 text-left md:pointer-events-none md:cursor-default"
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">ログアウト</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    ログアウトすると再度ログインするまでマイページを表示できません。
                  </p>
                </div>
                <span
                  aria-hidden
                  className={`ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 transition-transform md:hidden ${
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
                  {loggingOut ? '処理中…' : 'ログアウトする'}
                </button>
              </div>
            </section>
          </>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <button
            type="button"
            aria-expanded={mobileSectionsOpen.links}
            onClick={() => toggleMobileSection('links')}
            className="group flex w-full items-center justify-between gap-3 text-left md:pointer-events-none md:cursor-default"
          >
            <h2 className="text-lg font-semibold text-gray-900">連携リンク</h2>
            <span
              aria-hidden
              className={`ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 transition-transform md:hidden ${
                mobileSectionsOpen.links ? 'rotate-180' : ''
              }`}
            >
              ▼
            </span>
          </button>
          <div className={`${mobileSectionsOpen.links ? 'mt-3 block' : 'hidden'} md:mt-3 md:block`}>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <Link className="text-red-600 hover:underline" href="/pricing">
                  料金表を見る
                </Link>
              </li>
              <li>
                <Link className="text-red-600 hover:underline" href="/help">
                  ヘルプセンター
                </Link>
              </li>
            </ul>
          </div>
        </section>
      </main>
      {showCancelNotice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">予約キャンセルのお知らせ</h2>
            <p className="mt-3 text-sm text-gray-700">
              予約キャンセルが管理者にて設定されました。ご不明点があればサポートまでご連絡ください。
            </p>
            <button
              type="button"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              onClick={() => setShowCancelNotice(false)}
            >
              閉じる
            </button>
          </div>
        </div>
      ) : null}
      {showAccidentModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-rose-200 bg-white p-6 shadow-2xl ring-1 ring-rose-100">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">【事故・転倒報告】</h2>
                <p className="mt-2 text-sm text-gray-600">バイクの状態を写真で送付してください</p>
              </div>
              <button
                type="button"
                onClick={handleAccidentClose}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
              >
                閉じる
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-gray-600">写真アップロード</label>
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
                スマホで撮影してアップロード
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
                {accidentUploading ? '送信中…' : '送信'}
              </button>
              {accidentSubmitted ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  <p className="font-semibold">送信が完了しました。</p>
                  <div className="mt-3 space-y-2 text-xs text-emerald-900">
                    <p>① レッカーTELの案内</p>
                    <p>② 保証内容の案内</p>
                    <p className="pl-4 text-[11px] text-emerald-800">
                      → 詳細はレッカーを担当した保険会社に確認してください
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
                <h2 className="text-lg font-semibold text-gray-900">【バイクの返却】</h2>
                {returnStep === 'survey' ? (
                  <p className="mt-2 text-sm text-gray-600">ご利用ありがとうございました！</p>
                ) : returnStep === 'done' ? (
                  <p className="mt-2 text-sm text-gray-600">送信が完了しました。</p>
                ) : (
                  <p className="mt-2 text-sm text-gray-600">枠線の中に停められましたか？</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleReturnClose}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
              >
                閉じる
              </button>
            </div>
            {returnStep === 'check' ? (
              <div className="mt-4 space-y-3">
                <label className="block text-xs font-semibold text-gray-600">写真アップロード</label>
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
                  スマホで撮影してアップロード
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
                  {returnUploading ? '送信中…' : '返却完了'}
                </button>
              </div>
            ) : null}
            {returnStep === 'survey' ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">【総合評価】</p>
                  <p className="mt-1 text-xs text-gray-600">バイクはいかがでしたか？</p>
                  <div className="mt-3 flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setReturnRating(value)}
                        aria-label={`${value}つ星`}
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
                  <p className="font-semibold text-gray-900">【アンケート】</p>
                  <p className="mt-1 text-xs text-gray-600">今後乗ってみたいバイクはありますか？</p>
                  <textarea
                    value={returnSurvey}
                    onChange={(event) => setReturnSurvey(event.target.value)}
                    rows={3}
                    className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    placeholder="例）電動バイクに興味があります"
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
                  {returnSubmitting ? '送信中…' : '送信'}
                </button>
              </div>
            ) : null}
            {returnStep === 'done' ? (
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
                  ご協力ありがとうございました。レンタル中のバイク情報を更新しました。
                </p>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                  <p className="text-sm font-semibold text-gray-900">よろしければシェアをお願いします。</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        reviewStore ? `${reviewStore.name}でレンタルしました！` : 'ヤスカリでレンタルしました！'
                      )}&url=${encodeURIComponent(reviewStore?.url ?? 'https://yasukaribike.com')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
                    >
                      Twitterでシェア
                    </a>
                    <a
                      href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
                        reviewStore?.url ?? 'https://yasukaribike.com'
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
                    >
                      LINEでシェア
                    </a>
                  </div>
                </div>
                {reviewStore ? (
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-3">
                    <p className="text-sm font-semibold text-gray-900">レビュー口コミはこちら</p>
                    <a
                      href={reviewStore.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
                    >
                      {reviewStore.name}
                    </a>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={handleReturnClose}
                  className="inline-flex w-full items-center justify-center rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  閉じる
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {showReturnExpiredModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border-2 border-red-500 bg-yellow-50 shadow-2xl ring-4 ring-yellow-200">
            <div className="flex items-start gap-3 bg-yellow-100 px-5 py-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-red-600 shadow-inner">
                <span className="text-xl font-bold">!</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-red-900">【返却期限のご案内】</h2>
                <div className="mt-2 space-y-1 text-sm text-red-900">
                  <p className="font-semibold">返却期限を過ぎています。</p>
                  <p>返却や延長についてはサポートまでご連絡ください。</p>
                  <p>同じ内容を通知にも掲載していますので、確認をお願いします。</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 px-6 pb-6 pt-4">
              <div className="rounded-xl bg-yellow-100 px-4 py-3 text-sm text-red-900">
                <ul className="list-disc space-y-2 pl-4">
                  <li>返却が完了するまで車両を安全な場所で保管してください。</li>
                  <li>延長を希望される場合は「レンタル延長」からお手続きください。</li>
                  <li>ご不明点はチャットサポートまたはお電話でお問い合わせください。</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={handleReturnClose}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {showUnlockQrModal && activeKeyboxQrImageUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-4 shadow-2xl">
            <div className="flex justify-center">
              <img
                src={activeKeyboxQrImageUrl}
                alt="解錠用QRコード"
                className="h-[70vh] w-full max-w-sm rounded-2xl border border-gray-200 bg-white object-contain"
              />
            </div>
            <p className="mt-4 text-center text-sm text-gray-700">鍵ボックスのリーダーにかざしてください。</p>
            <button
              type="button"
              onClick={() => setShowUnlockQrModal(false)}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
            >
              閉じる
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
