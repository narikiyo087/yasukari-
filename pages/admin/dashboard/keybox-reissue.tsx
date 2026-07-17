import Head from "next/head";
import { FormEvent, useEffect, useState } from "react";

import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import type { Member } from "../../../lib/members";
import styles from "../../../styles/Dashboard.module.css";
import tableStyles from "../../../styles/AdminTable.module.css";
import reissueStyles from "../../../styles/KeyboxReissue.module.css";

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
};

const toLocalInputValue = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const roundUpToHour = (date: Date) => {
  const rounded = new Date(date);
  if (rounded.getMinutes() > 0 || rounded.getSeconds() > 0 || rounded.getMilliseconds() > 0) {
    rounded.setHours(rounded.getHours() + 1);
  }
  rounded.setMinutes(0, 0, 0);
  return rounded;
};

const defaultStart = () => {
  const now = roundUpToHour(new Date());
  return toLocalInputValue(now);
};

const defaultEnd = () => {
  const start = roundUpToHour(new Date());
  const end = new Date(start);
  end.setHours(end.getHours() + 2);
  return toLocalInputValue(end);
};

const appendTokyoOffset = (value: string) => {
  if (!value) return value;
  if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(value)) return value;
  return `${value}:00+09:00`;
};

type ReissueResponse = {
  success: boolean;
  pinCode: string;
  pinId?: string;
  unitId: string;
  qrCode?: string;
  qrImageUrl?: string;
  windowStart: string;
  windowEnd: string;
  signUsed?: string;
  targetName: string;
  reservationId?: string;
  memberId?: string;
  message?: string;
};

export default function KeyboxReissuePage() {
  const [windowStart, setWindowStart] = useState(defaultStart);
  const [windowEnd, setWindowEnd] = useState(defaultEnd);
  const [pinCode, setPinCode] = useState("");
  const [targetName, setTargetName] = useState("再発行PIN");
  const [unitId, setUnitId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ReissueResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchMembers = async () => {
      try {
        const response = await fetch("/api/admin/members/active", { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`会員情報の取得に失敗しました (${response.status})`);
        }
        const data = (await response.json()) as { members?: Member[] };
        setMembers(data.members ?? []);
        setMembersError(null);
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          const message =
            fetchError instanceof Error
              ? fetchError.message
              : "会員情報の取得中にエラーが発生しました。";
          setMembersError(message);
        }
      }
    };

    void fetchMembers();
    return () => controller.abort();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setResult(null);

    try {
      const response = await fetch("/api/admin/keybox-reissue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          windowStart: appendTokyoOffset(windowStart),
          windowEnd: appendTokyoOffset(windowEnd),
          pinCode: pinCode || undefined,
          targetName: targetName || undefined,
          unitId: unitId || undefined,
          storeName: storeName || undefined,
          memberId: memberId || undefined,
        }),
      });

      const data = (await response.json()) as ReissueResponse | { message?: string };
      if (!response.ok) {
        throw new Error((data as { message?: string }).message || "再発行に失敗しました。");
      }

      setResult(data as ReissueResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : "再発行に失敗しました。";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>KEYBOX再発行 | 管理ダッシュボード</title>
      </Head>
      <DashboardLayout
        title="KEYBOX再発行"
        description="指定した日時・PINで再発行し、必要に応じて利用中予約へ反映します。"
      >
        <section className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <p className={styles.breadcrumb}>無人店舗鍵の手動再発行</p>
              <h2 className={styles.sectionTitle}>PIN・QRの再発行</h2>
              <p className={styles.sectionDescription}>
                指定した日時とPINで再発行します。会員を選択すると、利用中予約に紐づけてマイページにも反映されます。
              </p>
            </div>
          </div>

          <div className={styles.splitLayout}>
            <form className={styles.formCard} onSubmit={handleSubmit}>
              <div className={reissueStyles.formSections}>
                <fieldset className={reissueStyles.fieldset}>
                  <legend className={reissueStyles.fieldsetLegend}>解錠ウィンドウ</legend>
                  <p className={styles.inlineNotice}>
                    予約に合わせて2時間幅を指定してください。入力が空の場合は丸めた最短時刻で自動採番します。
                  </p>
                  <div className={styles.formGridTwoCols}>
                    <label className={styles.formField}>
                      <span className={styles.formLabel}>有効開始</span>
                      <input
                        type="datetime-local"
                        required
                        value={windowStart}
                        onChange={(event) => setWindowStart(event.target.value)}
                        step={3600}
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
                        step={3600}
                        className={styles.input}
                      />
                    </label>
                  </div>
                </fieldset>

                <fieldset className={reissueStyles.fieldset}>
                  <legend className={reissueStyles.fieldsetLegend}>PINとラベル</legend>
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
                        placeholder="再発行PIN"
                        value={targetName}
                        onChange={(event) => setTargetName(event.target.value)}
                        className={styles.input}
                      />
                    </label>
                  </div>
                </fieldset>

                <fieldset className={reissueStyles.fieldset}>
                  <legend className={reissueStyles.fieldsetLegend}>ユニットと店舗</legend>
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
                </fieldset>

                <fieldset className={reissueStyles.fieldset}>
                  <legend className={reissueStyles.fieldsetLegend}>会員への割り当て</legend>
                  <label className={styles.formField}>
                    <span className={styles.formLabel}>ユーザー割り当て (現在予約中のみ)</span>
                    <select
                      value={memberId}
                      onChange={(event) => setMemberId(event.target.value)}
                      className={styles.input}
                    >
                      <option value="">未指定</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.email})
                        </option>
                      ))}
                    </select>
                    {membersError ? (
                      <p className={styles.errorText}>会員一覧を読み込めませんでした: {membersError}</p>
                    ) : null}
                    <p className={styles.mutedText}>
                      現在予約中の会員のみ表示しています。選択すると、利用中の予約にPIN・QRを反映します。
                    </p>
                  </label>
                </fieldset>

                {submitError ? <p className={styles.errorText}>{submitError}</p> : null}

                <div className={styles.formActions}>
                  <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
                    {isSubmitting ? "再発行中..." : "再発行する"}
                  </button>
                </div>
              </div>
            </form>

          </div>

          {result ? (
            <div className={styles.card}>
              <div className={styles.sectionHeaderRow}>
                <div>
                  <h3 className={styles.sectionTitle}>再発行結果</h3>
                  <p className={styles.sectionDescription}>
                    再発行したPIN・QRと割り当て結果を確認できます。
                  </p>
                </div>
              </div>
              <div className={reissueStyles.resultGrid}>
                <div className={reissueStyles.resultTile}>
                  <p className={reissueStyles.resultLabel}>ステータス</p>
                  <p className={reissueStyles.resultValue}>{result.success ? "成功" : "失敗"}</p>
                </div>
                <div className={reissueStyles.resultTile}>
                  <p className={reissueStyles.resultLabel}>PIN / pinId</p>
                  <p className={reissueStyles.resultValue}>{result.pinCode}</p>
                  <p className={reissueStyles.resultMeta}>{result.pinId || "pinId未発行"}</p>
                </div>
                <div className={reissueStyles.resultTile}>
                  <p className={reissueStyles.resultLabel}>有効時間</p>
                  <p className={reissueStyles.resultValue}>
                    {formatDateTime(result.windowStart)}
                  </p>
                  <p className={reissueStyles.resultMeta}>〜 {formatDateTime(result.windowEnd)}</p>
                </div>
                <div className={reissueStyles.resultTile}>
                  <p className={reissueStyles.resultLabel}>割り当て</p>
                  <p className={reissueStyles.resultValue}>
                    {result.reservationId ? `予約ID: ${result.reservationId}` : "未割り当て"}
                  </p>
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
                      <tr>
                        <th>有効時間</th>
                        <td>
                          {formatDateTime(result.windowStart)} 〜 {formatDateTime(result.windowEnd)}
                        </td>
                      </tr>
                      <tr>
                        <th>割り当て</th>
                        <td>{result.reservationId ? `予約ID: ${result.reservationId}` : "未割り当て"}</td>
                      </tr>
                      <tr>
                        <th>QR</th>
                        <td>
                          {result.qrImageUrl ? (
                            <img
                              src={result.qrImageUrl}
                              alt="再発行されたQRコード"
                              className="h-24 w-24 rounded border border-slate-200 object-contain"
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
