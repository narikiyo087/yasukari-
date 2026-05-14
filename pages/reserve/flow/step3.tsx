import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import type { RegistrationData } from "../../../types/registration";
import type { Reservation } from "../../../lib/reservations";
import PayjpCheckout from "../../../components/PayjpCheckout";
import { getPayjpPublicKey, getPayjpPublicKeyError } from "../../../lib/payjp";

const ACCESSORY_KEYS = ["halfCap", "jetHelmet", "brandHelmet", "glove"] as const;
const RESERVE_FLOW_STEP3_STORAGE_KEY = "reserve-flow-step3-payload";

const formatDateLabel = (dateString: string, fallback: string) => {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return fallback;

  return parsed.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
};

export default function ReserveFlowStep3() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState("");
  const [sessionUser, setSessionUser] = useState<{ id: string; email?: string; username?: string } | null>(null);
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [registrationError, setRegistrationError] = useState("");
  const [queryError, setQueryError] = useState("");
  const [queryReady, setQueryReady] = useState(false);

  const [statusMessage, setStatusMessage] = useState("");
  const [isSavingReservation, setIsSavingReservation] = useState(false);
  const [reservationPreview, setReservationPreview] = useState<Reservation | null>(null);
  const [payjpError, setPayjpError] = useState("");
  const payjpFormRef = useRef<HTMLFormElement | null>(null);
  const payjpSlotRef = useRef<HTMLDivElement | null>(null);
  const processedTokenRef = useRef<string | null>(null);

  const [store, setStore] = useState("足立小台店");
  const [modelName, setModelName] = useState("車両");
  const [managementNumber, setManagementNumber] = useState("未設定");
  const [pickupDate, setPickupDate] = useState("2025-12-26");
  const [returnDate, setReturnDate] = useState("2025-12-27");
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnTime, setReturnTime] = useState("10:00");
  const [totalAmount, setTotalAmount] = useState(7830);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [protectionTotal, setProtectionTotal] = useState(0);
  const [accessoryTotal, setAccessoryTotal] = useState(0);
  const [accessorySelection, setAccessorySelection] = useState<Record<string, number>>({});
  const [protectionSelection, setProtectionSelection] = useState({
    vehicle: true,
    theft: true,
  });

  useEffect(() => {
    const controller = new AbortController();
    const verifySession = async () => {
      try {
        const response = await fetch("/api/me", {
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to verify session");
        }

        const data = (await response.json().catch(() => ({}))) as {
          user?: { id: string; email?: string; username?: string } | null;
        };
        if (!data.user) {
          await router.replace("/login");
          return;
        }

        setSessionUser({ id: data.user.id, email: data.user.email, username: data.user.username });
        setAuthChecked(true);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setAuthError("ログイン状態の確認に失敗しました。時間をおいて再度お試しください。");
          setAuthChecked(true);
        }
      }
    };

    void verifySession();
    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    if (!router.isReady) return;
    const rawPayload =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem(RESERVE_FLOW_STEP3_STORAGE_KEY)
        : null;
    if (!rawPayload) {
      setQueryError("画面を更新したため予約情報が取得できませんでした。最初のページからやり直してください。");
      setQueryReady(false);
      return;
    }

    try {
      const payload = JSON.parse(rawPayload) as {
        store?: string;
        modelName?: string;
        managementNumber?: string;
        pickupDate?: string;
        returnDate?: string;
        pickupTime?: string;
        returnTime?: string;
        totalAmount?: number;
        couponCode?: string;
        couponDiscount?: number;
        accessoryTotal?: number;
        protectionTotal?: number;
        protectionSelection?: Record<string, boolean>;
        accessorySelection?: Record<string, number>;
      };

      if (
        !payload.store ||
        !payload.modelName ||
        !payload.managementNumber ||
        !payload.pickupDate ||
        !payload.returnDate ||
        !payload.pickupTime ||
        !payload.returnTime ||
        typeof payload.totalAmount !== "number"
      ) {
        throw new Error("Invalid reservation payload");
      }

      setStore(payload.store);
      setModelName(payload.modelName);
      setManagementNumber(payload.managementNumber);
      setPickupDate(payload.pickupDate);
      setReturnDate(payload.returnDate);
      setPickupTime(payload.pickupTime);
      setReturnTime(payload.returnTime);
      setTotalAmount(payload.totalAmount);
      setCouponCode(payload.couponCode ?? "");
      setCouponDiscount(typeof payload.couponDiscount === "number" ? payload.couponDiscount : 0);
      setAccessoryTotal(typeof payload.accessoryTotal === "number" ? payload.accessoryTotal : 0);
      setProtectionTotal(typeof payload.protectionTotal === "number" ? payload.protectionTotal : 0);

      const nextAccessorySelection: Record<string, number> = {};
      ACCESSORY_KEYS.forEach((key) => {
        const value = payload.accessorySelection?.[key];
        if (typeof value === "number" && value > 0) {
          nextAccessorySelection[key] = value;
        }
      });
      setAccessorySelection(nextAccessorySelection);

      setProtectionSelection({
        vehicle: payload.protectionSelection?.vehicle ?? true,
        theft: payload.protectionSelection?.theft ?? true,
      });

      setQueryError("");
      setQueryReady(true);
    } catch (error) {
      console.error(error);
      setQueryError("予約情報が不正です。最初のページからやり直してください。");
      setQueryReady(false);
    }
  }, [router.isReady]);

  useEffect(() => {
    if (!authChecked) return;

    const controller = new AbortController();
    const fetchRegistration = async () => {
      try {
        const response = await fetch("/api/register/user", {
          credentials: "include",
          signal: controller.signal,
        });

        if (response.status === 404) {
          setRegistration(null);
          return;
        }

        if (!response.ok) {
          throw new Error("failed to load registration");
        }

        const data = (await response.json()) as { registration?: RegistrationData | null };
        setRegistration(data.registration ?? null);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setRegistrationError("本登録情報の取得に失敗しました。時間をおいて再度お試しください。");
        }
      }
    };

    void fetchRegistration();
    return () => controller.abort();
  }, [authChecked]);

  const pickupLabel = useMemo(() => formatDateLabel(pickupDate, "2025年12月26日"), [pickupDate]);
  const returnLabel = useMemo(() => formatDateLabel(returnDate, "2025年12月27日"), [returnDate]);

  const rentalDurationHours = useMemo(() => {
    const pickup = new Date(`${pickupDate}T${pickupTime}:00`);
    const returned = new Date(`${returnDate}T${returnTime}:00`);
    const diff = returned.getTime() - pickup.getTime();
    if (Number.isNaN(diff) || diff <= 0) return null;
    return Math.round((diff / (1000 * 60 * 60)) * 10) / 10;
  }, [pickupDate, pickupTime, returnDate, returnTime]);

  const payjpCustomerEmail = registration?.email ?? sessionUser?.email ?? "";
  const payJpPublicKey = useMemo(() => getPayjpPublicKey(payjpCustomerEmail), [payjpCustomerEmail]);
  const payjpKeyError = useMemo(() => getPayjpPublicKeyError(payjpCustomerEmail), [payjpCustomerEmail]);

  useEffect(() => {
    if (payjpKeyError) {
      setPayjpError(payjpKeyError);
    }
  }, [payjpKeyError]);

  const handlePaymentWithToken = useCallback(async (tokenId: string) => {
    if (!sessionUser) {
      setStatusMessage("ログイン情報を確認できませんでした。再度お試しください。");
      return;
    }

    setIsSavingReservation(true);
    setStatusMessage("決済処理を実行しています…");

    const pickupAt = new Date(`${pickupDate}T${pickupTime}:00`).toISOString();
    const returnAt = new Date(`${returnDate}T${returnTime}:00`).toISOString();

    let paymentId: string | null = null;

    try {
      const availabilityResponse = await fetch("/api/reservations?validateOnly=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          storeName: store,
          vehicleModel: modelName,
          vehicleCode: managementNumber,
          pickupAt,
          returnAt,
          options: {
            vehicleCoverage: protectionSelection.vehicle ? "加入" : "未加入",
            theftCoverage: protectionSelection.theft ? "加入" : "未加入",
          },
          accessories: Object.keys(accessorySelection).length > 0 ? accessorySelection : undefined,
        }),
      });

      if (!availabilityResponse.ok) {
        const availabilityErrorPayload = (await availabilityResponse.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(
          availabilityErrorPayload?.error ??
            "予約可能な時間ではないため、決済を開始できません。日程を変更してお試しください。"
        );
      }

      const chargeResponse = await fetch("/api/payments/payjp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token: tokenId,
          amount: totalAmount,
          description: `${store} ${modelName} ${managementNumber}`,
          email: payjpCustomerEmail,
          metadata: {
            pickupAt,
            returnAt,
            store,
            modelName,
            managementNumber,
          },
        }),
      });

      if (!chargeResponse.ok) {
        const errorPayload = (await chargeResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorPayload?.error ?? "Pay.JP の決済処理に失敗しました。");
      }

      const chargeData = (await chargeResponse.json()) as { chargeId: string; paidAt?: string };
      paymentId = chargeData.chargeId;
      const paymentDate = chargeData.paidAt ?? new Date().toISOString();

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          storeName: store,
          vehicleModel: modelName,
          vehicleCode: managementNumber,
          vehiclePlate: managementNumber,
          pickupAt,
          returnAt,
          paymentAmount: totalAmount,
          paymentId,
          paymentDate,
          rentalDurationHours,
          rentalCompletedAt: "",
          reservationCompletedFlag: false,
          memberName: registration ? `${registration.name1} ${registration.name2}` : sessionUser.username ?? "",
          memberEmail: registration?.email ?? sessionUser.email ?? "",
          memberPhone: registration?.mobile ?? registration?.tel ?? "",
          couponCode,
          couponDiscount,
          options: {
            vehicleCoverage: protectionSelection.vehicle ? "加入" : "未加入",
            theftCoverage: protectionSelection.theft ? "加入" : "未加入",
          },
          accessories:
            Object.keys(accessorySelection).length > 0 ? accessorySelection : undefined,
          notes: "Pay.JP 決済経由で保存",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = (await response.json()) as { reservations?: Reservation[] };
      const reservation = data.reservations?.[0];
      setReservationPreview(reservation ?? null);
      setStatusMessage(
        reservation
          ? `決済が完了しました。予約ID ${reservation.id} を保存しました。マイページの予約状況に反映されます。`
          : "決済を保存しました。しばらくしてから予約一覧を確認してください。"
      );

      if (reservation) {
        void router.push({
          pathname: "/reserve/flow/complete",
          query: {
            reservationId: reservation.id,
            store,
            modelName,
            managementNumber,
            pickupDate,
            returnDate,
            pickupTime,
            returnTime,
            totalAmount: totalAmount.toString(),
          },
        });
      }
    } catch (error) {
      console.error("Failed to process Pay.JP payment", error);
      if (paymentId) {
        try {
          const refundResponse = await fetch("/api/payments/payjp-refund", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ chargeId: paymentId }),
          });

          if (!refundResponse.ok) {
            const refundErrorPayload = (await refundResponse.json().catch(() => null)) as
              | { error?: string }
              | null;
            console.error("Failed to refund charge after reservation failure", refundErrorPayload?.error);
            setStatusMessage(
              "決済後の予約保存に失敗しました。カード会社側で返金処理を進めていますが、反映まで時間がかかる場合があります。"
            );
            return;
          }

          setStatusMessage(
            "予約保存に失敗したため、課金は自動で返金処理しました。時間をおいて予約をやり直してください。"
          );
          return;
        } catch (refundError) {
          console.error("Failed to request refund after reservation failure", refundError);
          setStatusMessage(
            "決済後の予約保存に失敗しました。返金処理の確認が必要なため、サポートへお問い合わせください。"
          );
          return;
        }
      }

      setStatusMessage("決済に失敗しました。入力内容を確認のうえ、再度お試しください。");
    } finally {
      setIsSavingReservation(false);
    }
  }, [
    accessoryTotal,
    accessorySelection,
    couponCode,
    couponDiscount,
    managementNumber,
    modelName,
    pickupDate,
    pickupTime,
    payjpCustomerEmail,
    registration,
    rentalDurationHours,
    returnDate,
    returnTime,
    sessionUser,
    store,
    totalAmount,
    protectionSelection,
  ]);

  useEffect(() => {
    if (!router.isReady || !authChecked) return;

    const token = router.query["payjp-token"];
    if (typeof token !== "string" || !token) return;
    if (processedTokenRef.current === token || isSavingReservation) return;

    processedTokenRef.current = token;
    setStatusMessage("決済結果を確認しています…");
    void handlePaymentWithToken(token);

    const { ["payjp-token"]: _ignored, ...restQuery } = router.query;
    void router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true });
  }, [authChecked, handlePaymentWithToken, isSavingReservation, router]);

  const handleSubmitPayment = useCallback((event: Event) => {
    event.preventDefault();
    setPayjpError("");

    const form = payjpFormRef.current;
    if (!form) {
      setStatusMessage("決済フォームを確認できませんでした。再度お試しください。");
      return;
    }

    const tokenInput = form.querySelector<HTMLInputElement>('input[name="payjp-token"]');
    const token = tokenInput?.value;
    if (!token) {
      setStatusMessage("Pay.JP のトークン取得を待っています。しばらくしてから再度お試しください。");
      return;
    }

    setStatusMessage("");
    if (tokenInput) {
      tokenInput.value = "";
    }
    void handlePaymentWithToken(token);
  }, [handlePaymentWithToken]);

  const handlePayjpLoaded = useCallback(() => {
    setPayjpError("");
  }, []);

  const handlePayjpLoadError = useCallback(() => {
    setPayjpError("Pay.JP の読み込みに失敗しました。時間をおいて再度お試しください。");
  }, []);

  const canRenderPayment = authChecked && !authError && queryReady && !queryError && Boolean(payJpPublicKey);

  return (
    <>
      <Head>
        <title>決済情報の入力 - ステップ3</title>
      </Head>
      <main className="min-h-screen bg-gray-50 pb-16">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Step 3 / 3</p>
              <h1 className="text-2xl font-bold text-gray-900">決済情報の入力</h1>
            </div>
          </header>

          {authError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{authError}</p>
          ) : null}
          {queryError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p>{queryError}</p>
              <p className="mt-1">お手数ですが、最初のページからもう一度お手続きください。</p>
            </div>
          ) : null}

          <section className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">貸出・返却日時</p>
                  <h2 className="text-base font-bold text-gray-900">
                    {pickupLabel} {pickupTime} → {returnLabel} {returnTime}
                  </h2>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{store}</span>
                  <p className="text-xs text-gray-500">{modelName} / {managementNumber}</p>
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center justify-between text-lg font-bold text-gray-900">
                  <span className="flex flex-col leading-tight">
                    <span>レンタル料金</span>
                    <span>合計（税込）</span>
                  </span>
                  <span>{totalAmount.toLocaleString()}円</span>
                </div>
                <dl className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-600 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-gray-100">
                    <dt>用品・補償の内訳</dt>
                    <dd className="font-semibold text-gray-900">
                      {(accessoryTotal + protectionTotal).toLocaleString()}円
                    </dd>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-gray-100">
                    <dt>クーポン</dt>
                    <dd className="font-semibold text-gray-900">{couponCode || "未使用"}</dd>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-gray-100">
                    <dt>想定レンタル時間</dt>
                    <dd className="font-semibold text-gray-900">
                      {rentalDurationHours ? `${rentalDurationHours} 時間` : "算出不可"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900">クレジットカード決済</h3>
                <span className="text-xs text-gray-500">安全なカード決済フォーム</span>
              </div>
              <p className="text-sm text-gray-600">
                決済ボタンを押すと安全な決済画面が開きます。カード情報はそちらで入力してください。
              </p>
              <p className="text-sm font-semibold text-red-600">
                決済中は更新ボタンや戻るボタンを押さないようにしてください。
              </p>
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
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{payjpError}</p>
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
                      description={`${store} ${modelName} ${managementNumber}`}
                      amount={totalAmount}
                      email={payjpCustomerEmail}
                      label={isSavingReservation ? "決済中…" : "決済する"}
                      submitText="決済する"
                      enableApplePay
                    />
                  ) : (
                    <p className="text-sm text-gray-500">決済フォームを準備しています…</p>
                  )}
                </div>
              {statusMessage ? (
                <p className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">{statusMessage}</p>
              ) : null}
              {registrationError ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{registrationError}</p>
              ) : null}
              {reservationPreview ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p className="font-semibold">保存された予約情報（プレビュー）</p>
                  <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-emerald-800">予約ID</dt>
                      <dd className="font-mono">{reservationPreview.id}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-emerald-800">利用ステータス</dt>
                      <dd>{reservationPreview.status}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-emerald-800">貸出〜返却</dt>
                      <dd>
                        {formatDateLabel(reservationPreview.pickupAt, pickupLabel)} → {formatDateLabel(reservationPreview.returnAt, returnLabel)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-emerald-800">決済金額</dt>
                      <dd>{reservationPreview.paymentAmount} 円</dd>
                    </div>
                  </dl>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
