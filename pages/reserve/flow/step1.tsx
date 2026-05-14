import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import type { RegistrationData } from "../../../types/registration";
import { REQUIRED_REGISTRATION_FIELDS } from "../../../types/registration";

const buildTimeOptions = (startHour: number, endHour: number) =>
  Array.from({ length: endHour - startHour + 1 }, (_, index) => {
    const hour = String(startHour + index).padStart(2, "0");
    return `${hour}:00`;
  });

const formatDateLabel = (dateString: string, fallback: string) => {
  if (!dateString) return fallback;
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return fallback;

  return parsed.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
};

export default function ReserveFlowStep1() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState("");

  const [store, setStore] = useState("足立小台店");
  const [modelName, setModelName] = useState("車両");
  const [managementNumber, setManagementNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [pickupDate, setPickupDate] = useState("2025-12-26");
  const [returnDate, setReturnDate] = useState("2025-12-27");
  const [pickupTime, setPickupTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [registrationChecked, setRegistrationChecked] = useState(false);
  const [registrationError, setRegistrationError] = useState("");

  const timeOptions = useMemo(() => {
    if (store.includes("三ノ輪")) {
      return buildTimeOptions(0, 23);
    }
    if (store.includes("足立")) {
      return buildTimeOptions(10, 18);
    }
    return buildTimeOptions(8, 17);
  }, [store]);

  const storeNotice = useMemo(() => {
    if (store.includes("三ノ輪")) {
      return "三ノ輪店は24時間営業を開始しました。貸出時間は24時間（1時間刻み）で選択できます。";
    }
    return "";
  }, [store]);

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
          user?: { id?: string } | null;
        };

        if (!data.user) {
          await router.replace("/login");
          return;
        }

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

    const params = router.query;
    if (typeof params.store === "string" && params.store) setStore(params.store);
    if (typeof params.modelName === "string" && params.modelName) setModelName(params.modelName);
    if (typeof params.managementNumber === "string") setManagementNumber(params.managementNumber);
    if (typeof params.pickupDate === "string" && params.pickupDate) setPickupDate(params.pickupDate);
    if (typeof params.returnDate === "string" && params.returnDate) setReturnDate(params.returnDate);
    if (typeof params.customerName === "string" && params.customerName) setCustomerName(params.customerName);
    if (typeof params.email === "string" && params.email) setEmail(params.email);
  }, [router.isReady, router.query]);

  useEffect(() => {
    if (!authChecked || authError) return;

    const controller = new AbortController();

    const fetchRegistration = async () => {
      try {
        const response = await fetch("/api/register/user", {
          credentials: "include",
          signal: controller.signal,
        });

        if (response.status === 401) {
          await router.replace("/login");
          return;
        }

        if (response.status === 404) {
          setRegistration(null);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load registration");
        }

        const data = (await response.json()) as { registration?: RegistrationData | null };
        const registrationData = data.registration ?? null;
        setRegistration(registrationData);

        if (registrationData) {
          const fullName = `${registrationData.name1} ${registrationData.name2}`.trim();
          setCustomerName(fullName);
          setEmail(registrationData.email || "");
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setRegistrationError("本登録情報の取得に失敗しました。時間をおいて再度お試しください。");
        }
      } finally {
        if (!controller.signal.aborted) {
          setRegistrationChecked(true);
        }
      }
    };

    void fetchRegistration();
    return () => controller.abort();
  }, [authChecked, authError, router]);

  const pickupLabel = useMemo(
    () => `${formatDateLabel(pickupDate, "2025年12月26日")}`,
    [pickupDate]
  );
  const returnLabel = useMemo(
    () => `${formatDateLabel(returnDate, "2025年12月27日")}`,
    [returnDate]
  );

  const isRegistrationComplete = useMemo(() => {
    if (!registration) return false;
    return REQUIRED_REGISTRATION_FIELDS.every((field) => Boolean(registration[field]));
  }, [registration]);

  const hasAgreedToRentalTerms = Boolean(registration?.rental_terms_agreed_at);

  const canProceed = Boolean(pickupTime && returnTime);

  const buildStepParams = () =>
    new URLSearchParams({
      store,
      modelName,
      managementNumber,
      pickupDate,
      returnDate,
      pickupTime,
      returnTime,
    });

  useEffect(() => {
    if (!pickupDate) return;

    const date = new Date(pickupDate);
    if (Number.isNaN(date.getTime())) return;

    const currentReturn = returnDate ? new Date(returnDate) : null;
    const hasValidReturn =
      currentReturn && !Number.isNaN(currentReturn.getTime()) && currentReturn > date;

    if (hasValidReturn) return;

    const updated = new Date(date);
    updated.setDate(updated.getDate() + 1);
    const newReturnDate = updated.toISOString().split("T")[0];

    setReturnDate((prev) => (prev === newReturnDate ? prev : newReturnDate));
  }, [pickupDate, returnDate]);

  useEffect(() => {
    if (!pickupTime) return;

    setReturnTime((prev) => (prev === pickupTime ? prev : pickupTime));
  }, [pickupTime]);

  useEffect(() => {
    if (!pickupTime) return;
    if (!timeOptions.includes(pickupTime)) {
      setPickupTime("");
      setReturnTime("");
    }
  }, [pickupTime, timeOptions]);

  const handleNext = () => {
    if (!registrationChecked) return;

    if (!isRegistrationComplete) {
      window.alert("本登録を完了してください");
      return;
    }

    if (!canProceed) {
      window.alert("日時を指定してください");
      return;
    }

    const params = buildStepParams();

    if (!hasAgreedToRentalTerms) {
      void router.push(`/reserve/flow/rental-bike-terms?${params.toString()}`);
      return;
    }

    void router.push(`/reserve/flow/step2?${params.toString()}`);
  };

  const membershipStatus = useMemo(() => {
    if (registrationError) return "本登録情報の取得に失敗しました";
    if (!registrationChecked) return "本登録情報を確認中...";
    if (isRegistrationComplete) return "本登録済み";
    return "本登録が未完了です";
  }, [isRegistrationComplete, registrationChecked, registrationError]);

  const nameDisplay =
    customerName || (!registrationChecked ? "読み込み中..." : "本登録情報がありません");
  const emailDisplay = email || (!registrationChecked ? "読み込み中..." : "本登録情報がありません");

  return (
    <>
      <Head>
        <title>予約内容の確認 - ステップ1</title>
      </Head>
      <main className="min-h-screen bg-gray-50 pb-16">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Step 1 / 3</p>
              <h1 className="text-2xl font-bold text-gray-900">予約内容を確認する</h1>
              <p className="text-sm text-gray-600">
                予約内容を確認して時間を指定してください。時間の選択が完了するまで次に進めません。
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:border-gray-300"
            >
              車種一覧に戻る
            </Link>
          </header>

          {authError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{authError}</p>
          ) : null}

          <section className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">車両選択</p>
                    <h2 className="text-lg font-bold text-gray-900">{modelName}</h2>
                    {managementNumber ? (
                      <p className="text-sm text-gray-600">管理番号: {managementNumber}</p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{store}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">会員情報</p>
                    <h2 className="text-lg font-bold text-gray-900">ご本人さま</h2>
                  </div>
                  <span className="text-xs text-gray-500">{membershipStatus}</span>
                </div>
                {registrationError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{registrationError}</p>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="text-gray-700">お名前</span>
                    <input
                      type="text"
                      value={nameDisplay}
                      readOnly
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-gray-900 shadow-sm focus:border-red-500 focus:outline-none"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-gray-700">メールアドレス</span>
                    <input
                      type="email"
                      value={emailDisplay}
                      readOnly
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-gray-900 shadow-sm focus:border-red-500 focus:outline-none"
                    />
                  </label>
                </div>
                {registrationChecked && !isRegistrationComplete && !registrationError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 space-y-2">
                    <p className="font-semibold">本登録が完了していません</p>
                    <p className="leading-relaxed">
                      予約を進めるには本登録を完了する必要があります。新しいページで本登録を行ってください。
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href="/mypage/registration"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-red-600 transition"
                      >
                        本登録ページを開く
                      </Link>
                      <Link
                        href="/mypage"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 transition"
                      >
                        マイページで確認
                      </Link>
                    </div>
                  </div>
                ) : null}
                {registrationChecked && isRegistrationComplete && !registrationError && !hasAgreedToRentalTerms ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    オプション選択へ進む前に、レンタルバイク利用規約への同意が必要です。次の画面で規約を確認のうえ、同意してください。
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">貸出・返却日時</p>
                    <h2 className="text-lg font-bold text-gray-900">日時の指定</h2>
                  </div>
                  <p className="text-xs text-red-600">時間を選択すると進めます</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-800">貸出希望日</p>
                    <p className="text-sm text-gray-600">{pickupLabel}</p>
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm shadow-sm focus:border-red-500 focus:outline-none"
                    >
                      <option value="">時間を選択</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-800">返却日時</p>
                    <p className="text-sm text-gray-600">{returnLabel}</p>
                    <select
                      value={returnTime}
                      disabled
                      className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-3 text-sm shadow-sm text-gray-500"
                    >
                      <option value="">貸出希望日から自動設定されます</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">貸出希望日の24時間後が返却日時になります。</p>
                  </div>
                </div>
                {storeNotice ? <p className="text-xs text-gray-500">{storeNotice}</p> : null}
                {!canProceed ? (
                  <p className="text-sm text-red-600">貸出と返却の時間を選択すると、オプション選択へ進めます。</p>
                ) : null}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">ご予約の概要</p>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">1 / 3</span>
                </div>
                <dl className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start justify-between">
                    <dt className="text-gray-500">店舗</dt>
                    <dd className="font-semibold text-gray-900">{store}</dd>
                  </div>
                  <div className="flex items-start justify-between">
                    <dt className="text-gray-500">車種</dt>
                    <dd className="font-semibold text-gray-900">{modelName}</dd>
                  </div>
                  <div className="flex items-start justify-between">
                    <dt className="text-gray-500">貸出日時</dt>
                    <dd className="text-right">
                      <p className="font-semibold text-gray-900">{pickupLabel}</p>
                      <p className="text-xs text-gray-600">{pickupTime || "時間未選択"}</p>
                    </dd>
                  </div>
                  <div className="flex items-start justify-between">
                    <dt className="text-gray-500">返却日時</dt>
                    <dd className="text-right">
                      <p className="font-semibold text-gray-900">{returnLabel}</p>
                      <p className="text-xs text-gray-600">{returnTime || "時間未選択"}</p>
                    </dd>
                  </div>
                </dl>
                <button
                  type="button"
                  disabled={!authChecked || !registrationChecked}
                  onClick={handleNext}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-red-600 transition disabled:cursor-not-allowed disabled:bg-red-200"
                >
                  オプション選択へ
                </button>
                {registrationChecked && !isRegistrationComplete ? (
                  <p className="mt-2 text-xs text-red-600">
                    本登録が完了すると次のステップに進めます。上部のリンクから本登録を行ってください。
                  </p>
                ) : null}
              </div>
              <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
                <p className="font-semibold">ログイン中の会員さま専用</p>
                <p className="mt-2 leading-relaxed">
                  予約内容の確認から決済まで、すべてログイン状態でご利用いただけます。ログアウト中の場合はログインページへリダイレクトされます。
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
