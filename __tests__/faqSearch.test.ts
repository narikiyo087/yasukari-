import { extractKeywords, searchFaqs } from '../lib/chatbot/faqSearch';
import type { ChatbotFaqCategory } from '../types/chatbotFaq';

const CATEGORIES: ChatbotFaqCategory[] = [
  {
    id: 'rental',
    title: 'レンタルについて',
    faqs: [
      { q: 'レンタルの延長はできますか？', a: 'マイページから延長のお手続きができます。' },
      { q: 'ヘルメットは借りられますか？', a: 'ヘルメットのレンタルもご用意しています。' },
    ],
  },
  {
    id: 'payment',
    title: 'お支払いについて',
    faqs: [
      { q: '支払い方法は何がありますか？', a: 'クレジットカード決済に対応しています。' },
    ],
  },
];

describe('extractKeywords', () => {
  it('extracts kanji, katakana and ascii tokens', () => {
    expect(extractKeywords('延長したいのですがヘルメットもborrowできますか')).toEqual(
      expect.arrayContaining(['延長', 'ヘルメット', 'borrow'])
    );
  });

  it('ignores hiragana-only fragments', () => {
    expect(extractKeywords('したいのですが')).toEqual([]);
  });
});

describe('searchFaqs', () => {
  it('returns FAQs matching the input keywords with question matches ranked first', () => {
    const results = searchFaqs('レンタルを延長したい', CATEGORIES);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].q).toBe('レンタルの延長はできますか？');
    expect(results[0].categoryTitle).toBe('レンタルについて');
  });

  it('matches answer text with lower weight', () => {
    const results = searchFaqs('クレジットカードは使えますか', CATEGORIES);
    expect(results.map((item) => item.q)).toContain('支払い方法は何がありますか？');
  });

  it('returns empty results for short or unrelated input', () => {
    expect(searchFaqs('あ', CATEGORIES)).toEqual([]);
    expect(searchFaqs('宇宙旅行', CATEGORIES)).toEqual([]);
  });

  it('limits the number of suggestions', () => {
    const results = searchFaqs('レンタル', CATEGORIES, 1);
    expect(results).toHaveLength(1);
  });
});
