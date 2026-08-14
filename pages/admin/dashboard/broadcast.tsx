import Head from "next/head";
import { FormEvent, useEffect, useState } from "react";

import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import formStyles from "../../../styles/AdminForm.module.css";

type PreviewResponse = {
  smtpConfigured: boolean;
  recipientCount: number;
  emailRecipientCount: number;
  excludedOptedOut: number;
  excludedNoEmail: number;
  excludedInactive: number;
};

type SendResponse = {
  message: string;
  summary?: {
    emailSent: number;
    emailSkipped: number;
    emailFailed: number;
    siteRecorded: number;
  };
};

export default function BroadcastPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const loadPreview = async () => {
      setLoadingPreview(true);
      setPreviewError(null);
      try {
        const response = await fetch("/api/admin/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "preview" }),
        });
        const payload = (await response.json()) as PreviewResponse | { message?: string };
        if (!response.ok) {
          throw new Error(
            "message" in payload && payload.message
              ? payload.message
              : "配信対象の取得に失敗しました。"
          );
        }
        setPreview(payload as PreviewResponse);
      } catch (fetchError) {
        console.error(fetchError);
        setPreviewError(
          fetchError instanceof Error ? fetchError.message : "配信対象の取得に失敗しました。"
        );
      } finally {
        setLoadingPreview(false);
      }
    };

    void loadPreview();
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setConfirming(true);
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "send", subject, body }),
      });
      const payload = (await response.json()) as SendResponse | { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "全体通知の配信に失敗しました。");
      }

      setNotice((payload as SendResponse).message);
      setConfirming(false);
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error ? submitError.message : "全体通知の配信に失敗しました。"
      );
      setConfirming(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Head>
        <title>全体通知の配信 | 管理ダッシュボード</title>
      </Head>
      <DashboardLayout
        title="全体通知の配信"
        description="全会員へメールとサイト内通知を一斉配信します。「全体通知」をオフにしている会員は自動で除外されます。"
      >
        <form onSubmit={handleSubmit} className={formStyles.cardStack}>
          <div className={formStyles.card}>
            <div className={formStyles.header}>
              <h2 className={formStyles.title}>配信対象</h2>
              <p className={formStyles.description}>
                会員一覧と通知設定から配信対象を自動集計します。
              </p>
            </div>
            <div className={formStyles.body}>
              {loadingPreview ? (
                <p className={formStyles.hint}>配信対象を集計中です…</p>
              ) : previewError ? (
                <div className={formStyles.error}>{previewError}</div>
              ) : preview ? (
                <ul className={formStyles.hint} style={{ lineHeight: 1.9 }}>
                  <li>配信対象: {preview.recipientCount}名（うちメール配信 {preview.emailRecipientCount}名）</li>
                  <li>全体通知オフのため除外: {preview.excludedOptedOut}名</li>
                  <li>メールアドレス未登録のため除外: {preview.excludedNoEmail}名</li>
                  <li>退会・ブラックリストのため除外: {preview.excludedInactive}名</li>
                  {!preview.smtpConfigured && (
                    <li style={{ color: "#b45309" }}>
                      SMTP未設定のため、メールはスキップされサイト内通知のみ配信されます。
                    </li>
                  )}
                </ul>
              ) : null}
            </div>
          </div>

          <div className={formStyles.card}>
            <div className={formStyles.header}>
              <h2 className={formStyles.title}>配信内容</h2>
              <p className={formStyles.description}>
                件名と本文はメール・サイト内通知の両方に使用されます。本文末尾には店舗情報フッターが自動で追加されます。
              </p>
            </div>

            {error && <div className={formStyles.error}>{error}</div>}
            {notice && <div className={formStyles.success}>{notice}</div>}

            <div className={formStyles.body}>
              <div className={formStyles.field}>
                <label htmlFor="broadcastSubject">件名*</label>
                <input
                  id="broadcastSubject"
                  type="text"
                  required
                  maxLength={200}
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="【ヤスカリ】年末年始の営業時間のお知らせ"
                  disabled={sending}
                />
              </div>

              <div className={formStyles.field}>
                <label htmlFor="broadcastBody">本文*</label>
                <textarea
                  id="broadcastBody"
                  required
                  rows={10}
                  maxLength={8000}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder={"いつもヤスカリをご利用いただきありがとうございます。\n年末年始の営業時間をお知らせします。"}
                  disabled={sending}
                  spellCheck={false}
                />
              </div>
            </div>

            <div className={formStyles.actions}>
              {confirming ? (
                <>
                  <span className={formStyles.hint}>
                    {preview ? `${preview.recipientCount}名` : "対象会員"}に「{subject}
                    」を配信します。よろしいですか？
                  </span>
                  <button
                    type="button"
                    className={formStyles.primaryButton}
                    onClick={() => void handleSend()}
                    disabled={sending}
                  >
                    {sending ? "配信中..." : "配信を実行する"}
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
                <button
                  type="submit"
                  className={formStyles.primaryButton}
                  disabled={sending || loadingPreview || Boolean(previewError)}
                >
                  配信内容を確認する
                </button>
              )}
            </div>
          </div>
        </form>
      </DashboardLayout>
    </>
  );
}
