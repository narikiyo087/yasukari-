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
      </Head>

      <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm md:grid-cols-[1.05fr,1fr] md:p-8">
        <div className="overflow-hidden rounded-xl ring-1 ring-slate-100">
          <img
            src="https://yasukari.com/static/images/faq/barner.jpg"
            alt="Help banner"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-3 self-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Support Center</p>
          <h1 className="text-2xl font-bold text-slate-900">Help</h1>
          <p className="text-sm leading-relaxed text-slate-700">
            Find answers to common questions and how to reach us. Please check here first if you run into trouble.
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm md:p-8">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center justify-center rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-700">
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

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm md:p-8">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center justify-center rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-700">
            Contact
          </span>
          <h2 className="text-xl font-bold text-slate-900">Contact Us</h2>
          <p className="text-sm text-slate-600">For urgent matters, please call. Email and in-person visits are also welcome.</p>
        </div>
        <ul className="divide-y divide-slate-200 rounded-xl bg-rose-50/60 ring-1 ring-rose-100">
          <li className="grid grid-cols-1 gap-1 px-4 py-3 text-sm font-medium text-slate-800 sm:grid-cols-[120px,1fr] sm:items-center sm:px-5 sm:py-4">
            <span className="text-rose-700">Phone</span>
            <span className="font-semibold text-slate-900">03-5856-8200</span>
          </li>
          <li className="grid grid-cols-1 gap-1 px-4 py-3 text-sm font-medium text-slate-800 sm:grid-cols-[120px,1fr] sm:items-center sm:px-5 sm:py-4">
            <span className="text-rose-700">Email</span>
            <span className="font-semibold text-slate-900">info@yasukari.com</span>
          </li>
          <li className="grid grid-cols-1 gap-1 px-4 py-3 text-sm font-medium text-slate-800 sm:grid-cols-[120px,1fr] sm:items-center sm:px-5 sm:py-4">
            <span className="text-rose-700">Address</span>
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
