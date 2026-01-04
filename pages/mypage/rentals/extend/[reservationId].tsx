import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import type { BikeClass, BikeModel } from '../../../../lib/dashboard/types';
import type { Reservation } from '../../../../lib/reservations';

const formatReservationDatetime = (value: string | Date) => {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';

  return parsed.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatPrice = (value?: number | null) => {
  if (value == null || Number.isNaN(value)) return '料金未設定';
  return `${value.toLocaleString('ja-JP')}円`;
};

export default function RentalExtensionPage() {
  const router = useRouter();
  const reservationId = typeof router.query.reservationId === 'string' ? router.query.reservationId : '';

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingReservation, setLoadingReservation] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [error, setError] = useState('');
  const [reservationError, setReservationError] = useState('');
  const [sessionUser, setSessionUser] = useState<{ id?: string; email?: string } | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [bikeModels, setBikeModels] = useState<BikeModel[]>([]);
  const [bikeClasses, setBikeClasses] = useState<BikeClass[]>([]);
  const [extensionDays, setExtensionDays] = useState(1);

  useEffect(() => {
    if (!router.isReady) return;
    const raw = router.query.extensionDays;
    if (typeof raw !== 'string') return;
    const parsed = Number(raw);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setExtensionDays(Math.min(parsed, 30));
    }
  }, [router.isReady, router.query.extensionDays]);

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

        const data = (await response.json().catch(() => ({}))) as {
          user?: { id?: string; email?: string } | null;
        };
        if (!data.user) {
          await router.replace('/login');
          return;
        }

        setSessionUser({ id: data.user.id, email: data.user.email });
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err);
          setError('ログイン状態の確認に失敗しました。時間をおいて再度お試しください。');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingUser(false);
        }
      }
    };

    void fetchUser();
    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    if (loadingUser || !reservationId) return;

    const controller = new AbortController();
    const fetchReservation = async () => {
      try {
        const response = await fetch(`/api/reservations/${reservationId}`, {
          credentials: 'include',
          signal: controller.signal,
        });

        if (response.status === 404) {
          setReservationError('予約情報が見つかりませんでした。');
          return;
        }

        if (!response.ok) {
          throw new Error('failed to load reservation');
        }

        const data = (await response.json()) as { reservation?: Reservation };
        if (!data.reservation) {
          setReservationError('予約情報が見つかりませんでした。');
          return;
        }

        setReservation(data.reservation);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err);
          setReservationError('予約情報の取得に失敗しました。時間をおいて再度お試しください。');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingReservation(false);
        }
      }
    };

    void fetchReservation();
    return () => controller.abort();
  }, [loadingUser, reservationId]);

  useEffect(() => {
    if (!reservation) return;

    const controller = new AbortController();
    const fetchCatalog = async () => {
      try {
        const [modelsResponse, classesResponse] = await Promise.all([
          fetch('/api/bike-models', { signal: controller.signal }),
          fetch('/api/bike-classes', { signal: controller.signal }),
        ]);

        if (!modelsResponse.ok || !classesResponse.ok) {
          throw new Error('failed to load bike catalog');
        }

        const models = ((await modelsResponse.json()) ?? []) as BikeModel[];
        const classes = ((await classesResponse.json()) ?? []) as BikeClass[];
        setBikeModels(models);
        setBikeClasses(classes);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCatalog(false);
        }
      }
    };

    void fetchCatalog();
    return () => controller.abort();
  }, [reservation]);

  const targetModel = useMemo(() => {
    if (!reservation?.vehicleModel) return null;
    return bikeModels.find((model) => model.modelName === reservation.vehicleModel) ?? null;
  }, [bikeModels, reservation?.vehicleModel]);

  const targetClass = useMemo(() => {
    if (!targetModel) return null;
    return bikeClasses.find((bikeClass) => bikeClass.classId === targetModel.classId) ?? null;
  }, [bikeClasses, targetModel]);

  const baseReturnDate = useMemo(() => {
    if (!reservation?.returnAt) return null;
    const parsed = new Date(reservation.returnAt);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [reservation?.returnAt]);

  const extendedReturnDate = useMemo(() => {
    if (!baseReturnDate) return null;
    const extended = new Date(baseReturnDate);
    extended.setDate(extended.getDate() + extensionDays);
    return extended;
  }, [baseReturnDate, extensionDays]);

  const extra24hPrice = targetClass?.extra_prices?.['24h'];
  const additionalCost = useMemo(() => {
    if (extra24hPrice == null || Number.isNaN(extra24hPrice)) return null;
    return extra24hPrice * extensionDays;
  }, [extra24hPrice, extensionDays]);

  const handleExtensionDaysChange = (value: string) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) return;
    setExtensionDays(Math.min(parsed, 30));
  };

  const canProceed =
    !loadingUser &&
    !loadingReservation &&
    !reservationError &&
    reservation &&
    additionalCost != null &&
    sessionUser &&
    extendedReturnDate;

  return (
    <>
      <Head>
        <title>レンタル延長手続き</title>
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
              <li>
                <a href="/mypage" className="text-red-600 hover:underline">
                  マイページ
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-600">レンタル延長</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-semibold text-gray-900">レンタル延長</h1>
          <p className="text-sm text-gray-500">
            現在レンタルしている車両の返却日時を延長し、追加費用を確認できます。決済は次の画面で行います。
          </p>
        </header>

        {error ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <p className="text-sm text-red-700">{error}</p>
          </section>
        ) : null}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {loadingUser || loadingReservation ? (
            <p className="text-sm text-gray-700">情報を読み込み中です…</p>
          ) : reservationError ? (
            <p className="text-sm text-red-700">{reservationError}</p>
          ) : reservation ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{reservation.vehicleModel}</p>
                  <p className="text-xs text-gray-600">{reservation.storeName}</p>
                </div>
                <Link
                  href={`/mypage/rentals/${reservation.id}`}
                  className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
                >
                  予約の詳細を確認
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">現在の返却予定</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {baseReturnDate ? formatReservationDatetime(baseReturnDate) : '未設定'}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs text-emerald-700">延長後の返却予定</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-900">
                    {extendedReturnDate ? formatReservationDatetime(extendedReturnDate) : '未設定'}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <label className="text-sm font-semibold text-gray-900" htmlFor="extension-days">
                    延長日数 (24時間単位)
                  </label>
                  <input
                    id="extension-days"
                    type="number"
                    min={1}
                    max={30}
                    value={extensionDays}
                    onChange={(event) => handleExtensionDaysChange(event.target.value)}
                    className="w-full max-w-[240px] rounded-xl border border-gray-300 bg-gray-50/70 px-4 py-3 text-right text-base font-semibold text-gray-900 shadow-inner transition focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  レンタルクラスに設定された「追加料金(24時間)」を日数分加算して延長費用を計算します。
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">クラスの追加料金(24時間)</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {extra24hPrice != null ? formatPrice(extra24hPrice) : 'クラス情報なし'}
                  </p>
                  {loadingCatalog ? (
                    <p className="mt-2 text-xs text-gray-500">料金を取得しています…</p>
                  ) : null}
                  {!loadingCatalog && !targetClass ? (
                    <p className="mt-2 text-xs text-red-700">車両クラスが特定できませんでした。</p>
                  ) : null}
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs text-emerald-700">今回の延長費用</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-900">
                    {additionalCost != null ? formatPrice(additionalCost) : '計算できません'}
                  </p>
                  <p className="mt-2 text-xs text-emerald-700">
                    {additionalCost != null
                      ? `24時間追加料金 ${formatPrice(extra24hPrice)} × ${extensionDays}日分`
                      : 'クラスの追加料金を取得後に計算されます。'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-gray-500">
                    延長内容を確認したら、次の画面でクレジット決済を行います。
                  </p>
                  {canProceed ? (
                    <Link
                      href={{
                        pathname: `/mypage/rentals/extend/checkout/${reservation.id}`,
                        query: { extensionDays: extensionDays.toString() },
                      }}
                      className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-gray-800"
                    >
                      決済確認へ進む
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full bg-gray-200 px-5 py-3 text-sm font-semibold text-gray-500"
                      disabled
                    >
                      決済確認へ進む
                    </button>
                  )}
                </div>
                <Link
                  href="/mypage"
                  className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
                >
                  マイページに戻る
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700">予約情報が読み込めませんでした。</p>
          )}
        </section>
      </main>
    </>
  );
}
