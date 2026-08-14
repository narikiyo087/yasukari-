import type { ChatbotFaqCategory, ChatbotFaqItem } from "../../types/chatbotFaq";

export type FaqSuggestion = ChatbotFaqItem & {
  categoryTitle: string;
  score: number;
};

const MIN_QUERY_LENGTH = 2;
const DEFAULT_LIMIT = 3;

const normalize = (value: string): string =>
  value
    .normalize("NFKC")
    .toLowerCase()
    .trim();

/**
 * 日本語はスペース区切りされないため、入力文から意味を持ちやすい単位
 * （英数字の連続・カタカナの連続・漢字の連続）をキーワードとして抜き出す。
 * ひらがなのみの断片（助詞・語尾など）は検索ノイズになるため除外する。
 */
export const extractKeywords = (input: string): string[] => {
  const normalized = normalize(input);
  const matches = normalized.match(
    /[a-z0-9]{2,}|[゠-ヿー]{2,}|[一-鿿]+/g
  );

  if (!matches) return [];
  return Array.from(new Set(matches));
};

/**
 * 入力テキストに関連するFAQをスコア順に返す。
 * 質問文への一致を回答文への一致より重く評価する。
 */
export const searchFaqs = (
  input: string,
  categories: ChatbotFaqCategory[],
  limit = DEFAULT_LIMIT
): FaqSuggestion[] => {
  if (normalize(input).length < MIN_QUERY_LENGTH) return [];

  const keywords = extractKeywords(input);
  if (keywords.length === 0) return [];

  const scored: FaqSuggestion[] = [];

  for (const category of categories) {
    for (const faq of category.faqs) {
      const question = normalize(faq.q);
      const answer = normalize(faq.a);

      let score = 0;
      for (const keyword of keywords) {
        if (question.includes(keyword)) score += 3;
        else if (answer.includes(keyword)) score += 1;
      }

      if (score > 0) {
        scored.push({ ...faq, categoryTitle: category.title, score });
      }
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
