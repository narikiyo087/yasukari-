import React from "react";
import Head from "next/head";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import fs from "fs";
import path from "path";
import { GetStaticProps } from "next";
import { FaClock, FaTruck, FaStar, FaHashtag, FaMapMarkerAlt } from "react-icons/fa";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import BikeModelCarousel from "../components/BikeModelCarousel";
import BikeLineup from "../components/BikeLineup";
import HeroSlider from "../components/HeroSlider";
import RecentlyViewed from "../components/RecentlyViewed";
import HowToUse from "../components/HowToUse";
import SectionHeading from "../components/SectionHeading";
import FaqAccordion, { FAQItem } from "../components/FaqAccordion";
import faqData from "../data/faq.json";
import { getBikeClasses, getBikeModels, BikeClass, BikeModel } from "../lib/bikes";

type BlogSlide = {
  title: string;
  href: string;
  img: string;
};

interface Props {
  blogSlides: BlogSlide[];
  blogTags: string[];
  bikeModelsAll: BikeModel[];
  bikeClasses: BikeClass[];
  faqItems: FAQItem[];
}

export default function HomePage({ blogSlides, blogTags, bikeModelsAll, bikeClasses, faqItems }: Props) {
  const heroSlides = [
    { img: "https://yasukari.com/static/images/home/slide.jpg" },
    { img: "https://yasukari.com/static/images/home/slide2.jpg" },
  ];

  const faqs = faqItems;

  const hotKeywords = blogTags.slice(0, 12).map((tag) => ({
    label: tag,
    href: `/blog_for_custmor/tag/${encodeURIComponent(tag)}?click_from=top_keywords`,
  }));

  const featureHighlights = [
    {
      icon: <FaClock className="text-3xl text-red-500" />,
      title: "24時間スマート予約",
      text: "お支払いまでオンラインで完結。マイページで変更も柔軟に行えます。",
    },
    {
      icon: <FaTruck className="text-3xl text-red-500" />,
      title: "メンテナンス済みの安心車両",
      text: "プロの整備士がコンディションをチェックし、いつでもベストな状態でご用意。",
    },
    {
      icon: <FaStar className="text-3xl text-red-500" />,
      title: "レンタル特典とサポート",
      text: "充実の装備レンタルとロードサービスで、初めての長距離でも安心です。",
    },
  ];

  const stores = [
    {
      name: "足立小台本店",
      description: "足立区にある格安バイク屋です。",
      img: "https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/1769056287667-dc75b5a4-20d8-46f7-93be-38c35767e257-adachiten-001.jpg",
      href: "/stores#adachi",
    },
    {
      name: "三ノ輪店",
      description: "東京都台東区の国道4号線沿いにあるレンタルバイク店です。",
      img: "https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/1767016149538-9b1cfb29-74c6-4fad-b328-2ce52642b64f-unnamed.webp",
      href: "/stores#minowa",
    },
  ];

  return (
    <>
      <Head>
        <title>ヤスカリ - バイクレンタルサイト</title>
      </Head>

      <HeroSlider slides={heroSlides} />

      <RecentlyViewed />

      <BikeLineup bikes={bikeModelsAll} classes={bikeClasses} />

      <section className="section-surface section-padding">
        <SectionHeading
          eyebrow="Stores"
          title="お近くの店舗を選ぶ"
          description="都内2店舗で営業中。アクセスの良い立地と広々としたピットで、受け取りから返却まで快適にご利用いただけます。三ノ輪店はセルフ店（セルフサービス）です。"
        />
        <div className="mt-8">
          <Swiper
            modules={[Pagination]}
            pagination={{ clickable: true }}
            spaceBetween={16}
            breakpoints={{
              0: { slidesPerView: 1.05 },
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 2 },
            }}
          >
            {stores.map((store) => (
              <SwiperSlide key={store.name} className="h-auto">
                <article className="group h-full overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-[0_28px_42px_-30px_rgba(15,23,42,0.6)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_36px_62px_-34px_rgba(220,38,38,0.45)]">
                  <div className="store-card__image relative aspect-[3/4] w-full overflow-hidden">
                    <img
                      src={store.img}
                      alt={store.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-red-500 shadow">
                      <FaMapMarkerAlt />
                      {store.name}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 sm:py-6">
                    <p className="text-sm text-slate-600">{store.description}</p>
                    <Link href={store.href} className="inline-flex items-center gap-2 text-sm font-semibold text-red-500">
                      詳細を見る
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      <BikeModelCarousel
        items={bikeModelsAll}
        title="人気モデル"
        subtitle="ライダーに選ばれる定番モデル"
        headingTitle="ライダーに選ばれる定番モデル"
        headingDescription="快適さとデザイン、価格のバランスに優れ、初めてのレンタルにもおすすめのラインアップです。"
      />

      <section className="section-surface section-padding">
        <SectionHeading
          eyebrow="Why ヤスカリ"
          title="選ばれる3つの理由"
          description="スムーズな予約体験、整備士による徹底管理、そしてライダー目線のサポート。最新のオンライン体験で、旅の準備時間をぐっと短縮します。"
        />
        <div className="mt-8">
          <Swiper
            modules={[Pagination]}
            pagination={{ clickable: true }}
            spaceBetween={16}
            breakpoints={{
              0: { slidesPerView: 1.1 },
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {featureHighlights.map((feature) => (
              <SwiperSlide key={feature.title} className="h-auto">
                <FeatureHighlight {...feature} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      <HowToUse />

      <section className="section-surface section-padding faq-section">
        <div className="faq-section__inner">
          <SectionHeading
            eyebrow="FAQ"
            title="よくある質問"
            description="料金・保険・予約変更など、よくいただく質問をまとめました。もっと詳しく知りたいときは、ヘルプページもご覧ください。"
          />
          <FaqAccordion faqs={faqs} hideToggle />
          <div className="faq-section__actions mt-8">
            <Link href="/beginner" className="btn-primary w-full justify-center sm:w-auto">
              はじめてガイドで利用の流れを詳しく知る
            </Link>
            <Link href="/help" className="btn-primary w-full justify-center sm:w-auto">
              その他のよくあるご質問をもっと見る
            </Link>
          </div>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: faqs.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              }),
            }}
          />
        </div>
      </section>

      <section className="section-surface section-padding">
        <SectionHeading
          eyebrow="News & Blog"
          title="新着ブログ・お知らせ"
          description="店舗からのお知らせや、レンタルのコツをスタッフが発信中。旅前の準備に役立つコンテンツを毎週更新しています。"
        />
        <div className="mt-8">
          <Swiper
            modules={[Autoplay, Navigation, Pagination]}
            spaceBetween={16}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 3200 }}
            loop
            breakpoints={{
              0: { slidesPerView: 1 },
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {blogSlides.map((card, index) => (
              <SwiperSlide key={index}>
                <Link href={card.href} className="block h-full">
                  <div className="blog-slide blog-slide--compact h-full">
                    <img src={card.img} alt={card.title} className="h-full w-full object-cover" />
                    <div className="blog-slide-title">{card.title}</div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      <section className="section-surface section-padding">
        <SectionHeading
          eyebrow="Trending Now"
          title="注目キーワード"
          description="季節のおすすめや人気カテゴリから、気になるトピックをすぐにチェックできます。気軽な散策から本格ツーリングまで、あなたの目的に合うキーワードをピックアップ。"
        />
        <div className="flex flex-wrap items-center gap-3 pb-2">
          {hotKeywords.map((k, idx) => (
            <Link
              key={idx}
              href={k.href}
              className="group inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_12px_28px_-18px_rgba(220,38,38,0.35)] transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-white whitespace-nowrap md:whitespace-normal"
            >
              <FaHashtag className="text-base text-red-500 transition group-hover:text-red-600" />
              <span>{k.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function FeatureHighlight({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="feature-highlight-card flex h-full flex-col gap-4 rounded-2xl border border-white/60 bg-white/80 p-6 text-center shadow-[0_20px_40px_-28px_rgba(15,23,42,0.4)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_32px_52px_-28px_rgba(220,38,38,0.4)]">
      <div className="feature-highlight-card__icon mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100/70 text-red-500">
        {icon}
      </div>
      <h3 className="card-title text-lg font-semibold text-slate-800">{title}</h3>
      <p className="feature-highlight-card__text text-sm leading-relaxed text-slate-600">{text}</p>
    </article>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const faqs: FAQItem[] = (faqData as any).categories.flatMap((c: any) => c.faqs);
  for (let i = faqs.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [faqs[i], faqs[j]] = [faqs[j], faqs[i]];
  }
  const faqItems = faqs.slice(0, 10);
  const dir = path.join(process.cwd(), "blog_for_custmor");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  const posts = files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const md = fs.readFileSync(path.join(dir, file), "utf8");
    const lines = md.split(/\r?\n/);
    let idx = 0;
    const meta: Record<string, string> = {};
    if (lines[idx] === "---") {
      idx++;
      while (idx < lines.length && lines[idx] !== "---") {
        const [k, ...v] = lines[idx].split(":");
        if (k) meta[k.trim()] = v.join(":").trim().replace(/^"|"$/g, "");
        idx++;
      }
      idx++;
    }
    const heading = lines.find((l) => l.startsWith("# "));
    const title = meta.title || (heading ? heading.replace(/^#\s*/, "") : slug);
    const date = meta.date || slug.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || "";
    const eyecatch = meta.eyecatch || undefined;
    const tags = meta.tags;
    return { slug, title, date, eyecatch, tags };
  });

  posts.sort((a, b) => b.date.localeCompare(a.date));
  const tagSet = new Set<string>();
  posts.forEach((post) => {
    post.tags?.split(",").forEach((tag) => {
      const trimmed = tag.trim();
      if (trimmed) tagSet.add(trimmed);
    });
  });
  const blogTags = Array.from(tagSet);

  const blogSlides: BlogSlide[] = posts.slice(0, 10).map((p) => ({
    title: p.title,
    href: `/blog_for_custmor/${p.slug}`,
    img: p.eyecatch || "",
  }));
  const [bikeModelsAll, bikeClasses] = await Promise.all([
    getBikeModels(),
    getBikeClasses(),
  ]);

  return { props: { blogSlides, blogTags, bikeModelsAll, bikeClasses, faqItems }, revalidate: 60 };
};
