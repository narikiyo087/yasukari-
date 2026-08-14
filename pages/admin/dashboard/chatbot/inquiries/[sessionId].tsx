import { FormEvent, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import DashboardLayout from "../../../../../components/dashboard/DashboardLayout";
import { ChatHistoryEntry, ChatbotInquiryDetail } from "../../../../../lib/chatbot/inquiries";
import styles from "../../../../../styles/Dashboard.module.css";
import tableStyles from "../../../../../styles/AdminTable.module.css";

type InquiryStatus = "未対応" | "対応中" | "対応済み";

const statusClassName = (status: InquiryStatus): string => {
  if (status === "対応済み") {
    return `${tableStyles.badge} ${tableStyles.badgeOn}`;
  }

  if (status === "未対応") {
    return `${tableStyles.badge} ${tableStyles.badgeOff}`;
  }

  return `${tableStyles.badge} ${tableStyles.badgeNeutral}`;
};

export default function ChatbotInquiryDetailPage() {
  const router = useRouter();
  const sessionId = typeof router.query.sessionId === "string" ? router.query.sessionId : "";

  const [inquiry, setInquiry] = useState<ChatbotInquiryDetail | undefined>(undefined);
  const [replyText, setReplyText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notifyNotice, setNotifyNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !sessionId) {
      return;
    }

    const fetchInquiry = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/chatbot/inquiries/${sessionId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch inquiry: ${response.status}`);
        }

        const data = (await response.json()) as { inquiry?: ChatbotInquiryDetail };
        const nextInquiry = data.inquiry;
        if (!nextInquiry) {
          setInquiry(undefined);
          return;
        }

        setInquiry({
          ...nextInquiry,
          messages: [...nextInquiry.messages].sort((a, b) => a.messageIndex - b.messageIndex),
          history: nextInquiry.history,
        });
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : "不明なエラーが発生しました";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchInquiry();
  }, [router.isReady, sessionId]);

  const formatDatetime = (value: string) =>
    new Date(value).toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleReplySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!inquiry || replyText.trim() === "") {
      return;
    }

    const postReply = async () => {
      try {
        setIsSubmitting(true);
        const response = await fetch(`/api/chatbot/inquiries/${inquiry.sessionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: replyText.trim() }),
        });

        if (!response.ok) {
          throw new Error(`Failed to save reply: ${response.status}`);
        }

        const data = (await response.json()) as {
          inquiry?: ChatbotInquiryDetail;
          notification?: { siteNotified: boolean; emailStatus: "sent" | "skipped" | "not_available" };
        };
        const nextInquiry = data.inquiry;

        if (data.notification) {
          const { siteNotified, emailStatus } = data.notification;
          if (emailStatus === "sent") {
            setNotifyNotice("お客様へメールとサイト内通知でお知らせしました。");
          } else if (siteNotified) {
            setNotifyNotice(
              emailStatus === "skipped"
                ? "サイト内通知を記録しました（SMTP未設定のためメールはスキップ）。"
                : "サイト内通知を記録しました。"
            );
          } else {
            setNotifyNotice("未ログインのお問い合わせのため、お客様への通知は送信されません。");
          }
        }
        if (nextInquiry?.messages) {
          setInquiry((previous) => {
            if (!previous) {
              return previous;
            }

            const nextMessages = [...previous.messages, ...nextInquiry.messages];

            return {
              ...previous,
              lastActivityAt: nextInquiry.lastActivityAt ?? previous.lastActivityAt,
              messages: nextMessages.sort((a, b) => a.messageIndex - b.messageIndex),
              history: nextInquiry.history ?? previous.history,
            };
          });
        }

        setReplyText("");
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : "返信の保存に失敗しました";
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    };

    void postReply();
  };

  const sortedMessages = useMemo(() => {
    if (!inquiry) {
      return [];
    }

    return [...inquiry.messages].sort((a, b) => a.messageIndex - b.messageIndex);
  }, [inquiry]);

  const userMessages = useMemo(
    () => sortedMessages.filter((message) => message.role === "user"),
    [sortedMessages],
  );

  const storedHistory: ChatHistoryEntry[] = useMemo(() => {
    if (!inquiry) {
      return [];
    }

    if (inquiry.history?.length) {
      return inquiry.history;
    }

    return inquiry.messages.map((message) => ({
      messageId: message.messageId,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
      userId: message.userId,
      clientId: message.clientId,
    }));
  }, [inquiry]);

  const deriveStatus = (): InquiryStatus => {
    if (!sortedMessages.length || userMessages.length === 0) {
      return "未対応";
    }

    const lastMessage = sortedMessages[sortedMessages.length - 1];
    if (lastMessage.role === "assistant") {
      return "対応済み";
    }

    return "対応中";
  };

  return (
    <>
      <Head>
        <title>チャットボット問い合わせ詳細 | 管理ダッシュボード</title>
      </Head>
      <DashboardLayout
        title="チャットボット問い合わせ詳細"
        description="チャットボット経由で届いたお問い合わせの履歴と返信内容を確認できます。"
      >
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.breadcrumb}>
                <Link href="/admin/dashboard/chatbot/inquiries">チャットボット問い合わせ一覧</Link>
                <span aria-hidden> / </span>
                <span>{sessionId || "詳細"}</span>
              </p>
              <h2 className={styles.sectionTitle}>問い合わせ詳細</h2>
              <p className={styles.sectionDescription}>
                DynamoDB に保存された session_id / user_id / client_id をキーに会話履歴を参照し、問い合わせごとに返信できます。
              </p>
            </div>
            <button className={styles.outlineButton} onClick={() => router.back()} type="button">
              一覧に戻る
            </button>
          </div>

          {isLoading ? (
            <div className={styles.placeholderCard}>
              <p>問い合わせの履歴を読み込み中です…</p>
            </div>
          ) : error ? (
            <div className={styles.placeholderCard}>
              <p>問い合わせの取得に失敗しました。</p>
              <p className={styles.sectionDescription}>{error}</p>
              <Link className={styles.link} href="/admin/dashboard/chatbot/inquiries">
                一覧に戻る
              </Link>
            </div>
          ) : !inquiry ? (
            <div className={styles.placeholderCard}>
              <p>指定されたセッション ID の問い合わせが見つかりませんでした。</p>
              <Link className={styles.link} href="/admin/dashboard/chatbot/inquiries">
                一覧に戻る
              </Link>
            </div>
          ) : (
            <div className={styles.detailStack}>
              <div className={`${styles.detailPanel} ${styles.splitLayout}`}>
                <div className={styles.detailSection}>
                  <div className={styles.detailHeader}>
                    <div>
                      <p className={styles.tagline}>Session: {inquiry.sessionId}</p>
                      <h3 className={styles.detailTitle}>チャットボット問い合わせ</h3>
                      <p className={styles.sectionDescription}>
                        ChatSessions / ChatMessages に保存されたユーザーとボットのやり取りを、そのまま確認できます。
                      </p>
                    </div>
                    <span className={statusClassName(deriveStatus())}>{deriveStatus()}</span>
                  </div>

                  <dl className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <dt>ログイン状態</dt>
                      <dd>{inquiry.isLoggedIn ? "ログイン済み" : "未ログイン (client_id で紐付け)"}</dd>
                    </div>
                    <div className={styles.detailItem}>
                      <dt>user_id</dt>
                      <dd className={styles.monospace}>{inquiry.userId ?? "(null)"}</dd>
                    </div>
                    <div className={styles.detailItem}>
                      <dt>client_id</dt>
                      <dd className={styles.monospace}>{inquiry.clientId}</dd>
                    </div>
                    <div className={styles.detailItem}>
                      <dt>作成日時</dt>
                      <dd>{formatDatetime(inquiry.createdAt)}</dd>
                    </div>
                    <div className={styles.detailItem}>
                      <dt>最終アクティビティ</dt>
                      <dd>{formatDatetime(inquiry.lastActivityAt)}</dd>
                    </div>
                  </dl>
                </div>

                <div className={styles.detailSection}>
                  <div className={styles.detailHeader}>
                    <h3 className={styles.detailTitle}>ステータス</h3>
                    <p className={styles.sectionDescription}>
                      メッセージ件数と役割を分けて記録しています。返信は ChatMessages に assistant ロールで追記されます。
                    </p>
                  </div>
                  <div className={styles.statGrid}>
                    <div className={styles.statCard}>
                      <p className={styles.statLabel}>メッセージ総数</p>
                      <p className={styles.statValue}>{sortedMessages.length} 件</p>
                    </div>
                    <div className={styles.statCard}>
                      <p className={styles.statLabel}>ユーザー発言</p>
                      <p className={styles.statValue}>{userMessages.length} 件</p>
                    </div>
                    <div className={styles.statCard}>
                      <p className={styles.statLabel}>ボット発言</p>
                      <p className={styles.statValue}>{sortedMessages.length - userMessages.length} 件</p>
                    </div>
                  </div>

                  <form className={styles.replyForm} onSubmit={handleReplySubmit}>
                    <label className={styles.replyLabel} htmlFor="chatbot-reply">
                      返信内容
                    </label>
                    {notifyNotice && (
                      <p
                        style={{
                          margin: "0 0 0.5rem",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "0.5rem",
                          background: "#ecfdf5",
                          border: "1px solid #a7f3d0",
                          color: "#047857",
                          fontSize: "0.8125rem",
                        }}
                      >
                        {notifyNotice}
                      </p>
                    )}
                    <textarea
                      id="chatbot-reply"
                      className={styles.replyTextarea}
                      placeholder="ここに管理者からの返信を入力し、ChatMessages に assistant ロールとして保存します。"
                      rows={4}
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                    />
                    <div className={styles.replyActions}>
                      <button
                        type="submit"
                        className={`${styles.iconButton} ${styles.iconButtonAccent}`}
                        disabled={!replyText.trim() || isSubmitting}
                      >
                        返信を追加
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className={`${styles.detailPanel} ${styles.chatBoard}`}>
                <div className={styles.detailHeader}>
                  <div>
                    <h3 className={styles.detailTitle}>会話履歴</h3>
                    <p className={styles.sectionDescription}>
                      ユーザーとボットのメッセージを時系列に並べたチャットビューです。LINE のように左右に分けて確認できます。
                    </p>
                  </div>
                  <span className={`${tableStyles.badge} ${tableStyles.badgeNeutral}`}>
                    {sortedMessages.length} 件
                  </span>
                </div>

                <ol className={styles.chatMessageList} aria-label="チャット履歴">
                  {sortedMessages.map((message) => {
                    const isAssistant = message.role === "assistant";
                    const roleClassName = `${tableStyles.badge} ${isAssistant ? tableStyles.badgeOn : tableStyles.badgeOff}`;

                    return (
                      <li
                        key={message.messageId}
                        className={`${styles.chatMessage} ${isAssistant ? styles.chatMessageAssistant : styles.chatMessageUser}`}
                      >
                        <div className={styles.chatAvatar} aria-hidden>
                          {isAssistant ? "🤖" : "👤"}
                        </div>
                        <div className={styles.chatBubbleWrapper}>
                          <div className={styles.chatBubbleHeader}>
                            <span className={roleClassName}>{isAssistant ? "ボット" : "ユーザー"}</span>
                            <span className={styles.chatTimestamp}>{formatDatetime(message.createdAt)}</span>
                          </div>
                          <p className={styles.chatBubble}>{message.content}</p>
                          <div className={styles.chatMeta}>
                            <span className={styles.monospace}># {message.messageIndex}</span>
                            <span className={styles.monospace}>{message.userId ?? "(null)"}</span>
                            <span className={styles.monospace}>{message.clientId}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className={styles.detailPanel}>
                <div className={styles.detailHeader}>
                  <div>
                    <h3 className={styles.detailTitle}>保存済み履歴 (ChatMessages.history)</h3>
                    <p className={styles.sectionDescription}>
                      DynamoDB に保存された history フィールドをそのまま表示します。未ログインの利用者は client_id で追跡されます。
                    </p>
                  </div>
                  <span className={`${tableStyles.badge} ${tableStyles.badgeNeutral}`}>
                    {storedHistory.length} 件
                  </span>
                </div>

                {storedHistory.length === 0 ? (
                  <p className={styles.sectionDescription}>保存された履歴がありません。</p>
                ) : (
                  <ol className={styles.chatMessageList} aria-label="保存済みのチャット履歴">
                    {storedHistory.map((entry, index) => {
                      const isAssistant = entry.role === "assistant";
                      const badgeClassName = `${tableStyles.badge} ${isAssistant ? tableStyles.badgeOn : tableStyles.badgeOff}`;

                      return (
                        <li
                          key={`${entry.messageId}-${index}`}
                          className={`${styles.chatMessage} ${isAssistant ? styles.chatMessageAssistant : styles.chatMessageUser}`}
                        >
                          <div className={styles.chatAvatar} aria-hidden>
                            {isAssistant ? "🤖" : "👤"}
                          </div>
                          <div className={styles.chatBubbleWrapper}>
                            <div className={styles.chatBubbleHeader}>
                              <span className={badgeClassName}>{isAssistant ? "ボット" : "ユーザー"}</span>
                              <span className={styles.chatTimestamp}>{formatDatetime(entry.createdAt)}</span>
                            </div>
                            <p className={styles.chatBubble}>{entry.content}</p>
                            <div className={styles.chatMeta}>
                              <span className={styles.monospace}>ID: {entry.messageId}</span>
                              <span className={styles.monospace}>{entry.userId ?? "(null)"}</span>
                              <span className={styles.monospace}>{entry.clientId}</span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </div>
          )}
        </section>
      </DashboardLayout>
    </>
  );
}
