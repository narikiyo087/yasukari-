import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
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

export default function ReservationListPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortState, setSortState] = useState<{
    key:
      | "storeName"
      | "status"
      | "vehicleModel"
      | "vehicleCode"
      | "pickupAt"
      | "returnAt"
      | "paymentDate"
      | "memberName"
      | "memberEmail";
    direction: "asc" | "desc";
  }>({
    key: "paymentDate",
    direction: "desc",
  });

  useEffect(() => {
    const controller = new AbortController();

    const fetchReservations = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/reservations", { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to fetch reservations: ${response.status}`);
        }

        const data = (await response.json()) as { reservations?: Reservation[] };
        setReservations(data.reservations ?? []);
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

    void fetchReservations();
    return () => controller.abort();
  }, []);

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

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    reservationId: string
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      void router.push(`/admin/dashboard/reservations/${reservationId}`);
    }
  };

  const statusOptions = useMemo(() => {
    const statuses = new Set<string>();
    reservations.forEach((reservation) => {
      if (reservation.status) {
        statuses.add(reservation.status);
      }
    });
    return Array.from(statuses).sort((a, b) => a.localeCompare(b, "ja"));
  }, [reservations]);

  const filteredReservations = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    const filtered = reservations.filter((reservation) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : reservation.status === statusFilter;

      const matchesTerm = normalizedTerm
        ? [
            reservation.storeName,
            reservation.status,
            reservation.vehicleModel,
            reservation.vehicleCode,
            reservation.memberName,
            reservation.memberEmail,
          ].some((value) => value?.toLowerCase().includes(normalizedTerm))
        : true;

      return matchesStatus && matchesTerm;
    });

    const directionMultiplier = sortState.direction === "asc" ? 1 : -1;

    return [...filtered].sort((a, b) => {
      const getValue = (reservation: Reservation): string | number => {
        switch (sortState.key) {
          case "storeName":
            return reservation.storeName ?? "";
          case "status":
            return reservation.status ?? "";
          case "vehicleModel":
            return reservation.vehicleModel ?? "";
          case "vehicleCode":
            return reservation.vehicleCode ?? "";
          case "pickupAt":
            return new Date(reservation.pickupAt).getTime() || 0;
          case "returnAt":
            return new Date(reservation.returnAt).getTime() || 0;
          case "paymentDate":
            return new Date(reservation.paymentDate).getTime() || 0;
          case "memberName":
            return reservation.memberName ?? "";
          case "memberEmail":
            return reservation.memberEmail ?? "";
          default:
            return "";
        }
      };

      const aValue = getValue(a);
      const bValue = getValue(b);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * directionMultiplier;
      }

      return String(aValue).localeCompare(String(bValue), "ja") * directionMultiplier;
    });
  }, [reservations, searchTerm, sortState.direction, sortState.key, statusFilter]);

  const handleSort = (key: typeof sortState.key) => {
    setSortState((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  return (
    <>
      <Head>
        <title>バイクレンタル一覧 | 管理ダッシュボード</title>
      </Head>
      <DashboardLayout
        title="レンタル予約管理"
        description="予約内容と車両の紐付けを確認・更新できます。"
      >
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>バイクレンタル一覧</h2>
            <p className={styles.sectionDescription}>
              店舗別の予約状況と車両割当を確認できます。行をクリックすると詳細が開きます。
            </p>
          </div>

          {isLoading ? (
            <div className={styles.placeholderCard}>
              <p>予約データを読み込み中です…</p>
            </div>
          ) : error ? (
            <div className={styles.placeholderCard}>
              <p>予約データの取得に失敗しました。</p>
              <p className={styles.sectionDescription}>{error}</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className={styles.placeholderCard}>
              <p>まだ予約データが登録されていません。</p>
              <p className={styles.sectionDescription}>
                DynamoDB の yoyakuKanri テーブルに登録された最新のデータがここに表示されます。
              </p>
            </div>
          ) : (
            <>
              <div className={styles.tableToolbar}>
                <div className={styles.tableToolbarGroup}>
                  <input
                    type="search"
                    className={styles.tableSearchInput}
                    placeholder="店舗・予約状態・車種・管理番号・会員情報で検索"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    aria-label="予約一覧を検索"
                  />
                </div>
                <div className={styles.tableToolbarGroup}>
                  <label className={tableStyles.selectionLabel}>
                    予約状態:
                    <select
                      className={styles.tableSelect}
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      aria-label="予約状態で絞り込む"
                    >
                      <option value="ALL">すべて</option>
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className={styles.tableToolbarGroup}>
                  <span className={styles.tableSelectionCount}>
                    該当: {filteredReservations.length}件
                  </span>
                </div>
              </div>
            <div className={`${tableStyles.wrapper} ${tableStyles.tableWrapper}`}>
              <table className={`${tableStyles.table} ${tableStyles.dataTable}`}>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      aria-sort={
                        sortState.key === "storeName"
                          ? sortState.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className={tableStyles.sortableHeaderButton}
                        onClick={() => handleSort("storeName")}
                      >
                        <span>店舗</span>
                        <span
                          aria-hidden
                          className={`${tableStyles.sortIcon} ${
                            sortState.key === "storeName"
                              ? sortState.direction === "asc"
                                ? tableStyles.sortIconAsc
                                : tableStyles.sortIconDesc
                              : ""
                          }`}
                        />
                        <span className={tableStyles.visuallyHidden}>
                          {sortState.key === "storeName"
                            ? sortState.direction === "asc"
                              ? "昇順に並び替え"
                              : "降順に並び替え"
                            : "クリックして並び替え"}
                        </span>
                      </button>
                    </th>
                    <th
                      scope="col"
                      aria-sort={
                        sortState.key === "status"
                          ? sortState.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className={tableStyles.sortableHeaderButton}
                        onClick={() => handleSort("status")}
                      >
                        <span>予約状態</span>
                        <span
                          aria-hidden
                          className={`${tableStyles.sortIcon} ${
                            sortState.key === "status"
                              ? sortState.direction === "asc"
                                ? tableStyles.sortIconAsc
                                : tableStyles.sortIconDesc
                              : ""
                          }`}
                        />
                        <span className={tableStyles.visuallyHidden}>
                          {sortState.key === "status"
                            ? sortState.direction === "asc"
                              ? "昇順に並び替え"
                              : "降順に並び替え"
                            : "クリックして並び替え"}
                        </span>
                      </button>
                    </th>
                    <th
                      scope="col"
                      aria-sort={
                        sortState.key === "vehicleModel"
                          ? sortState.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className={tableStyles.sortableHeaderButton}
                        onClick={() => handleSort("vehicleModel")}
                      >
                        <span>車種</span>
                        <span
                          aria-hidden
                          className={`${tableStyles.sortIcon} ${
                            sortState.key === "vehicleModel"
                              ? sortState.direction === "asc"
                                ? tableStyles.sortIconAsc
                                : tableStyles.sortIconDesc
                              : ""
                          }`}
                        />
                        <span className={tableStyles.visuallyHidden}>
                          {sortState.key === "vehicleModel"
                            ? sortState.direction === "asc"
                              ? "昇順に並び替え"
                              : "降順に並び替え"
                            : "クリックして並び替え"}
                        </span>
                      </button>
                    </th>
                    <th
                      scope="col"
                      aria-sort={
                        sortState.key === "vehicleCode"
                          ? sortState.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className={tableStyles.sortableHeaderButton}
                        onClick={() => handleSort("vehicleCode")}
                      >
                        <span>車両管理番号</span>
                        <span
                          aria-hidden
                          className={`${tableStyles.sortIcon} ${
                            sortState.key === "vehicleCode"
                              ? sortState.direction === "asc"
                                ? tableStyles.sortIconAsc
                                : tableStyles.sortIconDesc
                              : ""
                          }`}
                        />
                        <span className={tableStyles.visuallyHidden}>
                          {sortState.key === "vehicleCode"
                            ? sortState.direction === "asc"
                              ? "昇順に並び替え"
                              : "降順に並び替え"
                            : "クリックして並び替え"}
                        </span>
                      </button>
                    </th>
                    <th
                      scope="col"
                      aria-sort={
                        sortState.key === "pickupAt"
                          ? sortState.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className={tableStyles.sortableHeaderButton}
                        onClick={() => handleSort("pickupAt")}
                      >
                        <span>貸出日時</span>
                        <span
                          aria-hidden
                          className={`${tableStyles.sortIcon} ${
                            sortState.key === "pickupAt"
                              ? sortState.direction === "asc"
                                ? tableStyles.sortIconAsc
                                : tableStyles.sortIconDesc
                              : ""
                          }`}
                        />
                        <span className={tableStyles.visuallyHidden}>
                          {sortState.key === "pickupAt"
                            ? sortState.direction === "asc"
                              ? "昇順に並び替え"
                              : "降順に並び替え"
                            : "クリックして並び替え"}
                        </span>
                      </button>
                    </th>
                    <th
                      scope="col"
                      aria-sort={
                        sortState.key === "returnAt"
                          ? sortState.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className={tableStyles.sortableHeaderButton}
                        onClick={() => handleSort("returnAt")}
                      >
                        <span>返却日時</span>
                        <span
                          aria-hidden
                          className={`${tableStyles.sortIcon} ${
                            sortState.key === "returnAt"
                              ? sortState.direction === "asc"
                                ? tableStyles.sortIconAsc
                                : tableStyles.sortIconDesc
                              : ""
                          }`}
                        />
                        <span className={tableStyles.visuallyHidden}>
                          {sortState.key === "returnAt"
                            ? sortState.direction === "asc"
                              ? "昇順に並び替え"
                              : "降順に並び替え"
                            : "クリックして並び替え"}
                        </span>
                      </button>
                    </th>
                    <th
                      scope="col"
                      aria-sort={
                        sortState.key === "paymentDate"
                          ? sortState.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className={tableStyles.sortableHeaderButton}
                        onClick={() => handleSort("paymentDate")}
                      >
                        <span>決済日時</span>
                        <span
                          aria-hidden
                          className={`${tableStyles.sortIcon} ${
                            sortState.key === "paymentDate"
                              ? sortState.direction === "asc"
                                ? tableStyles.sortIconAsc
                                : tableStyles.sortIconDesc
                              : ""
                          }`}
                        />
                        <span className={tableStyles.visuallyHidden}>
                          {sortState.key === "paymentDate"
                            ? sortState.direction === "asc"
                              ? "昇順に並び替え"
                              : "降順に並び替え"
                            : "クリックして並び替え"}
                        </span>
                      </button>
                    </th>
                    <th
                      scope="col"
                      aria-sort={
                        sortState.key === "memberName"
                          ? sortState.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className={tableStyles.sortableHeaderButton}
                        onClick={() => handleSort("memberName")}
                      >
                        <span>会員名</span>
                        <span
                          aria-hidden
                          className={`${tableStyles.sortIcon} ${
                            sortState.key === "memberName"
                              ? sortState.direction === "asc"
                                ? tableStyles.sortIconAsc
                                : tableStyles.sortIconDesc
                              : ""
                          }`}
                        />
                        <span className={tableStyles.visuallyHidden}>
                          {sortState.key === "memberName"
                            ? sortState.direction === "asc"
                              ? "昇順に並び替え"
                              : "降順に並び替え"
                            : "クリックして並び替え"}
                        </span>
                      </button>
                    </th>
                    <th
                      scope="col"
                      aria-sort={
                        sortState.key === "memberEmail"
                          ? sortState.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className={tableStyles.sortableHeaderButton}
                        onClick={() => handleSort("memberEmail")}
                      >
                        <span>メールアドレス</span>
                        <span
                          aria-hidden
                          className={`${tableStyles.sortIcon} ${
                            sortState.key === "memberEmail"
                              ? sortState.direction === "asc"
                                ? tableStyles.sortIconAsc
                                : tableStyles.sortIconDesc
                              : ""
                          }`}
                        />
                        <span className={tableStyles.visuallyHidden}>
                          {sortState.key === "memberEmail"
                            ? sortState.direction === "asc"
                              ? "昇順に並び替え"
                              : "降順に並び替え"
                            : "クリックして並び替え"}
                        </span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan={9}>該当する予約が見つかりませんでした。</td>
                    </tr>
                  ) : (
                    filteredReservations.map((reservation) => (
                      <tr
                        key={reservation.id}
                        className={tableStyles.clickableRow}
                        onClick={() =>
                          void router.push(`/admin/dashboard/reservations/${reservation.id}`)
                        }
                        onKeyDown={(event) => handleRowKeyDown(event, reservation.id)}
                        tabIndex={0}
                        aria-label={`${reservation.id} の詳細を開く`}
                      >
                        <td>{reservation.storeName}</td>
                        <td>
                          <span className={statusClassName(reservation.status)}>
                            {reservation.status}
                          </span>
                        </td>
                        <td>{reservation.vehicleModel}</td>
                        <td className={tableStyles.monospace}>{reservation.vehicleCode}</td>
                        <td>{formatDatetime(reservation.pickupAt)}</td>
                        <td>{formatDatetime(reservation.returnAt)}</td>
                        <td>{formatDatetime(reservation.paymentDate)}</td>
                        <td>{reservation.memberName}</td>
                        <td>{reservation.memberEmail}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            </>
          )}
        </section>
      </DashboardLayout>
    </>
  );
}
