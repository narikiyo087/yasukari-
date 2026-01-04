import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import type { RegistrationData } from "../../../../types/registration";
import type { Reservation } from "../../../../lib/reservations";
import PayjpCheckout from "../../../../components/PayjpCheckout";

const ACCESSORY_KEYS = ["halfCap", "jetHelmet", "brandHelmet", "glove"] as const;

const formatDateLabel = (dateString: string, fallback: string) => {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return fallback;

  return parsed.toLocaleDateString("en-US", {
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

  const [store, setStore] = useState("Adachi-Odai");
  const [modelName, setModelName] = useState("Vehicle");
  const [managementNumber, setManagementNumber] = useState("Not set");
  const [pickupDate, setPickupDate] = useState("2025-12-26");
  const [returnDate, setReturnDate] = useState("2025-12-27");
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnTime, setReturnTime] = useState("10:00");
  const [totalAmount, setTotalAmount] = useState(7830);
  const [couponCode, setCouponCode] = useState("");
  const [protectionTotal, setProtectionTotal] = useState(0);
  const [accessoryTotal, setAccessoryTotal] = useState(0);
  const [accessorySelection, setAccessorySelection] = useState<Record<string, number>>({});

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
          await router.replace("/en/login");
          return;
        }

        setSessionUser({ id: data.user.id, email: data.user.email, username: data.user.username });
        setAuthChecked(true);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setAuthError("Unable to verify your login session. Please try again shortly.");
          setAuthChecked(true);
        }
      }
    };

    void verifySession();
    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    if (!router.isReady) return;

    const params = router.query;
    const requiredParams = [
      "store",
      "modelName",
      "managementNumber",
      "pickupDate",
      "returnDate",
      "pickupTime",
      "returnTime",
      "totalAmount",
    ] as const;
    const missingParams = requiredParams.filter((key) => {
      const value = params[key];
      return typeof value !== "string" || value.trim() === "";
    });

    if (typeof params.store === "string" && params.store) setStore(params.store);
    if (typeof params.modelName === "string" && params.modelName) setModelName(params.modelName);
    if (typeof params.managementNumber === "string" && params.managementNumber)
      setManagementNumber(params.managementNumber);
    if (typeof params.pickupDate === "string" && params.pickupDate) setPickupDate(params.pickupDate);
    if (typeof params.returnDate === "string" && params.returnDate) setReturnDate(params.returnDate);
    if (typeof params.pickupTime === "string" && params.pickupTime) setPickupTime(params.pickupTime);
    if (typeof params.returnTime === "string" && params.returnTime) setReturnTime(params.returnTime);
    if (typeof params.totalAmount === "string") {
      const parsed = Number(params.totalAmount);
      if (!Number.isNaN(parsed)) {
        setTotalAmount(parsed);
      } else if (!missingParams.includes("totalAmount")) {
        missingParams.push("totalAmount");
      }
    }
    if (typeof params.couponCode === "string") setCouponCode(params.couponCode);
    if (typeof params.accessoryTotal === "string") setAccessoryTotal(Number(params.accessoryTotal));
    if (typeof params.protectionTotal === "string") setProtectionTotal(Number(params.protectionTotal));

    const nextAccessorySelection: Record<string, number> = {};
    ACCESSORY_KEYS.forEach((key) => {
      const value = params[key];
      if (typeof value === "string") {
        const parsed = Number(value);
        if (!Number.isNaN(parsed) && parsed > 0) {
          nextAccessorySelection[key] = parsed;
        }
      }
    });
    setAccessorySelection(nextAccessorySelection);

    if (missingParams.length > 0) {
      setQueryError("We could not restore your reservation details after refresh. Please start again.");
      setQueryReady(false);
    } else {
      setQueryError("");
      setQueryReady(true);
    }
  }, [router.isReady, router.query]);

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
          setRegistrationError("Unable to load your registration details. Please try again shortly.");
        }
      }
    };

    void fetchRegistration();
    return () => controller.abort();
  }, [authChecked]);

  const pickupLabel = useMemo(() => formatDateLabel(pickupDate, "Dec 26, 2025"), [pickupDate]);
  const returnLabel = useMemo(() => formatDateLabel(returnDate, "Dec 27, 2025"), [returnDate]);

  const rentalDurationHours = useMemo(() => {
    const pickup = new Date(`${pickupDate}T${pickupTime}:00`);
    const returned = new Date(`${returnDate}T${returnTime}:00`);
    const diff = returned.getTime() - pickup.getTime();
    if (Number.isNaN(diff) || diff <= 0) return null;
    return Math.round((diff / (1000 * 60 * 60)) * 10) / 10;
  }, [pickupDate, pickupTime, returnDate, returnTime]);

  const payJpPublicKey = process.env.NEXT_PUBLIC_PAYJP_PUBLIC_KEY ?? "pk_test_sample";

  const handlePaymentWithToken = useCallback(async (tokenId: string) => {
    if (!sessionUser) {
      setStatusMessage("We could not verify your login information. Please try again.");
      return;
    }

    setIsSavingReservation(true);
    setStatusMessage("Processing payment...");

    const pickupAt = new Date(`${pickupDate}T${pickupTime}:00`).toISOString();
    const returnAt = new Date(`${returnDate}T${returnTime}:00`).toISOString();

    try {
      const chargeResponse = await fetch("/api/payments/payjp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token: tokenId,
          amount: totalAmount,
          description: `${store} ${modelName} ${managementNumber}`,
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
        throw new Error(errorPayload?.error ?? "Pay.JP payment failed.");
      }

      const chargeData = (await chargeResponse.json()) as { chargeId: string; paidAt?: string };
      const paymentId = chargeData.chargeId;
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
          couponDiscount: accessoryTotal + protectionTotal,
          accessories:
            Object.keys(accessorySelection).length > 0 ? accessorySelection : undefined,
          notes: "Saved via Pay.JP payment",
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
          ? `Payment completed. Saved reservation ID ${reservation.id}. It will appear in your account shortly.`
          : "Payment completed. Please check your reservation list shortly."
      );

      if (reservation) {
        void router.push({
          pathname: "/en/reserve/flow/complete",
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
      setStatusMessage("Payment failed. Please double-check your details and try again.");
    } finally {
      setIsSavingReservation(false);
    }
  }, [
    accessoryTotal,
    accessorySelection,
    couponCode,
    managementNumber,
    modelName,
    pickupDate,
    pickupTime,
    protectionTotal,
    registration,
    rentalDurationHours,
    returnDate,
    returnTime,
    sessionUser,
    store,
    totalAmount,
  ]);

  useEffect(() => {
    if (!router.isReady || !authChecked) return;

    const token = router.query["payjp-token"];
    if (typeof token !== "string" || !token) return;
    if (processedTokenRef.current === token || isSavingReservation) return;

    processedTokenRef.current = token;
    setStatusMessage("Checking the payment result...");
    void handlePaymentWithToken(token);

    const { ["payjp-token"]: _ignored, ...restQuery } = router.query;
    void router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true });
  }, [authChecked, handlePaymentWithToken, isSavingReservation, router]);

  const handleSubmitPayment = useCallback((event: Event) => {
    event.preventDefault();
    setPayjpError("");

    const form = payjpFormRef.current;
    if (!form) {
      setStatusMessage("We could not access the payment form. Please try again.");
      return;
    }

    const tokenInput = form.querySelector<HTMLInputElement>('input[name="payjp-token"]');
    const token = tokenInput?.value;
    if (!token) {
      setStatusMessage("Waiting for Pay.JP token generation. Please try again shortly.");
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
    setPayjpError("Failed to load Pay.JP. Please try again shortly.");
  }, []);

  const handleBack = () => {
    if (queryError) {
      void router.push("/en/reserve/flow/step1");
      return;
    }

    const params = new URLSearchParams({
      store,
      modelName,
      managementNumber,
      pickupDate,
      returnDate,
      pickupTime,
      returnTime,
      couponCode,
      accessoryTotal: accessoryTotal.toString(),
      protectionTotal: protectionTotal.toString(),
      totalAmount: totalAmount.toString(),
    });

    void router.push(`/en/reserve/flow/step2?${params.toString()}`);
  };

  const canRenderPayment = authChecked && !authError && queryReady && !queryError;

  return (
    <>
      <Head>
        <title>Payment details - Step 3</title>
      </Head>
      <main className="min-h-screen bg-gray-50 pb-16">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Step 3 / 3</p>
              <h1 className="text-2xl font-bold text-gray-900">Enter payment details</h1>
              <p className="text-sm text-gray-600">Complete your payment securely through our external payment form.</p>
            </div>
            <Link
              href="/en/products"
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:border-gray-300"
            >
              Back to models
            </Link>
          </header>

          {authError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{authError}</p>
          ) : null}
          {queryError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p>{queryError}</p>
              <p className="mt-1">Please restart from the first step.</p>
            </div>
          ) : null}

          <section className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pickup & return</p>
                  <h2 className="text-lg font-bold text-gray-900">
                    {pickupLabel} {pickupTime} → {returnLabel} {returnTime}
                  </h2>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{store}</span>
                  <span className="text-xs text-gray-500">{modelName} / {managementNumber}</span>
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-center justify-between text-lg font-bold text-gray-900">
                  <span>Total rental fee (tax included)</span>
                  <span>¥{totalAmount.toLocaleString()}</span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-gray-100">
                    <dt>Accessories & protection</dt>
                    <dd className="font-semibold text-gray-900">
                      ¥{(accessoryTotal + protectionTotal).toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-gray-100">
                    <dt>Coupon</dt>
                    <dd className="font-semibold text-gray-900">{couponCode || "None"}</dd>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-gray-100">
                    <dt>Estimated rental duration</dt>
                    <dd className="font-semibold text-gray-900">
                      {rentalDurationHours ? `${rentalDurationHours} hours` : "Unavailable"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-gray-100">
                    <dt>Completion flag</dt>
                    <dd className="font-semibold text-gray-900">Incomplete</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Credit card payment</h3>
                <span className="text-xs text-gray-500">Secure payment form</span>
              </div>
              <p className="text-sm text-gray-600">
                Click the payment button to open the secure payment form. Enter your card details there.
              </p>
              {payjpError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{payjpError}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:border-gray-300"
                >
                  Back
                </button>
                <div ref={payjpSlotRef} />
                {canRenderPayment ? (
                  <PayjpCheckout
                    formRef={payjpFormRef}
                    placeholderRef={payjpSlotRef}
                    onSubmit={handleSubmitPayment}
                    onLoad={handlePayjpLoaded}
                    onError={handlePayjpLoadError}
                    locale="en"
                    publicKey={payJpPublicKey}
                    description={`${store} ${modelName} ${managementNumber}`}
                    amount={totalAmount}
                    email={sessionUser?.email ?? ""}
                    label={isSavingReservation ? "Processing..." : "Submit payment"}
                    submitText="Submit payment"
                    enableApplePay
                  />
                ) : (
                  <p className="text-sm text-gray-500">Preparing the payment form…</p>
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
                  <p className="font-semibold">Saved reservation preview</p>
                  <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-emerald-800">Reservation ID</dt>
                      <dd className="font-mono">{reservationPreview.id}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-emerald-800">Status</dt>
                      <dd>{reservationPreview.status}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-emerald-800">Pickup → return</dt>
                      <dd>
                        {formatDateLabel(reservationPreview.pickupAt, pickupLabel)} → {formatDateLabel(reservationPreview.returnAt, returnLabel)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-emerald-800">Payment amount</dt>
                      <dd>¥{reservationPreview.paymentAmount}</dd>
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
