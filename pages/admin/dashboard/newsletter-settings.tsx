import Head from "next/head";
import { FormEvent, useEffect, useMemo, useState } from "react";

import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import formStyles from "../../../styles/AdminForm.module.css";
import styles from "../../../styles/NewsletterSettings.module.css";
import { NewsletterSettings } from "../../../types/newsletter";

const DEFAULT_SETTINGS: NewsletterSettings = {
  subject: "",
  htmlContent: "",
};

type DeliveryPreview = {
  smtpConfigured: boolean;
  subject: string;
  recipientCount: number;
  excludedOptedOut: number;
  excludedNoEmail: number;
  excludedInactive: number;
};

export default function NewsletterSettingsPage() {
  const [formState, setFormState] = useState<NewsletterSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [deliveryPreview, setDeliveryPreview] = useState<DeliveryPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmingSend, setConfirmingSend] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [deliveryNotice, setDeliveryNotice] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/newsletter-settings");
        if (!response.ok) {
          throw new Error("メルマガ設定の取得に失敗しました。");
        }
        const data = (await response.json()) as NewsletterSettings;
        setFormState({
          subject: data.subject ?? "",
          previewText: data.previewText ?? "",
          htmlContent: data.htmlContent ?? "",
          updatedAt: data.updatedAt,
        });
      } catch (fetchError) {
        console.error(fetchError);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "データの取得に失敗しました。時間をおいて再度お試しください。"
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/newsletter-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: formState.subject,
          previewText: formState.previewText,
          htmlContent: formState.htmlContent,
        }),
      });

      const payload = (await response.json()) as NewsletterSettings | { message?: string };

      if (!response.ok) {
        throw new Error("message" in payload && payload.message ? payload.message : "保存に失敗しました。");
      }

      const savedSettings = payload as NewsletterSettings;
      setFormState((prev) => ({ ...prev, updatedAt: savedSettings.updatedAt }));
      setNotice("メルマガ設定を保存しました。下の配信カードからテスト配信・本配信ができます。");
    } catch (submitError) {
      console.error(submitError);
      setError(submitError instanceof Error ? submitError.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const previewHtml = useMemo(() => {
    if (!formState.htmlContent || formState.htmlContent.trim().length === 0) {
      return "";
    }
    return formState.htmlContent;
  }, [formState.htmlContent]);

  const previewDocument = useMemo(() => {
    if (!previewHtml) {
      return "";
    }

    return `<!doctype html><html lang="ja"><head><meta charset="UTF-8" /><title>${
      formState.subject || "メルマガプレビュー"
    }</title></head><body>${previewHtml}</body></html>`;
  }, [formState.subject, previewHtml]);

  const handleOpenPreview = () => {
    if (!previewDocument) {
      return;
    }

    const previewBlob = new Blob([previewDocument], { type: "text/html" });
    const previewUrl = URL.createObjectURL(previewBlob);
    const previewWindow = window.open(previewUrl, "_blank", "noopener");

    if (previewWindow) {
      previewWindow.focus();
    }

    window.setTimeout(() => {
      URL.revokeObjectURL(previewUrl);
    }, 1000);
  };

  const handleTestSend = async () => {
    setTestSending(true);
    setDeliveryError(null);
    setDeliveryNotice(null);

    try {
      const response = await fetch("/api/admin/newsletter-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "test", email: testEmail }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "テスト配信に失敗しました。");
      }

      setDeliveryNotice(payload.message ?? "テスト配信を送信しました。");
    } catch (sendError) {
      console.error(sendError);
      setDeliveryError(sendError instanceof Error ? sendError.message : "テスト配信に失敗しました。");
    } finally {
      setTestSending(false);
    }
  };

  const handlePrepareSend = async () => {
    setPreviewLoading(true);
    setDeliveryError(null);
    setDeliveryNotice(null);

    try {
      const response = await fetch("/api/admin/newsletter-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "preview" }),
      });
      const payload = (await response.json()) as DeliveryPreview | { message?: string };

      if (!response.ok) {
        throw new Error(
          "message" in payload && payload.message ? payload.message : "配信対象の取得に失敗しました。"
        );
      }

      setDeliveryPreview(payload as DeliveryPreview);
      setConfirmingSend(true);
    } catch (previewError) {
      console.error(previewError);
      setDeliveryError(
        previewError instanceof Error ? previewError.message : "配信対象の取得に失敗しました。"
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleBulkSend = async () => {
    setBulkSending(true);
    setDeliveryError(null);
    setDeliveryNotice(null);

    try {
      const response = await fetch("/api/admin/newsletter-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "send" }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "メルマガ配信に失敗しました。");
      }

      setDeliveryNotice(payload.message ?? "メルマガ配信が完了しました。");
      setConfirmingSend(false);
    } catch (sendError) {
      console.error(sendError);
      setDeliveryError(sendError instanceof Error ? sendError.message : "メルマガ配信に失敗しました。");
      setConfirmingSend(false);
    } finally {
      setBulkSending(false);
    }
  };

  return (
    <>
      <Head>
        <title>メルマガ配信設定 | 管理ダッシュボード</title>
      </Head>
      <DashboardLayout
        title="メルマガ配信設定"
        description="メルマガ配信用の件名やHTML本文を保存し、テスト配信・本配信を行います。本配信はメルマガ受信をオンにした会員（オプトイン）のみが対象です。"
      >
        <form onSubmit={handleSubmit} className={formStyles.cardStack}>
          <div className={formStyles.card}>
            <div className={formStyles.header}>
              <h2 className={formStyles.title}>コンテンツ設定</h2>
              <p className={formStyles.description}>
                配信予定のメルマガ本文をHTMLで保存します。画像やリンクを含んだリッチテキストもそのまま保存可能です。
              </p>
              {formState.updatedAt && (
                <div className={styles.metaList}>
                  <div className={styles.metaItem}>
                    最終更新: {new Date(formState.updatedAt).toLocaleString("ja-JP")}
                  </div>
                </div>
              )}
            </div>

            {error && <div className={formStyles.error}>{error}</div>}
            {notice && <div className={formStyles.success}>{notice}</div>}

            <div className={formStyles.body}>
              <div className={formStyles.field}>
                <label htmlFor="subject">件名*</label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                  value={formState.subject}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, subject: event.target.value }))
                  }
                  placeholder="【ヤスカリ】春のツーリング応援セールのご案内"
                  disabled={loading}
                />
                <p className={formStyles.hint}>配信時のメール件名として使用します。</p>
              </div>

              <div className={formStyles.field}>
                <label htmlFor="previewText">プレビューテキスト（任意）</label>
                <input
                  id="previewText"
                  name="previewText"
                  type="text"
                  value={formState.previewText ?? ""}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, previewText: event.target.value }))
                  }
                  placeholder="今だけの限定クーポンをご用意しました。"
                  disabled={loading}
                />
                <p className={formStyles.hint}>
                  メールクライアントで件名の下に表示される補足文です。空欄の場合は本文が使用されます。
                </p>
              </div>

              <div className={formStyles.field}>
                <label htmlFor="htmlContent">HTML本文*</label>
                <textarea
                  id="htmlContent"
                  name="htmlContent"
                  required
                  value={formState.htmlContent}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, htmlContent: event.target.value }))
                  }
                  rows={14}
                  placeholder="<h1>春のツーリング応援セール</h1>\n<p>最新モデルをお得にレンタルできるキャンペーンのご案内です。</p>"
                  disabled={loading}
                  spellCheck={false}
                />
                <p className={formStyles.hint}>
                  画像URLやスタイルを含むHTMLをそのまま保存します。配信機能は今後追加されます。
                </p>
              </div>
            </div>

            <div className={formStyles.actions}>
              <button type="submit" className={formStyles.primaryButton} disabled={saving || loading}>
                {saving ? "保存中..." : "設定を保存"}
              </button>
            </div>
          </div>

          <div className={formStyles.card}>
            <div className={formStyles.header}>
              <h2 className={formStyles.title}>プレビュー</h2>
              <p className={formStyles.description}>
                HTMLとして保存される内容をそのまま確認できます。配信処理は実装されていないため、保存のみ行います。
              </p>
            </div>

            <div className={styles.previewGrid}>
              <div className={styles.previewActions}>
                <div className={styles.previewButtons}>
                  <button
                    type="button"
                    className={formStyles.secondaryButton}
                    onClick={handleOpenPreview}
                    disabled={!previewDocument || loading}
                  >
                    別ページでプレビューを開く
                  </button>
                </div>
                <div className={styles.previewDescription}>
                  <p className={styles.previewHint}>
                    画像や外部リンクを利用する場合は、HTTPSでアクセスできるURLをご利用ください。メールクライアントによってはスタイルが簡略化されます。
                  </p>
                  {!previewHtml && (
                    <p className={styles.previewHint}>HTML本文を入力すると、別ページでプレビューを確認できます。</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={formStyles.card}>
            <div className={formStyles.header}>
              <h2 className={formStyles.title}>配信</h2>
              <p className={formStyles.description}>
                保存済みの内容をテスト配信または本配信します。本配信の対象は通知設定で「メルマガ・クーポン」をオンにした会員のみです（オプトイン制）。
              </p>
            </div>

            {deliveryError && <div className={formStyles.error}>{deliveryError}</div>}
            {deliveryNotice && <div className={formStyles.success}>{deliveryNotice}</div>}

            <div className={formStyles.body}>
              <div className={formStyles.field}>
                <label htmlFor="newsletterTestEmail">テスト配信の宛先</label>
                <input
                  id="newsletterTestEmail"
                  type="email"
                  value={testEmail}
                  onChange={(event) => setTestEmail(event.target.value)}
                  placeholder="sample@example.com"
                  disabled={testSending || bulkSending}
                />
                <p className={formStyles.hint}>
                  保存済みの件名・HTML本文を、指定した1件のアドレスにだけ送信します。
                </p>
              </div>
            </div>

            <div className={formStyles.actions}>
              <button
                type="button"
                className={formStyles.secondaryButton}
                onClick={() => void handleTestSend()}
                disabled={!testEmail || testSending || bulkSending || loading}
              >
                {testSending ? "テスト配信中..." : "テスト配信を送信"}
              </button>

              {confirmingSend && deliveryPreview ? (
                <>
                  <span className={formStyles.hint}>
                    配信対象 {deliveryPreview.recipientCount}名（オプトアウト除外{" "}
                    {deliveryPreview.excludedOptedOut}名）に「{deliveryPreview.subject}
                    」を配信します。
                    {!deliveryPreview.smtpConfigured &&
                      "SMTP未設定のため、メールはスキップされサイト内通知のみ配信されます。"}
                    よろしいですか？
                  </span>
                  <button
                    type="button"
                    className={formStyles.primaryButton}
                    onClick={() => void handleBulkSend()}
                    disabled={bulkSending}
                  >
                    {bulkSending ? "配信中..." : "本配信を実行する"}
                  </button>
                  <button
                    type="button"
                    className={formStyles.secondaryButton}
                    onClick={() => setConfirmingSend(false)}
                    disabled={bulkSending}
                  >
                    キャンセル
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={formStyles.primaryButton}
                  onClick={() => void handlePrepareSend()}
                  disabled={previewLoading || bulkSending || loading}
                >
                  {previewLoading ? "配信対象を確認中..." : "本配信の対象を確認する"}
                </button>
              )}
            </div>
          </div>
        </form>
      </DashboardLayout>
    </>
  );
}
