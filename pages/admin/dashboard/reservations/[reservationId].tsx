import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useMemo, useState } from "react";

import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import { formatDisplayPhoneNumberWithCountryCode } from "../../../../lib/phoneNumber";
import { Reservation } from "../../../../lib/reservations";
import styles from "../../../../styles/Dashboard.module.css";
import tableStyles from "../../../../styles/AdminTable.module.css";

const statusClassName = (status: Reservation["status"]): string => {
  if (status === "予約受付完了") {
    return `${tableStyles.badge} ${tableStyles.badgeOn}`;
  }

  if (status === "入金待ち") {
    return `${tableStyles.badge} ${tableStyles.badgeNeutral}`;
  }

  if (status === "キャンセル") {
    return `${tableStyles.badge} ${tableStyles.badgeOff}`;
  }

  return tableStyles.badge;
};

const ACCESSORY_LABELS: Array<{ key: string; label: string }> = [
  { key: "halfCap", label: "半キャップ" },
  { key: "jetHelmet", label: "ジェットヘル" },
  { key: "brandHelmet", label: "ブランド・ヘルメット" },
  { key: "glove", label: "グローブ" },
];
const REFUND_LIMIT_DAYS = 180;

export default function ReservationDetailPage() {
  const router = useRouter();
  const { reservationId } = router.query;
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicleOptions, setVehicleOptions] = useState<{ code: string; plate: string }[]>([]);
  const [selectedVehicleCode, setSelectedVehicleCode] = useState<string>("");
  const [vehicleChangeMessage, setVehicleChangeMessage] = useState<string>("");
  const [vehicleChangeError, setVehicleChangeError] = useState<string>("");
  const [isUpdatingVehicle, setIsUpdatingVehicle] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [isCancellingWithoutRefund, setIsCancellingWithoutRefund] = useState<boolean>(false);
  const [refundNote, setRefundNote] = useState<string>("");
  const [cancelError, setCancelError] = useState<string>("");
  const [highSeasonDates, setHighSeasonDates] = useState<Set<string>>(new Set());
  const [highSeasonLoading, setHighSeasonLoading] = useState<boolean>(false);
  const [highSeasonError, setHighSeasonError] = useState<string>("");
  const [pickupInput, setPickupInput] = useState<string>("");
  const [returnInput, setReturnInput] = useState<string>("");
  const [scheduleMessage, setScheduleMessage] = useState<string>("");
  const [scheduleError, setScheduleError] = useState<string>("");
  const [isUpdatingSchedule, setIsUpdatingSchedule] = useState<boolean>(false);
  const isReservationCompleted = reservation?.status === "予約完了";

  const paymentDateInfo = (() => {
    if (!reservation?.paymentDate) return { label: "決済日時未登録", isEligible: false };
    const paidAt = new Date(reservation.paymentDate);
    if (Number.isNaN(paidAt.getTime())) {
      return { label: "決済日時の形式が不正です", isEligible: false };
    }

    const deadline = new Date(paidAt);
    deadline.setDate(deadline.getDate() + REFUND_LIMIT_DAYS);
    const now = new Date();
    const isEligible = deadline >= now;

    return {
      label: `返金期限: ${deadline.toLocaleDateString("ja-JP")} (売上日から${REFUND_LIMIT_DAYS}日以内 ${
        isEligible ? ": 返金可能" : ": 期限切れ"
      })`,
      isEligible,
    };
  })();

  useEffect(() => {
    if (!router.isReady || typeof reservationId !== "string") return;

    const controller = new AbortController();

    const fetchReservation = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/reservations/${reservationId}`, {
          signal: controller.signal,
        });

        if (response.status === 404) {
          setReservation(null);
          setError("指定された予約が見つかりませんでした。");
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch reservation: ${response.status}`);
        }

        const data = (await response.json()) as { reservation?: Reservation };
        setReservation(data.reservation ?? null);
        setError(null);
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          const message =
            fetchError instanceof Error ? fetchError.message : "不明なエラーが発生しました";
          setError(message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void fetchReservation();
    return () => controller.abort();
  }, [reservationId, router.isReady]);

  useEffect(() => {
    if (!reservation) return;

    const controller = new AbortController();
    const loadVehicleOptions = async () => {
      try {
        const response = await fetch("/api/reservations", { signal: controller.signal });
        if (!response.ok) throw new Error(`Failed to fetch vehicles: ${response.status}`);

        const data = (await response.json()) as { reservations?: Reservation[] };
        const sameModel = (data.reservations ?? []).filter(
          (item) => item.vehicleModel === reservation.vehicleModel
        );

        const uniqueOptions = sameModel.reduce<{ code: string; plate: string }[]>((acc, curr) => {
          if (!acc.some((option) => option.code === curr.vehicleCode)) {
            acc.push({ code: curr.vehicleCode, plate: curr.vehiclePlate });
          }
          return acc;
        }, []);

        setVehicleOptions(uniqueOptions);
        setSelectedVehicleCode((prev) => prev || reservation.vehicleCode);
      } catch (vehicleError) {
        if (!controller.signal.aborted) {
          console.error(vehicleError);
          setVehicleChangeError("車両一覧の取得に失敗しました");
        }
      }
    };

    void loadVehicleOptions();
    return () => controller.abort();
  }, [reservation]);

  useEffect(() => {
    if (!reservation?.pickupAt || !reservation?.returnAt) {
      setHighSeasonDates(new Set());
      setHighSeasonError("");
      setHighSeasonLoading(false);
      return;
    }

    const pickup = new Date(reservation.pickupAt);
    const returnAt = new Date(reservation.returnAt);

    if (Number.isNaN(pickup.getTime()) || Number.isNaN(returnAt.getTime())) {
      setHighSeasonDates(new Set());
      setHighSeasonError("ハイシーズン日付の算出に失敗しました");
      return;
    }

    const formatMonthKey = (date: Date): string =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    const start = new Date(pickup.getFullYear(), pickup.getMonth(), 1);
    const end = new Date(returnAt.getFullYear(), returnAt.getMonth(), 1);
    const months: string[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      months.push(formatMonthKey(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const controller = new AbortController();

    const loadHighSeason = async () => {
      try {
        setHighSeasonLoading(true);
        setHighSeasonError("");
        const responses = await Promise.all(
          months.map(async (month) => {
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
      } catch (loadError) {
        if (!controller.signal.aborted) {
          console.error("Failed to load high season dates", loadError);
          setHighSeasonDates(new Set());
          setHighSeasonError("ハイシーズン情報の取得に失敗しました");
        }
      } finally {
        if (!controller.signal.aborted) {
          setHighSeasonLoading(false);
        }
      }
    };

    void loadHighSeason();

    return () => controller.abort();
  }, [reservation?.pickupAt, reservation?.returnAt]);

  const formatDatetime = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";

    return parsed.toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDatetimeLocal = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
  };

  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const rentalDays = (() => {
    if (!reservation?.pickupAt || !reservation?.returnAt) return 0;
    const pickupDateTime = new Date(reservation.pickupAt);
    const returnDateTime = new Date(reservation.returnAt);
    const diffMs = returnDateTime.getTime() - pickupDateTime.getTime();
    if (Number.isNaN(diffMs) || diffMs <= 0) return 1;
    const hours = diffMs / (1000 * 60 * 60);
    return Math.max(1, Math.ceil(hours / 24));
  })();

  const highSeasonDateList = (() => {
    if (!reservation?.pickupAt || highSeasonDates.size === 0 || rentalDays === 0) return [];
    const pickup = new Date(reservation.pickupAt);
    if (Number.isNaN(pickup.getTime())) return [];
    const dates: string[] = [];
    for (let day = 0; day < rentalDays; day += 1) {
      const current = new Date(pickup);
      current.setDate(pickup.getDate() + day);
      const key = formatDateKey(current);
      if (highSeasonDates.has(key)) {
        dates.push(key);
      }
    }
    return dates;
  })();

  const rentalDurationMs = useMemo(() => {
    if (!reservation?.pickupAt || !reservation?.returnAt) return null;
    const pickup = new Date(reservation.pickupAt);
    const returnAt = new Date(reservation.returnAt);
    const diff = returnAt.getTime() - pickup.getTime();

    if (!Number.isNaN(diff) && diff > 0) return diff;
    if (reservation.rentalDurationHours && reservation.rentalDurationHours > 0) {
      return reservation.rentalDurationHours * 60 * 60 * 1000;
    }

    return 24 * 60 * 60 * 1000;
  }, [reservation?.pickupAt, reservation?.rentalDurationHours, reservation?.returnAt]);

  const accessoryLabelMap = new Map(ACCESSORY_LABELS.map((option) => [option.key, option.label]));
  const accessorySelections = Object.entries(reservation?.accessories ?? {})
    .map(([key, value]) => {
      const count = Number(value);
      return count > 0
        ? { key, label: accessoryLabelMap.get(key) ?? key, count }
        : null;
    })
    .filter((option): option is { key: string; label: string; count: number } => option !== null);

  const formatPhoneNumber = (phone: string, countryCode?: string) =>
    formatDisplayPhoneNumberWithCountryCode(phone, countryCode) || "-";

  const formatPaymentAmount = (amount?: string) => {
    if (!amount?.trim().length) return "決済金額未登録";
    const normalized = amount.trim().replace(/円$/, "");
    return `${normalized}円`;
  };

  useEffect(() => {
    if (!reservation) return;

    setPickupInput(formatDatetimeLocal(reservation.pickupAt));
    setReturnInput(formatDatetimeLocal(reservation.returnAt));
  }, [reservation]);

  const handlePickupChange = (value: string) => {
    setPickupInput(value);
    setScheduleMessage("");
    setScheduleError("");

    if (!rentalDurationMs) {
      setReturnInput("");
      return;
    }

    const pickupDate = new Date(value);
    if (Number.isNaN(pickupDate.getTime())) {
      setReturnInput("");
      return;
    }

    const nextReturn = new Date(pickupDate.getTime() + rentalDurationMs);
    setReturnInput(formatDatetimeLocal(nextReturn.toISOString()));
  };

  const handleScheduleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reservation || typeof reservationId !== "string" || !rentalDurationMs) return;

    const pickupAt = new Date(pickupInput);
    if (Number.isNaN(pickupAt.getTime())) {
      setScheduleError("貸出日時の形式が正しくありません。");
      return;
    }

    const returnAt = new Date(pickupAt.getTime() + rentalDurationMs);
    const pickupIso = pickupAt.toISOString();
    const returnIso = returnAt.toISOString();

    setScheduleMessage("");
    setScheduleError("");
    setIsUpdatingSchedule(true);

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupAt: pickupIso,
          returnAt: returnIso,
        }),
      });

      const data = (await response.json()) as { reservation?: Reservation; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "貸出日時の更新に失敗しました");
      }

      if (data.reservation) {
        setReservation(data.reservation);
        setScheduleMessage("貸出日時と返却日時を更新しました (貸出期間は変更されません)。");
      }
    } catch (scheduleUpdateError) {
      const message =
        scheduleUpdateError instanceof Error
          ? scheduleUpdateError.message
          : "貸出日時の更新中にエラーが発生しました";
      setScheduleError(message);
    } finally {
      setIsUpdatingSchedule(false);
    }
  };

  const handleVehicleChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reservation || typeof reservationId !== "string") return;
    if (reservation.status === "予約完了") return;

    if (
      selectedVehicleCode !== reservation.vehicleCode &&
      !window.confirm(
        "ここを変更するときに、お客様が予約した車両が変更になりますが、良いですか？"
      )
    ) {
      return;
    }

    setVehicleChangeMessage("");
    setVehicleChangeError("");
    setIsUpdatingVehicle(true);

    try {
      const nextVehicle = vehicleOptions.find((option) => option.code === selectedVehicleCode);
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleCode: selectedVehicleCode,
          vehiclePlate: nextVehicle?.plate ?? reservation.vehiclePlate,
          vehicleModel: reservation.vehicleModel,
          vehicleChangeNotified: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`車両変更に失敗しました (${response.status})`);
      }

      const data = (await response.json()) as { reservation?: Reservation };
      if (data.reservation) {
        setReservation(data.reservation);
        setVehicleChangeMessage("同じ車種から車両を更新し、ユーザーへ通知を設定しました。");
      }
    } catch (updateError) {
      const message =
        updateError instanceof Error ? updateError.message : "車両変更中にエラーが発生しました";
      setVehicleChangeError(message);
    } finally {
      setIsUpdatingVehicle(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservation || typeof reservationId !== "string") return;
    if (reservation.status === "予約完了") return;

    const userNotificationMessage =
      reservation.status === "キャンセル"
        ? ""
        : `予約がキャンセルされました。決済いただいた金額（${formatPaymentAmount(
            reservation.paymentAmount
          )}）は自動で返金されます。`;

    const confirmationLines = [
      "予約をキャンセルし、下記の内容で返金処理を行います。",
      `決済番号 (pay.jp): ${reservation.paymentId || "未登録"}`,
      `決済金額: ${formatPaymentAmount(reservation.paymentAmount)}`,
      paymentDateInfo.label,
      "",
      userNotificationMessage
        ? `ユーザー側ポップアップ想定: ${userNotificationMessage}`
        : "ユーザー向けの案内メッセージも併せて表示されます。",
    ];

    if (!window.confirm(confirmationLines.join("\n"))) {
      return;
    }

    setIsCancelling(true);
    setCancelError("");

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "キャンセル", refundNote: refundNote || "返金設定未入力" }),
      });

      const data = (await response.json()) as { reservation?: Reservation; error?: string };
      if (!response.ok) {
        throw new Error(data.error || `キャンセル処理に失敗しました (${response.status})`);
      }
      if (data.reservation) {
        setReservation(data.reservation);
        if (userNotificationMessage) {
          window.alert(userNotificationMessage);
        }
      }
    } catch (cancelErrorResponse) {
      const message =
        cancelErrorResponse instanceof Error
          ? cancelErrorResponse.message
          : "キャンセル処理でエラーが発生しました";
      setCancelError(message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelReservationWithoutRefund = async () => {
    if (!reservation || typeof reservationId !== "string") return;
    if (reservation.status === "予約完了") return;

    const userNotificationMessage =
      reservation.status === "キャンセル"
        ? ""
        : "予約がキャンセルされました。返金は行われません。";

    const confirmationLines = [
      "予約を返金なしでキャンセルします。",
      `決済番号 (pay.jp): ${reservation.paymentId || "未登録"}`,
      `決済金額: ${formatPaymentAmount(reservation.paymentAmount)}`,
      "",
      userNotificationMessage
        ? `ユーザー側ポップアップ想定: ${userNotificationMessage}`
        : "ユーザー向けの案内メッセージも併せて表示されます。",
    ];

    if (!window.confirm(confirmationLines.join("\n"))) {
      return;
    }

    setIsCancellingWithoutRefund(true);
    setCancelError("");

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "キャンセル",
          refundNote: refundNote || "返金なしでキャンセル",
          skipRefund: true,
        }),
      });

      const data = (await response.json()) as { reservation?: Reservation; error?: string };
      if (!response.ok) {
        throw new Error(data.error || `キャンセル処理に失敗しました (${response.status})`);
      }
      if (data.reservation) {
        setReservation(data.reservation);
        if (userNotificationMessage) {
          window.alert(userNotificationMessage);
        }
      }
    } catch (cancelErrorResponse) {
      const message =
        cancelErrorResponse instanceof Error
          ? cancelErrorResponse.message
          : "キャンセル処理でエラーが発生しました";
      setCancelError(message);
    } finally {
      setIsCancellingWithoutRefund(false);
    }
  };

  return (
    <>
      <Head>
        <title>予約詳細 | 管理ダッシュボード</title>
      </Head>
      <DashboardLayout title="予約詳細" description="予約内容の確認・更新ができます。">
        <section className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <p className={styles.breadcrumb}>
                <Link href="/admin/dashboard/reservations">バイクレンタル一覧</Link>
                <span aria-hidden> / </span>
                <span>{(reservationId as string) ?? "詳細"}</span>
              </p>
              <h2 className={styles.sectionTitle}>予約詳細</h2>
              <p className={styles.sectionDescription}>
                予約内容、車両情報、会員情報を確認できます。
              </p>
            </div>
            <div className={styles.sectionActions}>
              <button className={styles.iconButton} onClick={() => router.back()} type="button">
                一覧に戻る
              </button>
              {typeof reservationId === "string" ? (
                <Link
                  className={`${styles.iconButton} ${styles.iconButtonAccent}`}
                  href={`/rental-contract/${reservationId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  貸渡契約書
                </Link>
              ) : null}
            </div>
          </div>

          {isLoading ? (
            <div className={styles.placeholderCard}>
              <p>予約情報を読み込み中です…</p>
            </div>
          ) : error ? (
            <div className={styles.placeholderCard}>
              <p>{error}</p>
              <Link className={styles.link} href="/admin/dashboard/reservations">
                バイクレンタル一覧に戻る
              </Link>
            </div>
          ) : !reservation ? (
            <div className={styles.placeholderCard}>
              <p>指定された予約が見つかりませんでした。</p>
              <Link className={styles.link} href="/admin/dashboard/reservations">
                バイクレンタル一覧に戻る
              </Link>
            </div>
          ) : (
            <div className={styles.detailStack}>
              <div className={styles.detailPanel}>
                <div className={styles.detailHeader}>
                  <div>
                    <p className={styles.tagline}>予約番号: {reservation.id}</p>
                    <h3 className={styles.detailTitle}>{reservation.vehicleModel}</h3>
                    <p className={styles.sectionDescription}>{reservation.notes}</p>
                  </div>
                  <span className={statusClassName(reservation.status)}>{reservation.status}</span>
                </div>

                <dl className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <dt>店舗</dt>
                    <dd>{reservation.storeName}</dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>貸出日時</dt>
                    <dd>{formatDatetime(reservation.pickupAt)}</dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>返却日時</dt>
                    <dd>{formatDatetime(reservation.returnAt)}</dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>決済金額</dt>
                    <dd>{reservation.paymentAmount}</dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>決済番号 (pay.jp)</dt>
                    <dd className={styles.monospace}>{reservation.paymentId}</dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>決済日時</dt>
                    <dd>{reservation.paymentDate}</dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>予約状態</dt>
                    <dd>
                      <span className={statusClassName(reservation.status)}>{reservation.status}</span>
                    </dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>返金メモ</dt>
                    <dd>{reservation.refundNote || "返金設定は未入力です"}</dd>
                  </div>
                </dl>
              </div>

              <div className={styles.detailPanel}>
                <div className={styles.detailHeader}>
                  <h3 className={styles.detailTitle}>貸出日時の変更</h3>
                </div>
                <form onSubmit={handleScheduleUpdate}>
                  <label className={styles.inputLabel} htmlFor="pickupAt">
                    貸出日時
                  </label>
                  <input
                    id="pickupAt"
                    className={styles.input}
                    type="datetime-local"
                    value={pickupInput}
                    onChange={(event) => handlePickupChange(event.target.value)}
                    required
                  />
                  <label className={styles.inputLabel} htmlFor="returnAt">
                    返却日時 (貸出期間に合わせて自動更新)
                  </label>
                  <input
                    id="returnAt"
                    className={styles.input}
                    type="datetime-local"
                    value={returnInput}
                    readOnly
                  />
                  <p className={styles.mutedText}>
                    貸出期間を変えずに日時をずらすことができます。同じ時間の範囲のみ変更可能です。
                  </p>
                  <div className={`${styles.inlineNotice} ${styles.noticeNeutral}`}>
                    注意事項: 貸出期間が延びる場合は、追加予約の受付、もしくは別途ユーザーの決済が必要になります。
                  </div>
                  <div className={styles.detailActions}>
                    <button
                      className={`${styles.iconButton} ${styles.iconButtonAccent}`}
                      type="submit"
                      disabled={isUpdatingSchedule || isReservationCompleted}
                    >
                      {isUpdatingSchedule ? "更新中..." : "日時を更新"}
                    </button>
                  </div>
                  {scheduleError && (
                    <p className={`${styles.inlineNotice} ${styles.noticeDanger}`}>{scheduleError}</p>
                  )}
                  {scheduleMessage && (
                    <p className={`${styles.inlineNotice} ${styles.noticeSuccess}`}>{scheduleMessage}</p>
                  )}
                </form>
              </div>

              <div className={styles.detailPanel}>
                <div className={styles.detailHeader}>
                  <h3 className={styles.detailTitle}>ハイシーズン・用品オプション</h3>
                </div>
                <dl className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <dt>ハイシーズン</dt>
                    <dd>
                      {highSeasonError
                        ? highSeasonError
                        : highSeasonLoading
                          ? "算出中..."
                          : highSeasonDateList.length > 0
                            ? `該当 (${highSeasonDateList.length}日)`
                            : "対象外"}
                    </dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>ハイシーズン対象日</dt>
                    <dd>
                      {highSeasonError
                        ? "取得に失敗しました"
                        : highSeasonLoading
                          ? "算出中..."
                          : highSeasonDateList.length > 0
                            ? highSeasonDateList
                                .map((date) =>
                                  new Date(`${date}T00:00:00`).toLocaleDateString("ja-JP")
                                )
                                .join(" / ")
                            : "該当なし"}
                    </dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>用品オプション</dt>
                    <dd>
                      {accessorySelections.length === 0 ? (
                        "選択なし"
                      ) : (
                        <ul className={styles.optionList}>
                          {accessorySelections.map((option) => (
                            <li key={option.key}>
                              {option.label} × {option.count}
                            </li>
                          ))}
                        </ul>
                      )}
                    </dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>用品レンタル期間</dt>
                    <dd>
                      {formatDatetime(reservation.pickupAt)} → {formatDatetime(reservation.returnAt)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className={styles.detailPanel}>
                <div className={styles.detailHeader}>
                  <h3 className={styles.detailTitle}>返却アンケート</h3>
                </div>
                <dl className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <dt>総合評価</dt>
                    <dd>
                      {reservation.returnRating && reservation.returnRating > 0
                        ? `${reservation.returnRating} / 5`
                        : "未入力"}
                    </dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>アンケート</dt>
                    <dd>
                      {reservation.returnSurvey ? (
                        <div style={{ whiteSpace: "pre-line" }}>{reservation.returnSurvey}</div>
                      ) : (
                        "未入力"
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className={styles.detailPanel}>
                <div className={styles.detailHeader}>
                  <h3 className={styles.detailTitle}>車両情報</h3>
                </div>
                <dl className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <dt>管理番号</dt>
                    <dd className={styles.monospace}>{reservation.vehicleCode}</dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>ナンバープレート</dt>
                    <dd>
                      <div className={styles.monospace}>{reservation.vehiclePlate}</div>
                      <form className={styles.changeRow} onSubmit={handleVehicleChange}>
                        <label className={styles.srOnly} htmlFor="vehicle-select">
                          同じ車種から車両を選ぶ
                        </label>
                        <select
                          id="vehicle-select"
                          className={styles.selectInput}
                          value={selectedVehicleCode}
                          onChange={(event) => setSelectedVehicleCode(event.target.value)}
                          disabled={isReservationCompleted}
                        >
                          {vehicleOptions.length === 0 ? (
                            <option>候補がありません</option>
                          ) : (
                            vehicleOptions.map((option) => (
                              <option key={option.code} value={option.code}>
                                {option.code} / {option.plate}
                              </option>
                            ))
                          )}
                        </select>
                        <button
                          className={`${styles.detailEditButton} ${styles.detailPrimaryButton}`}
                          type="submit"
                          disabled={
                            isReservationCompleted || isUpdatingVehicle || vehicleOptions.length === 0
                          }
                        >
                          {isUpdatingVehicle ? "変更中..." : "車両を変更"}
                        </button>
                      </form>
                      <p className={styles.mutedText}>同じ車種の車両一覧から選択できます。</p>
                      {vehicleChangeError && (
                        <p className={`${styles.inlineNotice} ${styles.noticeDanger}`}>
                          {vehicleChangeError}
                        </p>
                      )}
                      {vehicleChangeMessage && (
                        <p className={`${styles.inlineNotice} ${styles.noticeSuccess}`}>
                          {vehicleChangeMessage}
                        </p>
                      )}
                    </dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>オプション</dt>
                    <dd>
                      <div>車両補償: {reservation.options.vehicleCoverage}</div>
                      <div>盗難補償: {reservation.options.theftCoverage}</div>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className={styles.detailPanel}>
                <div className={styles.detailHeader}>
                  <h3 className={styles.detailTitle}>会員情報</h3>
                </div>
                <dl className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <dt>会員番号</dt>
                    <dd className={styles.monospace}>{reservation.memberId}</dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>会員名</dt>
                    <dd>{reservation.memberName}</dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>メールアドレス</dt>
                    <dd>{reservation.memberEmail}</dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>電話番号</dt>
                    <dd>
                      {formatPhoneNumber(reservation.memberPhone, reservation.memberCountryCode)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className={styles.detailPanel}>
                <div className={styles.detailHeader}>
                  <h3 className={styles.detailTitle}>クーポン情報</h3>
                </div>
                <dl className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <dt>クーポン・コード</dt>
                    <dd>{reservation.couponCode || "(なし)"}</dd>
                  </div>
                  <div className={styles.detailItem}>
                    <dt>割引額</dt>
                    <dd>{reservation.couponDiscount}</dd>
                  </div>
                </dl>
              </div>

              <div className={styles.detailPanel}>
                <div className={styles.detailHeader}>
                  <h3 className={styles.detailTitle}>予約キャンセル・返金メモ</h3>
                </div>
                <div className={`${styles.inlineNotice} ${styles.noticeNeutral}`}>
                  返金設定は後から行えるようにするため、現時点では返金メモのみを残します。
                  ステータスをキャンセルに変更すると、ユーザー側で最新状態が確認できます。
                  返金ありのキャンセルは決済番号 (pay.jp) と決済金額を参照して自動で返金処理を実行します。
                  {paymentDateInfo.label}
                </div>
                <div className={`${styles.inlineNotice} ${styles.noticeDanger}`}>
                  返金なしでキャンセルすると Pay.jp への返金処理は行われません。必要な場合は手動返金の対応をしてください。
                </div>
                <div className={`${styles.inlineNotice} ${styles.noticeSuccess}`}>
                  ユーザー表示: 予約がキャンセルされました。決済いただいた金額（
                  {formatPaymentAmount(reservation.paymentAmount)}）は自動で返金されます。
                </div>
                <label className={styles.inputLabel} htmlFor="refund-note">
                  返金メモ
                </label>
                <textarea
                  id="refund-note"
                  className={styles.textArea}
                  rows={3}
                  placeholder="返金設定は後から登録予定。現時点での対応メモを残してください。"
                  value={refundNote}
                  onChange={(event) => setRefundNote(event.target.value)}
                />
                <div className={styles.detailActions}>
                  <button
                    className={`${styles.iconButton} ${styles.iconButtonDanger} ${styles.iconButtonDisabled}`}
                    type="button"
                    onClick={handleCancelReservation}
                    disabled
                  >
                    {isCancelling ? "キャンセル処理中..." : "返金ありキャンセル (無効)"}
                  </button>
                  <button
                    className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                    type="button"
                    onClick={handleCancelReservationWithoutRefund}
                    disabled={
                      isCancellingWithoutRefund ||
                      reservation.status === "キャンセル" ||
                      reservation.status === "予約完了"
                    }
                  >
                    {isCancellingWithoutRefund ? "キャンセル処理中..." : "返金なしでキャンセル"}
                  </button>
                  {reservation.status === "キャンセル" && (
                    <span className={`${tableStyles.badge} ${tableStyles.badgeOff}`}>
                      既にキャンセル済み
                    </span>
                  )}
                </div>
                {cancelError && (
                  <p className={`${styles.inlineNotice} ${styles.noticeDanger}`}>{cancelError}</p>
                )}
              </div>
            </div>
          )}
        </section>
      </DashboardLayout>
    </>
  );
}
