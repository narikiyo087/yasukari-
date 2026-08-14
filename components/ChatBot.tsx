import React, { useState, useRef, useEffect } from "react";
import { ChatbotFaqCategory } from "../types/chatbotFaq";
import { searchFaqs, type FaqSuggestion } from "../lib/chatbot/faqSearch";
import { FaRobot, FaArrowLeft, FaTimes, FaPaperPlane, FaLightbulb } from "react-icons/fa";
import styles from "../styles/ChatSupport.module.css";

interface Message {
  from: "bot" | "user";
  text: string;
  time: string;
  feedback?: boolean;
}

type Category = ChatbotFaqCategory;

export default function ChatBot({
  className = "",
  onClose,
  fullScreen = false,
}: {
  className?: string;
  onClose?: () => void;
  fullScreen?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<"survey" | "free">("survey");
  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [loopCount, setLoopCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faqCategories, setFaqCategories] = useState<Category[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [faqError, setFaqError] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [freeText, setFreeText] = useState("");
  const [suggestions, setSuggestions] = useState<FaqSuggestion[]>([]);
  const [confirmingSubmit, setConfirmingSubmit] = useState(false);
  const storageKey = "chatbot_saved_messages";

  // 入力中のテキストから関連FAQを探す（250msデバウンス）
  useEffect(() => {
    if (step !== "free") {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(() => {
      setSuggestions(searchFaqs(freeText, faqCategories));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [freeText, faqCategories, step]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedClientId = localStorage.getItem("chatbot_client_id");
    if (storedClientId) {
      setClientId(storedClientId);
    } else {
      const generatedId = crypto.randomUUID?.() ?? `client-${Date.now()}`;
      setClientId(generatedId);
      localStorage.setItem("chatbot_client_id", generatedId);
    }

    const storedSessionId = localStorage.getItem("chatbot_session_id");
    if (storedSessionId) {
      setSessionId(storedSessionId);
    }

    const storedMessages = localStorage.getItem(storageKey);
    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      } catch (error) {
        console.error("Failed to parse stored chat messages", error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to persist chat messages", error);
    }
  }, [messages]);

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.id) {
          setUserId(data.user.id);
        }
      })
      .catch(() => {
        setUserId(null);
      });
  }, []);

  useEffect(() => {
    const fetchFaqs = async () => {
      setFaqLoading(true);
      setFaqError(null);

      try {
        const response = await fetch("/api/chatbot/faq");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            typeof data?.message === "string" ? data.message : "FAQデータの取得に失敗しました。"
          );
        }

        setFaqCategories(Array.isArray(data?.categories) ? data.categories : []);
      } catch (faqError) {
        console.error(faqError);
        setFaqCategories([]);
        setFaqError("FAQデータの取得に失敗しました。時間をおいて再度お試しください。");
      } finally {
        setFaqLoading(false);
      }
    };

    void fetchFaqs();
  }, []);

  function addMessage(from: "bot" | "user", text: string) {
    const d = new Date();
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
    setMessages((prev) => [...prev, { from, text, time }]);
  }

  function handleCategory(cat: Category) {
    setSelectedCategory(cat);
    addMessage("bot", `${cat.title}から質問をお選びください。`);
  }

  function handleQuestion(faq: { q: string; a: string }) {
    addMessage("user", faq.q);
    addMessage("bot", faq.a);
    const d = new Date();
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
    setMessages((prev) => [
      ...prev,
      { from: "bot", text: "解決しましたか？", time, feedback: true },
    ]);
    setShowFeedback(true);
  }

  function handleFreeStart() {
    setStep("free");
    addMessage(
      "bot",
      "ご自由にお問い合わせ内容を入力してください。入力中に関連するFAQを自動でご案内します。FAQで解決しない場合はスタッフが回答いたします。"
    );
  }

  async function handleFreeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = freeText.trim();
    if (!text) return;

    // 関連FAQがある場合は、送信前に一度FAQでの自己解決を促す
    if (suggestions.length > 0 && !confirmingSubmit) {
      setConfirmingSubmit(true);
      return;
    }

    if (!userId) {
      setShowLoginPrompt(true);
      return;
    }

    await submitInquiry(text);
  }

  function handleSuggestionSelect(faq: FaqSuggestion) {
    setConfirmingSubmit(false);
    handleQuestion(faq);
  }

  async function submitInquiry(text: string) {
    addMessage("user", text);
    setFreeText("");
    setSuggestions([]);
    setConfirmingSubmit(false);

    const ensuredClientId = clientId ?? crypto.randomUUID?.() ?? `client-${Date.now()}`;
    if (!clientId) {
      setClientId(ensuredClientId);
      if (typeof window !== "undefined") {
        localStorage.setItem("chatbot_client_id", ensuredClientId);
      }
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/chatbot/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          clientId: ensuredClientId,
          sessionId,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save chat message");
      }

      const data = await response.json();
      if (data.sessionId) {
        setSessionId(data.sessionId);
        if (typeof window !== "undefined") {
          localStorage.setItem("chatbot_session_id", data.sessionId);
        }
      }
      addMessage(
        "bot",
        data.assistantMessage?.content ??
          "ただいま確認中です。後ほどご回答いたします。"
      );
    } catch (error) {
      addMessage(
        "bot",
        "メッセージの送信中にエラーが発生しました。時間をおいて再度お試しください。"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleYes() {
    onClose?.();
    setShowFeedback(false);
  }

  function handleNo() {
    const newCount = loopCount + 1;
    setLoopCount(newCount);
    setShowFeedback(false);
    setSelectedCategory(null);
    setStep("survey");
    if (newCount >= 4) {
      handleFreeStart();
    }
  }

  function handleBack() {
    setSelectedCategory(null);
    setStep("survey");
    setConfirmingSubmit(false);
  }

  function handleBackButton() {
    if (selectedCategory || step === "free") {
      handleBack();
    } else {
      handleCloseButton();
    }
  }

  function handleCloseButton() {
    if (onClose) {
      onClose();
    } else {
      handleClearHistory();
    }
  }

  function handleClearHistory() {
    setMessages([]);
    setSelectedCategory(null);
    setStep("survey");
    setLoopCount(0);
    setShowAllCategories(false);
    setShowFeedback(false);
    setSessionId(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
      localStorage.removeItem("chatbot_session_id");
    }
  }

  function handleDownloadHistory() {
    if (messages.length === 0) return;
    const header = "【ヤスカリ チャット履歴】";
    const lines = messages.map(
      (m) => `[${m.time}] ${m.from === "bot" ? "スタッフ" : "あなた"}: ${m.text}`
    );
    const blob = new Blob([`${header}\n${lines.join("\n")}`], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-history-${sessionId ?? "local"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
  const visibleCategories = showAllCategories
    ? faqCategories
    : faqCategories.slice(0, 3);

  return (
    <div
      className={`${styles.chatShell} ${fullScreen ? styles.fullScreen : ""} ${className}`}
    >
      <div className={styles.safeArea}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            {(selectedCategory || step === "free") && (
              <button
                onClick={handleBackButton}
                className={styles.headerAction}
                aria-label="前の画面に戻る"
              >
                <FaArrowLeft />
              </button>
            )}
            <div>
              <p className={styles.headerTitle}>チャットサポート</p>
              <p className={styles.headerSubtitle}>
                FAQと予約サポートをご案内します
              </p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <button
              onClick={handleCloseButton}
              className={styles.headerAction}
              aria-label="チャットを閉じる"
            >
              <FaTimes />
            </button>
          </div>
        </header>

        <div className={styles.chatArea} ref={scrollRef}>
          {messages.length === 0 && (
            <div className={styles.messageGroup}>
              <div className={styles.messageRow}>
                <div className={styles.avatar}>
                  <FaRobot />
                </div>
                <div className={styles.bubble}>
                  こんにちは。FAQから探すか、予約サポートについてご相談いただけます。
                  <div className={styles.timestamp}>09:30</div>
                </div>
              </div>
            </div>
          )}
          {messages.map((m, idx) => (
            <div key={idx} className={styles.messageGroup}>
              <div className={`${styles.messageRow} ${m.from === "user" ? styles.messageRowUser : ""}`}>
                {m.from === "bot" && (
                  <div className={styles.avatar}>
                    <FaRobot />
                  </div>
                )}
                <div className={`${styles.bubble} ${m.from === "user" ? styles.bubbleUser : ""}`}>
                  {m.text}
                  <div className={styles.timestamp}>{m.time}</div>
                </div>
              </div>
            </div>
          ))}
          {isSubmitting && (
            <div className={styles.messageGroup}>
              <div className={styles.messageRow}>
                <div className={styles.avatar}>
                  <FaRobot />
                </div>
                <div className={styles.bubble}>
                  <div className={styles.typing}>
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {showFeedback && (
          <div className="flex justify-center gap-4 my-2">
            <button className={styles.chip} onClick={handleYes}>
              はい👍
            </button>
            <button className={styles.chip} onClick={handleNo}>
              いいえ
            </button>
          </div>
        )}

        {step === "survey" && !selectedCategory && (
          <div className="space-y-3 flex flex-col items-center text-center w-full">
            <p className="text-sm font-medium text-gray-800">カテゴリを選択してください。</p>
            {faqLoading && (
              <p className="text-sm text-gray-600">FAQを読み込み中です…</p>
            )}
            {faqError && !faqLoading && (
              <p className="text-sm text-red-600">{faqError}</p>
            )}
            {!faqLoading && !faqError && faqCategories.length === 0 && (
              <p className="text-sm text-gray-600">表示できるカテゴリがありません。</p>
            )}
            {!faqLoading && !faqError && (
              <div className={styles.chipRow}>
                {visibleCategories.map((cat) => (
                  <button
                    key={cat.id}
                    className={styles.chip}
                    onClick={() => handleCategory(cat)}
                  >
                    {cat.title}
                  </button>
                ))}
              </div>
            )}
            {!faqLoading && !faqError && faqCategories.length > 3 && (
              <button
                className="text-sm text-blue-600 hover:underline"
                onClick={() => setShowAllCategories((prev) => !prev)}
              >
                {showAllCategories ? "カテゴリを閉じる" : "さらに表示"}
              </button>
            )}
          </div>
        )}

        {step === "survey" && selectedCategory && (
          <div className="space-y-3 flex flex-col items-center">
            <button
              onClick={handleBack}
              className="text-sm text-blue-600 hover:underline"
            >
              &larr; カテゴリ選択に戻る
            </button>
            <div className={styles.chipRow}>
              {selectedCategory.faqs.map((faq, idx) => (
                <button
                  key={idx}
                  className={styles.chip}
                  onClick={() => handleQuestion(faq)}
                >
                  {faq.q}
                </button>
              ))}
            </div>
            {loopCount >= 2 && (
              <button
                className={styles.chip}
                onClick={handleFreeStart}
              >
                その他の質問を入力する
              </button>
            )}
          </div>
        )}

        {step === "free" && (
          <div className="space-y-3 flex flex-col items-center">
            <button
              onClick={handleBack}
              className="text-sm text-blue-600 hover:underline"
            >
              &larr; カテゴリ選択に戻る
            </button>
          </div>
        )}

        {step === "free" && suggestions.length > 0 && !confirmingSubmit && (
          <div className="w-full px-3 pb-1">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-2">
              <p className="mb-1 flex items-center text-xs font-semibold text-yellow-800">
                <FaLightbulb className="mr-1" aria-hidden="true" />
                入力内容に近いFAQが見つかりました
              </p>
              <div>
                {suggestions.map((faq, idx) => (
                  <button
                    key={`${faq.categoryTitle}-${idx}`}
                    type="button"
                    className="block w-full rounded-md bg-white px-2 py-1.5 mb-1 text-left text-xs text-gray-800 shadow-sm hover:bg-yellow-100"
                    onClick={() => handleSuggestionSelect(faq)}
                  >
                    <span className="mr-1 text-xs text-yellow-700">
                      [{faq.categoryTitle}]
                    </span>
                    {faq.q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "free" && confirmingSubmit && (
          <div className="w-full px-3 pb-1">
            <div className="rounded-lg border border-red-200 bg-red-50 p-2">
              <p className="mb-1 text-xs font-semibold text-red-800">
                送信前にご確認ください。こちらのFAQで解決しませんか？
              </p>
              <div>
                {suggestions.map((faq, idx) => (
                  <button
                    key={`confirm-${faq.categoryTitle}-${idx}`}
                    type="button"
                    className="block w-full rounded-md bg-white px-2 py-1.5 mb-1 text-left text-xs text-gray-800 shadow-sm hover:bg-red-100"
                    onClick={() => handleSuggestionSelect(faq)}
                  >
                    <span className="mr-1 text-xs text-red-700">
                      [{faq.categoryTitle}]
                    </span>
                    {faq.q}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="mt-2 block w-full rounded-md border border-red-300 bg-white px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                onClick={() => {
                  if (!userId) {
                    setShowLoginPrompt(true);
                    return;
                  }
                  void submitInquiry(freeText.trim());
                }}
                disabled={isSubmitting}
              >
                FAQでは解決しないため、この内容で問い合わせる
              </button>
            </div>
          </div>
        )}

        {step === "free" ? (
          <form onSubmit={handleFreeSubmit} className={styles.composer}>
            <input
              type="text"
              name="free"
              className={styles.input}
              placeholder="質問を入力してください"
              disabled={isSubmitting}
              value={freeText}
              onChange={(event) => {
                setFreeText(event.target.value);
                setConfirmingSubmit(false);
              }}
            />
            <button
              type="submit"
              className={`${styles.composerButton} ${styles.sendButton}`}
              aria-label="送信する"
              disabled={isSubmitting}
            >
              <FaPaperPlane />
            </button>
          </form>
        ) : (
          <div className={styles.composerHidden}>
            <div className={styles.composerHiddenLabel}>
              「その他の質問を入力する」を選択すると入力欄が開きます
            </div>
          </div>
        )}
        {showLoginPrompt && (
          <div className={styles.loginPromptOverlay} role="presentation">
            <div className={styles.loginPromptCard} role="dialog" aria-modal="true">
              <h2 className={styles.loginPromptTitle}>ログインが必要です</h2>
              <p className={styles.loginPromptBody}>
                お問い合わせの送信にはログインが必要です。FAQの検索・閲覧はログインなしでご利用いただけます。
              </p>
              <div className={styles.loginPromptActions}>
                <button
                  type="button"
                  className={styles.loginPromptSecondary}
                  onClick={() => setShowLoginPrompt(false)}
                >
                  閉じる
                </button>
                <a className={styles.loginPromptPrimary} href="/login">
                  ログインする
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
