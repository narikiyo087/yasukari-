import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import type { Reservation } from "../../../../lib/reservations";
import styles from "../../../../styles/Dashboard.module.css";

type RankedVehicle = {
  label: string;
  model: string;
  code: string;
  count: number;
};

type VehicleRankingState = {
  reservations: Reservation[];
  isLoading: boolean;
  error: boolean;
};

const formatCount = (value: number) => value.toLocaleString();

const isValidReservationForRanking = (reservation: Reservation) => {
  const model = reservation.vehicleModel?.trim();
  const code = reservation.vehicleCode?.trim();
  return Boolean(model && code && reservation.status !== "キャンセル");
};

const buildVehicleLabel = (reservation: Reservation) => {
  const model = reservation.vehicleModel?.trim() || "-";
  const code = reservation.vehicleCode?.trim() || "-";
  return `${model} (${code})`;
};

export default function VehicleAnalyticsPage() {
  const [rankingState, setRankingState] = useState<VehicleRankingState>({
    reservations: [],
    isLoading: true,
    error: false,
  });

  useEffect(() => {
    let isMounted = true;

    const loadReservations = async () => {
      try {
        setRankingState((prev) => ({ ...prev, isLoading: true, error: false }));
        const response = await fetch("/api/reservations");
        if (!response.ok) {
          throw new Error("Failed to fetch reservations");
        }
        const data = (await response.json()) as { reservations?: Reservation[] };
        if (isMounted) {
          setRankingState({
            reservations: data.reservations ?? [],
            isLoading: false,
            error: false,
          });
        }
      } catch (error) {
        console.error("Failed to load vehicle ranking", error);
        if (isMounted) {
          setRankingState({ reservations: [], isLoading: false, error: true });
        }
      }
    };

    loadReservations();
    return () => {
      isMounted = false;
    };
  }, []);

  const ranking = useMemo<RankedVehicle[]>(() => {
    if (rankingState.reservations.length === 0) {
      return [];
    }

    const tally = rankingState.reservations.reduce<Record<string, RankedVehicle>>(
      (acc, reservation) => {
        if (!isValidReservationForRanking(reservation)) {
          return acc;
        }
        const normalizedModel = reservation.vehicleModel.trim();
        const normalizedCode = reservation.vehicleCode.trim();
        const key = `${normalizedModel}-${normalizedCode}`;
        if (!acc[key]) {
          acc[key] = {
            label: buildVehicleLabel(reservation),
            model: normalizedModel,
            code: normalizedCode,
            count: 0,
          };
        }
        acc[key].count += 1;
        return acc;
      },
      {}
    );

    return Object.values(tally)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [rankingState.reservations]);

  return (
    <>
      <Head>
        <title>車両分析 | 管理ダッシュボード</title>
      </Head>
      <DashboardLayout
        title="車両分析"
        description="予約データをもとに車両の人気ランキングを確認できます。"
        showDashboardLink
      >
        <section className={styles.menuSection}>
          <div className={styles.dashboardStatsHeader}>
            <div>
              <p className={styles.dashboardSectionKicker}>Vehicle analytics</p>
              <h2 className={styles.dashboardSectionTitle}>予約車両ランキング</h2>
              <p className={styles.dashboardSectionNote}>
                予約時に選択された車両のランキングを上位5件まで表示します。
              </p>
            </div>
          </div>

          <div className={styles.analyticsGrid}>
            <article className={styles.analyticsCard}>
              <header className={styles.analyticsCardHeader}>
                <div>
                  <p className={styles.dashboardSectionKicker}>ランキング</p>
                  <h3 className={styles.dashboardSectionTitle}>予約数の多い車両</h3>
                  <p className={styles.dashboardSectionNote}>
                    同一車両（車種 + 管理番号）をまとめて集計しています。
                  </p>
                </div>
              </header>
              <div>
                {rankingState.isLoading ? (
                  <p className={styles.chartPlaceholderNote}>読み込み中です…</p>
                ) : rankingState.error ? (
                  <p className={styles.chartPlaceholderNote}>
                    ランキングの取得に失敗しました。
                  </p>
                ) : ranking.length === 0 ? (
                  <p className={styles.chartPlaceholderNote}>
                    表示できる予約データがありません。
                  </p>
                ) : (
                  <div className={styles.statGrid}>
                    {ranking.map((item, index) => (
                      <div key={item.label} className={styles.statCard}>
                        <p className={styles.statLabel}>{`#${index + 1} ${item.label}`}</p>
                        <p className={styles.statValue}>{formatCount(item.count)} 件</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>

            <article className={styles.analyticsCard}>
              <header className={styles.analyticsCardHeader}>
                <div>
                  <p className={styles.dashboardSectionKicker}>次のステップ</p>
                  <h3 className={styles.dashboardSectionTitle}>車両稼働率メモ</h3>
                  <p className={styles.dashboardSectionNote}>
                    稼働率や回転数などの追加指標を配置するためのスペースです。
                  </p>
                </div>
              </header>
              <div className={styles.chartPlaceholder}>
                <p className={styles.chartPlaceholderLabel}>稼働率チャート</p>
                <p className={styles.chartPlaceholderNote}>
                  将来的に稼働率グラフやメンテナンス指標を表示します。
                </p>
              </div>
            </article>
          </div>
        </section>
      </DashboardLayout>
    </>
  );
}
