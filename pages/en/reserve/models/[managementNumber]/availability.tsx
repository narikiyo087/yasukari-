import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { getStoreLabel } from "../../../../../lib/dashboard/storeOptions";
import {
  BikeModel,
  RentalAvailabilityDay,
  RentalAvailabilityMap,
  Vehicle,
} from "../../../../../lib/dashboard/types";

const STATUS_COLORS: Record<"AVAILABLE" | "UNAVAILABLE", string> = {
  AVAILABLE: "bg-emerald-500",
  UNAVAILABLE: "bg-red-600",
};
const MAX_ADVANCE_MONTHS = 3;
const MAX_RENTAL_DAYS = 31;

type CalendarCell = {
  date: Date;
  key: string;
  isCurrentMonth: boolean;
};

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getBookingWindow = () => {
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  minDate.setHours(0, 0, 0, 0);

  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + MAX_ADVANCE_MONTHS);
  maxDate.setHours(0, 0, 0, 0);

  return { minDate, maxDate };
};

const buildCalendarGrid = (month: Date): CalendarCell[][] => {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  const weeks: CalendarCell[][] = [];
  const current = new Date(startDate);

  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const row: CalendarCell[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const cellDate = new Date(current);
      row.push({
        date: cellDate,
        key: formatDateInput(cellDate),
        isCurrentMonth: cellDate.getMonth() === month.getMonth(),
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(row);
  }

  return weeks;
};

const normalizeAvailabilityMap = (value: unknown): RentalAvailabilityMap => {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<RentalAvailabilityMap>(
    (acc, [date, raw]) => {
      if (typeof date !== "string") {
        return acc;
      }

      const normalizedEntry = (() => {
        if (Array.isArray(raw)) {
          if (raw.length === 0) {
            return null;
          }

          const [firstSlot] = raw as Record<string, unknown>[];
          const noteCandidate =
            typeof firstSlot?.note === "string" && firstSlot.note.trim().length > 0
              ? firstSlot.note.trim()
              : undefined;

          return {
            status: "AVAILABLE",
            ...(noteCandidate ? { note: noteCandidate } : {}),
          } satisfies RentalAvailabilityDay;
        }

        if (typeof raw !== "object" || raw === null) {
          return null;
        }

        const { status, note } = raw as Record<string, unknown>;
        const isValidStatus =
          status === "AVAILABLE" ||
          status === "UNAVAILABLE" ||
          status === "MAINTENANCE" ||
          status === "RENTED";
        if (!isValidStatus) {
          return null;
        }

        const trimmedNote =
          typeof note === "string" && note.trim().length > 0 ? note.trim() : undefined;

        return { status, ...(trimmedNote ? { note: trimmedNote } : {}) } satisfies RentalAvailabilityDay;
      })();

      if (normalizedEntry) {
        acc[date] = normalizedEntry;
      }

      return acc;
    },
    {}
  );
};

export default function BikeAvailabilityPreviewPage() {
  const router = useRouter();
  const managementNumber = router.query.managementNumber as string | undefined;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [model, setModel] = useState<BikeModel | null>(null);
  const [availabilityMap, setAvailabilityMap] = useState<RentalAvailabilityMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);

  useEffect(() => {
    if (!managementNumber) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [vehicleResponse, modelResponse] = await Promise.all([
          fetch(`/api/vehicles/${managementNumber}`),
          fetch("/api/bike-models"),
        ]);

        if (!vehicleResponse.ok || !modelResponse.ok) {
          throw new Error("failed to load");
        }

        const matchedVehicle = (await vehicleResponse.json()) as Vehicle;
        const models: BikeModel[] = await modelResponse.json();
        const matchedModel =
          models.find((item) => item.modelId === matchedVehicle.modelId) ?? null;

        setVehicle(matchedVehicle);
        setModel(matchedModel ?? null);
        setAvailabilityMap(
          matchedVehicle ? normalizeAvailabilityMap(matchedVehicle.rentalAvailability) : {}
        );
        setLoadError(null);
      } catch (error) {
        console.error("Failed to load availability preview", error);
        setLoadError("Unable to load availability. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [managementNumber]);

  const displayMonth = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + calendarMonthOffset, 1);
  }, [calendarMonthOffset]);

const calendarWeeks = useMemo(() => buildCalendarGrid(displayMonth), [displayMonth]);

const selectedEntry = selectedDate ? availabilityMap[selectedDate] : undefined;
const isAvailable = (entry?: RentalAvailabilityDay) => entry?.status === "AVAILABLE";
const { minDate: bookingWindowMinDate, maxDate: bookingWindowMaxDate } = useMemo(
  () => getBookingWindow(),
  []
);
const isWithinBookingWindow = (date: Date) => date >= bookingWindowMinDate && date <= bookingWindowMaxDate;
const canMovePrevMonth =
  new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1) >
  new Date(bookingWindowMinDate.getFullYear(), bookingWindowMinDate.getMonth(), 1);
const canMoveNextMonth =
  new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1) <
  new Date(bookingWindowMaxDate.getFullYear(), bookingWindowMaxDate.getMonth(), 1);
const availabilityLabel = (entry?: RentalAvailabilityDay, date?: Date) => {
  if (date && !isWithinBookingWindow(date)) {
    return "Outside booking window (pickup date must be within 3 months)";
  }
  return isAvailable(entry) ? "Available" : "Unavailable";
};
const availabilityIcon = (entry?: RentalAvailabilityDay, date?: Date) => {
  if (date && !isWithinBookingWindow(date)) {
    return "—";
  }
  return isAvailable(entry) ? "〇" : "×";
};

  const resolvedModelName = model?.modelName ?? "Model";
  const resolvedStoreLabel = vehicle?.storeId ? getStoreLabel(vehicle.storeId) : "Store";

  return (
    <>
      <Head>
        <title>{resolvedModelName} availability - ヤスカリ</title>
      </Head>
      <main className="min-h-screen bg-slate-50 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/en" className="hover:text-red-600 font-medium">
                  Home
                </Link>
              </li>
              <li className="text-slate-300">/</li>
              <li>
                <Link href="/en/products" className="hover:text-red-600 font-medium">
                  Models & Rates
                </Link>
              </li>
              <li className="text-slate-300">/</li>
              <li className="text-slate-900 font-semibold" aria-current="page">
                Availability
              </li>
            </ol>
          </nav>

          <header className="bg-white shadow-sm ring-1 ring-slate-100 rounded-lg p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Availability</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Model availability</h1>
            <p className="mt-2 text-slate-700">
              Check whether the selected bike is available based on the latest schedule.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {managementNumber ? (
                <Link
                  href={`/en/reserve/models/${managementNumber}`}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 transition"
                >
                  Back to store & date selection
                </Link>
              ) : null}
            </div>
          </header>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 bg-white shadow-sm ring-1 ring-slate-100 rounded-lg p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Calendar</p>
                  <h2 className="text-lg font-bold text-slate-900">Availability calendar</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Select a date to review availability status.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Pickup dates can be selected up to 3 months ahead, and rental duration is up to {MAX_RENTAL_DAYS} days.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 transition"
                    onClick={() => setCalendarMonthOffset((prev) => prev - 1)}
                    disabled={!canMovePrevMonth}
                  >
                    Previous
                  </button>
                  <div className="text-sm font-semibold text-slate-900">
                    {displayMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 transition"
                    onClick={() => setCalendarMonthOffset((prev) => prev + 1)}
                    disabled={!canMoveNextMonth}
                  >
                    Next
                  </button>
                </div>
              </div>

              {loadError && <p className="mt-4 text-sm text-red-600">{loadError}</p>}
              {isLoading && !loadError ? (
                <p className="mt-4 text-sm text-slate-600">Loading availability...</p>
              ) : null}
              {!isLoading && !vehicle ? (
                <p className="mt-4 text-sm text-red-600">We could not find the selected bike.</p>
              ) : null}

              <div className="mt-6 overflow-hidden rounded-md border border-slate-100">
                <table className="w-full text-center text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => (
                        <th key={weekday} className="py-2 font-semibold">
                          {weekday}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {calendarWeeks.map((week, weekIndex) => (
                      <tr key={`week-${weekIndex}`} className="divide-x divide-slate-100">
                        {week.map((cell, dayIndex) => {
                          const entry = availabilityMap[cell.key];
                          const isSelected = selectedDate === cell.key;
                          const isOutsideBookingWindow = !isWithinBookingWindow(cell.date);
                          return (
                            <td
                              key={`${weekIndex}-${dayIndex}`}
                              className={`h-20 align-top p-2 text-left transition ${
                                !cell.isCurrentMonth ? "bg-slate-50 text-slate-400" : "bg-white"
                              } ${isOutsideBookingWindow ? "bg-slate-100 text-slate-400" : ""} ${
                                isSelected ? "ring-2 ring-red-500" : ""
                              }`}
                            >
                              <button
                                type="button"
                                className="w-full h-full text-left space-y-2"
                                onClick={() => setSelectedDate(cell.key)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-slate-700">
                                    {cell.date.getDate()}
                                  </span>
                                  <span className="text-sm font-semibold text-slate-700">
                                    {availabilityIcon(entry, cell.date)}
                                  </span>
                                </div>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-lg p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vehicle</p>
                <h2 className="text-lg font-bold text-slate-900">Bike details</h2>
                {vehicle ? (
                  <dl className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-slate-500">Management number</dt>
                      <dd className="font-semibold text-slate-900">{vehicle.managementNumber}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-slate-500">Model</dt>
                      <dd className="font-semibold text-slate-900">{resolvedModelName}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-slate-500">Store</dt>
                      <dd className="font-semibold text-slate-900">{resolvedStoreLabel}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-4 text-sm text-slate-600">
                    {isLoading ? "Loading..." : "Unable to load bike details."}
                  </p>
                )}
              </div>

              <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-lg p-6 sm:p-8 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Legend</p>
                  <h2 className="text-lg font-bold text-slate-900">Legend</h2>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">〇</span>
                    <span className="text-slate-700">Available</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">×</span>
                    <span className="text-slate-700">Unavailable</span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">—</span>
                    <span className="text-slate-700">Outside booking window</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${STATUS_COLORS.AVAILABLE}`} aria-hidden />
                    <span className="font-semibold text-slate-900">Available</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${STATUS_COLORS.UNAVAILABLE}`} aria-hidden />
                    <span className="font-semibold text-slate-900">Unavailable</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white shadow-sm ring-1 ring-slate-100 rounded-lg p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected day</p>
                <h2 className="text-lg font-bold text-slate-900">Selected date</h2>
                {selectedDate ? (
                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{selectedDate}</p>
                    <p className="inline-flex items-center gap-2 text-slate-900">
                      <span
                        className={`h-3 w-3 rounded-full ${
                          selectedDate && !isWithinBookingWindow(new Date(selectedDate))
                            ? STATUS_COLORS.UNAVAILABLE
                            : isAvailable(selectedEntry)
                            ? STATUS_COLORS.AVAILABLE
                            : STATUS_COLORS.UNAVAILABLE
                        }`}
                        aria-hidden
                      />
                      <span className="font-semibold">
                        {availabilityLabel(
                          selectedEntry,
                          selectedDate ? new Date(selectedDate) : undefined
                        )}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-600">Select a date to see details.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
