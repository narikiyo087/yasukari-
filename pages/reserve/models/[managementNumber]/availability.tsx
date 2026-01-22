import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { getStoreLabel } from "../../../../lib/dashboard/storeOptions";
import {
  BikeModel,
  RentalAvailabilityDay,
  RentalAvailabilityMap,
  Vehicle,
} from "../../../../lib/dashboard/types";

const STATUS_COLORS: Record<"AVAILABLE" | "UNAVAILABLE", string> = {
  AVAILABLE: "bg-emerald-500",
  UNAVAILABLE: "bg-rose-500",
};

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
        setLoadError("空き状況の取得に失敗しました。しばらく待ってから再度お試しください。");
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
const availabilityLabel = (entry?: RentalAvailabilityDay) =>
  isAvailable(entry) ? "レンタル可" : "レンタル不可";
const availabilityIcon = (entry?: RentalAvailabilityDay) => (isAvailable(entry) ? "⚪︎" : "❌");

  const resolvedModelName = model?.modelName ?? "車種";
  const resolvedStoreLabel = vehicle?.storeId ? getStoreLabel(vehicle.storeId) : "店舗";

  return (
    <>
      <Head>
        <title>{resolvedModelName}の空き状況 - ヤスカリ</title>
      </Head>
      <main className="min-h-screen bg-gray-50 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <nav className="text-sm text-gray-500" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-red-500 font-medium">
                  ホーム
                </Link>
              </li>
              <li className="text-gray-300">/</li>
              <li>
                <Link href="/products" className="hover:text-red-500 font-medium">
                  車種・料金
                </Link>
              </li>
              <li className="text-gray-300">/</li>
              <li className="text-gray-900 font-semibold" aria-current="page">
                車種の空き状況
              </li>
            </ol>
          </nav>

          <header className="bg-white shadow-sm ring-1 ring-gray-100 rounded-2xl p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Availability</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">車種の空き状況</h1>
            <p className="mt-2 text-gray-700">
              バイクスケジュールのデータを基に、レンタル可否をカレンダーで確認できます。
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {managementNumber ? (
                <Link
                  href={`/reserve/models/${managementNumber}`}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-300 transition"
                >
                  店舗・日時選択に戻る
                </Link>
              ) : null}
            </div>
          </header>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 bg-white shadow-sm ring-1 ring-gray-100 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Calendar</p>
                  <h2 className="text-lg font-bold text-gray-900">空き状況カレンダー</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    日付をクリックすると、その日のステータスを表示します。
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:border-gray-300 transition"
                    onClick={() => setCalendarMonthOffset((prev) => prev - 1)}
                  >
                    前の月
                  </button>
                  <div className="text-sm font-semibold text-gray-900">
                    {displayMonth.getFullYear()}年{displayMonth.getMonth() + 1}月
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:border-gray-300 transition"
                    onClick={() => setCalendarMonthOffset((prev) => prev + 1)}
                  >
                    次の月
                  </button>
                </div>
              </div>

              {loadError && <p className="mt-4 text-sm text-rose-600">{loadError}</p>}
              {isLoading && !loadError ? (
                <p className="mt-4 text-sm text-gray-600">空き状況を読み込み中です...</p>
              ) : null}
              {!isLoading && !vehicle ? (
                <p className="mt-4 text-sm text-rose-600">該当する車両が見つかりませんでした。</p>
              ) : null}

              <div className="mt-6 overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-center text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      {"日月火水木金土".split("").map((weekday) => (
                        <th key={weekday} className="py-2 font-semibold">
                          {weekday}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {calendarWeeks.map((week, weekIndex) => (
                      <tr key={`week-${weekIndex}`} className="divide-x divide-gray-100">
                        {week.map((cell, dayIndex) => {
                          const entry = availabilityMap[cell.key];
                          const isSelected = selectedDate === cell.key;
                          return (
                            <td
                              key={`${weekIndex}-${dayIndex}`}
                              className={`h-20 align-top p-2 text-left transition ${
                                !cell.isCurrentMonth ? "bg-gray-50 text-gray-400" : "bg-white"
                              } ${isSelected ? "ring-2 ring-red-500" : ""}`}
                            >
                              <button
                                type="button"
                                className="w-full h-full text-left space-y-2"
                                onClick={() => setSelectedDate(cell.key)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-gray-700">
                                    {cell.date.getDate()}日
                                  </span>
                                  <span className="text-sm font-semibold text-gray-700">
                                    {availabilityIcon(entry)}
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
              <div className="bg-white shadow-sm ring-1 ring-gray-100 rounded-2xl p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Vehicle</p>
                <h2 className="text-lg font-bold text-gray-900">車両情報</h2>
                {vehicle ? (
                  <dl className="mt-4 space-y-3 text-sm text-gray-700">
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-gray-500">管理番号</dt>
                      <dd className="font-semibold text-gray-900">{vehicle.managementNumber}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-gray-500">モデル</dt>
                      <dd className="font-semibold text-gray-900">{resolvedModelName}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-gray-500">店舗</dt>
                      <dd className="font-semibold text-gray-900">{resolvedStoreLabel}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-4 text-sm text-gray-600">
                    {isLoading ? "読み込み中です..." : "車両情報を取得できませんでした。"}
                  </p>
                )}
              </div>

              <div className="bg-white shadow-sm ring-1 ring-gray-100 rounded-2xl p-6 sm:p-8 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Legend</p>
                  <h2 className="text-lg font-bold text-gray-900">ステータス表示</h2>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${STATUS_COLORS.AVAILABLE}`} aria-hidden />
                    <span className="font-semibold text-gray-900">レンタル可</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${STATUS_COLORS.UNAVAILABLE}`} aria-hidden />
                    <span className="font-semibold text-gray-900">レンタル不可</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white shadow-sm ring-1 ring-gray-100 rounded-2xl p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Selected day</p>
                <h2 className="text-lg font-bold text-gray-900">選択中の日付</h2>
                {selectedDate ? (
                  <div className="mt-4 space-y-2 text-sm text-gray-700">
                    <p className="font-semibold text-gray-900">{selectedDate}</p>
                    <p className="inline-flex items-center gap-2 text-gray-900">
                      <span
                        className={`h-3 w-3 rounded-full ${
                          isAvailable(selectedEntry) ? STATUS_COLORS.AVAILABLE : STATUS_COLORS.UNAVAILABLE
                        }`}
                        aria-hidden
                      />
                      <span className="font-semibold">
                        {availabilityLabel(selectedEntry)}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-gray-600">日付を選択すると詳細が表示されます。</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
