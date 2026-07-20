import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { KeyboxLog } from "../../../lib/keyboxLogs";
import styles from "../../../styles/Dashboard.module.css";
import tableStyles from "../../../styles/AdminTable.module.css";

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
};

const statusBadge = (success: boolean) =>
  success
    ? `${tableStyles.badge} ${tableStyles.badgeOn}`
    : `${tableStyles.badge} ${tableStyles.badgeOff}`;

const resolveFailureReason = (log: KeyboxLog) => {
  if (log.success) return null;
  if (log.message) return log.message;
  if (typeof log.responseBody === "string" && log.responseBody.trim()) return log.responseBody;
  if (log.responseBody && typeof log.responseBody === "object") {
    const response = log.responseBody as Record<string, unknown>;
    const candidate =
      response.message ?? response.error ?? response.detail ?? response.reason ?? response.title ?? response.status;
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  return null;
};

export default function KeyboxLogsPage() {
  const [logs, setLogs] = useState<KeyboxLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromFallback, setFromFallback] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const loadLogs = async (signal?: AbortSignal) => {
    const response = await fetch("/api/admin/keybox-logs", { signal });
    if (!response.ok) {
      throw new Error(`ログの取得に失敗しました (${response.status})`);
    }
    const data = (await response.json()) as {
      logs?: KeyboxLog[];
      fromFallback?: boolean;
      errorMessage?: string;
    };

    setLogs(data.logs ?? []);
    setFromFallback(Boolean(data.fromFallback));
    setServerMessage(data.errorMessage ?? null);
    setError(null);
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchLogs = async () => {
      try {
        await loadLogs(controller.signal);
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          const message =
            fetchError instanceof Error ? fetchError.message : "ログの取得中にエラーが発生しました。";
          setError(message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void fetchLogs();
    return () => controller.abort();
  }, []);

  const latestStatus = useMemo(() => {
    if (logs.length === 0) return "N/A";
    return logs[0].success ? "成功" : "失敗";
  }, [logs]);

  const successRate = useMemo(() => {
    if (logs.length === 0) return "-";
    const successCount = logs.filter((log) => log.success).length;
    return `${successCount} / ${logs.length}`;
  }, [logs]);

  return (
    <>
      <Head>
        <title>KEYBOX実行ログ | 管理ダッシュボード</title>
      </Head>
      <DashboardLayout
        title="KEYBOX実行ログ"
        description="無人店舗の鍵発行実行結果を確認できます。直近のPIN発行リクエストやレスポンスを一覧表示します。"
      >
        <section className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <p className={styles.breadcrumb}>無人店舗鍵の自動発行</p>
              <h2 className={styles.sectionTitle}>実行サマリー</h2>
              <p className={styles.sectionDescription}>
                予約完了時に三ノ輪店向けのPIN発行を実行します。発行結果や失敗理由をここで確認できます。
              </p>
            </div>
          </div>

          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>最新の実行</p>
              <p className={styles.statValue}>{latestStatus}</p>
              <p className={styles.statHelper}>もっとも新しいログの結果</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>成功 / 全体</p>
              <p className={styles.statValue}>{successRate}</p>
              <p className={styles.statHelper}>表示中ログの成功件数</p>
            </div>
          </div>

          {fromFallback || serverMessage ? (
            <div className={styles.placeholderCard}>
              <p className="font-semibold text-yellow-800">ログの取得に問題が発生したためキャッシュを表示中です。</p>
              {serverMessage ? <p className="text-sm text-slate-700">{serverMessage}</p> : null}
            </div>
          ) : null}

          {isLoading ? (
            <div className={styles.placeholderCard}>
              <p>実行ログを読み込み中です…</p>
            </div>
          ) : error ? (
            <div className={styles.placeholderCard}>
              <p>{error}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className={styles.placeholderCard}>
              <p>表示できるログがまだありません。</p>
            </div>
          ) : (
            <div className={tableStyles.wrapper}>
              <div className={tableStyles.tableWrapper}>
                <table className={`${tableStyles.table} ${tableStyles.dataTable}`}>
                  <thead>
                    <tr>
                      <th>実行日時</th>
                      <th>予約ID / 店舗</th>
                      <th>PIN情報</th>
                      <th>有効時間</th>
                      <th>QR</th>
                      <th>ステータス</th>
                      <th>備考</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const failureReason = resolveFailureReason(log);
                      return (
                        <tr key={log.logId}>
                          <td>{formatDateTime(log.createdAt)}</td>
                          <td>
                            {log.reservationId ? (
                              <Link
                                href={`/admin/dashboard/reservations/${log.reservationId}`}
                                className={tableStyles.link}
                              >
                                {log.reservationId}
                              </Link>
                            ) : (
                              "-"
                            )}
                            <div className="text-xs text-slate-600">{log.storeName || "-"}</div>
                          </td>
                          <td>
                            <div className="text-sm font-semibold">PIN: {log.pinCode || "-"}</div>
                            <div className="text-xs text-slate-600">pinId: {log.pinId || "-"}</div>
                            <div className="text-xs text-slate-600">unit: {log.unitId || "-"}</div>
                          </td>
                          <td>
                            <div className="text-xs">{formatDateTime(log.windowStart)} 〜</div>
                            <div className="text-xs">{formatDateTime(log.windowEnd)}</div>
                            <div className="text-xs text-slate-600">署名方式: {log.signUsed || "-"}</div>
                          </td>
                          <td>
                            {log.qrImageUrl ? (
                              <img
                                src={log.qrImageUrl}
                                alt="keybox qr"
                                className="h-16 w-16 rounded border border-slate-200 object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-xs text-slate-500">-</span>
                            )}
                          </td>
                          <td>
                            <span className={statusBadge(log.success)}>{log.success ? "成功" : "失敗"}</span>
                            {failureReason ? (
                              <div className="mt-1 text-xs text-slate-600">理由: {failureReason}</div>
                            ) : null}
                          </td>
                          <td>
                            <div className="text-xs text-slate-800">{log.message || "-"}</div>
                            {log.responseBody ? (
                              <details className="mt-1 text-xs">
                                <summary className="cursor-pointer text-slate-600">レスポンス詳細</summary>
                                <pre className="whitespace-pre-wrap break-words bg-slate-50 p-2 text-slate-800">
                                  {JSON.stringify(log.responseBody, null, 2)}
                                </pre>
                              </details>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </DashboardLayout>
    </>
  );
}
