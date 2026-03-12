import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { getDocumentClient } from "../../../../lib/dynamodb";
import { BikeModel as LegacyBikeModel, getBikeModels } from "../../../../lib/bikes";
import { getStoreLabel } from "../../../../lib/dashboard/storeOptions";
import { fetchMonthlyHolidays } from "../../../../lib/dashboard/holidayManager";
import { findHolidayStoreByLabel } from "../../../../lib/dashboard/holidayStores";
import { useRouter } from "next/router";
import { RentalAvailabilityMap } from "../../../../lib/dashboard/types";

interface VehicleRecord {
  managementNumber: string;
  modelId: number;
  storeId: string;
}

interface BikeModelRecord {
  modelId: number;
  modelName: string;
  publishStatus: "ON" | "OFF";
  mainImageUrl?: string;
}

interface Props {
  vehicle: VehicleRecord | null;
  model: BikeModelRecord | null;
  fallbackBike: LegacyBikeModel | null;
  managementNumber: string;
}

type SelectionType = "pickup" | "return";

interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
}

type AvailabilityResponse = {
  rentalAvailability?: RentalAvailabilityMap;
};

export default function ReserveModelPage({
  vehicle,
  model,
  fallbackBike,
  managementNumber,
}: Props) {
  const router = useRouter();
  const resolvedModelName = model?.modelName ?? fallbackBike?.modelName ?? "Model";
  const resolvedImage = model?.mainImageUrl ?? fallbackBike?.img;
  const resolvedModelCode = fallbackBike?.modelCode;

  const storeOptions = useMemo(() => {
    if (vehicle?.storeId) {
      const label = getStoreLabel(vehicle.storeId);
      return label ? [label] : [];
    }
    return fallbackBike?.stores ?? [];
  }, [vehicle?.storeId, fallbackBike?.stores]);

  const [store, setStore] = useState(() => {
    if (vehicle?.storeId) {
      return getStoreLabel(vehicle.storeId);
    }
    return (fallbackBike?.stores ?? [])[0] ?? "";
  });
  const [pickup, setPickup] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [activeSelection, setActiveSelection] = useState<SelectionType>("pickup");
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  });
  const [availabilityMap, setAvailabilityMap] = useState<RentalAvailabilityMap>({});
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [holidayDates, setHolidayDates] = useState<Set<string>>(new Set());
  const [holidayLoaded, setHolidayLoaded] = useState(false);
  const [holidayError, setHolidayError] = useState<string | null>(null);

  useEffect(() => {
    if (!store && storeOptions.length > 0) {
      setStore(storeOptions[0]);
    }
  }, [store, storeOptions]);

  const minDate = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + 1);
    base.setHours(0, 0, 0, 0);
    return base;
  }, []);

  const maxAdvanceDays = 31;
  const maxDate = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + maxAdvanceDays);
    base.setHours(0, 0, 0, 0);
    return base;
  }, [maxAdvanceDays]);

  const minDateString = useMemo(() => formatInputDate(minDate), [minDate]);

  const pickupDate = pickup ? new Date(pickup) : null;
  const returnDateValue = returnDate ? new Date(returnDate) : null;

  const storeNotice = store === "三ノ輪店";

  const canProceed = store && pickup && returnDate;

  const [checkingSession, setCheckingSession] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadAvailability = async () => {
      setAvailabilityLoaded(false);
      setAvailabilityError(null);
      try {
        const response = await fetch(`/api/vehicles/${managementNumber}`);
        if (!response.ok) {
          throw new Error("failed to load availability");
        }

        const data = (await response.json()) as AvailabilityResponse;
        if (!isActive) return;
        setAvailabilityMap(data.rentalAvailability ?? {});
      } catch (error) {
        console.error(error);
        if (!isActive) return;
        setAvailabilityMap({});
        setAvailabilityError("Unable to load availability.");
      } finally {
        if (!isActive) return;
        setAvailabilityLoaded(true);
      }
    };

    void loadAvailability();

    return () => {
      isActive = false;
    };
  }, [managementNumber]);

  const holidayMonthKey = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = `${visibleMonth.getMonth() + 1}`.padStart(2, "0");
    return `${year}-${month}`;
  }, [visibleMonth]);

  useEffect(() => {
    let isActive = true;
    const storeId = findHolidayStoreByLabel(store)?.id;

    if (!storeId) {
      setHolidayDates(new Set());
      setHolidayLoaded(true);
      setHolidayError(null);
      return () => {
        isActive = false;
      };
    }

    const loadHolidays = async () => {
      setHolidayLoaded(false);
      setHolidayError(null);
      try {
        const holidays = await fetchMonthlyHolidays(holidayMonthKey, storeId);
        if (!isActive) return;
        const holidaySet = new Set(
          holidays.filter((holiday) => holiday.isHoliday).map((holiday) => holiday.date)
        );
        setHolidayDates(holidaySet);
      } catch (error) {
        console.error(error);
        if (!isActive) return;
        setHolidayDates(new Set());
        setHolidayError("Unable to load store holiday information.");
      } finally {
        if (!isActive) return;
        setHolidayLoaded(true);
      }
    };

    void loadHolidays();

    return () => {
      isActive = false;
    };
  }, [holidayMonthKey, store]);

  const handleReviewReservation = async () => {
    if (!canProceed || checkingSession) return;

    setCheckingSession(true);
    try {
      const response = await fetch("/api/me", { credentials: "include" });
      if (!response.ok) {
        throw new Error("failed to verify session");
      }

      const data = (await response.json().catch(() => ({}))) as { user?: { id?: string } | null };
      if (!data.user) {
        await router.push("/en/login");
        return;
      }

      const params = new URLSearchParams({
        store,
        pickupDate: pickup,
        returnDate,
        modelName: resolvedModelName,
        managementNumber,
      });

      await router.push(`/en/reserve/flow/step1?${params.toString()}`);
    } catch (error) {
      console.error(error);
    } finally {
      setCheckingSession(false);
    }
  };

  return (
    <>
      <Head>
        <title>Reserve {resolvedModelName} - ヤスカリ</title>
      </Head>
      <main className="min-h-screen bg-gray-50 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
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
                  Models & Rates
                </Link>
              </li>
              {resolvedModelCode ? (
                <>
                  <li className="text-gray-300">/</li>
                  <li>
                    <Link
                      href={`/en/products/${resolvedModelCode}`}
                      className="hover:text-red-500 font-medium"
                    >
                      {resolvedModelName}
                    </Link>
                  </li>
                </>
              ) : null}
              <li className="text-gray-300">/</li>
              <li className="text-gray-900 font-semibold" aria-current="page">
                Choose store & dates
              </li>
            </ol>
          </nav>

          <header className="bg-white shadow-sm ring-1 ring-gray-100 rounded-2xl p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
              Reservation
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Choose store & dates</h1>
            <p className="mt-2 text-gray-700">
              Booking request for {resolvedModelName}. Select your preferred store and dates to proceed.
            </p>
          </header>

          <section className="bg-white shadow-sm ring-1 ring-gray-100 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Model</p>
                <p className="text-lg font-bold text-gray-900">{resolvedModelName}</p>
                <p className="text-sm text-gray-600">Management number: {managementNumber}</p>
              </div>
              {resolvedImage ? (
                <img
                  src={resolvedImage}
                  alt={resolvedModelName}
                  className="h-20 w-32 object-cover rounded-lg ring-1 ring-gray-100"
                />
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <p className="text-xs font-semibold text-gray-900">Select from calendar</p>
                      <div className="grid w-full grid-cols-2 gap-2 text-[11px] sm:w-auto sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-red-700">
                          <span className="h-2 w-2 rounded-full bg-red-500" />Pickup date
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                          <span className="h-2 w-2 rounded-full bg-blue-500" />Return date
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-green-700">
                          <span className="h-2 w-2 rounded-full bg-green-500" />Rental period
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-1 text-gray-700">
                          Closed: Store holiday
                        </span>
                      </div>
                    </div>

                    <Calendar
                      month={visibleMonth}
                      onMonthChange={setVisibleMonth}
                      activeSelection={activeSelection}
                      minDate={minDate}
                      maxDate={maxDate}
                      maxRentalDays={maxAdvanceDays}
                      pickupDate={pickupDate}
                      returnDate={returnDateValue}
                      availabilityMap={availabilityMap}
                      availabilityLoaded={availabilityLoaded}
                      holidayDates={holidayDates}
                    holidayLoaded={holidayLoaded}
                    onSelectDate={(date) => {
                      const formatted = formatInputDate(date);

                      if (activeSelection === "pickup") {
                        setPickup(formatted);
                        if (returnDateValue && date > returnDateValue) {
                          setReturnDate("");
                        }
                        setActiveSelection("return");
                      } else {
                        setReturnDate(formatted);
                      }
                    }}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <button
                      type="button"
                    className={`rounded-full px-3 py-1 font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${activeSelection === "pickup" ? "bg-red-500 text-white focus:ring-red-500" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100 focus:ring-gray-300"}`}
                    onClick={() => setActiveSelection("pickup")}
                  >
                      Choose pickup date
                  </button>
                    <button
                      type="button"
                    className={`rounded-full px-3 py-1 font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${activeSelection === "return" ? "bg-blue-500 text-white focus:ring-blue-500" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100 focus:ring-gray-300"}`}
                    onClick={() => setActiveSelection("return")}
                    disabled={!pickup}
                  >
                      Choose return date
                  </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-600">
                    Select a pickup date. Reservations are available up to 3 months ahead.
                  </p>
                  <p className="mt-3 text-xs text-gray-600">
                    {activeSelection === "pickup"
                      ? "Please choose a pickup date from tomorrow onwards"
                      : "Choose a return date on or after your pickup date"}
                  </p>
                  {!availabilityLoaded ? (
                    <p className="mt-2 text-xs text-gray-500">Loading availability...</p>
                  ) : availabilityError ? (
                    <p className="mt-2 text-xs text-red-500">{availabilityError}</p>
                  ) : !holidayLoaded ? (
                    <p className="mt-2 text-xs text-gray-500">Loading store holidays...</p>
                  ) : holidayError ? (
                    <p className="mt-2 text-xs text-red-500">{holidayError}</p>
                  ) : null}
              </div>
              {storeNotice ? (
                <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700 leading-relaxed">
                  Minowa is an unmanned store, so staff cannot provide detailed instructions.
                  <br />
                  If you are unsure how to operate the bike or prefer assistance in Japanese,
                  <Link href="/stores#adachi" className="ml-1 font-semibold text-red-600 hover:underline">
                    please choose Adachi-Odai main store instead.
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
              </p>
              <button
                type="button"
                onClick={handleReviewReservation}
                disabled={!canProceed || checkingSession}
                className="inline-flex items-center justify-center rounded-lg bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-red-600 transition disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {checkingSession ? "Checking..." : "Review reservation details"}
              </button>
            </div>

            <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
              <Link
                href={`/en/reserve/models/${managementNumber}/availability`}
                className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-black transition"
              >
                Check availability
              </Link>
              <Link
                href={resolvedModelCode ? `/en/products/${resolvedModelCode}` : "/en/products"}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-300 transition"
              >
                Back to model page
              </Link>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
              <p className="text-sm font-semibold text-gray-900">Important notes</p>
              <p>
                We may need to change the vehicle on the rental day due to unexpected issues such as breakdowns or accidents.
              </p>
              <p>
                Reservations close at 5:00 p.m. on the business day before your rental date.
                (Mondays are closed, so Tuesday rentals must be booked by 5:00 p.m. on the preceding Sunday.)
              </p>
              <p>
                Adachi-Odai store is closed on holidays. If your return date falls on a holiday, please return the bike by the previous day.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  const managementNumberParam = params?.managementNumber;
  if (typeof managementNumberParam !== "string") {
    return { notFound: true };
  }

  const VEHICLES_TABLE = process.env.VEHICLES_TABLE ?? "Vehicles";
  const MODELS_TABLE = process.env.BIKE_MODELS_TABLE ?? "BikeModels";

  let vehicle: VehicleRecord | null = null;
  let model: BikeModelRecord | null = null;

  try {
    const client = getDocumentClient();
    const vehicleResult = await client.send(
      new GetCommand({
        TableName: VEHICLES_TABLE,
        Key: { managementNumber: managementNumberParam },
      })
    );
    vehicle = (vehicleResult.Item as VehicleRecord | undefined) ?? null;

    if (vehicle?.modelId !== undefined) {
      const modelResult = await client.send(
        new GetCommand({
          TableName: MODELS_TABLE,
          Key: { modelId: vehicle.modelId },
        })
      );
      model = (modelResult.Item as BikeModelRecord | undefined) ?? null;
    }
  } catch (error) {
    console.error("Failed to load vehicle/model data", error);
  }

  if (vehicle) {
    return {
      props: {
        vehicle,
        model,
        fallbackBike: null,
        managementNumber: managementNumberParam,
      },
    };
  }

  const bikes = await getBikeModels();
  const fallbackBike =
    bikes.find((b) => b.modelCode === managementNumberParam) ?? null;

  if (!fallbackBike) {
    return { notFound: true };
  }

  return {
    props: {
      vehicle: null,
      model: null,
      fallbackBike,
      managementNumber: managementNumberParam,
    },
  };
};

interface CalendarProps {
  month: Date;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: Date) => void;
  activeSelection: SelectionType;
  minDate: Date;
  maxDate: Date;
  maxRentalDays: number;
  pickupDate: Date | null;
  returnDate: Date | null;
  availabilityMap: RentalAvailabilityMap;
  availabilityLoaded: boolean;
  holidayDates: Set<string>;
  holidayLoaded: boolean;
}

function Calendar({
  month,
  onMonthChange,
  onSelectDate,
  activeSelection,
  minDate,
  maxDate,
  maxRentalDays,
  pickupDate,
  returnDate,
  availabilityMap,
  availabilityLoaded,
  holidayDates,
  holidayLoaded,
}: CalendarProps) {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const startDay = monthStart.getDay();
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - startDay);

  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const endDay = monthEnd.getDay();
  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(monthEnd.getDate() + (6 - endDay));

  const days: CalendarDay[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    days.push({ date: new Date(cursor), inCurrentMonth: cursor.getMonth() === month.getMonth() });
    cursor.setDate(cursor.getDate() + 1);
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const moveMonth = (offset: number) => {
    const next = new Date(month);
    next.setMonth(month.getMonth() + offset);
    next.setDate(1);
    onMonthChange(next);
  };

  const isStoreHoliday = (date: Date) => holidayDates.has(formatInputDate(date));

  const isBikeAvailable = (date: Date) => {
    if (!availabilityLoaded) {
      return false;
    }
    const key = formatInputDate(date);
    return availabilityMap[key]?.status === "AVAILABLE";
  };

  const isDateAvailable = (date: Date) => {
    if (!availabilityLoaded || !holidayLoaded) {
      return false;
    }
    if (isStoreHoliday(date)) {
      return false;
    }
    return isBikeAvailable(date);
  };

  const isRangeAvailable = (start: Date, end: Date) => {
    if (!availabilityLoaded) {
      return false;
    }

    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);

    for (; cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
      if (!isBikeAvailable(cursor)) {
        return false;
      }
    }
    return true;
  };

  const getMaxReturnDate = (start: Date) => {
    const maxReturn = new Date(start);
    maxReturn.setDate(maxReturn.getDate() + maxRentalDays);
    maxReturn.setHours(0, 0, 0, 0);
    return maxReturn > maxDate ? maxDate : maxReturn;
  };

  const isDateDisabled = (date: Date) => {
    const isBeforeMin = date < minDate;
    const isAfterMax = date > maxDate;
    const isBeforePickup = activeSelection === "return" && pickupDate ? date < pickupDate : false;
    const maxReturnDate = pickupDate ? getMaxReturnDate(pickupDate) : maxDate;
    const isAfterMaxReturn = activeSelection === "return" && pickupDate ? date > maxReturnDate : false;
    const isUnavailable = !isDateAvailable(date);
    const isRangeUnavailable =
      activeSelection === "return" && pickupDate
        ? !isRangeAvailable(pickupDate, date)
        : false;
    return (
      isBeforeMin ||
      isAfterMax ||
      isBeforePickup ||
      isAfterMaxReturn ||
      isUnavailable ||
      isRangeUnavailable
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900">
          {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500">
        {weekDays.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map(({ date, inCurrentMonth }) => {
          const holiday = isStoreHoliday(date);
          const disabled = isDateDisabled(date) || !inCurrentMonth;
          const isPickup = pickupDate ? isSameDay(date, pickupDate) : false;
          const isReturn = returnDate ? isSameDay(date, returnDate) : false;
          const isInRange =
            pickupDate && returnDate
              ? date > pickupDate && date < returnDate
              : false;

          const baseClasses = "flex h-12 w-full flex-col items-center justify-center rounded-lg text-sm font-semibold transition";

          const stateClass = (() => {
            if (isPickup) return "bg-red-500 text-white shadow";
            if (isReturn) return "bg-blue-500 text-white shadow";
            if (isInRange) return "bg-green-100 text-green-900";
            if (disabled) return "text-gray-300 bg-gray-100";
            if (!inCurrentMonth) return "text-gray-300";
            return "bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50";
          })();

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(date)}
              className={`${baseClasses} ${stateClass}`}
            >
              <span>{date.getDate()}</span>
              {holiday && inCurrentMonth ? (
                <span className="text-[10px] leading-none text-red-500">Closed</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
