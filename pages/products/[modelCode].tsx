import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  getBikeModels,
  BikeModel,
  BikeSpec,
  getBikeClasses,
  getVehiclesByModel,
  BikeVehicle,
} from "../../lib/bikes";
import { readVehicleRentalPricesFromStore } from "../../lib/server/vehicleRentalPrices";
import RecentlyViewed from "../../components/RecentlyViewed";
import type { Reservation } from "../../lib/reservations";
import { formatAdjustedYenPrice } from "../../lib/pricing";
import useInternationalPricingMultiplier from "../../lib/useInternationalPricingMultiplier";
import { STORE_OPTIONS } from "../../lib/dashboard/storeOptions";

interface Props {
  bike: BikeModel;
  className?: string;
  vehicles: BikeVehicle[];
  priceGuide: Partial<Record<DurationKey, string>>;
}

const specLabels: Record<keyof BikeSpec, string> = {
  license: "必要免許",
  capacity: "乗車定員",
  length: "全長",
  width: "全幅",
  height: "全高",
  seatHeight: "シート高",
  weight: "車両重量",
  tank: "タンク容量",
  fuel: "使用燃料",
  output: "最高出力",
  displacement: "排気量",
  torque: "最大トルク",
};

const durationDays = {
  "24h": 1,
  "2d": 2,
  "1w": 7,
  "2w": 14,
  "1m": 31,
} as const;

type DurationKey = keyof typeof durationDays;

const formatPrice = (price: number | undefined) =>
  typeof price === "number" && Number.isFinite(price)
    ? `${price.toLocaleString()}円`
    : "-";

export default function ProductDetailPage({
  bike,
  className,
  vehicles,
  priceGuide,
}: Props) {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRentalLimitModal, setShowRentalLimitModal] = useState(false);
  const [showBlacklistedModal, setShowBlacklistedModal] = useState(false);
  const [showStoreRequiredModal, setShowStoreRequiredModal] = useState(false);
  const [rentalCheckError, setRentalCheckError] = useState("");
  const [checkingRental, setCheckingRental] = useState(false);
  const router = useRouter();
  const priceMultiplier = useInternationalPricingMultiplier("ja");


  const adjustedPriceGuide = useMemo(() => {
    const next: Partial<Record<DurationKey, string>> = {};
    (Object.entries(priceGuide) as [DurationKey, string | undefined][])
      .forEach(([key, value]) => {
        if (!value || value === "-") {
          next[key] = value ?? "-";
          return;
        }
        next[key] = formatAdjustedYenPrice(value, priceMultiplier) ?? value;
      });
    return next;
  }, [priceGuide, priceMultiplier]);

  const vehicleOptions = useMemo(
    () =>
      vehicles.map((vehicle) => ({
        value: vehicle.managementNumber,
        label: vehicle.managementNumber,
        storeId: vehicle.storeId,
      })),
    [vehicles]
  );

  const storeOptions = useMemo(() => {
    const uniqueStores = new Set<string>();
    STORE_OPTIONS.forEach((store) => uniqueStores.add(store.id));
    (bike.stores ?? []).forEach((storeId) => {
      if (storeId) uniqueStores.add(storeId);
    });
    vehicles.forEach((vehicle) => {
      if (vehicle.storeId) uniqueStores.add(vehicle.storeId);
    });
    return Array.from(uniqueStores);
  }, [bike.stores, vehicles]);

  const storeStockCount = useMemo(() => {
    const counts = new Map<string, number>();
    storeOptions.forEach((storeId) => counts.set(storeId, 0));
    vehicles.forEach((vehicle) => {
      if (!vehicle.storeId) return;
      counts.set(vehicle.storeId, (counts.get(vehicle.storeId) ?? 0) + 1);
    });
    return counts;
  }, [storeOptions, vehicles]);

  const filteredVehicleOptions = useMemo(() => {
    if (!selectedStoreId) return [];
    return vehicleOptions.filter((vehicle) => vehicle.storeId === selectedStoreId);
  }, [vehicleOptions, selectedStoreId]);

  const hasStock = vehicleOptions.length > 0;
  const hasFilteredStock = filteredVehicleOptions.length > 0;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("recentBikes");
      const list: BikeModel[] = stored ? JSON.parse(stored) : [];
      const existingIndex = list.findIndex((b) => b.modelCode === bike.modelCode);
      if (existingIndex !== -1) list.splice(existingIndex, 1);
      list.unshift(bike);
      if (list.length > 5) list.length = 5;
      localStorage.setItem("recentBikes", JSON.stringify(list));
    } catch {
      // ignore write errors
    }
  }, [bike]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const controller = new AbortController();
    const checkSession = async () => {
      try {
        const response = await fetch("/api/me", {
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) {
          setShowAuthModal(true);
          return;
        }

        const data = (await response.json().catch(() => ({}))) as { user?: { id?: string } | null };
        if (!data.user) {
          setShowAuthModal(true);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setShowAuthModal(true);
      }
    };

    void checkSession();
    return () => controller.abort();
  }, []);

  const specEntries = Object.entries(bike.spec ?? {}).filter(
    ([, value]) => Boolean(value)
  );

  const tagItems = [...(bike.tags ?? []), bike.badge].filter(Boolean) as string[];

  const canonicalUrl = `https://yasukari.com/products/${bike.modelCode}`;
  const productDescription =
    bike.description ||
    `${bike.modelName}のレンタル料金・スペック・取扱店舗・空き状況。東京の格安レンタルバイク「ヤスカリ」で予約できます。`;
  const price24hValue = (() => {
    const raw = adjustedPriceGuide["24h"];
    if (!raw || raw === "-") return undefined;
    const n = Number(String(raw).replace(/[^0-9]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  })();
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: bike.modelName,
    image: bike.img,
    description: productDescription,
    url: canonicalUrl,
    ...(price24hValue
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "JPY",
            price: price24hValue,
            availability: hasStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url: canonicalUrl,
            description: "24時間レンタル基本料金",
          },
        }
      : {}),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: "https://yasukari.com/" },
      { "@type": "ListItem", position: 2, name: "車種・料金", item: "https://yasukari.com/products" },
      { "@type": "ListItem", position: 3, name: bike.modelName, item: canonicalUrl },
    ],
  };

  const selectedVehicleStore = useMemo(
    () => vehicleOptions.find((option) => option.value === selectedVehicle)?.storeId,
    [selectedVehicle, vehicleOptions]
  );

  useEffect(() => {
    setSelectedVehicle("");
  }, [selectedStoreId]);

  const hasActiveRental = (reservations: Reservation[]) =>
    reservations.some((reservation) => {
      const isCompleted =
        reservation.reservationCompletedFlag || reservation.status === "予約完了";
      return !isCompleted && reservation.status !== "キャンセル";
    });

  const handleReserveClick = async () => {
    if (!selectedStoreId) {
      setShowStoreRequiredModal(true);
      return;
    }
    if (!selectedVehicle || checkingRental) return;
    setCheckingRental(true);
    setRentalCheckError("");

    try {
      const registrationResponse = await fetch("/api/register/user", {
        credentials: "include",
      });

      if (registrationResponse.status === 401) {
        setShowAuthModal(true);
        return;
      }

      if (registrationResponse.ok) {
        const registrationData = (await registrationResponse.json()) as {
          registration?: { is_blacklisted?: boolean } | null;
        };
        if (registrationData.registration?.is_blacklisted === true) {
          setShowBlacklistedModal(true);
          return;
        }
      }

      const response = await fetch("/api/reservations/me", {
        credentials: "include",
      });

      if (response.status === 401) {
        setShowAuthModal(true);
        return;
      }

      if (!response.ok) {
        throw new Error("failed to load reservations");
      }

      const data = (await response.json()) as { reservations?: Reservation[] };
      const reservations = data.reservations ?? [];

      if (hasActiveRental(reservations)) {
        setShowRentalLimitModal(true);
        return;
      }

      await router.push(`/reserve/models/${selectedVehicle}`);
    } catch (error) {
      console.error("Failed to verify rental status", error);
      setRentalCheckError("予約状況の確認に失敗しました。時間をおいて再度お試しください。");
      setShowRentalLimitModal(true);
    } finally {
      setCheckingRental(false);
    }
  };

  return (
    <>
      <Head>
        <title>{bike.modelName} - ヤスカリ</title>
        <meta
          name="description"
          content={`${bike.modelName}のレンタル料金・スペック・取扱店舗・空き状況。東京の格安レンタルバイク「ヤスカリ」で予約できます。${
            bike.description ? ` ${bike.description}` : ""
          }`}
        />
        <link
          rel="canonical"
          href={`https://yasukari.com/products/${bike.modelCode}`}
        />
        <meta property="og:type" content="product" />
        <meta property="og:site_name" content="ヤスカリ" />
        <meta property="og:title" content={`${bike.modelName} - ヤスカリ`} />
        <meta
          property="og:description"
          content={`${bike.modelName}のレンタル料金・スペック・取扱店舗・空き状況。東京の格安レンタルバイク「ヤスカリ」で予約できます。`}
        />
        <meta
          property="og:url"
          content={`https://yasukari.com/products/${bike.modelCode}`}
        />
        <meta property="og:image" content={bike.img} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${bike.modelName} - ヤスカリ`} />
        <meta
          name="twitter:image"
          content={bike.img}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      </Head>
      <main className="min-h-screen bg-transparent pb-12">
        <div className="w-full py-8 space-y-10">
          <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-red-600 font-medium">
                  ホーム
                </Link>
              </li>
              <li className="text-slate-300">/</li>
              <li>
                <Link
                  href="/products"
                  className="hover:text-red-600 font-medium"
                >
                  車種・料金
                </Link>
              </li>
              <li className="text-slate-300">/</li>
              <li className="text-slate-900 font-semibold" aria-current="page">
                {bike.modelName}
              </li>
            </ol>
          </nav>

          <section className="bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
            <div className="lg:grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative h-72 sm:h-96 lg:aspect-[4/3] lg:h-auto">
                <img
                  src={bike.img}
                  alt={bike.modelName}
                  className="w-full h-full object-cover"
                />
                {bike.badge && (
                  <span className="absolute top-4 left-4 inline-flex items-center rounded bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">
                    {bike.badge}
                  </span>
                )}
              </div>

              <div className="p-6 lg:p-8 flex flex-col gap-6 justify-center">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                    model detail
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                      {bike.modelName}
                    </h1>
                    {className ? (
                      <span className="rounded bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                        {className}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {bike.description || "ヤスカリで人気のモデルです。スペックや料金の詳細は以下をご覧ください。"}
                  </p>
                </div>

                {tagItems.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tagItems.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                  <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">在庫の選択</p>
                        <span className="text-xs text-slate-500">
                          {selectedStoreId ? `${filteredVehicleOptions.length}件` : `${vehicles.length}件`}
                        </span>
                      </div>
                      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-700">レンタル店舗を選択</p>
                        <p className="mt-1 text-xs text-slate-500">
                          まず、店舗を選んでから在庫を選択してください。
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          三ノ輪店はセルフ店（セルフサービス）です。
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {storeOptions.length === 0 ? (
                            <span className="text-xs text-slate-500">
                              ただいま在庫がない、もしくは貸出中です。
                            </span>
                          ) : (
                            storeOptions.map((storeId) => {
                              const isSelected = storeId === selectedStoreId;
                              const stockCount = storeStockCount.get(storeId) ?? 0;
                              return (
                                <button
                                  key={storeId}
                                  type="button"
                                  onClick={() => setSelectedStoreId(storeId)}
                                  className={`rounded-md px-4 py-2 text-xs font-semibold transition ${
                                    isSelected
                                      ? "bg-red-600 text-white border border-red-600"
                                      : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  {storeId}（在庫{stockCount}件）
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                      <div
                        onMouseDown={() => {
                          if (!selectedStoreId) setShowStoreRequiredModal(true);
                        }}
                        onFocus={() => {
                          if (!selectedStoreId) setShowStoreRequiredModal(true);
                        }}
                      >
                        <select
                          value={selectedVehicle}
                          onChange={(e) => {
                            if (!selectedStoreId) {
                              setShowStoreRequiredModal(true);
                              return;
                            }
                            setSelectedVehicle(e.target.value);
                          }}
                          className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                          disabled={selectedStoreId ? filteredVehicleOptions.length === 0 : false}
                        >
                          {!selectedStoreId ? (
                            <option value="" disabled>
                              先に店舗を選択してください
                            </option>
                          ) : filteredVehicleOptions.length === 0 ? (
                            <option value="" disabled>
                              在庫がありません
                            </option>
                          ) : (
                            <>
                              <option value="" disabled>
                                管理番号を選択してください
                              </option>
                              {filteredVehicleOptions.map((vehicle) => (
                                <option key={vehicle.value} value={vehicle.value}>
                                  {vehicle.label}
                                </option>
                              ))}
                            </>
                          )}
                        </select>
                      </div>
                      {selectedVehicleStore ? (
                        <p className="text-xs text-slate-600">
                          紐づく店舗ID: <span className="font-semibold">{selectedVehicleStore}</span>
                        </p>
                      ) : null}
                      {hasStock ? (
                        <button
                          type="button"
                          onClick={handleReserveClick}
                          disabled={
                            selectedStoreId
                              ? !selectedVehicle || !hasFilteredStock || checkingRental
                              : false
                          }
                          className="inline-flex w-full items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                        >
                          {checkingRental ? "予約状況を確認中…" : "この車種をレンタル予約する"}
                        </button>
                      ) : (
                        <button
                          className="inline-flex w-full items-center justify-center rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 cursor-not-allowed"
                          disabled
                          aria-disabled="true"
                        >
                          在庫がありません
                        </button>
                      )}
                      <div className="flex flex-col gap-2">
                        <Link
                          href="#price-guide"
                          className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                        >
                          料金プランを見る
                        </Link>
                        <Link
                          href="/contact"
                          className="inline-flex w-full items-center justify-center rounded-md border border-emerald-600 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition"
                        >
                          お問い合わせ
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 w-full">
                    <div className="rounded-lg bg-white shadow-sm border border-slate-200 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">取扱店舗</h3>
                        <span className="text-xs font-medium text-slate-500">Stores</span>
                      </div>
                      {bike.stores && bike.stores.length > 0 ? (
                        <ul className="space-y-2 text-sm text-slate-800">
                          {bike.stores.map((store) => (
                            <li
                              key={store}
                              className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2"
                            >
                              <span className="h-2 w-2 rounded-full bg-red-600" aria-hidden />
                              <span>{store}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-600">
                          店舗在庫は変動します。最寄りの店舗までお問い合わせください。
                        </p>
                      )}
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-slate-900">安心のサポート</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        ヘルメットや装備のレンタル、万が一のトラブル対応など、お客様の快適なツーリングをサポートします。
                      </p>
                      <Link
                        href="/insurance"
                        className="group mt-4 inline-flex items-center justify-center gap-2 rounded-md border border-red-600 bg-white px-5 py-2 text-sm font-semibold text-red-700 transition duration-200 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                      >
                        サポート内容を確認
                        <span
                          aria-hidden
                          className="translate-x-0 text-base transition duration-200 group-hover:translate-x-0.5"
                        >
                          →
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6" id="price-guide">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">料金の目安</h2>
                <span className="text-xs font-medium text-slate-500">Price Guide</span>
              </div>
              <div className="rounded-lg bg-white shadow-sm border border-slate-200 p-6 space-y-3">
                <p className="text-sm text-slate-700">
                  24時間料金を基準に、長期レンタルほどお得になる料金プランをご用意しています。
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  {[
                    { label: "24時間", value: adjustedPriceGuide["24h"] ?? "-" },
                    { label: "2日間", value: adjustedPriceGuide["2d"] ?? "-" },
                    { label: "1週間", value: adjustedPriceGuide["1w"] ?? "-" },
                    { label: "2週間", value: adjustedPriceGuide["2w"] ?? "-" },
                    { label: "1ヶ月", value: adjustedPriceGuide["1m"] ?? "-" },
                    { label: "補償プラン", value: "加入可能" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-center"
                    >
                      <div className="text-xs font-semibold text-slate-500">
                        {item.label}
                      </div>
                      <div className="mt-1 text-base font-bold text-slate-900">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">スペック</h2>
                <span className="text-xs font-medium text-slate-500">Spec</span>
              </div>
              <div className="rounded-lg bg-white shadow-sm border border-slate-200 p-6">
                {specEntries.length > 0 ? (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                    {specEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="flex flex-col gap-1 rounded-md bg-slate-50 px-4 py-3"
                      >
                        <dt className="text-xs font-semibold text-slate-500">
                          {specLabels[key as keyof BikeSpec]}
                        </dt>
                        <dd className="text-sm font-medium text-slate-900">{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-sm text-slate-600">
                    詳細なスペック情報は準備中です。お問い合わせいただければスタッフがご案内いたします。
                  </p>
                )}
              </div>
            </div>
          </section>

          <RecentlyViewed />
        </div>
      </main>
      {showAuthModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="bg-red-600 px-6 py-4 text-white">
              <p className="text-sm font-semibold uppercase tracking-wide">ヤスカリ Member</p>
              <h2 className="mt-1 text-xl font-bold">会員登録で予約がスムーズに</h2>
            </div>
            <div className="space-y-4 px-6 py-5 text-slate-700">
              <p className="text-sm leading-relaxed">
                未ログインの方は、会員登録後に本登録まで完了していただくとご予約できます。
              </p>
              <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                ヤスカリ会員になると、長期ほどお得な料金や会員限定クーポンでさらにお得にバイクを借りられます。
              </div>
              <ul className="grid gap-2 text-sm text-slate-600">
                {[
                  "即日予約に必要な情報をまとめて管理",
                  "お得なキャンペーンやクーポン情報を受け取れる",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-red-600" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-md bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 transition"
                  onClick={() => router.push("/login")}
                >
                  OK（ログイン・会員登録へ）
                </button>
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
                  onClick={() => setShowAuthModal(false)}
                >
                  今は閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {showRentalLimitModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-4 text-slate-900">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-900">Rental Notice</p>
              <h2 className="mt-1 text-xl font-bold text-red-600">レンタル中のバイクを返却してください</h2>
            </div>
            <div className="space-y-4 px-6 py-5 text-slate-700">
              {rentalCheckError ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {rentalCheckError}
                </p>
              ) : (
                <>
                  <p className="text-sm leading-relaxed">
                    現在ご利用中のレンタルがあるため、新しい予約はできません。
                  </p>
                  <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    「マイページ」→「予約状況」→「直近の予約や利用状況をここに表示します。」で
                    返却ステータスをご確認ください。
                  </div>
                </>
              )}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-md bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                  onClick={() => router.push("/mypage")}
                >
                  マイページの予約状況へ
                </button>
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
                  onClick={() => setShowRentalLimitModal(false)}
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {showBlacklistedModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="border-b border-amber-100 bg-amber-50 px-6 py-4 text-slate-900">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-900">Rental Notice</p>
              <h2 className="mt-1 text-xl font-bold text-amber-700">現在マイページのアクセスは制限されています</h2>
            </div>
            <div className="space-y-4 px-6 py-5 text-slate-700">
              <p className="text-sm leading-relaxed">
                ご利用状況の確認により、現在このアカウントのマイページ表示を制限しています。
                ご不明点は店舗またはサポートまでお問い合わせください。
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-md bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                  onClick={() => router.push("/contact")}
                >
                  お問い合わせ
                </button>
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
                  onClick={() => setShowBlacklistedModal(false)}
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {showStoreRequiredModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="border-b border-amber-100 bg-amber-50 px-6 py-4 text-slate-900">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-900">Store Notice</p>
              <h2 className="mt-1 text-xl font-bold text-amber-700">レンタル店舗を選択してください</h2>
            </div>
            <div className="space-y-4 px-6 py-5 text-slate-700">
              <p className="text-sm leading-relaxed">
                先にレンタル店舗のボタンを選択してから、在庫や予約ボタンをご利用ください。
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-md bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                  onClick={() => setShowStoreRequiredModal(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  const modelCode = params?.modelCode as string | undefined;
  if (!modelCode) return { notFound: true };

  const [bikes, classes] = await Promise.all([getBikeModels(), getBikeClasses()]);
  const bike = bikes.find((b) => b.modelCode === modelCode);

  if (!bike) {
    return { notFound: true };
  }

  const [bikeClass, vehicles, rentalPrices] = await Promise.all([
    Promise.resolve(classes.find((cls) => cls.classId === bike.classId)),
    bike.modelId != null ? getVehiclesByModel(bike.modelId) : Promise.resolve([]),
    bike.modelId != null
      ? readVehicleRentalPricesFromStore(bike.modelId)
      : Promise.resolve([]),
  ]);

  const classNameLabel = bikeClass?.className;
  const rentalPriceMap = rentalPrices.reduce<Record<number, number>>((acc, record) => {
    acc[record.days] = record.price;
    return acc;
  }, {});

  const priceGuide = (Object.entries(durationDays) as [DurationKey, number][])
    .map(([key, days]) => {
      const rentalPrice = rentalPriceMap[days];
      if (typeof rentalPrice === "number") {
        return [key, formatPrice(rentalPrice)] as [DurationKey, string];
      }
      return [key, "-"] as [DurationKey, string];
    })
    .reduce<Partial<Record<DurationKey, string>>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  return {
    props: {
      bike,
      className: classNameLabel ?? undefined,
      vehicles,
      priceGuide,
    },
  };
};
