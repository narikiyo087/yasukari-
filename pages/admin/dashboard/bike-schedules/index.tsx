import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import tableStyles from "../../../../styles/AdminTable.module.css";
import formStyles from "../../../../styles/AdminForm.module.css";
import styles from "../../../../styles/Dashboard.module.css";
import { Vehicle, BikeModel } from "../../../../lib/dashboard/types";
import { getStoreLabel, STORE_OPTIONS } from "../../../../lib/dashboard/storeOptions";

type ExpiryFilterOption = "all" | "expired" | "warning" | "valid";
type SortKey = "id" | "model" | "store" | "liability" | "inspection";
type SortDirection = "asc" | "desc";

export default function BikeScheduleManagementPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bikeModels, setBikeModels] = useState<BikeModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [keywordFilter, setKeywordFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilterOption>("all");
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const getExpiryStatus = (expiryDate?: string | null) => {
    if (!expiryDate) {
      return null;
    }
    const parsed = new Date(expiryDate);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    const normalizedExpiry = new Date(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate(),
    );

    if (normalizedExpiry < normalizedToday) {
      return "expired";
    }

    const warningStart = new Date(normalizedExpiry);
    warningStart.setMonth(warningStart.getMonth() - 1);
    if (normalizedToday >= warningStart) {
      return "warning";
    }

    return null;
  };

  const filteredVehicles = useMemo(() => {
    const normalizedKeyword = keywordFilter.trim().toLowerCase();

    const matchesExpiryFilter = (vehicle: Vehicle) => {
      if (expiryFilter === "all") {
        return true;
      }

      const liabilityStatus = getExpiryStatus(vehicle.liabilityInsuranceExpiryDate);
      const inspectionStatus = getExpiryStatus(vehicle.inspectionExpiryDate);

      if (expiryFilter === "valid") {
        return liabilityStatus === null && inspectionStatus === null;
      }

      return liabilityStatus === expiryFilter || inspectionStatus === expiryFilter;
    };

    const matchesKeyword = (vehicle: Vehicle) => {
      if (!normalizedKeyword) {
        return true;
      }

      const modelName =
        bikeModels.find((model) => model.modelId === vehicle.modelId)?.modelName ?? "";
      return (
        vehicle.managementNumber.toLowerCase().includes(normalizedKeyword) ||
        modelName.toLowerCase().includes(normalizedKeyword)
      );
    };

    const filtered = vehicles.filter((vehicle) => {
      const storeMatch = storeFilter === "all" || vehicle.storeId === storeFilter;
      return storeMatch && matchesExpiryFilter(vehicle) && matchesKeyword(vehicle);
    });

    const getDateValue = (value?: string | null) => {
      if (!value) {
        return null;
      }
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
    };

    const sorted = [...filtered].sort((a, b) => {
      let compareValue = 0;

      switch (sortKey) {
        case "model": {
          const modelA =
            bikeModels.find((model) => model.modelId === a.modelId)?.modelName ?? "";
          const modelB =
            bikeModels.find((model) => model.modelId === b.modelId)?.modelName ?? "";
          compareValue = modelA.localeCompare(modelB, "ja");
          break;
        }
        case "store": {
          compareValue = getStoreLabel(a.storeId).localeCompare(
            getStoreLabel(b.storeId),
            "ja"
          );
          break;
        }
        case "liability": {
          const liabilityA = getDateValue(a.liabilityInsuranceExpiryDate) ?? 0;
          const liabilityB = getDateValue(b.liabilityInsuranceExpiryDate) ?? 0;
          compareValue = liabilityA - liabilityB;
          break;
        }
        case "inspection": {
          const inspectionA = getDateValue(a.inspectionExpiryDate) ?? 0;
          const inspectionB = getDateValue(b.inspectionExpiryDate) ?? 0;
          compareValue = inspectionA - inspectionB;
          break;
        }
        case "id":
        default: {
          compareValue = a.managementNumber.localeCompare(b.managementNumber, "ja");
          break;
        }
      }

      return sortDirection === "asc" ? compareValue : -compareValue;
    });

    return sorted;
  }, [bikeModels, expiryFilter, keywordFilter, sortDirection, sortKey, storeFilter, vehicles]);

  const handleAutoAvailability = async (vehicle: Vehicle) => {
    setProcessingId(vehicle.managementNumber);
    setActionMessage(null);
    setActionError(null);

    try {
      const response = await fetch("/api/vehicles/auto-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managementNumber: vehicle.managementNumber }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message ?? "自動設定に失敗しました。");
      }

      const updatedVehicle = (await response.json()) as Vehicle;
      setVehicles((prev) =>
        prev.map((item) =>
          item.managementNumber === updatedVehicle.managementNumber ? updatedVehicle : item
        )
      );
      setActionMessage(`${vehicle.managementNumber}のレンタル可能日を自動設定しました。`);
    } catch (error) {
      console.error("Failed to auto set rental availability", error);
      setActionError(
        error instanceof Error
          ? error.message
          : "自動設定の実行中にエラーが発生しました。"
      );
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
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
        setLoadError("車両一覧の取得に失敗しました。しばらく待ってから再度お試しください。");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchVehicles();
  }, []);

  return (
    <>
      <Head>
        <title>バイクスケジュール管理</title>
      </Head>
      <DashboardLayout
        title="バイクスケジュール管理"
        description="車両ごとのスケジュールをカレンダーから直接更新できます。"
        showDashboardLink
      >
        <section className={styles.menuSection}>
          <div className={styles.menuGroups}>
            <div className={styles.menuGroup}>
              {loadError && <p className={styles.menuGroupNote}>{loadError}</p>}
              {actionError && (
                <p className={styles.menuGroupNote} style={{ color: "#b91c1c" }}>
                  {actionError}
                </p>
              )}
              {actionMessage && <p className={styles.menuGroupNote}>{actionMessage}</p>}
              <div className={styles.menuGroupTitle}>車両別スケジュール</div>
              <p className={styles.menuGroupNote}>
                各車両のスケジュールを詳細カレンダーで管理します。ボタンを押して日別の
                ステータスとメモを設定してください。
              </p>
              <div className={formStyles.grid} style={{ marginBottom: "1rem" }}>
                <div className={formStyles.field}>
                  <label htmlFor="vehicle-filter-keyword">車両検索</label>
                  <input
                    id="vehicle-filter-keyword"
                    type="text"
                    placeholder="ID または車両名で検索"
                    value={keywordFilter}
                    onChange={(event) => setKeywordFilter(event.target.value)}
                  />
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="vehicle-filter-store">店舗フィルター</label>
                  <select
                    id="vehicle-filter-store"
                    value={storeFilter}
                    onChange={(event) => setStoreFilter(event.target.value)}
                  >
                    <option value="all">全店舗</option>
                    {STORE_OPTIONS.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="vehicle-filter-expiry">期限ステータス</label>
                  <select
                    id="vehicle-filter-expiry"
                    value={expiryFilter}
                    onChange={(event) =>
                      setExpiryFilter(event.target.value as ExpiryFilterOption)
                    }
                  >
                    <option value="all">すべて</option>
                    <option value="expired">期限切れ</option>
                    <option value="warning">1か月以内</option>
                    <option value="valid">期限内</option>
                  </select>
                </div>
                <div className={formStyles.field}>
                  <label htmlFor="vehicle-sort-key">並び替え</label>
                  <div className={formStyles.inlineControls}>
                    <select
                      id="vehicle-sort-key"
                      value={sortKey}
                      onChange={(event) => setSortKey(event.target.value as SortKey)}
                    >
                      <option value="id">ID</option>
                      <option value="model">車両名</option>
                      <option value="store">店舗</option>
                      <option value="liability">自賠責満了日</option>
                      <option value="inspection">車検満了日</option>
                    </select>
                    <select
                      aria-label="並び替え方向"
                      value={sortDirection}
                      onChange={(event) =>
                        setSortDirection(event.target.value as SortDirection)
                      }
                    >
                      <option value="asc">昇順</option>
                      <option value="desc">降順</option>
                    </select>
                  </div>
                </div>
              </div>
              <p className={styles.menuGroupNote}>
                表示中: {filteredVehicles.length}件 / 全{vehicles.length}件
              </p>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>車両名</th>
                    <th>店舗</th>
                    <th>自賠責満了日</th>
                    <th>車検満了日</th>
                    <th className={tableStyles.centerCell}>レンタル可自動設定</th>
                    <th className={tableStyles.centerCell}>スケジュール設定</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle) => {
                    const modelName =
                      bikeModels.find((model) => model.modelId === vehicle.modelId)?.modelName ??
                      "-";
                    const schedulePath = `/admin/dashboard/bike-schedules/${vehicle.managementNumber}`;
                    const liabilityStatus = getExpiryStatus(
                      vehicle.liabilityInsuranceExpiryDate,
                    );
                    const inspectionStatus = getExpiryStatus(vehicle.inspectionExpiryDate);
                    return (
                      <tr
                        key={vehicle.managementNumber}
                        tabIndex={0}
                        className={tableStyles.clickableRow}
                        onClick={() => {
                          void router.push(schedulePath);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            void router.push(schedulePath);
                          }
                        }}
                      >
                        <td>{vehicle.managementNumber}</td>
                        <td>{modelName}</td>
                        <td>{getStoreLabel(vehicle.storeId)}</td>
                        <td
                          className={
                            liabilityStatus === "expired"
                              ? tableStyles.expiredCell
                              : liabilityStatus === "warning"
                                ? tableStyles.warningCell
                                : undefined
                          }
                        >
                          {vehicle.liabilityInsuranceExpiryDate ?? "-"}
                        </td>
                        <td
                          className={
                            inspectionStatus === "expired"
                              ? tableStyles.expiredCell
                              : inspectionStatus === "warning"
                                ? tableStyles.warningCell
                                : undefined
                          }
                        >
                          {vehicle.inspectionExpiryDate ?? "-"}
                        </td>
                        <td className={tableStyles.centerCell}>
                          <button
                            type="button"
                            className={formStyles.secondaryButton}
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleAutoAvailability(vehicle);
                            }}
                            onKeyDown={(event) => event.stopPropagation()}
                            disabled={
                              processingId === vehicle.managementNumber ||
                              vehicle.autoAvailabilityInitialized ||
                              (!vehicle.liabilityInsuranceExpiryDate &&
                                !vehicle.inspectionExpiryDate)
                            }
                          >
                            {vehicle.autoAvailabilityInitialized
                              ? "設定済み"
                              : processingId === vehicle.managementNumber
                                ? "設定中..."
                                : "レンタル可自動設定"}
                          </button>
                        </td>
                        <td className={tableStyles.centerCell}>
                          <Link
                            href={schedulePath}
                            className={formStyles.submitButton}
                          >
                            詳細を開く
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className={styles.menuGroupNote}>
                自賠責満了日・車検満了日のセルは、満了日まで1か月以内で黄色、満了日が過ぎている場合は薄い赤色で表示されます。
              </p>
              {isLoading && <p className={styles.menuGroupNote}>読み込み中です...</p>}
            </div>
          </div>
        </section>
      </DashboardLayout>
    </>
  );
}
