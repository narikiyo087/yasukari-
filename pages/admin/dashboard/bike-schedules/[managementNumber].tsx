import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import tableStyles from "../../../../styles/AdminTable.module.css";
import formStyles from "../../../../styles/AdminForm.module.css";
import styles from "../../../../styles/Dashboard.module.css";
import {
  RentalAvailabilityDay,
  RentalAvailabilityMap,
  RentalAvailabilityStatus,
  Vehicle,
  BikeModel,
} from "../../../../lib/dashboard/types";
import { getStoreLabel } from "../../../../lib/dashboard/storeOptions";
import { buildMaintenanceAvailability, formatDateKey } from "../../../../lib/dashboard/utils";
import type { Reservation } from "../../../../lib/reservations";

const STATUS_LABELS: Record<RentalAvailabilityStatus, string> = {
  AVAILABLE: "レンタル可",
  UNAVAILABLE: "貸出不可",
  MAINTENANCE: "メンテナンス中",
  RENTED: "レンタル中",
  RENTAL_COMPLETED: "レンタル完了",
};

const STATUS_COLORS: Record<RentalAvailabilityStatus, string> = {
  AVAILABLE: "#22c55e",
  UNAVAILABLE: "#ef4444",
  MAINTENANCE: "#f59e0b",
  RENTED: "#3b82f6",
  RENTAL_COMPLETED: "#8b5cf6",
};

type CalendarCell = {
  date: Date;
  key: string;
  isCurrentMonth: boolean;
};

type StatusEditorState = {
  date: string;
  x: number;
  y: number;
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
        key: formatDateKey(cellDate),
        isCurrentMonth: cellDate.getMonth() === month.getMonth(),
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(row);
  }

  return weeks;
};

const buildReservationAvailability = (reservations: Reservation[]): RentalAvailabilityMap => {
  const map: RentalAvailabilityMap = {};

  reservations.forEach((reservation) => {
    const isPaid = Boolean(reservation.paymentDate || reservation.paymentId);
    const isExcludedStatus =
      reservation.status === "キャンセル" ||
      reservation.status === "入金待ち" ||
      reservation.status === "予約完了";

    if (!isPaid || isExcludedStatus) {
      return;
    }

    const startDate = new Date(reservation.pickupAt);
    const endDate = new Date(reservation.returnAt);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return;
    }

    const renterName = reservation.memberName?.trim() || "名前未登録";
    const isRentalCompleted =
      Boolean(reservation.rentalCompletedAt) || reservation.status === "レンタル完了";
    const completionNote = `${renterName}（バイク返却完了）`;
    const cursor = new Date(startDate);

    const noteForDay = (base: string, existing?: string) =>
      existing && existing !== base
        ? Array.from(new Set([existing, base])).join(" / ")
        : base;

    if (isRentalCompleted) {
      while (cursor <= endDate) {
        const key = formatDateKey(cursor);
        const existingNote = map[key]?.note;
        const note = noteForDay(completionNote, existingNote);

        map[key] = { status: "AVAILABLE", note };
        cursor.setDate(cursor.getDate() + 1);
      }
      return;
    }

    while (cursor <= endDate) {
      const key = formatDateKey(cursor);
      const existingNote = map[key]?.note;
      const note = noteForDay(renterName, existingNote);

      map[key] = { status: "RENTED", note };
      cursor.setDate(cursor.getDate() + 1);
    }
  });

  return map;
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
          status === "RENTED" ||
          status === "RENTAL_COMPLETED";
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

export default function BikeScheduleDetailPage() {
  const router = useRouter();
  const managementNumber = router.query.managementNumber as string | undefined;

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bikeModels, setBikeModels] = useState<BikeModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [availabilityMap, setAvailabilityMap] = useState<RentalAvailabilityMap>({});
  const [reservationAvailabilityMap, setReservationAvailabilityMap] =
    useState<RentalAvailabilityMap>({});
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<RentalAvailabilityStatus>("AVAILABLE");
  const [activeNote, setActiveNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);
  const [statusEditor, setStatusEditor] = useState<StatusEditorState | null>(null);
  const [maintenanceStartDate, setMaintenanceStartDate] = useState(() =>
    formatDateKey(new Date())
  );
  const [maintenanceMonths, setMaintenanceMonths] = useState(1);
  const [rentalOverrideDates, setRentalOverrideDates] = useState<Set<string>>(() => new Set());

  const calendarWrapperRef = useRef<HTMLDivElement | null>(null);
  const statusEditorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!managementNumber) {
      return;
    }

    const fetchVehicles = async () => {
      try {
        const [vehicleResponse, modelResponse] = await Promise.all([
          fetch("/api/vehicles"),
          fetch("/api/bike-models"),
        ]);

        if (!vehicleResponse.ok || !modelResponse.ok) {
          throw new Error("failed to load");
        }

        const data: Vehicle[] = await vehicleResponse.json();
        const models: BikeModel[] = await modelResponse.json();
        setVehicles(data);
        setBikeModels(models);
        setLoadError(null);
      } catch (error) {
        console.error("Failed to load vehicles for schedule management", error);
        setLoadError("車両情報の取得に失敗しました。しばらく待ってから再度お試しください。");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchVehicles();
  }, [managementNumber]);

  const selectedVehicle = useMemo(
    () =>
      managementNumber
        ? vehicles.find((vehicle) => vehicle.managementNumber === managementNumber) ?? null
        : null,
    [managementNumber, vehicles]
  );

  useEffect(() => {
    if (selectedVehicle) {
      const normalized = normalizeAvailabilityMap(selectedVehicle.rentalAvailability);
      setAvailabilityMap(normalized);
      setMaintenanceStartDate(
        selectedVehicle.liabilityInsuranceExpiryDate ??
          selectedVehicle.inspectionExpiryDate ??
          formatDateKey(new Date())
      );
    } else {
      setAvailabilityMap({});
      setMaintenanceStartDate(formatDateKey(new Date()));
    }
    setReservationAvailabilityMap({});
    setActiveDate(null);
    setActiveNote("");
    setActiveStatus("AVAILABLE");
    setStatusEditor(null);
    setSaveSuccess(null);
    setSaveError(null);
    setRentalOverrideDates(new Set());
  }, [selectedVehicle]);

  useEffect(() => {
    if (!selectedVehicle) {
      return;
    }

    const fetchReservations = async () => {
      try {
        const response = await fetch("/api/reservations");
        if (!response.ok) {
          throw new Error("failed to load reservations");
        }

        const data = (await response.json()) as { reservations?: Reservation[] };
        const reservations = data.reservations ?? [];
        const matchedReservations = reservations.filter(
          (reservation) => reservation.vehicleCode === selectedVehicle.managementNumber
        );
        setReservationAvailabilityMap(buildReservationAvailability(matchedReservations));
      } catch (error) {
        console.error("Failed to load reservations for rental status", error);
        setReservationAvailabilityMap({});
      }
    };

    void fetchReservations();
  }, [selectedVehicle]);

  const displayMonth = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + calendarMonthOffset, 1);
  }, [calendarMonthOffset]);

  const mergedAvailabilityMap = useMemo(() => {
    const merged = {
      ...availabilityMap,
      ...reservationAvailabilityMap,
    };

    rentalOverrideDates.forEach((date) => {
      if (availabilityMap[date]) {
        merged[date] = availabilityMap[date];
      } else {
        delete merged[date];
      }
    });

    return merged;
  }, [availabilityMap, rentalOverrideDates, reservationAvailabilityMap]);

  const isReservationLockedDate = (date: string) => {
    const reservationStatus = reservationAvailabilityMap[date]?.status;
    return reservationStatus === "RENTED" || reservationStatus === "RENTAL_COMPLETED";
  };

  const confirmOverrideRentalStatus = () =>
    window.confirm("レンタル中というステータスになっていますが、変更しますか？");

  const calendarWeeks = useMemo(
    () => buildCalendarGrid(displayMonth),
    [displayMonth]
  );

  const handleSelectDate = (date: string) => {
    setActiveDate(date);
    const entry = mergedAvailabilityMap[date];
    setActiveStatus(entry?.status ?? "AVAILABLE");
    setActiveNote(entry?.note ?? "");
    setFormError(null);
  };

  const handleOpenStatusEditor = (
    cell: CalendarCell,
    event: ReactMouseEvent<HTMLTableCellElement>
  ) => {
    event.stopPropagation();
    handleSelectDate(cell.key);

    if (!calendarWrapperRef.current) {
      setStatusEditor({ date: cell.key, x: event.clientX, y: event.clientY });
      return;
    }

    const containerRect = calendarWrapperRef.current.getBoundingClientRect();
    const targetRect = event.currentTarget.getBoundingClientRect();
    setStatusEditor({
      date: cell.key,
      x: targetRect.left - containerRect.left + targetRect.width / 2,
      y: targetRect.top - containerRect.top + targetRect.height + 8,
    });
  };

  useEffect(() => {
    const closeEditor = (event: MouseEvent) => {
      if (
        statusEditorRef.current &&
        !statusEditorRef.current.contains(event.target as Node)
      ) {
        setStatusEditor(null);
      }
    };

    document.addEventListener("click", closeEditor);
    return () => {
      document.removeEventListener("click", closeEditor);
    };
  }, []);

  const handleApplyDate = () => {
    if (!selectedVehicle) {
      setFormError("編集する車両を読み込み中です。");
      return;
    }

    if (!activeDate) {
      setFormError("日を選択してください。");
      return;
    }

    const reservationStatus = reservationAvailabilityMap[activeDate]?.status;
    const isRentalStatus =
      reservationStatus === "RENTED" || reservationStatus === "RENTAL_COMPLETED";

    if (
      isRentalStatus &&
      activeStatus !== reservationStatus &&
      !rentalOverrideDates.has(activeDate) &&
      !confirmOverrideRentalStatus()
    ) {
      return;
    }

    const trimmedNote = activeNote.trim();
    setAvailabilityMap((prev) => ({
      ...prev,
      [activeDate]: {
        status: activeStatus,
        ...(trimmedNote ? { note: trimmedNote } : {}),
      },
    }));

    if (isRentalStatus) {
      setRentalOverrideDates((prev) => {
        const next = new Set(prev);
        if (activeStatus === reservationStatus) {
          next.delete(activeDate);
        } else {
          next.add(activeDate);
        }
        return next;
      });
    }
    setFormError(null);
    setSaveSuccess(null);
    setStatusEditor(null);
  };

  const handleResetDate = () => {
    if (!activeDate) {
      setFormError("日を選択してください。");
      return;
    }

    setAvailabilityMap((prev) => {
      const { [activeDate]: _, ...rest } = prev;
      return rest;
    });
    setRentalOverrideDates((prev) => {
      if (!prev.has(activeDate)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(activeDate);
      return next;
    });
    setActiveNote("");
    setActiveStatus("AVAILABLE");
    setSaveSuccess(null);
    setFormError(null);
    setStatusEditor(null);
  };

  const handleBulkSetMonthAvailable = () => {
    if (!selectedVehicle) {
      setFormError("車両情報の読み込みを確認してから操作してください。");
      return;
    }

    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const updatedAvailability: RentalAvailabilityMap = { ...availabilityMap };
    const rentalDatesInMonth: string[] = [];

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = formatDateKey(new Date(year, month, day));
      if (isReservationLockedDate(dateKey) && !rentalOverrideDates.has(dateKey)) {
        rentalDatesInMonth.push(dateKey);
      } else {
        updatedAvailability[dateKey] = { status: "AVAILABLE" };
      }
    }

    const shouldOverrideRentalStatus =
      rentalDatesInMonth.length === 0 || confirmOverrideRentalStatus();

    if (shouldOverrideRentalStatus) {
      rentalDatesInMonth.forEach((dateKey) => {
        updatedAvailability[dateKey] = { status: "AVAILABLE" };
      });
      setRentalOverrideDates((prev) => {
        const next = new Set(prev);
        rentalDatesInMonth.forEach((dateKey) => next.add(dateKey));
        return next;
      });
    }

    setAvailabilityMap(updatedAvailability);
    setActiveDate(null);
    setActiveNote("");
    setActiveStatus("AVAILABLE");
    setSaveSuccess(null);
    setFormError(null);
    setStatusEditor(null);
  };

  const handleSave = async () => {
    if (!selectedVehicle) {
      setSaveError("スケジュールを保存する車両を確認できませんでした。");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    const payload = {
      managementNumber: selectedVehicle.managementNumber,
      modelId: selectedVehicle.modelId,
      storeId: selectedVehicle.storeId,
      publishStatus: selectedVehicle.publishStatus,
      tags: selectedVehicle.tags ?? [],
      rentalAvailability: mergedAvailabilityMap,
      policyNumber1: selectedVehicle.policyNumber1,
      policyBranchNumber1: selectedVehicle.policyBranchNumber1,
      policyNumber2: selectedVehicle.policyNumber2,
      policyBranchNumber2: selectedVehicle.policyBranchNumber2,
      inspectionExpiryDate: selectedVehicle.inspectionExpiryDate,
      licensePlateNumber: selectedVehicle.licensePlateNumber,
      previousLicensePlateNumber: selectedVehicle.previousLicensePlateNumber,
      liabilityInsuranceExpiryDate: selectedVehicle.liabilityInsuranceExpiryDate,
      videoUrl: selectedVehicle.videoUrl,
      notes: selectedVehicle.notes,
    };

    try {
      const response = await fetch("/api/vehicles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { message?: string };
        throw new Error(errorBody.message ?? "保存に失敗しました。");
      }

      const updated = (await response.json()) as Vehicle;
      setSaveSuccess("レンタル可能日の更新が完了しました。");
      setVehicles((prev) =>
        prev.map((vehicle) =>
          vehicle.managementNumber === updated.managementNumber ? updated : vehicle
        )
      );
    } catch (error) {
      console.error("Failed to save rental availability", error);
      setSaveError(
        error instanceof Error ? error.message : "レンタル可能日の保存に失敗しました。"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyMaintenanceRange = (
    startDate: string,
    label: string,
    months = maintenanceMonths
  ) => {
    if (!startDate) {
      setFormError(`${label}の開始日を設定してください。`);
      return;
    }

    const maintenanceMap = buildMaintenanceAvailability(startDate, months, label);

    if (Object.keys(maintenanceMap).length === 0) {
      setFormError(`${label}の日付が正しくありません。`);
      return;
    }

    setAvailabilityMap((prev) => ({ ...prev, ...maintenanceMap }));
    setFormError(null);
    setSaveSuccess(null);
    setStatusEditor(null);
    setActiveDate(null);
  };

  return (
    <>
      <Head>
        <title>バイクスケジュール詳細</title>
      </Head>
      <DashboardLayout
        title="バイクスケジュール詳細"
        description="カレンダーを使って日毎のステータスとメモを編集し、データベースへ保存します。"
        showDashboardLink
      >
        <section className={styles.menuSection}>
          <div className={styles.menuGroups}>
            <div className={styles.menuGroup}>
              <div className={styles.buttonRow} style={{ justifyContent: "space-between" }}>
                <Link href="/admin/dashboard/bike-schedules" className={formStyles.secondaryButton}>
                  戻る
                </Link>
                {selectedVehicle && (
                  <div className={styles.menuGroupNote}>
                    {selectedVehicle.managementNumber} / {getStoreLabel(selectedVehicle.storeId)}
                  </div>
                )}
              </div>
              {loadError && <p className={formStyles.formError}>{loadError}</p>}
              {isLoading && <p className={styles.menuGroupNote}>読み込み中です...</p>}
              {!selectedVehicle && !isLoading && (
                <p className={formStyles.formError}>対象の車両が見つかりませんでした。</p>
              )}

              {selectedVehicle && (
                <>
                  <div className={styles.menuGroup}>
                    <div className={styles.menuGroupTitle}>車両情報</div>
                    <table className={tableStyles.table}>
                      <tbody>
                        <tr>
                          <th style={{ width: "140px" }}>管理番号</th>
                          <td>{selectedVehicle.managementNumber}</td>
                        </tr>
                        <tr>
                          <th>モデル</th>
                          <td>
                            {bikeModels.find((model) => model.modelId === selectedVehicle.modelId)?.modelName ?? "-"}
                          </td>
                        </tr>
                        <tr>
                          <th>店舗</th>
                          <td>{getStoreLabel(selectedVehicle.storeId)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.cardGrid} style={{ gap: "1.25rem" }}>
                    <div className={styles.menuGroup} style={{ minHeight: "100%" }}>
                      <div className={styles.calendarHeader}>
                        <div>
                          <div className={styles.menuGroupTitle}>カレンダー</div>
                          <div className={styles.menuGroupNote}>日付の枠をクリックしてステータスとメモを設定してください。</div>
                        </div>
                        <div className={styles.calendarControls}>
                          <button
                            type="button"
                            className={formStyles.secondaryButton}
                            onClick={() => {
                              setStatusEditor(null);
                              setCalendarMonthOffset((prev) => prev - 1);
                            }}
                          >
                            前の月
                          </button>
                          <div className={styles.calendarMonthLabel}>
                            {displayMonth.getFullYear()}年{displayMonth.getMonth() + 1}月
                          </div>
                          <button
                            type="button"
                            className={formStyles.secondaryButton}
                            onClick={() => {
                              setStatusEditor(null);
                              setCalendarMonthOffset((prev) => prev + 1);
                            }}
                          >
                            次の月
                          </button>
                        </div>
                      </div>
                      <div className={styles.calendarUtilityRow}>
                        <div className={styles.calendarUtilityText}>
                          表示中の1か月分をまとめて「レンタル可」に設定できます。設定後に保存ボタンを押してください。
                        </div>
                        <button
                          type="button"
                          className={formStyles.primaryButton}
                          onClick={handleBulkSetMonthAvailable}
                        >
                          <span aria-hidden>🗓️</span>
                          <span>今月をレンタル可で一括設定</span>
                        </button>
                      </div>
                      <div className={styles.calendarUtilityRow}>
                        <div className={styles.calendarUtilityText}>
                          メンテナンス期間を一括で設定できます。月数は共通で利用されます（最小1か月）。
                        </div>
                        <div className={styles.calendarMaintenanceControls}>
                          <label className={styles.inlineInputLabel}>
                            開始日
                            <input
                              type="date"
                              value={maintenanceStartDate}
                              className={formStyles.formInput}
                              onChange={(event) => setMaintenanceStartDate(event.target.value)}
                            />
                          </label>
                          <label className={styles.inlineInputLabel}>
                            期間（月）
                            <input
                              type="number"
                              min={1}
                              value={maintenanceMonths}
                              className={formStyles.formInput}
                              onChange={(event) =>
                                setMaintenanceMonths(Math.max(1, Number(event.target.value) || 1))
                              }
                            />
                          </label>
                          <button
                            type="button"
                            className={formStyles.secondaryButton}
                            onClick={() => handleApplyMaintenanceRange(maintenanceStartDate, "メンテナンス期間")}
                          >
                            <span aria-hidden>🛠️</span>
                            <span>メンテナンス期間設定</span>
                          </button>
                          <button
                            type="button"
                            className={formStyles.secondaryButton}
                            disabled={!selectedVehicle?.liabilityInsuranceExpiryDate}
                            onClick={() =>
                              handleApplyMaintenanceRange(
                                selectedVehicle?.liabilityInsuranceExpiryDate ?? "",
                                "自賠責満了期間"
                              )
                            }
                          >
                            <span aria-hidden>🧾</span>
                            <span>自賠責満了期間設定</span>
                          </button>
                          <button
                            type="button"
                            className={formStyles.secondaryButton}
                            disabled={!selectedVehicle?.inspectionExpiryDate}
                            onClick={() =>
                              handleApplyMaintenanceRange(
                                selectedVehicle?.inspectionExpiryDate ?? "",
                                "車検満了期間"
                              )
                            }
                          >
                            <span aria-hidden>🧰</span>
                            <span>車検満了期間設定</span>
                          </button>
                        </div>
                      </div>
                    <div className={`${styles.calendarCard} ${styles.calendarCardRaised}`} ref={calendarWrapperRef}>
                      <table className={styles.calendarTable}>
                        <thead>
                          <tr>
                            {"日月火水木金土".split("").map((weekday) => (
                                <th key={weekday}>{weekday}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {calendarWeeks.map((week, weekIndex) => (
                              <tr key={`week-${weekIndex}`}>
                                {week.map((cell, dayIndex) => {
                                  const entry = mergedAvailabilityMap[cell.key];
                                  const isSelected = activeDate === cell.key;
                                  const muted = !cell.isCurrentMonth;
                                  return (
                                    <td
                                      key={`${weekIndex}-${dayIndex}`}
                                      className={`${styles.calendarCell} ${muted ? styles.calendarCellMuted : ""} ${
                                        isSelected ? styles.calendarCellSelected : ""
                                      }`}
                                      onClick={(event) => handleOpenStatusEditor(cell, event)}
                                    >
                                      <div className={styles.calendarCellHeader}>
                                        <span className={styles.calendarDateLabel}>{cell.date.getDate()}日</span>
                                        {entry && (
                                          <span
                                            className={styles.calendarStatusChip}
                                            style={{
                                              backgroundColor: `${STATUS_COLORS[entry.status]}1a`,
                                              color: STATUS_COLORS[entry.status],
                                            }}
                                          >
                                        {entry.note &&
                                        (entry.status === "RENTED" ||
                                          entry.status === "RENTAL_COMPLETED")
                                          ? `${STATUS_LABELS[entry.status]}（${entry.note}）`
                                          : STATUS_LABELS[entry.status]}
                                      </span>
                                    )}
                                  </div>
                                      {!entry && <div className={styles.calendarEmpty}>未設定</div>}
                                      {entry?.note && <div className={styles.calendarNote}>{entry.note}</div>}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {statusEditor && (
                          <div
                            className={styles.calendarStatusEditor}
                            style={{ left: statusEditor.x, top: statusEditor.y }}
                            ref={statusEditorRef}
                          >
                            <div className={styles.calendarStatusEditorHeader}>
                              <div>
                                <div className={styles.menuGroupNote}>対象日</div>
                                <div className={styles.calendarStatusEditorDate}>{statusEditor.date}</div>
                              </div>
                              <button
                                type="button"
                                className={styles.iconButton}
                                onClick={() => setStatusEditor(null)}
                                aria-label="ポップアップを閉じる"
                              >
                                ×
                              </button>
                            </div>
                            <div className={styles.calendarStatusEditorBody}>
                              <label className={styles.calendarStatusEditorLabel}>
                                ステータス
                                <select
                                  className={formStyles.formSelect}
                                  value={activeStatus}
                                  onChange={(event) =>
                                    setActiveStatus(event.target.value as RentalAvailabilityStatus)
                                  }
                                >
                                  {(Object.keys(STATUS_LABELS) as RentalAvailabilityStatus[]).map((status) => (
                                    <option key={status} value={status}>
                                      {STATUS_LABELS[status]}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className={styles.calendarStatusEditorLabel}>
                                メモ
                                <input
                                  type="text"
                                  className={formStyles.formInput}
                                  value={activeNote}
                                  onChange={(event) => setActiveNote(event.target.value)}
                                  placeholder="任意で入力"
                                />
                              </label>
                              <div className={styles.calendarStatusEditorActions}>
                                <button
                                  type="button"
                                  className={formStyles.secondaryButton}
                                  onClick={handleResetDate}
                                >
                                  未設定に戻す
                                </button>
                                <button
                                  type="button"
                                  className={formStyles.submitButton}
                                  onClick={handleApplyDate}
                                >
                                  ステータスを反映
                                </button>
                              </div>
                            </div>
                            {formError && <p className={formStyles.formError}>{formError}</p>}
                          </div>
                        )}
                      </div>
                      <div className={styles.statusLegend}>
                        <div className={styles.menuGroupTitle}>ステータス凡例</div>
                        <div className={styles.statusLegendGrid}>
                          {(Object.keys(STATUS_LABELS) as RentalAvailabilityStatus[]).map((status) => (
                            <div key={status} className={styles.statusLegendItem}>
                              <span
                                className={styles.statusLegendDot}
                                style={{ backgroundColor: STATUS_COLORS[status] }}
                              />
                              <div>
                                <div className={styles.statusLegendLabel}>{STATUS_LABELS[status]}</div>
                                <div className={styles.menuGroupNote}>コード: {status}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className={styles.menuGroup} style={{ minHeight: "100%" }}>
                      <div className={styles.menuGroupTitle}>ステータスの保存</div>
                      <div className={styles.saveHelper}>
                        <div className={styles.saveHelperIcon} aria-hidden>
                          💾
                        </div>
                        <div>
                          <div className={styles.saveHelperTitle}>設定内容を反映するには保存が必要です</div>
                          <p className={styles.menuGroupNote}>
                            カレンダーで設定したステータスとメモは、保存ボタンを押すとデータベースに反映されます。
                          </p>
                        </div>
                      </div>
                      {formError && <p className={formStyles.formError}>{formError}</p>}
                      <div className={styles.buttonRow}>
                        <button
                          type="button"
                          className={`${formStyles.primaryButton} ${styles.saveButton}`}
                          onClick={handleSave}
                          disabled={isSaving}
                        >
                          <span aria-hidden>{isSaving ? "⏳" : "✅"}</span>
                          <span>{isSaving ? "保存中..." : "変更内容を保存"}</span>
                        </button>
                      </div>
                      {saveError && <p className={formStyles.formError}>{saveError}</p>}
                      {saveSuccess && <p className={formStyles.formSuccess}>{saveSuccess}</p>}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </DashboardLayout>
    </>
  );
}
