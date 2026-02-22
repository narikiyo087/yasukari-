import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import SectionHeading from "./SectionHeading";

type Step = {
  img: string;
  alt: string;
  title: string;
  desc: string;
};

export default function HowToUse() {
  const steps: Step[] = [
    {
      img: "/image/howto01_touka.png",
      alt: "店舗選択イラスト",
      title: "1. 店舗を選ぶ",
      desc:
        "足立小台本店（足立区の格安バイク屋）と三ノ輪店（東京都台東区の国道4号線沿いのレンタルバイク店）のどちらから借りるか選択します。三ノ輪店はセルフ店（セルフサービス）です。",
    },
    {
      img: "/image/howto02.png",
      alt: "予約イラスト",
      title: "2. ご予約",
      desc:
        "車両ページでスケジュールを確認しクレジットカードで予約。変更やキャンセルはお問い合わせから連絡してください。",
    },
    {
      img: "/image/howto03.png",
      alt: "来店イラスト",
      title: "3. ご来店",
      desc:
        "10:00〜18:30の間に免許証とヘルメットを持参し、リバイクルK-JETスタッフにお声かけください。",
    },
    {
      img: "/image/howto04.png",
      alt: "返却イラスト",
      title: "4. ご利用・返却",
      desc:
        "ガソリンを満タンにして営業時間中に借りた店舗へ戻り、返却写真を取って返却完了です。返却は10:00〜18:30の間にガソリン満タンでお願いします。",
    },
  ];

  return (
    <section className="section-surface section-padding">
      <SectionHeading
        eyebrow="How to use"
        title="ヤスカリの利用方法"
        description="初めてでも迷わずにステップを完了できるよう、予約から返却までの流れをシンプルにまとめました。"
      />
      <div className="mt-8">
        <Swiper
          modules={[Pagination]}
          pagination={{ clickable: true }}
          spaceBetween={16}
          breakpoints={{
            0: { slidesPerView: 1.1 },
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 4 },
          }}
        >
          {steps.map((step, idx) => (
            <SwiperSlide key={idx} className="h-auto">
              <div className="flex h-full flex-col items-center gap-4 rounded-2xl border border-white/60 bg-white/80 p-6 text-center shadow-[0_20px_42px_-28px_rgba(15,23,42,0.45)]">
                <div className="mx-auto w-44 overflow-hidden rounded-xl bg-white">
                  <img
                    className="h-full w-full object-contain"
                    alt={step.alt}
                    loading="lazy"
                    decoding="async"
                    src={step.img}
                  />
                </div>
                <p className="text-base font-semibold text-slate-800">{step.title}</p>
                <p className="text-sm leading-relaxed text-slate-600">{step.desc}</p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
