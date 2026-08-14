import Head from "next/head";
import { useCallback, useEffect, useState } from "react";

import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import formStyles from "../../../styles/AdminForm.module.css";

type ReminderTarget = {
  reservationId: string;
  storeName: string;
  vehicleModel: string;
  pickupAt: string;
  memberName: string;
  memberEmail: string;
};

type ReminderSendResult = ReminderTarget & {
  status: "sent" | "skipped" | "failed" | "already_sent";
  detail?: string;
};

type TargetsResponse = {
  targetDate: string;
  subjectSample: string;
  targets: ReminderTarget[];
};

type SendResponse = {
  message: string;
  results: ReminderSendResult[];
};

const STATUS_LABELS: Record<ReminderSendResult["status"], string> = {
  sent: "送信済み",
  skipped: "スキップ",
  failed: "失敗",
  already_sent: "送信済み（重複）",
};

const formatPickup = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
};

export default function RentalRemindersPage() {
  const [targetDate, setTargetDate] = useState("");
  const [targets, setTargets] = useState<ReminderTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [results, setResults] = useState<ReminderSendResult[]>([]);

  const loadTargets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/rental-reminders");
      if (!response.ok) {
        throw new Error("対象予約の取得に失敗しました。");
      }
      const data = (await response.json()) as TargetsResponse;
      setTargetDate(data.targetDate);
      setTargets(data.targets);
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError instanceof Error ? fetchError.message : "対象予約の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTargets();
  }, [loadTargets]);

  const handleSend = async () => {
    setSending(true);
    setError(null);
    setNotice(null);
    setResults([]);

    try {
      const response = await fetch("/api/admin/rental-reminders", { method: "POST" });
      const payload = (await response.json()) as SendResponse | { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "前日リマインドの送信に失敗しました。");
      }

      const data = payload as SendResponse;
      setNotice(data.message);
      setResults(data.results);
      setConfirming(false);
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error ? submitError.message : "前日リマインドの送信に失敗しました。"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Head>
        <title>レンタル前日リマインド | 管理ダッシュボード</title>
      </Head>
      <DashboardLayout
        title="レンタル前日リマインド"
        description="明日開始する予約に「明日はレンタル開始日です」のリマインドメールとサイト内通知を送ります。送信済みの予約は自動でスキップされます。"
      >
        <div className={formStyles.cardStack}>
          <div className={formStyles.card}>
            <div className={formStyles.header}>
              <h2 className={formStyles.title}>
                送信対象（{targetDate ? `${targetDate} 開始分` : "読み込み中"}）
              </h2>
              <p className={formStyles.description}>
                件名「【ヤスカリ】明日はレンタル開始日です」で、各予約の店舗・車両・貸出日時を記載したメールを送信します。
              </p>
            </div>

            {error && <div className={formStyles.error}>{error}</div>}
            {notice && <div className={formStyles.success}>{notice}</div>}

            <div className={formStyles.body}>
              {loading ? (
                <p className={formStyles.hint}>対象予約を読み込み中です…</p>
              ) : targets.length === 0 ? (
                <p className={formStyles.hint}>明日開始の有効な予約はありません。</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                    <thead>
                      <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                        <th style={{ padding: "0.5rem" }}>予約番号</th>
                        <th style={{ padding: "0.5rem" }}>店舗</th>
                        <th style={{ padding: "0.5rem" }}>車両</th>
                        <th style={{ padding: "0.5rem" }}>貸出日時</th>
                        <th style={{ padding: "0.5rem" }}>会員名</th>
                        <th style={{ padding: "0.5rem" }}>宛先</th>
                        {results.length > 0 && <th style={{ padding: "0.5rem" }}>結果</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {targets.map((target) => {
                        const result = results.find(
                          (item) => item.reservationId === target.reservationId
                        );
                        return (
                          <tr
                            key={target.reservationId}
                            style={{ borderBottom: "1px solid #f1f5f9" }}
                          >
                            <td style={{ padding: "0.5rem" }}>{target.reservationId}</td>
                            <td style={{ padding: "0.5rem" }}>{target.storeName}</td>
                            <td style={{ padding: "0.5rem" }}>{target.vehicleModel}</td>
                            <td style={{ padding: "0.5rem" }}>{formatPickup(target.pickupAt)}</td>
                            <td style={{ padding: "0.5rem" }}>{target.memberName}</td>
                            <td style={{ padding: "0.5rem" }}>{target.memberEmail}</td>
                            {results.length > 0 && (
                              <td style={{ padding: "0.5rem" }} title={result?.detail ?? ""}>
                                {result ? STATUS_LABELS[result.status] : "-"}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className={formStyles.actions}>
              {confirming ? (
                <>
                  <span className={formStyles.hint}>
                    {targets.length}件の予約にリマインドを送信します。よろしいですか？
                  </span>
                  <button
                    type="button"
                    className={formStyles.primaryButton}
                    onClick={() => void handleSend()}
                    disabled={sending}
                  >
                    {sending ? "送信中..." : "送信を実行する"}
                  </button>
                  <button
                    type="button"
                    className={formStyles.secondaryButton}
                    onClick={() => setConfirming(false)}
                    disabled={sending}
                  >
                    キャンセル
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={formStyles.primaryButton}
                    onClick={() => setConfirming(true)}
                    disabled={loading || sending || targets.length === 0}
                  >
                    前日リマインドを送信
                  </button>
                  <button
                    type="button"
                    className={formStyles.secondaryButton}
                    onClick={() => void loadTargets()}
                    disabled={loading || sending}
                  >
                    対象を再読み込み
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
