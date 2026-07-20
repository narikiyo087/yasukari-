import { GetStaticProps } from 'next';
import Head from 'next/head';

import { FAQItem } from '../components/FaqAccordion';
import FaqCategoryAccordion, { FaqCategory } from '../components/FaqCategoryAccordion';
import { readChatbotFaq } from '../lib/server/chatbotFaq';
import { ChatbotFaqCategory } from '../types/chatbotFaq';

type Props = {
  categories: ChatbotFaqCategory[];
};

export default function HelpPage({ categories }: Props) {
  const faqCategories: FaqCategory[] = categories.map((category) => ({
    id: category.id,
    title: category.title,
    faqs: category.faqs,
  }));
  const faqs: FAQItem[] = faqCategories.flatMap((c) => c.faqs);

  return (
    <div className="space-y-12">
      <Head>
        <title>ヘルプ - ヤスカリ</title>
        <meta name="description" content="ヤスカリのヘルプ・よくある質問（FAQ）。料金・保険・予約変更・お問い合わせ方法などをまとめています。" />
        <link rel="canonical" href="https://yasukari.com/help" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ヤスカリ" />
        <meta property="og:title" content="ヘルプ - ヤスカリ" />
        <meta property="og:description" content="ヤスカリのヘルプ・よくある質問（FAQ）。料金・保険・予約変更・お問い合わせ方法などをまとめています。" />
        <meta property="og:url" content="https://yasukari.com/help" />
        <meta property="og:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ヘルプ - ヤスカリ" />
        <meta name="twitter:description" content="ヤスカリのヘルプ・よくある質問（FAQ）。料金・保険・予約変更・お問い合わせ方法などをまとめています。" />
        <meta name="twitter:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
      </Head>

      <section className="grid gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[1.05fr,1fr] md:p-8">
        <div className="overflow-hidden rounded-md border border-slate-200">
          <img
            src="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/faq-barner.jpg"
            alt="ヘルプバナー"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-3 self-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Support Center</p>
          <h1 className="text-2xl font-bold text-slate-900">ヘルプ</h1>
          <p className="text-sm leading-relaxed text-slate-700">
            よくある質問やお問い合わせ方法をまとめました。お困りのときは、まずこちらをご確認ください。
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center justify-center rounded bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-700">
            FAQ
          </span>
          <h2 className="text-xl font-bold text-slate-900">よくある質問</h2>
        </div>
        <FaqCategoryAccordion categories={categories} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            }),
          }}
        />
      </section>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center justify-center rounded bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-700">
            Contact
          </span>
          <h2 className="text-xl font-bold text-slate-900">お問い合わせ</h2>
          <p className="text-sm text-slate-600">お急ぎの際はお電話で、その他はメールや来店でも承ります。</p>
        </div>
        <ul className="divide-y divide-slate-200 rounded-lg bg-slate-50 border border-slate-200">
          <li className="grid grid-cols-1 gap-1 px-4 py-3 text-sm font-medium text-slate-800 sm:grid-cols-[120px,1fr] sm:items-center sm:px-5 sm:py-4">
            <span className="text-red-700">電話</span>
            <span className="font-semibold text-slate-900">03-5856-8200</span>
          </li>
          <li className="grid grid-cols-1 gap-1 px-4 py-3 text-sm font-medium text-slate-800 sm:grid-cols-[120px,1fr] sm:items-center sm:px-5 sm:py-4">
            <span className="text-red-700">メール</span>
            <span className="font-semibold text-slate-900">info@yasukari.com</span>
          </li>
          <li className="grid grid-cols-1 gap-1 px-4 py-3 text-sm font-medium text-slate-800 sm:grid-cols-[120px,1fr] sm:items-center sm:px-5 sm:py-4">
            <span className="text-red-700">住所</span>
            <span className="font-semibold text-slate-900">東京都足立区小台2-9-7 1階</span>
          </li>
        </ul>
      </section>
    </div>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    const data = await readChatbotFaq();
    return {
      props: { categories: data.categories ?? [] },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Failed to load chatbot FAQ data for help page", error);
    return {
      props: { categories: [] },
      revalidate: 60,
    };
  }
};
