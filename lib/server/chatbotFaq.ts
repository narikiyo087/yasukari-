import { ChatbotFaqCategory, ChatbotFaqData, ChatbotFaqItem } from "../../types/chatbotFaq";
import { loadSettingDoc, saveSettingDoc } from "./settingsStore";

// チャットボット・FAQのデータ。保存は lib/server/settingsStore.ts（DynamoDB、
// ローカルは data/chatbot-faq.json）。デプロイで編集内容が消えないようにするため。
// ※ data/faq.json は初回シード時代の旧ファイル。移行初期値は chatbot-faq.json 側を使う。

const KEY = "chatbot-faq";
const FILE = "chatbot-faq.json";

function sanitizeFaqItem(item: ChatbotFaqItem): ChatbotFaqItem | null {
  if (!item) return null;

  const q = typeof item.q === "string" ? item.q.trim() : "";
  const a = typeof item.a === "string" ? item.a.trim() : "";

  if (!q || !a) {
    return null;
  }

  return { q, a };
}

function sanitizeCategory(category: ChatbotFaqCategory): ChatbotFaqCategory | null {
  if (!category || typeof category !== "object") {
    return null;
  }

  const id = typeof category.id === "string" ? category.id.trim() : "";
  const title = typeof category.title === "string" ? category.title.trim() : "";
  const faqs = Array.isArray(category.faqs)
    ? category.faqs
        .map((faq) => sanitizeFaqItem(faq))
        .filter((faq): faq is ChatbotFaqItem => Boolean(faq))
    : [];

  if (!id || !title || faqs.length === 0) {
    return null;
  }

  return { id, title, faqs };
}

function normalizeData(data: Partial<ChatbotFaqData>): ChatbotFaqData {
  const categories = Array.isArray(data.categories)
    ? data.categories
        .map((category) => sanitizeCategory(category as ChatbotFaqCategory))
        .filter((category): category is ChatbotFaqCategory => Boolean(category))
    : [];

  return {
    categories,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : undefined,
  };
}

export async function readChatbotFaq(): Promise<ChatbotFaqData> {
  const doc = (await loadSettingDoc(KEY, FILE)) as Partial<ChatbotFaqData> | null;
  if (!doc) {
    return { categories: [] };
  }
  return normalizeData(doc);
}

export async function writeChatbotFaq(data: ChatbotFaqData): Promise<ChatbotFaqData> {
  const sanitized = normalizeData(data);
  const payload: ChatbotFaqData = {
    ...sanitized,
    updatedAt: new Date().toISOString(),
  };
  await saveSettingDoc(KEY, FILE, payload);
  return payload;
}
