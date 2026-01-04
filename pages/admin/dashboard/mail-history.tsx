import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import {
  MailHistoryEntry,
  MailHistoryStatus,
  MailHistoryCategory,
} from "../../../lib/mailHistory";
import styles from "../../../styles/Dashboard.module.css";
import tableStyles from "../../../styles/AdminTable.module.css";

type MailHistoryResponse = {
  history: MailHistoryEntry[];
};

const statusLabel = (status: MailHistoryStatus) => {
  switch (status) {
    case "sent":
      return "送信済み";
    case "failed":
      return "失敗";
    case "skipped":
      return "スキップ";
    default:
      return status;
  }
};

const categoryLabel = (category: MailHistoryCategory) => {
  switch (category) {
    case "仮登録":
      return "仮登録";
    case "本登録":
      return "本登録";
    case "予約完了":
      return "予約完了";
    default:
      return category;
  }
};

const statusClass = (status: MailHistoryStatus) => {
  if (status === "sent") return `${tableStyles.badge} ${tableStyles.badgeOn}`;
  if (status === "failed") return `${tableStyles.badge} ${tableStyles.badgeOff}`;
  return `${tableStyles.badge} ${tableStyles.badgeNeutral}`;
};

export default function MailHistoryPage() {
  const [history, setHistory] = useState<MailHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 20;

  useEffect(() => {
    const controller = new AbortController();
    const loadHistory = async () => {
      try {
        const response = await fetch("/api/admin/mail-history", { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`メール履歴の取得に失敗しました (${response.status})`);
        }
        const data = (await response.json()) as MailHistoryResponse;
        setHistory(data.history ?? []);
        setError(null);
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          const message =
            fetchError instanceof Error ? fetchError.message : "メール履歴の取得でエラーが発生しました。";
          setError(message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadHistory();
    return () => controller.abort();
  }, []);

  const totalPages = Math.max(1, Math.ceil(history.length / pageSize));
  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const pagedHistory = history.slice(startIndex, startIndex + pageSize);

  const latestThreeCategories = useMemo(() => {
    return history.reduce<
      Partial<Record<MailHistoryCategory, MailHistoryStatus>>
    >((acc, entry) => {
      if (!acc[entry.category]) {
        acc[entry.category] = entry.status;
      }
      return acc;
    }, {});
  }, [history]);

  return (
    <>
      <Head>
        <title>メール送信履歴 | 管理ダッシュボード</title>
      </Head>
      <DashboardLayout
        title="メール送信履歴"
        description="仮登録・本登録・予約完了メールの送信状況を確認できます。"
      >
        <section className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <p className={styles.breadcrumb}>送信したメールの履歴</p>
              <h2 className={styles.sectionTitle}>履歴一覧</h2>
              <p className={styles.sectionDescription}>
                直近のメール送信結果を確認できます。環境変数が未設定の場合は「スキップ」として記録されます。
              </p>
            </div>
          </div>

          <div className={styles.statGrid}>
            {["仮登録", "本登録", "予約完了"].map((category) => {
              const status =
                latestThreeCategories[category as MailHistoryCategory] ?? ("skipped" as MailHistoryStatus);

              return (
                <div key={category} className={styles.statCard}>
                  <p className={styles.statLabel}>{category}</p>
                  <p className={styles.statValue}>{statusLabel(status)}</p>
                  <p className={styles.statHelper}>最新の送信状態を表示しています。</p>
                </div>
              );
            })}
          </div>

          {isLoading ? (
            <div className={styles.placeholderCard}>
              <p>メール履歴を読み込み中です…</p>
            </div>
          ) : error ? (
            <div className={styles.placeholderCard}>
              <p>{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className={styles.placeholderCard}>
              <p>表示できるメール履歴がまだありません。</p>
            </div>
          ) : (
            <div className={tableStyles.wrapper}>
              <div className={tableStyles.tableWrapper}>
                <table className={`${tableStyles.table} ${tableStyles.dataTable}`}>
                  <thead>
                    <tr>
                      <th>送信日時</th>
                      <th>種別</th>
                      <th>宛先</th>
                      <th>件名</th>
                      <th>ステータス</th>
                      <th>備考</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedHistory.map((entry) => (
                      <tr key={entry.id}>
                        <td>{new Date(entry.createdAt).toLocaleString("ja-JP")}</td>
                        <td>{categoryLabel(entry.category)}</td>
                        <td>{entry.to}</td>
                        <td title={entry.subject}>{entry.subject}</td>
                        <td>
                          <span className={statusClass(entry.status)}>{statusLabel(entry.status)}</span>
                        </td>
                        <td>{entry.errorMessage || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.tableToolbar}>
                <div className={styles.tableToolbarGroup}>
                  <span className={styles.tableSelectionCount}>
                    {history.length === 0
                      ? "0件"
                      : `${startIndex + 1}-${Math.min(startIndex + pageSize, history.length)}件 / 全${history.length}件`}
                  </span>
                </div>
                <div className={styles.tableToolbarGroup}>
                  <button
                    type="button"
                    className={styles.tableToolbarButton}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safeCurrentPage === 1}
                  >
                    前へ
                  </button>
                  <span className={styles.tableSelectionCount}>
                    {safeCurrentPage} / {totalPages}ページ
                  </span>
                  <button
                    type="button"
                    className={styles.tableToolbarButton}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={safeCurrentPage === totalPages}
                  >
                    次へ
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </DashboardLayout>
    </>
  );
}
