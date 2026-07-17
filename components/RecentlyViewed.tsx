import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { BikeModel } from "../lib/bikes";
import SectionHeading from "./SectionHeading";

export default function RecentlyViewed() {
  const [bikes, setBikes] = useState<BikeModel[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("recentBikes");
      if (stored) {
        setBikes(JSON.parse(stored));
      }
    } catch {
      // ignore parsing errors
    }
  }, []);

  const displayList = useMemo(() => bikes.slice(0, 6), [bikes]);
  const hasMore = bikes.length > displayList.length;

  if (bikes.length === 0) return null;

  return (
    <section className="section-surface section-padding">
      <SectionHeading
        eyebrow="Recently Viewed"
        title="最近チェックしたモデル"
        description="履歴からすぐに再アクセス。気になっていたモデルを見逃さず、比較検討がスムーズに進められます。"
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
          {displayList.map((bike) => (
            <SwiperSlide key={bike.modelCode} className="h-auto">
              <article className="recently-viewed-card group h-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-md">
                <Link href={`/products/${bike.modelCode}`} className="flex h-full flex-col">
                  <div className="recently-viewed-card__image relative aspect-[3/4] w-full overflow-hidden">
                    <img
                      src={bike.img}
                      alt={bike.modelName}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="recently-viewed-card__body flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
                    <h3
                      className="card-title text-base font-semibold text-slate-800"
                      dangerouslySetInnerHTML={{ __html: bike.modelName.replace(/\\n/g, "<br>") }}
                    />
                    <span className="text-sm font-semibold text-red-600">詳細を見る →</span>
                  </div>
                </Link>
              </article>
            </SwiperSlide>
          ))}
          {hasMore ? (
            <SwiperSlide className="h-auto">
              <div className="flex h-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
                <p className="font-semibold">すべての履歴をチェックする</p>
                <Link href="/products" className="btn-primary">
                  もっと見る
                </Link>
              </div>
            </SwiperSlide>
          ) : null}
        </Swiper>
      </div>
    </section>
  );
}
