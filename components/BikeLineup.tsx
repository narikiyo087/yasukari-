import React, { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Link from "next/link";
import { BikeClass, BikeModel } from "../lib/bikes";
import SectionHeading from "./SectionHeading";

const fallbackCategories = [
  { label: "401cc以上", value: 0 },
  { label: "251〜400cc", value: 1 },
  { label: "126〜250cc", value: 2 },
  { label: "51〜125cc", value: 3 },
  { label: "50cc以下", value: 4 },
];

function parseDisplacement(bike: BikeModel): number | null {
  const text = bike.spec?.displacement || bike.description;
  if (!text) return null;
  const m = text.match(/([0-9]+)cm/);
  return m ? parseInt(m[1], 10) : null;
}

function getCategory(cc: number | null): number {
  if (cc === null) return 2;
  if (cc <= 50) return 4;
  if (cc <= 125) return 3;
  if (cc <= 250) return 2;
  if (cc <= 400) return 1;
  return 0;
}

type Props = {
  bikes: BikeModel[];
  classes?: BikeClass[];
};

export default function BikeLineup({ bikes, classes }: Props) {
  const categories = useMemo(
    () =>
      classes?.length
        ? classes.map((cls) => ({ label: cls.className, value: cls.classId }))
        : fallbackCategories,
    [classes]
  );

  const resolveStartIndex = (list: typeof categories) => {
    if (!list.length) return 0;
    const preferredLabels = ["50cc 原付スクーター", "50cc原付スクーター", "50cc以下", "原付スクーター"];
    const exactIndex = preferredLabels
      .map((label) => list.findIndex((item) => item.label === label))
      .find((index) => index != null && index >= 0);
    if (exactIndex != null && exactIndex >= 0) return exactIndex;
    const fuzzyIndex = list.findIndex((item) => item.label.includes("50cc"));
    return fuzzyIndex >= 0 ? fuzzyIndex : 0;
  };

  const [activeIndex, setActiveIndex] = useState<number>(
    resolveStartIndex(categories)
  );

  const [isDesktop, setIsDesktop] = useState(false);

  const filter = categories[activeIndex]?.value ?? categories[0]?.value ?? 0;

  useEffect(() => {
    setActiveIndex(resolveStartIndex(categories));
  }, [categories]);

  useEffect(() => {
    const updateIsDesktop = () => setIsDesktop(window.innerWidth >= 768);
    updateIsDesktop();
    window.addEventListener("resize", updateIsDesktop);
    return () => window.removeEventListener("resize", updateIsDesktop);
  }, []);

  const filtered = useMemo(
    () =>
      bikes.filter((b) => {
        if (b.classId != null && categories.some((c) => c.value === b.classId)) {
          return b.classId === filter;
        }
        return getCategory(parseDisplacement(b)) === filter;
      }),
    [bikes, categories, filter]
  );

  const displayList = filtered.slice(0, 6);

  return (
    <section className="section-surface section-padding">
      <SectionHeading
        eyebrow="Bike Lineup"
        title="排気量から人気モデルをチェック"
        description="経験値別にセレクトされた多彩なラインアップ。初心者向けのコンパクトスクーターから、ロングツーリングで頼れる大型ネイキッドまで、好みに合わせて最適な1台が見つかります。"
      />
      <p className="mt-3 text-sm text-slate-600">
        整備済み &amp; 24時間予約対応。用途や体格に合わせたフィット感で、週末のツーリングも安心です。
      </p>

      <div className="lineup-marquee mt-4 overflow-x-auto scroll-row">
        <div className="lineup-marquee__track flex flex-nowrap items-center gap-2 pb-2">
          {[...categories, ...categories].map((c, index) => {
            const originalIndex = index % categories.length;
            const active = activeIndex === originalIndex;
            return (
              <button
                key={`${c.value}-${index}`}
                type="button"
                onClick={() => setActiveIndex(originalIndex)}
                className={`lineup-marquee__button whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 ${
                  active
                    ? "bg-red-600 text-white border border-red-600"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-10">
        <Swiper
          modules={[Pagination, Autoplay]}
          pagination={{ clickable: true }}
          autoplay={
            isDesktop
              ? { delay: 3200, disableOnInteraction: false }
              : undefined
          }
          loop={isDesktop}
          spaceBetween={16}
          breakpoints={{
            0: { slidesPerView: 1.1 },
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
        >
          {displayList.map((bike) => (
            <SwiperSlide key={bike.modelCode} className="h-auto">
              <article className="bike-lineup-card group relative h-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-md">
                <Link href={`/products/${bike.modelCode}`} className="flex h-full flex-col">
                  <div className="bike-lineup-card__image relative aspect-[3/4] w-full overflow-hidden">
                    <img
                      src={bike.img}
                      alt={bike.modelName}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {bike.badge ? (
                      <span className="absolute left-4 top-4 inline-flex items-center rounded border border-slate-200 bg-white/95 px-2.5 py-1 text-xs font-semibold text-red-600">{bike.badge}</span>
                    ) : null}
                  </div>
                  <div className="bike-lineup-card__body flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
                    <h3
                      className="card-title text-base font-semibold text-slate-800"
                      dangerouslySetInnerHTML={{ __html: bike.modelName.replace(/\\n/g, "<br>") }}
                    />
                    <p className="text-sm font-semibold text-red-600">
                      {bike.price24h ? `基本料金 24時間 ${bike.price24h}` : "基本料金 24時間〜"}
                    </p>
                    <span className="text-sm font-semibold text-red-600">
                      詳細を見る →
                    </span>
                  </div>
                </Link>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {filtered.length > displayList.length ? (
        <div className="mt-8 text-center">
          <Link href="/products" className="btn-primary">
            排気量別一覧を見る
          </Link>
        </div>
      ) : null}
    </section>
  );
}
