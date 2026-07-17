import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function HeroSlider({ slides }: { slides: { img: string }[] }) {
  return (
    <section className="hero-bleed relative mx-auto w-full max-w-none sm:max-w-6xl">
      <div className="section-surface hero-surface overflow-hidden rounded-lg">
        <div className="relative aspect-[16/9] w-full">
          <Swiper
            modules={[Autoplay, Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 4200, disableOnInteraction: false }}
            loop
            className="h-full w-full"
          >
            {slides.map((s, idx) => (
              <SwiperSlide key={idx}>
                <div className="relative h-full w-full">
                  <img
                    src={s.img}
                    alt="バイクレンタルの魅力"
                    width={1280}
                    height={720}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-black/20 to-transparent" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
