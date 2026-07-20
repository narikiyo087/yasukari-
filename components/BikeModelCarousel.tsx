import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import SectionHeading from "./SectionHeading";

export type BikeItem = {
  modelName: string;
  modelCode: string;
  img: string;
  badge?: string;
  price24h?: string;
};

type Props = {
  items: BikeItem[];
  title?: string;
  subtitle?: string;
  headingTitle?: string;
  headingDescription?: string;
  detailLabel?: string;
  pricePrefix?: string;
};

export default function BikeModelCarousel({
  items,
  title = "POPULAR MODELS",
  subtitle = "Popular models",
  headingTitle,
  headingDescription,
  detailLabel = "詳細を見る",
  pricePrefix = "24時間",
}: Props) {
  const [randomizedItems, setRandomizedItems] = useState(items);
  const description =
    headingDescription ??
    `${
      subtitle ?? "Popular models"
    }. A curated lineup balancing comfort, style, and cost—ideal picks even for first-time renters.`;

  useEffect(() => {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setRandomizedItems(shuffled);
  }, [items]);

  return (
    <section className="section-surface section-padding">
      <SectionHeading
        eyebrow={title}
        title={headingTitle ?? "Classic models chosen by riders"}
        description={description}
      />
      <div className="mt-8">
        <Swiper
          modules={[Autoplay, Pagination]}
          pagination={{ clickable: true }}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          loop
          spaceBetween={16}
          breakpoints={{
            0: { slidesPerView: 1.1 },
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
        >
          {randomizedItems.slice(0, 6).map((item) => (
            <SwiperSlide key={item.modelCode} className="h-auto">
              <article className="group h-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-md">
                <Link
                  href={`/products/${item.modelCode}?click_from=top_modelcarousel`}
                  className="flex h-full flex-col"
                >
                  <div className="bike-model-carousel__image relative aspect-[3/4] w-full overflow-hidden">
                    <img
                      src={item.img}
                      alt={item.modelName}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {item.badge ? (
                      <span className="absolute left-4 top-4 inline-flex items-center rounded border border-slate-200 bg-white/95 px-2.5 py-1 text-xs font-semibold text-red-600">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <div className="bike-model-carousel__body flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
                    <h3 className="card-title text-base font-semibold text-slate-800">{item.modelName}</h3>
                    {item.price24h ? (
                      <p className="text-sm font-semibold text-red-600">{pricePrefix} {item.price24h}</p>
                    ) : null}
                    <span className="text-sm font-semibold text-red-600">{detailLabel} →</span>
                  </div>
                </Link>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
