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
} from "../../../lib/bikes";
import { readVehicleRentalPrices } from "../../../lib/server/vehicleRentalPrices";
import RecentlyViewedEn from "../../../components/RecentlyViewedEn";
import type { Reservation } from "../../../lib/reservations";
import {
  applyInternationalMultiplier,
  INTERNATIONAL_PRICE_MULTIPLIER,
} from "../../../lib/pricing";

interface Props {
  bike: BikeModel;
  className?: string;
  vehicles: BikeVehicle[];
  priceGuide: Partial<Record<DurationKey, string>>;
}

const specLabels: Record<keyof BikeSpec, string> = {
  license: "Required license",
  capacity: "Seating capacity",
  length: "Overall length",
  width: "Overall width",
  height: "Overall height",
  seatHeight: "Seat height",
  weight: "Weight",
  tank: "Fuel tank",
  fuel: "Fuel type",
  output: "Maximum output",
  displacement: "Displacement",
  torque: "Maximum torque",
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
    ? `${price.toLocaleString()} JPY`
    : "-";

const normalizePrice = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const sanitized = value.replace(/,/g, "").trim();
    if (!sanitized) {
      return undefined;
    }

    const numericValue = Number(sanitized);
    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }

  return undefined;
};

const applyPriceMultiplier = (price: number) =>
  applyInternationalMultiplier(price, INTERNATIONAL_PRICE_MULTIPLIER);

export default function ProductDetailPageEn({
  bike,
  className,
  vehicles,
  priceGuide,
}: Props) {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRentalLimitModal, setShowRentalLimitModal] = useState(false);
  const [showStoreRequiredModal, setShowStoreRequiredModal] = useState(false);
  const [rentalCheckError, setRentalCheckError] = useState("");
  const [checkingRental, setCheckingRental] = useState(false);
  const router = useRouter();

  const vehicleOptions = useMemo(
    () =>
      vehicles.map((vehicle) => ({
        value: vehicle.managementNumber,
        label: vehicle.managementNumber,
        storeId: vehicle.storeId,
      })),
    [vehicles]
  );

  const hasStock = vehicleOptions.length > 0;
  const storeOptions = useMemo(() => {
    const uniqueStores = new Set<string>();
    vehicles.forEach((vehicle) => {
      if (vehicle.storeId) uniqueStores.add(vehicle.storeId);
    });
    return Array.from(uniqueStores);
  }, [vehicles]);

  const filteredVehicleOptions = useMemo(() => {
    if (!selectedStoreId) return [];
    return vehicleOptions.filter((vehicle) => vehicle.storeId === selectedStoreId);
  }, [vehicleOptions, selectedStoreId]);

  const hasFilteredStock = filteredVehicleOptions.length > 0;
  const showPrice = Boolean(priceGuide["24h"] && priceGuide["24h"] !== "-");

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

      await router.push(`/en/reserve/models/${selectedVehicle}`);
    } catch (error) {
      console.error("Failed to verify rental status", error);
      setRentalCheckError("We could not confirm your rental status. Please try again later.");
      setShowRentalLimitModal(true);
    } finally {
      setCheckingRental(false);
    }
  };

  return (
    <>
      <Head>
        <title>{bike.modelName} - yasukari</title>
      </Head>
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-12">
        <div className="w-full py-8 space-y-10">
          <nav className="text-sm text-gray-500" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/en" className="hover:text-red-500 font-medium">
                  Home
                </Link>
              </li>
              <li className="text-gray-300">/</li>
              <li>
                <Link href="/en/products" className="hover:text-red-500 font-medium">
                  Bikes & Pricing
                </Link>
              </li>
              <li className="text-gray-300">/</li>
              <li className="text-gray-900 font-semibold" aria-current="page">
                {bike.modelName}
              </li>
            </ol>
          </nav>

          <section className="bg-white shadow-md rounded-2xl overflow-hidden ring-1 ring-gray-100">
            <div className="lg:grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative h-72 sm:h-96 lg:aspect-[4/3] lg:h-auto">
                <img src={bike.img} alt={bike.modelName} className="w-full h-full object-cover" />
                {bike.badge && (
                  <span className="absolute top-4 left-4 inline-flex items-center rounded-full bg-red-500/90 px-3 py-1 text-xs font-semibold text-white shadow">
                    {bike.badge}
                  </span>
                )}
              </div>

              <div className="p-6 lg:p-8 flex flex-col gap-6 justify-center">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-500">model detail</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{bike.modelName}</h1>
                    {className ? (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">{className}</span>
                    ) : null}
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {bike.description ||
                      "A popular pick on yasukari. Check the specs and pricing details below."}
                  </p>
                </div>

                {tagItems.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tagItems.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                  <div className="space-y-4">
                    {showPrice ? (
                      <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-red-50 to-white p-4 shadow-sm">
                        <p className="text-3xl font-bold text-gray-900">{priceGuide["24h"]}</p>
                      </div>
                    ) : null}
                    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">Choose availability</p>
                        <span className="text-xs text-gray-500">
                          {selectedStoreId
                            ? `${filteredVehicleOptions.length} options`
                            : `${vehicles.length} options`}
                        </span>
                      </div>
                      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-700">Select a rental store</p>
                        <p className="mt-1 text-xs text-gray-500">
                          Choose a store first, then select a vehicle.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {storeOptions.length === 0 ? (
                            <span className="text-xs text-gray-500">
                              No stock available at the moment.
                            </span>
                          ) : (
                            storeOptions.map((storeId) => {
                              const isSelected = storeId === selectedStoreId;
                              return (
                                <button
                                  key={storeId}
                                  type="button"
                                  onClick={() => setSelectedStoreId(storeId)}
                                  className={`rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition ${
                                    isSelected
                                      ? "bg-red-500 text-white"
                                      : "bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-red-200"
                                  }`}
                                >
                                  {storeId}
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
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-red-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
                        disabled={selectedStoreId ? filteredVehicleOptions.length === 0 : false}
                      >
                        {!selectedStoreId ? (
                          <option value="" disabled>
                            Please select a store first
                          </option>
                        ) : filteredVehicleOptions.length === 0 ? (
                          <option value="" disabled>
                            No stock available
                          </option>
                        ) : (
                          <>
                            <option value="" disabled>
                              Select a management number
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
                        <p className="text-xs text-gray-600">
                          Linked store ID: <span className="font-semibold">{selectedVehicleStore}</span>
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
                          className="inline-flex w-full items-center justify-center rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
                        >
                          {checkingRental ? "Checking reservation status…" : "Reserve this bike"}
                        </button>
                      ) : (
                        <button
                          className="inline-flex w-full items-center justify-center rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-500 shadow cursor-not-allowed"
                          disabled
                          aria-disabled="true"
                        >
                          No stock available
                        </button>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <Link
                          href="/en/pricing"
                          className="inline-flex items-center justify-center rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-600 transition"
                        >
                          View pricing plans
                        </Link>
                        <Link
                          href="/en/contact"
                          className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-300 transition"
                        >
                          Contact us
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 w-full">
                    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Available stores</h3>
                        <span className="text-xs font-medium text-gray-500">Stores</span>
                      </div>
                      {bike.stores && bike.stores.length > 0 ? (
                        <ul className="space-y-2 text-sm text-gray-800">
                          {bike.stores.map((store) => (
                            <li
                              key={store}
                              className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2"
                            >
                              <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />
                              <span>{store}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-600">
                          Store inventory changes. Please contact your nearest location.
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-red-50 via-red-100 to-red-200 p-6 text-red-900 shadow-md">
                      <h3 className="text-lg font-semibold">Reliable support</h3>
                      <p className="mt-2 text-sm leading-relaxed text-red-900/80">
                        From helmet rentals to roadside assistance, we provide the support you need for a comfortable ride.
                      </p>
                      <Link
                        href="/en/insurance"
                        className="group mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-red-700 shadow-md ring-1 ring-red-200 transition duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                      >
                        Review coverage
                        <span aria-hidden className="translate-x-0 text-base transition duration-200 group-hover:translate-x-0.5">
                          →
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Price guide</h2>
                <span className="text-xs font-medium text-gray-500">Price Guide</span>
              </div>
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6 space-y-3">
                <p className="text-sm text-gray-700">
                  Rates are based on the 24-hour price, with discounts for longer rentals. Contact us for a detailed quote.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  {[
                    { label: "24 hours", value: priceGuide["24h"] },
                    { label: "2 days", value: priceGuide["2d"] },
                    { label: "1 week", value: priceGuide["1w"] },
                    { label: "2 weeks", value: priceGuide["2w"] },
                    { label: "1 month", value: priceGuide["1m"] },
                    { label: "Insurance plan", value: "Available" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 text-center"
                    >
                      <div className="text-xs font-semibold text-gray-500">{item.label}</div>
                      <div className="mt-1 text-base font-bold text-gray-900">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Specifications</h2>
                <span className="text-xs font-medium text-gray-500">Spec</span>
              </div>
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6">
                {specEntries.length > 0 ? (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                    {specEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="flex flex-col gap-1 rounded-lg bg-gray-50 px-4 py-3"
                      >
                        <dt className="text-xs font-semibold text-gray-500">
                          {specLabels[key as keyof BikeSpec]}
                        </dt>
                        <dd className="text-sm font-medium text-gray-900">{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-sm text-gray-600">
                    Detailed specs are being prepared. Contact our team for the latest information.
                  </p>
                )}
              </div>
            </div>
          </section>

          <RecentlyViewedEn />
        </div>
      </main>
      {showAuthModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-red-500 px-6 py-4 text-white">
              <p className="text-sm font-semibold uppercase tracking-wide">yasukari Member</p>
              <h2 className="mt-1 text-xl font-bold">Finish signup to reserve</h2>
            </div>
            <div className="space-y-4 px-6 py-5 text-gray-700">
              <p className="text-sm leading-relaxed">
                If you are not logged in, please create an account and complete the full registration to make a reservation.
              </p>
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                Members enjoy better long-term rates, exclusive coupons, and more value every time you ride with yasukari.
              </div>
              <ul className="grid gap-2 text-sm text-gray-600">
                {[
                  "Save your details for quick, same-day reservations",
                  "Receive member-only promotions and coupons",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-red-500" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-red-600 transition"
                  onClick={() => router.push("/en/login")}
                >
                  OK (Go to login / signup)
                </button>
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-gray-300"
                  onClick={() => setShowAuthModal(false)}
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {showRentalLimitModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-4 text-gray-900">
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-900">Rental Notice</p>
              <h2 className="mt-1 text-xl font-bold text-red-600">Please return your current rental bike</h2>
            </div>
            <div className="space-y-4 px-6 py-5 text-gray-700">
              {rentalCheckError ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {rentalCheckError}
                </p>
              ) : (
                <>
                  <p className="text-sm leading-relaxed">
                    You already have an active rental, so we cannot accept a new reservation.
                  </p>
                  <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    Please check your return status on My Page → Reservation Status.
                  </div>
                </>
              )}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-red-700"
                  onClick={() => router.push("/en/mypage")}
                >
                  Go to My Page
                </button>
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-gray-300"
                  onClick={() => setShowRentalLimitModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {showStoreRequiredModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-amber-100 bg-amber-50 px-6 py-4 text-gray-900">
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-900">Store Notice</p>
              <h2 className="mt-1 text-xl font-bold text-amber-700">Please select a rental store</h2>
            </div>
            <div className="space-y-4 px-6 py-5 text-gray-700">
              <p className="text-sm leading-relaxed">
                Select a store first, then choose an available vehicle to continue.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-red-700"
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
    bike.modelId != null ? readVehicleRentalPrices(bike.modelId) : Promise.resolve([]),
  ]);

  const className = bikeClass?.className;
  const classPriceMap = bikeClass?.base_prices ?? {};
  const rentalPriceMap = rentalPrices.reduce<Record<number, number>>((acc, record) => {
    acc[record.days] = record.price;
    return acc;
  }, {});
  const base24hPrice =
    rentalPriceMap[durationDays["24h"]] ??
    normalizePrice(classPriceMap["24h"]) ??
    normalizePrice(bike.price24h);

  const priceGuide = (Object.entries(durationDays) as [DurationKey, number][])
    .map(([key, days]) => {
      const rentalPrice = rentalPriceMap[days];
      if (typeof rentalPrice === "number") {
        return [key, formatPrice(applyPriceMultiplier(rentalPrice))] as [DurationKey, string];
      }
      const classPrice = normalizePrice(classPriceMap[key]);
      if (classPrice != null) {
        return [key, formatPrice(applyPriceMultiplier(classPrice))] as [DurationKey, string];
      }
      if (key === "2d" && typeof base24hPrice === "number") {
        return [key, formatPrice(applyPriceMultiplier(base24hPrice * durationDays["2d"]))] as [
          DurationKey,
          string
        ];
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
      className: className ?? undefined,
      vehicles,
      priceGuide,
    },
  };
};
