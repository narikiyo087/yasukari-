import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import type {
  Accessory,
  AccessoryPriceKey,
  BikeClass,
  BikeModel,
  CouponRule,
  DurationPriceKey,
} from "../../../../lib/dashboard/types";
import {
  applyInternationalMultiplier,
  formatYen,
} from "../../../../lib/pricing";
import useInternationalPricingMultiplier from "../../../../lib/useInternationalPricingMultiplier";

type AddOn = {
  key: string;
  label: string;
  price?: number;
};

const PROTECTION_OPTION_DEFINITIONS: Array<{ key: string; label: string }> = [
  { key: "vehicle", label: "Vehicle damage cover" },
  { key: "theft", label: "Theft cover" },
];

const ACCESSORY_DISPLAY_ORDER: Array<{ key: string; label: string }> = [
  { key: "halfCap", label: "Half helmet" },
  { key: "jetHelmet", label: "Jet helmet" },
  { key: "brandHelmet", label: "Brand helmet" },
  { key: "glove", label: "Gloves" },
];

const HELMET_ACCESSORY_KEYS = new Set(["halfCap", "jetHelmet", "brandHelmet"]);

const defaultFees = {
  rental: 3980,
  couponDiscount: 0,
};

const HIGH_SEASON_FEE_PER_DAY = 550;

const formatAccessoryPrice = (price?: number) => formatYen(price ?? 0);
const getHelmetSelectedTotal = (selection: Record<string, number>) =>
  Array.from(HELMET_ACCESSORY_KEYS).reduce(
    (total, key) => total + (selection[key] ?? 0),
    0
  );
const getAccessoryPrice = (
  accessory: Accessory | undefined,
  priceKey: AccessoryPriceKey,
  days: number
) => {
  if (!accessory?.prices) return undefined;
  if (days > 31) {
    const monthlyPrice = accessory.prices["1m"];
    if (monthlyPrice != null) {
      const dailyRate = monthlyPrice / 31;
      return Math.round(dailyRate * days);
    }
  }
  return accessory.prices[priceKey];
};
const getInsuranceDurationKey = (days: number): DurationPriceKey => {
  if (days <= 1) return "24h";
  if (days <= 2) return "2d";
  if (days <= 4) return "4d";
  if (days <= 7) return "1w";
  if (days <= 14) return "2w";
  return "1m";
};
const formatProtectionPrice = (price?: number) =>
  price == null ? "Calculating" : formatYen(price);

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatMonthKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export default function ReserveFlowStep2() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState("");

  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [accessoryError, setAccessoryError] = useState<string | null>(null);

  const [store, setStore] = useState("足立小台店");
  const [modelName, setModelName] = useState("車両");
  const [pickupDate, setPickupDate] = useState("2025-12-26");
  const [returnDate, setReturnDate] = useState("2025-12-27");
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnTime, setReturnTime] = useState("10:00");
  const [managementNumber, setManagementNumber] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(defaultFees.couponDiscount);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [rentalFee, setRentalFee] = useState(defaultFees.rental);
  const [rentalFeeError, setRentalFeeError] = useState<string | null>(null);
  const [vehicleModelId, setVehicleModelId] = useState<number | null>(null);
  const [insurancePrices, setInsurancePrices] = useState<
    BikeClass["insurance_prices"] | null
  >(null);
  const [theftInsurance, setTheftInsurance] = useState<number | null>(null);
  const [protectionError, setProtectionError] = useState<string | null>(null);
  const [highSeasonDates, setHighSeasonDates] = useState<Set<string>>(new Set());
  const [highSeasonLoading, setHighSeasonLoading] = useState(false);
  const priceMultiplier = useInternationalPricingMultiplier("en");

  const [protectionSelection, setProtectionSelection] = useState(() =>
    PROTECTION_OPTION_DEFINITIONS.reduce<Record<string, boolean>>((acc, option) => {
      acc[option.key] = true;
      return acc;
    }, {})
  );

  const [accessorySelection, setAccessorySelection] = useState(() =>
    ACCESSORY_DISPLAY_ORDER.reduce<Record<string, number>>((acc, option) => {
      acc[option.key] = 0;
      return acc;
    }, {})
  );

  const helmetSelectionTotal = useMemo(
    () => getHelmetSelectedTotal(accessorySelection),
    [accessorySelection]
  );

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
          await router.replace("/en/login");
          return;
        }

        setAuthChecked(true);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setAuthError("Failed to confirm login status. Please try again later.");
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
    if (typeof params.pickupTime === "string" && params.pickupTime) setPickupTime(params.pickupTime);
    if (typeof params.returnTime === "string" && params.returnTime) setReturnTime(params.returnTime);
  }, [router.isReady, router.query]);

  useEffect(() => {
    const controller = new AbortController();

    const loadAccessories = async () => {
      try {
        const response = await fetch("/api/accessories", { signal: controller.signal });

        if (!response.ok) {
          throw new Error("Failed to load accessories.");
        }

        const data: Accessory[] = await response.json();
        setAccessories(data);
        setAccessoryError(null);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to load accessories", error);
        setAccessoryError("Failed to load accessories.");
      }
    };

    void loadAccessories();

    return () => controller.abort();
  }, []);

  const rentalPriceKey = useMemo<AccessoryPriceKey>(() => {
    const pickup = pickupTime ? `${pickupTime}:00` : "00:00:00";
    const returnAt = returnTime ? `${returnTime}:00` : "00:00:00";

    const pickupDateTime = new Date(`${pickupDate}T${pickup}`);
    const returnDateTime = new Date(`${returnDate}T${returnAt}`);

    const diffMs = returnDateTime.getTime() - pickupDateTime.getTime();
    if (Number.isNaN(diffMs) || diffMs <= 0) {
      return "24h";
    }

    const hours = diffMs / (1000 * 60 * 60);
    if (hours <= 24) return "24h";
    if (hours <= 48) return "2d";
    if (hours <= 96) return "4d";
    if (hours <= 168) return "1w";
    if (hours <= 336) return "2w";
    return "1m";
  }, [pickupDate, pickupTime, returnDate, returnTime]);

  const rentalDays = useMemo(() => {
    const pickup = pickupTime ? `${pickupTime}:00` : "00:00:00";
    const returnAt = returnTime ? `${returnTime}:00` : "00:00:00";

    const pickupDateTime = new Date(`${pickupDate}T${pickup}`);
    const returnDateTime = new Date(`${returnDate}T${returnAt}`);

    const diffMs = returnDateTime.getTime() - pickupDateTime.getTime();
    if (Number.isNaN(diffMs) || diffMs <= 0) {
      return 1;
    }

    const hours = diffMs / (1000 * 60 * 60);
    return Math.max(1, Math.ceil(hours / 24));
  }, [pickupDate, pickupTime, returnDate, returnTime]);

  const highSeasonMonths = useMemo(() => {
    const pickup = new Date(`${pickupDate}T00:00:00`);
    const dropoff = new Date(`${returnDate}T00:00:00`);
    if (Number.isNaN(pickup.getTime()) || Number.isNaN(dropoff.getTime())) {
      return [];
    }

    const start = new Date(pickup.getFullYear(), pickup.getMonth(), 1);
    const end = new Date(dropoff.getFullYear(), dropoff.getMonth(), 1);
    if (start > end) {
      return [formatMonthKey(start)];
    }

    const months: string[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      months.push(formatMonthKey(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return months;
  }, [pickupDate, returnDate]);

  useEffect(() => {
    if (highSeasonMonths.length === 0) {
      setHighSeasonDates(new Set());
      return;
    }

    const controller = new AbortController();

    const loadHighSeason = async () => {
      try {
        setHighSeasonLoading(true);
        const responses = await Promise.all(
          highSeasonMonths.map(async (month) => {
            const response = await fetch(`/api/high-season?month=${month}`, {
              signal: controller.signal,
            });
            if (!response.ok) {
              throw new Error("Failed to fetch high season calendar");
            }
            const data = (await response.json()) as {
              dates: { date: string; isHighSeason: boolean }[];
            };
            return data.dates ?? [];
          })
        );

        const nextDates = responses
          .flat()
          .filter((date) => date.isHighSeason)
          .map((date) => date.date);
        setHighSeasonDates(new Set(nextDates));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load high season calendar", error);
          setHighSeasonDates(new Set());
        }
      } finally {
        if (!controller.signal.aborted) {
          setHighSeasonLoading(false);
        }
      }
    };

    void loadHighSeason();

    return () => controller.abort();
  }, [highSeasonMonths]);

  const vehicleInsuranceFee = useMemo(() => {
    if (!insurancePrices) return undefined;

    if (rentalDays > 31) {
      const monthlyPrice = insurancePrices["1m"];
      if (monthlyPrice != null) {
        const dailyRate = monthlyPrice / 31;
        return Math.round(dailyRate * rentalDays);
      }
    }

    const key = getInsuranceDurationKey(rentalDays);
    return insurancePrices[key];
  }, [insurancePrices, rentalDays]);

  const theftInsuranceFee = useMemo(
    () => (typeof theftInsurance === "number" ? theftInsurance : undefined),
    [theftInsurance]
  );

  const protectionOptions = useMemo<AddOn[]>(() => {
    const applyMultiplier = (value?: number) =>
      value == null ? undefined : applyInternationalMultiplier(value, priceMultiplier);

    return [
      { key: "vehicle", label: "Vehicle damage cover", price: applyMultiplier(vehicleInsuranceFee) },
      { key: "theft", label: "Theft cover", price: applyMultiplier(theftInsuranceFee) },
    ];
  }, [priceMultiplier, theftInsuranceFee, vehicleInsuranceFee]);

  const selectedProtectionFee = useMemo(
    () =>
      protectionOptions.reduce((total, option) => {
        return protectionSelection[option.key] ? total + (option.price ?? 0) : total;
      }, 0),
    [protectionOptions, protectionSelection]
  );

  const accessoryOptions = useMemo<AddOn[]>(() => {
    const accessoryMap = new Map(accessories.map((accessory) => [accessory.name, accessory]));

    return ACCESSORY_DISPLAY_ORDER.map((option) => {
      const accessory = accessoryMap.get(option.label);
      const price = getAccessoryPrice(accessory, rentalPriceKey, rentalDays);

      return {
        ...option,
        price: price == null ? undefined : applyInternationalMultiplier(price, priceMultiplier),
      };
    });
  }, [accessories, priceMultiplier, rentalPriceKey, rentalDays]);

  const selectedAccessoryFee = useMemo(
    () =>
      accessoryOptions.reduce((total, option) => {
        const selectedCount = accessorySelection[option.key] ?? 0;
        return total + (option.price ?? 0) * selectedCount;
      }, 0),
    [accessoryOptions, accessorySelection]
  );

  const highSeasonDays = useMemo(() => {
    if (highSeasonDates.size === 0) return 0;
    const pickup = new Date(`${pickupDate}T00:00:00`);
    if (Number.isNaN(pickup.getTime())) return 0;

    let count = 0;
    for (let day = 0; day < rentalDays; day += 1) {
      const current = new Date(pickup);
      current.setDate(pickup.getDate() + day);
      if (highSeasonDates.has(formatDateKey(current))) {
        count += 1;
      }
    }
    return count;
  }, [highSeasonDates, pickupDate, rentalDays]);

  const highSeasonFee = highSeasonDays * HIGH_SEASON_FEE_PER_DAY;
  const adjustedHighSeasonFee = applyInternationalMultiplier(highSeasonFee, priceMultiplier);
  const adjustedRentalFee = applyInternationalMultiplier(rentalFee, priceMultiplier);
  const totalAmount =
    adjustedRentalFee +
    selectedAccessoryFee +
    selectedProtectionFee +
    adjustedHighSeasonFee -
    couponDiscount;
  const highSeasonFeeLabel = highSeasonLoading
    ? "Calculating"
    : formatYen(adjustedHighSeasonFee);

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

  const pickupLabel = formatDateLabel(pickupDate, "December 26, 2025");
  const returnLabel = formatDateLabel(returnDate, "December 27, 2025");

  const toggleProtection = (key: string) => {
    setProtectionSelection((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getCouponEligibleRentalDays = (
    coupon: CouponRule,
    rentalStartDate: string,
    rentalEndDate: string
  ) => {
    const couponStart = new Date(`${coupon.start_date}T00:00:00`);
    const couponEnd = new Date(`${coupon.end_date}T23:59:59`);
    const rentalStart = new Date(`${rentalStartDate}T00:00:00`);
    const rentalEnd = new Date(`${rentalEndDate}T23:59:59`);

    if (
      Number.isNaN(couponStart.getTime()) ||
      Number.isNaN(couponEnd.getTime()) ||
      Number.isNaN(rentalStart.getTime()) ||
      Number.isNaN(rentalEnd.getTime())
    ) {
      return 0;
    }

    if (rentalStart > rentalEnd || couponStart > couponEnd) {
      return 0;
    }

    const overlapStart = rentalStart > couponStart ? rentalStart : couponStart;
    const overlapEnd = rentalEnd < couponEnd ? rentalEnd : couponEnd;
    if (overlapStart > overlapEnd) {
      return 0;
    }

    const diffMs = overlapEnd.getTime() - overlapStart.getTime();
    return Math.max(1, Math.ceil((diffMs + 1) / (1000 * 60 * 60 * 24)));
  };

  const calculateCouponDiscount = (
    coupon: CouponRule,
    baseAmount: number,
    multiplier: number,
    validDays: number,
    totalDays: number
  ) => {
    const dayRatio = totalDays > 0 ? Math.min(1, validDays / totalDays) : 0;
    if (dayRatio <= 0) {
      return 0;
    }

    if (typeof coupon.discount_amount === "number") {
      const adjustedDiscount = applyInternationalMultiplier(
        coupon.discount_amount,
        multiplier
      );
      const proratedDiscount = Math.round(adjustedDiscount * dayRatio);
      return Math.min(proratedDiscount, baseAmount);
    }
    if (typeof coupon.discount_percentage === "number") {
      return Math.min(Math.round((baseAmount * coupon.discount_percentage) / 100), baseAmount);
    }
    return 0;
  };

  const handleApplyCoupon = async () => {
    const trimmedCode = couponCode.trim();
    setCouponMessage(null);
    if (!trimmedCode) {
      setCouponError("Please enter a coupon code.");
      setCouponDiscount(0);
      return;
    }

    try {
      const response = await fetch("/api/coupon-rules");
      if (!response.ok) {
        throw new Error("Failed to fetch coupons");
      }

      const coupons = (await response.json()) as CouponRule[];
      const matched = coupons.find((coupon) => coupon.coupon_code === trimmedCode);
      if (!matched) {
        setCouponError("Coupon code not found.");
        setCouponDiscount(0);
        return;
      }

      const eligibleRentalDays = getCouponEligibleRentalDays(matched, pickupDate, returnDate);
      if (eligibleRentalDays <= 0) {
        setCouponError("This coupon is not available for your rental dates.");
        setCouponDiscount(0);
        return;
      }

      const eligibleRentalAmount = Math.round(
        adjustedRentalFee * (eligibleRentalDays / Math.max(rentalDays, 1))
      );
      const discount = calculateCouponDiscount(
        matched,
        eligibleRentalAmount,
        priceMultiplier,
        eligibleRentalDays,
        rentalDays
      );
      if (discount <= 0) {
        setCouponError("Could not calculate the coupon discount.");
        setCouponDiscount(0);
        return;
      }

      setCouponDiscount(discount);
      setCouponError(null);
      if (eligibleRentalDays < rentalDays) {
        setCouponMessage(`Coupon applied. Valid for ${eligibleRentalDays} day(s) only.`);
      } else {
        setCouponMessage("Coupon applied.");
      }
    } catch (error) {
      console.error("Failed to apply coupon", error);
      setCouponError("Failed to apply the coupon. Please try again later.");
      setCouponDiscount(0);
    }
  };

  useEffect(() => {
    if (!managementNumber) return;

    const controller = new AbortController();

    const loadVehicle = async () => {
      try {
        const vehicleResponse = await fetch(`/api/vehicles/${managementNumber}`, {
          signal: controller.signal,
        });

        if (!vehicleResponse.ok) {
          throw new Error("Failed to load vehicle");
        }

        const vehicleData = (await vehicleResponse.json()) as { modelId?: number };
        if (!vehicleData.modelId) {
          throw new Error("Vehicle model not found");
        }

        setVehicleModelId(vehicleData.modelId);
        setRentalFeeError(null);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to load vehicle", error);
        setVehicleModelId(null);
        setRentalFee(defaultFees.rental);
        setRentalFeeError("Failed to load vehicle information.");
      }
    };

    void loadVehicle();

    return () => controller.abort();
  }, [managementNumber]);

  useEffect(() => {
    if (!vehicleModelId) return;

    const controller = new AbortController();

    const loadRentalFee = async () => {
      try {
        const pricesResponse = await fetch(
          `/api/vehicle-rental-prices?vehicle_type_id=${vehicleModelId}`,
          { signal: controller.signal }
        );

        if (!pricesResponse.ok) {
          throw new Error("Failed to load rental prices");
        }

        const prices = (await pricesResponse.json()) as Array<{
          days: number;
          price: number;
        }>;
        const matched = prices.find((item) => item.days === rentalDays);

        if (matched?.price != null) {
          setRentalFee(matched.price);
          setRentalFeeError(null);
          return;
        }

        if (rentalDays > 31) {
          const monthPrice = prices.find((item) => item.days === 31)?.price;
          if (monthPrice != null) {
            const dailyRate = monthPrice / 31;
            const prorated = Math.round(dailyRate * rentalDays);
            setRentalFee(prorated);
            setRentalFeeError(null);
            return;
          }
        }

        setRentalFee(defaultFees.rental);
        setRentalFeeError("Rental pricing is not configured.");
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to load rental fee", error);
        setRentalFee(defaultFees.rental);
        setRentalFeeError("Failed to load rental pricing.");
      }
    };

    void loadRentalFee();

    return () => controller.abort();
  }, [vehicleModelId, rentalDays]);

  useEffect(() => {
    if (!vehicleModelId) {
      setInsurancePrices(null);
      setTheftInsurance(null);
      setProtectionError(null);
      return;
    }

    const controller = new AbortController();

    const loadProtectionPricing = async () => {
      try {
        const [modelsResponse, classesResponse] = await Promise.all([
          fetch("/api/bike-models", { signal: controller.signal }),
          fetch("/api/bike-classes", { signal: controller.signal }),
        ]);

        if (!modelsResponse.ok || !classesResponse.ok) {
          throw new Error("Failed to load bike classes");
        }

        const models = (await modelsResponse.json()) as BikeModel[];
        const classes = (await classesResponse.json()) as BikeClass[];

        const targetModel = models.find((model) => model.modelId === vehicleModelId);
        if (!targetModel) {
          throw new Error("Bike model not found");
        }

        const targetClass = classes.find(
          (bikeClass) => bikeClass.classId === targetModel.classId
        );
        if (!targetClass) {
          throw new Error("Bike class not found");
        }

        setInsurancePrices(targetClass.insurance_prices ?? null);
        setTheftInsurance(
          typeof targetClass.theft_insurance === "number"
            ? targetClass.theft_insurance
            : null
        );
        setProtectionError(null);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to load protection pricing", error);
        setInsurancePrices(null);
        setTheftInsurance(null);
        setProtectionError("Failed to load protection pricing.");
      }
    };

    void loadProtectionPricing();

    return () => controller.abort();
  }, [vehicleModelId]);

  const handleNext = () => {
    const params = new URLSearchParams({
      store,
      modelName,
      managementNumber,
      pickupDate,
      returnDate,
      pickupTime,
      returnTime,
      couponCode,
      couponDiscount: couponDiscount.toString(),
      accessoryTotal: selectedAccessoryFee.toString(),
      protectionTotal: selectedProtectionFee.toString(),
      totalAmount: totalAmount.toString(),
    });

    PROTECTION_OPTION_DEFINITIONS.forEach((option) => {
      params.append(option.key, protectionSelection[option.key] ? "1" : "0");
    });

    accessoryOptions.forEach((option) => {
      params.append(option.key, String(accessorySelection[option.key] ?? 0));
    });

    void router.push(`/en/reserve/flow/step3?${params.toString()}`);
  };

  const handleBack = () => {
    const params = new URLSearchParams({
      store,
      modelName,
      managementNumber,
      pickupDate,
      returnDate,
      pickupTime,
      returnTime,
    });

    void router.push(`/en/reserve/flow/step1?${params.toString()}`);
  };

  return (
    <>
      <Head>
        <title>Select options - Step 2</title>
      </Head>
      <main className="min-h-screen bg-slate-50 pb-16">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Step 2 / 3</p>
              <h1 className="text-2xl font-bold text-slate-900">Select options</h1>
              <p className="text-sm text-slate-600">Choose protection and gear options to review your estimate.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300"
              >
                Back
              </button>
              <Link
                href="/en/products"
                className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300"
              >
                Back to models
              </Link>
            </div>
          </header>

          {authError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{authError}</p>
          ) : null}

          <section className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-6">
              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pickup & return</p>
                    <h2 className="text-lg font-bold text-slate-900">{pickupLabel} {pickupTime} → {returnLabel} {returnTime}</h2>
                  </div>
                  <span className="rounded bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{store}</span>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Protection options</h3>
                  <span className="text-xs text-slate-500">Optional</span>
                </div>
                {protectionError ? (
                  <p className="text-xs text-red-600">{protectionError}</p>
                ) : null}
                <div className="space-y-3">
                  {protectionOptions.map((option) => (
                    <label
                      key={option.key}
                      className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-4 py-3 shadow-sm"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatProtectionPrice(option.price)}
                        </span>
                        <input
                          type="checkbox"
                          checked={protectionSelection[option.key]}
                          onChange={() => toggleProtection(option.key)}
                          className="h-5 w-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Gear options</h3>
                  <span className="text-xs text-slate-500">Select what you need</span>
                </div>
                <p className="text-xs text-slate-500">
                  Options: up to 2 per type / up to 2 helmets total
                </p>
                <Link
                  href="/options"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  Accessory option details
                </Link>
                {accessoryError ? (
                  <p className="text-xs text-red-600">{accessoryError}</p>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  {accessoryOptions.map((option) => (
                    <label
                      key={option.key}
                      className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-4 py-3 shadow-sm"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-900">{formatAccessoryPrice(option.price)}</span>
                        {(() => {
                          const isHelmetAccessory = HELMET_ACCESSORY_KEYS.has(option.key);
                          const currentValue = accessorySelection[option.key] ?? 0;
                          const otherHelmetCount = isHelmetAccessory
                            ? helmetSelectionTotal - currentValue
                            : helmetSelectionTotal;
                          const remainingHelmetSlots = Math.max(0, 2 - otherHelmetCount);
                          const maxSelectable = isHelmetAccessory
                            ? Math.min(2, remainingHelmetSlots)
                            : 2;
                          const selectableCounts = Array.from(
                            { length: maxSelectable + 1 },
                            (_, index) => index
                          );

                          return (
                        <select
                          value={accessorySelection[option.key]}
                          onChange={(event) => {
                            const selected = Number(event.target.value);
                            setAccessorySelection((prev) => ({
                              ...prev,
                              [option.key]: (() => {
                                const parsed = Number.isNaN(selected)
                                  ? 0
                                  : Math.min(2, Math.max(0, selected));

                                if (!HELMET_ACCESSORY_KEYS.has(option.key)) {
                                  return parsed;
                                }

                                const currentHelmetValue = prev[option.key] ?? 0;
                                const otherHelmets = getHelmetSelectedTotal(prev) - currentHelmetValue;
                                return Math.min(parsed, Math.max(0, 2 - otherHelmets));
                              })(),
                            }));
                          }}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                          aria-label={`${option.label} quantity`}
                        >
                            {selectableCounts.map((count) => (
                              <option key={count} value={count}>
                                {count}
                              </option>
                            ))}
                          </select>
                          );
                        })()}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Discount coupon</h3>
                  <span className="text-xs text-slate-500">Optional</span>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setCouponError(null);
                      setCouponMessage(null);
                      setCouponDiscount(0);
                    }}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-3 text-sm shadow-sm focus:border-red-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300"
                  >
                    Apply
                  </button>
                </div>
                {couponError ? (
                  <p className="text-xs text-red-600">{couponError}</p>
                ) : couponMessage ? (
                  <p className="text-xs text-emerald-600">{couponMessage}</p>
                ) : null}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Estimate</p>
                  <span className="rounded bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">2 / 3</span>
                </div>
                <dl className="space-y-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Bike rental fee</dt>
                    <dd className="font-semibold text-slate-900">{formatYen(adjustedRentalFee)}</dd>
                  </div>
                  {rentalFeeError ? (
                    <p className="text-xs text-red-600">{rentalFeeError}</p>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Gear options</dt>
                    <dd className="font-semibold text-slate-900">{formatYen(selectedAccessoryFee)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Protection options</dt>
                    <dd className="font-semibold text-slate-900">{formatYen(selectedProtectionFee)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">High-season fee ({highSeasonDays} days)</dt>
                    <dd className="font-semibold text-slate-900">{highSeasonFeeLabel}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Coupon discount</dt>
                    <dd className="font-semibold text-slate-900">-{formatYen(couponDiscount)}</dd>
                  </div>
                </dl>
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between text-lg font-bold text-slate-900">
                    <span>Total (tax included)</span>
                    <span>{formatYen(totalAmount)}</span>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  * An additional ¥550 per day applies during Golden Week, Obon, and year-end/New Year holidays.
                  <br />
                  * Payments are accepted by credit card only.
                </p>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!authChecked}
                  className="inline-flex w-full items-center justify-center rounded-md bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-red-700 transition disabled:cursor-not-allowed disabled:bg-red-200"
                >
                  Enter payment information
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
