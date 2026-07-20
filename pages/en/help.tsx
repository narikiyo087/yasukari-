import Head from 'next/head'
import { GetStaticProps } from 'next'

import FaqCategoryAccordion, { FaqCategory } from '../../components/FaqCategoryAccordion'
import { FAQItem } from '../../components/FaqAccordion'
import faqEn from '../../data/faq_en.json'
import { ChatbotFaqCategory, ChatbotFaqData } from '../../types/chatbotFaq'

type Props = {
  categories: ChatbotFaqCategory[]
}

export default function HelpPageEn({ categories }: Props) {
  const faqCategories: FaqCategory[] = categories.map((category) => ({
    id: category.id,
    title: category.title,
    faqs: category.faqs,
  }))
  const faqs: FAQItem[] = faqCategories.flatMap((c) => c.faqs)

  return (
    <div className="space-y-12">
      <Head>
        <title>Help - ヤスカリ</title>
        <meta name="description" content="Yasukari help and FAQ — pricing, insurance, booking changes and how to contact us." />
        <link rel="canonical" href="https://yasukari.com/en/help" />
        <link rel="alternate" hrefLang="ja" href="https://yasukari.com/help" />
        <link rel="alternate" hrefLang="en" href="https://yasukari.com/en/help" />
        <link rel="alternate" hrefLang="x-default" href="https://yasukari.com/help" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yasukari" />
        <meta property="og:title" content="Help - ヤスカリ" />
        <meta property="og:description" content="Yasukari help and FAQ — pricing, insurance, booking changes and how to contact us." />
        <meta property="og:url" content="https://yasukari.com/en/help" />
        <meta property="og:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Help - ヤスカリ" />
        <meta name="twitter:description" content="Yasukari help and FAQ — pricing, insurance, booking changes and how to contact us." />
        <meta name="twitter:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
      </Head>

      <section className="grid gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[1.05fr,1fr] md:p-8">
        <div className="overflow-hidden rounded-md ring-1 ring-slate-100">
          <img
            src="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/faq-barner.jpg"
            alt="Help banner"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-3 self-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Support Center</p>
          <h1 className="text-2xl font-bold text-slate-900">Help</h1>
          <p className="text-sm leading-relaxed text-slate-700">
            Find answers to common questions and how to reach us. Please check here first if you run into trouble.
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center justify-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-700">
            FAQ
          </span>
          <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-600">Browse questions by category in the accordion below.</p>
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
          <span className="inline-flex items-center justify-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-700">
            Contact
          </span>
          <h2 className="text-xl font-bold text-slate-900">Contact Us</h2>
          <p className="text-sm text-slate-600">For urgent matters, please call. Email and in-person visits are also welcome.</p>
        </div>
        <ul className="divide-y divide-slate-200 rounded-md bg-red-50/60 ring-1 ring-red-100">
          <li className="grid grid-cols-1 gap-1 px-4 py-3 text-sm font-medium text-slate-800 sm:grid-cols-[120px,1fr] sm:items-center sm:px-5 sm:py-4">
            <span className="text-red-700">Phone</span>
            <span className="font-semibold text-slate-900">03-5856-8200</span>
          </li>
          <li className="grid grid-cols-1 gap-1 px-4 py-3 text-sm font-medium text-slate-800 sm:grid-cols-[120px,1fr] sm:items-center sm:px-5 sm:py-4">
            <span className="text-red-700">Email</span>
            <span className="font-semibold text-slate-900">info@yasukari.com</span>
          </li>
          <li className="grid grid-cols-1 gap-1 px-4 py-3 text-sm font-medium text-slate-800 sm:grid-cols-[120px,1fr] sm:items-center sm:px-5 sm:py-4">
            <span className="text-red-700">Address</span>
            <span className="font-semibold text-slate-900">2-9-7 Odai, Adachi-ku, Tokyo 1F</span>
          </li>
        </ul>
      </section>
    </div>
  )
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const data = faqEn as ChatbotFaqData
  return {
    props: { categories: data.categories ?? [] },
    revalidate: 60,
  }
}
