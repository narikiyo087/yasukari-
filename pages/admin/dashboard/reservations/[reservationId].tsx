import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useState } from "react";

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
  const [refundNote, setRefundNote] = useState<string>("");
  const [cancelError, setCancelError] = useState<string>("");
  const [highSeasonDates, setHighSeasonDates] = useState<Set<string>>(new Set());
  const [highSeasonLoading, setHighSeasonLoading] = useState<boolean>(false);
  const [highSeasonError, setHighSeasonError] = useState<string>("");
  const isReservationCompleted = reservation?.status === "予約完了";

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

    setIsCancelling(true);
    setCancelError("");

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "キャンセル", refundNote: refundNote || "返金設定未入力" }),
      });

      if (!response.ok) {
        throw new Error(`キャンセル処理に失敗しました (${response.status})`);
      }

      const data = (await response.json()) as { reservation?: Reservation };
      if (data.reservation) {
        setReservation(data.reservation);
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
                    className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                    type="button"
                    onClick={handleCancelReservation}
                    disabled={
                      isCancelling ||
                      reservation.status === "キャンセル" ||
                      reservation.status === "予約完了"
                    }
                  >
                    {isCancelling ? "キャンセル処理中..." : "予約をキャンセル"}
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
