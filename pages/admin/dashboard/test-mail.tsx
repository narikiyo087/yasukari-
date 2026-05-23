import Head from "next/head";
import { FormEvent, useMemo, useState } from "react";

import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import formStyles from "../../../styles/AdminForm.module.css";

type TestMailStatus = "sent" | "skipped";

type TestMailResponse = {
  message: string;
  status?: TestMailStatus;
};

const MAIL_TYPE_OPTIONS = [
  { value: "provisional", label: "仮予約" },
  { value: "full", label: "本登録" },
  { value: "full_en", label: "本登録（英語版）" },
  { value: "reservation_adachi", label: "予約受付完了（足立小台店）" },
  { value: "reservation_minowa", label: "予約受付完了（三ノ輪店）" },
  { value: "reservation_adachi_en", label: "予約受付完了（足立小台店・英語版）" },
  { value: "reservation_minowa_en", label: "予約受付完了（三ノ輪店・英語版）" },
  { value: "extension", label: "レンタル延長決済完了" },
  { value: "extension_en", label: "レンタル延長決済完了（英語版）" },
];

const statusText = (status?: TestMailStatus) => {
  if (status === "sent") return "送信済み";
  if (status === "skipped") return "スキップ";
  return "";
};

export default function TestMailPage() {
  const [email, setEmail] = useState("");
  const [mailType, setMailType] = useState(MAIL_TYPE_OPTIONS[0]?.value ?? "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<TestMailStatus | null>(null);

  const selectedLabel = useMemo(() => {
    return MAIL_TYPE_OPTIONS.find((option) => option.value === mailType)?.label ?? "";
  }, [mailType]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    setNotice(null);
    setLastStatus(null);

    try {
      const response = await fetch("/api/admin/test-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mailType }),
      });
      const payload = (await response.json()) as TestMailResponse;

      if (!response.ok) {
        throw new Error(payload.message || "テストメール送信に失敗しました。");
      }

      setNotice(payload.message);
      setLastStatus(payload.status ?? null);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "テストメール送信に失敗しました。"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Head>
        <title>テストメール | 管理ダッシュボード</title>
      </Head>
      <DashboardLayout
        title="テストメール"
        description="仮予約・本登録・予約受付完了・レンタル延長決済完了のメールをテスト送信できます。"
      >
        <form onSubmit={handleSubmit} className={formStyles.cardStack}>
          <div className={formStyles.card}>
            <div className={formStyles.header}>
              <h2 className={formStyles.title}>テストメール送信</h2>
              <p className={formStyles.description}>
                宛先メールアドレスとメール種別を選択して、サンプルデータで送信します。
              </p>
            </div>

            {error && <div className={formStyles.error}>{error}</div>}
            {notice && (
              <div className={formStyles.success}>
                {notice}
                {lastStatus ? `（${statusText(lastStatus)}）` : ""}
              </div>
            )}

            <div className={formStyles.body}>
              <div className={formStyles.field}>
                <label htmlFor="testMailEmail">宛先メールアドレス</label>
                <input
                  id="testMailEmail"
                  name="testMailEmail"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="sample@example.com"
                  required
                  disabled={sending}
                />
                <p className={formStyles.hint}>送信先のメールアドレスを入力してください。</p>
              </div>

              <div className={formStyles.field}>
                <label htmlFor="testMailType">メール種別</label>
                <select
                  id="testMailType"
                  name="testMailType"
                  value={mailType}
                  onChange={(event) => setMailType(event.target.value)}
                  disabled={sending}
                >
                  {MAIL_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className={formStyles.hint}>選択した種別のサンプルメールを送信します。</p>
              </div>

              <div className={formStyles.field}>
                <label>送信サンプル</label>
                <div className={formStyles.hint}>
                  {selectedLabel
                    ? `${selectedLabel}メールのサンプル内容で送信します。`
                    : "送信メールを選択してください。"}
                </div>
              </div>
            </div>

            <div className={formStyles.actions}>
              <button type="submit" className={formStyles.primaryButton} disabled={sending}>
                {sending ? "送信中..." : "テストメールを送信"}
              </button>
            </div>
          </div>
        </form>
      </DashboardLayout>
    </>
  );
}
