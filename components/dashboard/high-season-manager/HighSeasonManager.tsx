import type { MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  deleteHighSeason,
  fetchMonthlyHighSeason,
  setHighSeason,
} from "../../../lib/dashboard/highSeasonManager";
import styles from "../../../styles/HolidayManager.module.css";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatMonthParam = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const formatMonthLabel = (date: Date): string => {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
};

type CalendarCell = {
  date: Date;
  key: string;
  isCurrentMonth: boolean;
};

type ContextMenuState = {
  date: string;
  x: number;
  y: number;
};

const buildCalendar = (reference: Date): CalendarCell[][] => {
  const firstDay = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const weeks: CalendarCell[][] = [];
  const current = new Date(startDate);

  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const days: CalendarCell[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const cellDate = new Date(current);
      days.push({
        date: cellDate,
        key: formatDateKey(cellDate),
        isCurrentMonth: cellDate.getMonth() === reference.getMonth(),
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(days);

    if (
      current.getMonth() !== reference.getMonth() &&
      current.getDay() === 0 &&
      weeks.length >= 5
    ) {
      break;
    }
  }

  return weeks;
};

export default function HighSeasonManager() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [highSeasonDates, setHighSeasonDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const calendarWrapperRef = useRef<HTMLDivElement | null>(null);

  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const calendar = useMemo(() => buildCalendar(currentMonth), [currentMonth]);

  const currentMonthParam = useMemo(
    () => formatMonthParam(currentMonth),
    [currentMonth]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchMonthlyHighSeason(currentMonthParam);
        setHighSeasonDates(
          new Set(response.filter((date) => date.isHighSeason).map((date) => date.date))
        );
      } catch (fetchError) {
        console.error(fetchError);
        setError("ハイシーズン情報の取得に失敗しました。時間をおいて再度お試しください。");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentMonthParam]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    document.addEventListener("click", closeMenu);
    return () => {
      document.removeEventListener("click", closeMenu);
    };
  }, []);

  const refreshMonth = async () => {
    try {
      const result = await fetchMonthlyHighSeason(currentMonthParam);
      setHighSeasonDates(
        new Set(result.filter((date) => date.isHighSeason).map((date) => date.date))
      );
      setError(null);
    } catch (refreshError) {
      console.error(refreshError);
      setError("ハイシーズン情報の更新に失敗しました。");
    }
  };

  const handleMonthChange = (offset: number) => {
    setContextMenu(null);
    setError(null);
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + offset);
      return new Date(next.getFullYear(), next.getMonth(), 1);
    });
  };

  const handleCellClick = (
    cell: CalendarCell,
    event: ReactMouseEvent<HTMLTableCellElement>
  ) => {
    event.stopPropagation();
    if (!calendarWrapperRef.current) {
      setContextMenu({ date: cell.key, x: event.clientX, y: event.clientY });
      return;
    }

    const containerRect = calendarWrapperRef.current.getBoundingClientRect();
    const targetRect = event.currentTarget.getBoundingClientRect();
    const x = targetRect.left - containerRect.left + targetRect.width / 2;
    const y = targetRect.top - containerRect.top + targetRect.height;
    setContextMenu({ date: cell.key, x, y });
  };

  const handleSetHighSeason = async (date: string) => {
    setError(null);
    setActionBusy(true);
    setContextMenu(null);
    try {
      await setHighSeason(date, true);
      await refreshMonth();
    } catch (setError) {
      console.error(setError);
      setError("ハイシーズンの設定に失敗しました。");
    } finally {
      setActionBusy(false);
    }
  };

  const handleRemoveHighSeason = async (date: string) => {
    setError(null);
    setActionBusy(true);
    setContextMenu(null);
    try {
      await deleteHighSeason(date);
      await refreshMonth();
    } catch (removeError) {
      console.error(removeError);
      setError("ハイシーズンの解除に失敗しました。");
    } finally {
      setActionBusy(false);
    }
  };

  const menuHighSeason = contextMenu
    ? highSeasonDates.has(contextMenu.date)
    : false;

  return (
    <section className={styles.storeSection}>
      <div className={styles.storeHeader}>
        <h2 className={styles.storeTitle}>ハイシーズン設定</h2>
        <p className={styles.storeLead}>
          ハイシーズンONの日付には、1日あたり550円の追加料金が適用されます。
        </p>
      </div>
      {error && <div className={styles.errorMessage}>{error}</div>}
      <section className={styles.calendarCard}>
        <div className={styles.calendarHeader}>
          <div className={styles.monthLabel}>{formatMonthLabel(currentMonth)}</div>
          <div className={styles.monthControls}>
            <button
              type="button"
              className={styles.monthButton}
              onClick={() => handleMonthChange(-1)}
              disabled={actionBusy || loading}
            >
              前月
            </button>
            <button
              type="button"
              className={styles.monthButton}
              onClick={() => handleMonthChange(1)}
              disabled={actionBusy || loading}
            >
              翌月
            </button>
          </div>
        </div>
        <div className={styles.calendarWrapper} ref={calendarWrapperRef}>
          {loading ? (
            <div className={styles.skeletonGrid} aria-hidden>
              {Array.from({ length: 42 }).map((_, index) => (
                <div key={index} className={styles.skeletonCell} />
              ))}
            </div>
          ) : (
            <table className={styles.calendarGrid}>
              <thead>
                <tr>
                  {WEEKDAY_LABELS.map((weekday) => (
                    <th key={weekday} scope="col">
                      {weekday}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calendar.map((week) => (
                  <tr key={week[0].key}>
                    {week.map((cell) => {
                      const isHighSeason = highSeasonDates.has(cell.key);
                      return (
                        <td
                          key={cell.key}
                          className={`
                            ${styles.dayCell}
                            ${cell.isCurrentMonth ? "" : styles.outsideMonth}
                            ${isHighSeason ? styles.holiday : ""}
                            ${cell.key === todayKey ? styles.today : ""}
                          `}
                          onClick={(event) => handleCellClick(cell, event)}
                        >
                          <div className={styles.dayNumber}>{cell.date.getDate()}</div>
                          {isHighSeason && (
                            <div className={styles.highSeasonBadge}>ON</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {contextMenu && (
            <div
              className={styles.contextMenu}
              style={{
                top: contextMenu.y,
                left: contextMenu.x,
              }}
            >
              <div className={styles.calendarStatus}>{contextMenu.date}</div>
              <div className={styles.contextMenuDivider} aria-hidden="true" />
              {menuHighSeason ? (
                <button
                  type="button"
                  onClick={() => handleRemoveHighSeason(contextMenu.date)}
                  disabled={actionBusy}
                >
                  OFFに設定する
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetHighSeason(contextMenu.date)}
                  disabled={actionBusy}
                >
                  ONに設定する
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
