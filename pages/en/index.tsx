import React from "react";
import Head from "next/head";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import fs from "fs";
import path from "path";
import { GetStaticProps } from "next";
import {
  FaClock,
  FaTruck,
  FaStar,
  FaHashtag,
  FaMapMarkerAlt,
} from "react-icons/fa";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import BikeModelCarousel from "../../components/BikeModelCarousel";
import BikeLineupEn from "../../components/BikeLineupEn";
import HeroSlider from "../../components/HeroSlider";
import RecentlyViewedEn from "../../components/RecentlyViewedEn";
import FaqAccordion, { FAQItem } from "../../components/FaqAccordion";
import faqData from "../../data/faq_en.json";
import HowToUseEn from "../../components/HowToUseEn";
import SectionHeading from "../../components/SectionHeading";
import { getBikeClasses, getBikeModels, BikeClass, BikeModel } from "../../lib/bikes";

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

export default function HomeEn({ blogSlides, blogTags, bikeModelsAll, bikeClasses, faqItems }: Props) {
  const heroSlides = [
    { img: "https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" },
    { img: "https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide2.jpg" },
  ];

  const faqs = faqItems;

  const hotKeywords = blogTags.slice(0, 12).map((tag) => ({
    label: tag,
    href: `/en/blog_for_custmor/tag/${encodeURIComponent(tag)}?click_from=top_keywords`,
  }));

  const featureHighlights = [
    {
      icon: <FaClock className="text-3xl text-red-500" />,
      title: "24/7 online booking",
      text: "Reserve anytime and manage your schedule through your personal dashboard.",
    },
    {
      icon: <FaTruck className="text-3xl text-red-500" />,
      title: "Professionally maintained",
      text: "Our mechanics inspect each bike before every rental for maximum peace of mind.",
    },
    {
      icon: <FaStar className="text-3xl text-red-500" />,
      title: "Premium support",
      text: "Rental gear, roadside assistance, and multilingual help keep your trip smooth.",
    },
  ];

  const stores = [
    {
      name: "Adachi-Odai Main Store",
      description: "Affordable rental bikes in Adachi-ku with a wide selection ready to ride.",
      img: "https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/1769056287667-dc75b5a4-20d8-46f7-93be-38c35767e257-adachiten-001.jpg",
      href: "/stores#adachi",
    },
    {
      name: "Minowa Store",
      description: "Located along Route 4 in Taito Ward, perfect for quick pick-ups and returns.",
      img: "https://lh3.googleusercontent.com/p/AF1QipO9gfqTiOGXc1xWxE90p1a7asvUFDH4smOC7R48=s680-w680-h510-rw",
      href: "/stores#minowa",
    },
  ];

  return (
    <>
      <Head>
        <title>Yasukari | Affordable Motorcycle & Moped Rentals in Tokyo</title>
        <meta
          name="description"
          content="Yasukari offers affordable motorcycle and moped rentals in Tokyo. Book online 24/7, pick up in Adachi or Minowa, and ride with confidence. ヤスカリ レンタルバイク 格安 東京 原付."
        />
        <meta
          name="keywords"
          content="Yasukari, motorcycle rental Tokyo, moped rental Tokyo, scooter rental Tokyo, affordable rental bike, rental bike Tokyo, Yasukari rental, ヤスカリ, レンタルバイク, 格安, 東京, 原付"
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Yasukari | Affordable Motorcycle & Moped Rentals in Tokyo" />
        <meta
          property="og:description"
          content="Affordable motorcycle and moped rentals in Tokyo with 24/7 online booking. Pick up in Adachi or Minowa and ride today."
        />
        <meta property="og:url" content="https://yasukari.com/en" />
        <meta property="og:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Yasukari | Affordable Motorcycle & Moped Rentals in Tokyo" />
        <meta
          name="twitter:description"
          content="Affordable motorcycle and moped rentals in Tokyo with 24/7 online booking."
        />
        <meta name="twitter:image" content="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/slide.jpg" />
        <link rel="canonical" href="https://yasukari.com/en" />
      </Head>

      <HeroSlider slides={heroSlides} />

      <RecentlyViewedEn />

      <BikeLineupEn bikes={bikeModelsAll} classes={bikeClasses} />

      <section className="section-surface section-padding">
        <SectionHeading
          eyebrow="Stores"
          title="Choose your pick-up location"
          description="Two stores in Tokyo offer quick access and spacious pits to prepare for your journey."
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
                      View details
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
        title="Popular models"
        subtitle="Classic models chosen by riders"
        headingTitle="Classic models chosen by riders"
        headingDescription="A curated lineup balancing comfort, style, and cost—ideal picks even for first-time renters."
        detailLabel="View details"
        pricePrefix="24 hours"
      />

      <section className="section-surface section-padding">
        <SectionHeading
          eyebrow="Why ヤスカリ"
          title="Three reasons riders choose us"
          description="Enjoy a seamless digital experience, meticulously maintained bikes, and supportive staff ready to help before, during, and after your trip."
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

      <HowToUseEn />

      <section className="section-surface section-padding faq-section">
        <div className="faq-section__inner">
          <SectionHeading
            eyebrow="FAQ"
            title="Frequently asked questions"
            description="Find answers on pricing, insurance, and reservation changes. Our support team is only a chat away if you need more help."
          />
          <FaqAccordion faqs={faqs} hideToggle />
          <div className="faq-section__actions mt-8">
            <Link href="/en/beginner" className="btn-primary w-full justify-center sm:w-auto">
              Learn more in the beginner guide
            </Link>
            <Link href="/en/help" className="btn-primary w-full justify-center sm:w-auto">
              See more FAQs
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
          title="Latest updates from the team"
          description="Stay informed with maintenance tips, touring ideas, and important service announcements updated weekly."
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
          title="Hot keywords"
          description="Discover seasonal picks and trending topics to plan your next ride in seconds."
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
    const showEn = meta.showEn === "true";
    if (!showEn) return null;
    return { slug, title, date, eyecatch, tags };
  }).filter((post): post is NonNullable<typeof post> => post !== null);

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
    href: `/en/blog_for_custmor/${p.slug}`,
    img: p.eyecatch || "",
  }));
  const [bikeModelsAll, bikeClasses] = await Promise.all([
    getBikeModels(),
    getBikeClasses(),
  ]);

  return { props: { blogSlides, blogTags, bikeModelsAll, bikeClasses, faqItems }, revalidate: 60 };
};
