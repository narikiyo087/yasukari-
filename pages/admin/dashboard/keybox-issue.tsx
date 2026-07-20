import Head from "next/head";
import { FormEvent, useMemo, useState } from "react";

import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import styles from "../../../styles/Dashboard.module.css";
import tableStyles from "../../../styles/AdminTable.module.css";

const toLocalInputValue = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const defaultStart = () => {
  const now = new Date();
  return toLocalInputValue(now);
};

const defaultEnd = () => {
  const end = new Date();
  end.setHours(end.getHours() + 2);
  return toLocalInputValue(end);
};

type IssueResponse = {
  success: boolean;
  pinCode: string;
  pinId?: string;
  unitId: string;
  qrCode?: string;
  qrImageUrl?: string;
  windowStart: string;
  windowEnd: string;
  signUsed?: string;
  message?: string;
};

export default function KeyboxIssuePage() {
  const [windowStart, setWindowStart] = useState(defaultStart);
  const [windowEnd, setWindowEnd] = useState(defaultEnd);
  const [pinCode, setPinCode] = useState("");
  const [targetName, setTargetName] = useState("管理者発行PIN");
  const [unitId, setUnitId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IssueResponse | null>(null);

  const windowSummary = useMemo(() => {
    if (!result) return "-";
    const start = new Date(result.windowStart);
    const end = new Date(result.windowEnd);
    return `${start.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} 〜 ${end.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`;
  }, [result]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/admin/keybox-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          windowStart,
          windowEnd,
          pinCode: pinCode || undefined,
          targetName: targetName || undefined,
          unitId: unitId || undefined,
          storeName: storeName || undefined,
        }),
      });

      const data = (await response.json()) as IssueResponse | { message?: string };
      if (!response.ok) {
        throw new Error((data as { message?: string }).message || "発行に失敗しました。再度お試しください。");
      }

      setResult(data as IssueResponse);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "発行に失敗しました。再度お試しください。";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>KEYBOX解錠キーの発行 | 管理ダッシュボード</title>
      </Head>
      <DashboardLayout
        title="KEYBOX解錠キーの発行"
        description="管理者操作で即時にPIN・QRを発行します。テスト用に任意の時間帯とPINを指定できます。"
      >
        <section className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <p className={styles.breadcrumb}>無人店舗鍵の手動発行</p>
              <h2 className={styles.sectionTitle}>サンプルPINを発行</h2>
              <p className={styles.sectionDescription}>
                解錠ウィンドウとPINを指定してAPI経由でキーを発行します。入力が空の場合はランダムなPINやユニットIDが採番されます。
              </p>
            </div>
          </div>

          <form className={styles.formCard} onSubmit={handleSubmit}>
            <div className={styles.formGridTwoCols}>
              <label className={styles.formField}>
                <span className={styles.formLabel}>有効開始</span>
                <input
                  type="datetime-local"
                  required
                  value={windowStart}
                  onChange={(event) => setWindowStart(event.target.value)}
                  className={styles.input}
                />
              </label>
              <label className={styles.formField}>
                <span className={styles.formLabel}>有効終了</span>
                <input
                  type="datetime-local"
                  required
                  value={windowEnd}
                  onChange={(event) => setWindowEnd(event.target.value)}
                  className={styles.input}
                />
              </label>
            </div>

            <div className={styles.formGridTwoCols}>
              <label className={styles.formField}>
                <span className={styles.formLabel}>PINコード (任意)</span>
                <input
                  type="text"
                  placeholder="未入力の場合は自動生成"
                  value={pinCode}
                  onChange={(event) => setPinCode(event.target.value)}
                  className={styles.input}
                />
              </label>
              <label className={styles.formField}>
                <span className={styles.formLabel}>ターゲット名 (任意)</span>
                <input
                  type="text"
                  placeholder="管理者発行PIN"
                  value={targetName}
                  onChange={(event) => setTargetName(event.target.value)}
                  className={styles.input}
                />
              </label>
            </div>

            <div className={styles.formGridTwoCols}>
              <label className={styles.formField}>
                <span className={styles.formLabel}>ユニットID (任意)</span>
                <input
                  type="text"
                  placeholder="未入力の場合は自動生成"
                  value={unitId}
                  onChange={(event) => setUnitId(event.target.value)}
                  className={styles.input}
                />
              </label>
              <label className={styles.formField}>
                <span className={styles.formLabel}>店舗名・備考 (任意)</span>
                <input
                  type="text"
                  placeholder="三ノ輪店"
                  value={storeName}
                  onChange={(event) => setStoreName(event.target.value)}
                  className={styles.input}
                />
              </label>
            </div>

            {error ? <p className={styles.errorText}>{error}</p> : null}

            <div className={styles.formActions}>
              <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
                {isSubmitting ? "発行中..." : "PINを発行する"}
              </button>
            </div>
          </form>

          {result ? (
            <div className={styles.card}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <h3 className={styles.sectionTitle}>発行結果</h3>
              <p className={styles.sectionDescription}>発行したPINとQRコードを確認できます。</p>
            </div>
          </div>
          <div className={tableStyles.wrapper}>
            <div className={tableStyles.tableWrapper}>
              <table className={`${tableStyles.table} ${tableStyles.dataTable}`}>
                <tbody>
                  <tr>
                    <th>ステータス</th>
                    <td>{result.success ? "成功" : "失敗"}</td>
                  </tr>
                  <tr>
                    <th>PIN</th>
                    <td>{result.pinCode}</td>
                  </tr>
                  <tr>
                    <th>pinId</th>
                        <td>{result.pinId || "-"}</td>
                      </tr>
                      <tr>
                        <th>ユニットID</th>
                        <td>{result.unitId}</td>
                      </tr>
                      <tr>
                    <th>署名方式</th>
                    <td>{result.signUsed || "-"}</td>
                  </tr>
                  {result.message ? (
                    <tr>
                      <th>メッセージ</th>
                      <td>{result.message}</td>
                    </tr>
                  ) : null}
                  <tr>
                    <th>有効時間</th>
                    <td>{windowSummary}</td>
                  </tr>
                      <tr>
                        <th>QR</th>
                        <td>
                          {result.qrImageUrl ? (
                            <img
                              src={result.qrImageUrl}
                              alt="発行されたQRコード"
                              className="h-32 w-32 rounded border border-slate-200 object-contain"
                            />
                          ) : (
                            <span className="text-xs text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </DashboardLayout>
    </>
  );
}
