import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import PayjpCheckout from '../../../../../components/PayjpCheckout';
import type { BikeClass, BikeModel } from '../../../../../lib/dashboard/types';
import type { Reservation } from '../../../../../lib/reservations';
import { getPayjpPublicKey, getPayjpPublicKeyError } from '../../../../../lib/payjp';

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

const clampExtensionDays = (value: number) => Math.min(Math.max(value, 1), 31);

export default function RentalExtensionCheckoutPage() {
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
  const [statusMessage, setStatusMessage] = useState('');
  const [payjpError, setPayjpError] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const payjpFormRef = useRef<HTMLFormElement | null>(null);
  const payjpSlotRef = useRef<HTMLDivElement | null>(null);
  const processedTokenRef = useRef<string | null>(null);

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
    if (!router.isReady) return;
    const raw = router.query.extensionDays;
    if (typeof raw !== 'string') return;
    const parsed = Number(raw);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setExtensionDays(clampExtensionDays(parsed));
    }
  }, [router.isReady, router.query.extensionDays]);

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

  const payjpCustomerEmail = sessionUser?.email ?? '';
  const payJpPublicKey = useMemo(() => getPayjpPublicKey(payjpCustomerEmail), [payjpCustomerEmail]);
  const payjpKeyError = useMemo(() => getPayjpPublicKeyError(payjpCustomerEmail), [payjpCustomerEmail]);

  useEffect(() => {
    if (payjpKeyError) {
      setPayjpError(payjpKeyError);
    }
  }, [payjpKeyError]);

  const handlePaymentWithToken = useCallback(
    async (tokenId: string) => {
      if (!reservation) {
        setStatusMessage('予約情報を確認できませんでした。再度お試しください。');
        return;
      }
      if (!extendedReturnDate) {
        setStatusMessage('延長後の返却日時が確定していません。');
        return;
      }
      if (additionalCost == null) {
        setStatusMessage('延長料金が確定していません。');
        return;
      }

      setIsProcessingPayment(true);
      setStatusMessage('決済処理を実行しています…');

      try {
        const chargeResponse = await fetch('/api/payments/payjp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            token: tokenId,
            amount: additionalCost,
            description: `${reservation.storeName} ${reservation.vehicleModel} 延長`,
            email: payjpCustomerEmail,
            metadata: {
              reservationId: reservation.id,
              extensionDays: extensionDays.toString(),
            },
          }),
        });

        if (!chargeResponse.ok) {
          const errorPayload = (await chargeResponse.json().catch(() => null)) as { error?: string } | null;
          throw new Error(errorPayload?.error ?? 'Pay.JP の決済処理に失敗しました。');
        }

        const chargeData = (await chargeResponse.json()) as { chargeId: string; paidAt?: string };
        const paymentDate = chargeData.paidAt ?? new Date().toISOString();
        const updatedReturnAt = extendedReturnDate.toISOString();

        const updateResponse = await fetch(`/api/reservations/${reservation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            returnAt: updatedReturnAt,
            paymentId: chargeData.chargeId,
            paymentDate,
            extensionPaidFlag: true,
          }),
        });

        if (!updateResponse.ok) {
          const errorPayload = (await updateResponse.json().catch(() => null)) as { error?: string } | null;
          throw new Error(errorPayload?.error ?? 'レンタル延長の反映に失敗しました。');
        }

        const notifyResponse = await fetch('/api/reservations/extension/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            reservationId: reservation.id,
            previousReturnAt: reservation.returnAt,
            newReturnAt: updatedReturnAt,
            extensionDays,
            amount: additionalCost,
            paymentId: chargeData.chargeId,
          }),
        });

        if (!notifyResponse.ok) {
          console.error('Failed to send extension completion email');
        }

        setStatusMessage('決済が完了しました。マイページに延長内容を反映しました。');
        void router.push('/mypage');
      } catch (err) {
        console.error('Failed to process rental extension payment', err);
        setStatusMessage('決済に失敗しました。入力内容を確認のうえ、再度お試しください。');
      } finally {
        setIsProcessingPayment(false);
      }
    },
    [additionalCost, extendedReturnDate, extensionDays, payjpCustomerEmail, reservation, router]
  );

  useEffect(() => {
    if (!router.isReady) return;

    const token = router.query['payjp-token'];
    if (typeof token !== 'string' || !token) return;
    if (processedTokenRef.current === token || isProcessingPayment) return;

    processedTokenRef.current = token;
    setStatusMessage('決済結果を確認しています…');
    void handlePaymentWithToken(token);

    const { ['payjp-token']: _ignored, ...restQuery } = router.query;
    void router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true });
  }, [handlePaymentWithToken, isProcessingPayment, router]);

  const handleSubmitPayment = useCallback(
    (event: Event) => {
      event.preventDefault();
      setPayjpError('');

      const form = payjpFormRef.current;
      if (!form) {
        setStatusMessage('決済フォームを確認できませんでした。再度お試しください。');
        return;
      }

      const tokenInput = form.querySelector<HTMLInputElement>('input[name="payjp-token"]');
      const token = tokenInput?.value;
      if (!token) {
        setStatusMessage('Pay.JP のトークン取得を待っています。しばらくしてから再度お試しください。');
        return;
      }

      setStatusMessage('');
      if (showConfirmation) {
        return;
      }
      if (tokenInput) {
        tokenInput.value = '';
      }
      setPendingToken(token);
      setShowConfirmation(true);
    },
    [handlePaymentWithToken, showConfirmation]
  );

  const handleConfirmPayment = useCallback(() => {
    if (!pendingToken) {
      setShowConfirmation(false);
      return;
    }
    const token = pendingToken;
    setPendingToken(null);
    setShowConfirmation(false);
    void handlePaymentWithToken(token);
  }, [handlePaymentWithToken, pendingToken]);

  const handlePayjpLoaded = useCallback(() => {
    setPayjpError('');
  }, []);

  const handlePayjpLoadError = useCallback(() => {
    setPayjpError('Pay.JP の読み込みに失敗しました。時間をおいて再度お試しください。');
  }, []);

  const canRenderPayment =
    !loadingUser &&
    !loadingReservation &&
    !reservationError &&
    reservation &&
    additionalCost != null &&
    sessionUser &&
    Boolean(payJpPublicKey);

  return (
    <>
      <Head>
        <title>レンタル延長 決済確認</title>
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
              <li>
                <a href={`/mypage/rentals/extend/${reservationId}`} className="text-red-600 hover:underline">
                  レンタル延長
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-600">決済確認</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-semibold text-gray-900">レンタル延長 決済確認</h1>
          <p className="text-sm text-gray-500">内容をご確認のうえ、クレジット決済を行ってください。</p>
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
                  <p className="mt-2 text-xs text-emerald-700">{extensionDays}日延長</p>
                </div>
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
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <span className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-700">
                      Apple Pay 対応
                    </span>
                    <span>Apple Pay での支払いも選択できます。</span>
                  </div>
                  <ul className="space-y-1 text-xs text-gray-500">
                    <li>※ Apple Pay は対応端末・ブラウザ（Safari）でのみ表示されます。</li>
                    <li>※ Apple Pay が表示されない場合は、クレジットカード決済をご利用ください。</li>
                    <li>※ ご利用環境により表示される決済方法が異なる場合があります。</li>
                  </ul>
                  {payjpError ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {payjpError}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-3">
                    <div ref={payjpSlotRef} />
                    {canRenderPayment ? (
                      <PayjpCheckout
                        formRef={payjpFormRef}
                        placeholderRef={payjpSlotRef}
                        onSubmit={handleSubmitPayment}
                        onLoad={handlePayjpLoaded}
                        onError={handlePayjpLoadError}
                        locale="ja"
                        publicKey={payJpPublicKey}
                        description={`${reservation.storeName} ${reservation.vehicleModel} 延長`}
                        amount={additionalCost ?? 0}
                        email={payjpCustomerEmail}
                        label={isProcessingPayment ? '決済中…' : 'クレジット決済で延長する'}
                        submitText="延長する"
                        enableApplePay
                      />
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full bg-gray-200 px-5 py-3 text-sm font-semibold text-gray-500"
                        disabled
                      >
                        クレジット決済で延長する
                      </button>
                    )}
                  </div>
                  {statusMessage ? (
                    <p className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                      {statusMessage}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={{
                    pathname: `/mypage/rentals/extend/${reservation.id}`,
                    query: { extensionDays: extensionDays.toString() },
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
                >
                  延長内容を修正
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700">予約情報が読み込めませんでした。</p>
          )}
        </section>
      </main>
      {showConfirmation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true">
            <h2 className="text-lg font-semibold text-gray-900">ご確認ください</h2>
            <p className="mt-4 text-sm text-gray-900">
              続けて長期レンタルしたい場合は長期価格との差額分を返金いたしますので、追加決済後にお問い合わせよりご連絡ください。
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                onClick={handleConfirmPayment}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
