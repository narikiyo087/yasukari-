import React from "react";
import { FaCaretRight } from "react-icons/fa";
import SectionHeading from "./SectionHeading";

type Step = {
  img: string;
  alt: string;
  title: string;
  desc: string;
};

export default function HowToUseEn() {
  const steps: Step[] = [
    {
      img: "/image/howto01_touka.png",
      alt: "Choose store illustration",
      title: "1. Choose a store",
      desc: "Select either the Adachi-Odai main store or the Minowa store along Route 4.",
    },
    {
      img: "/image/howto02.png",
      alt: "Reservation illustration",
      title: "2. Reserve",
      desc: "Check availability on the bike page and complete your booking online with a credit card.",
    },
    {
      img: "/image/howto03.png",
      alt: "Visit illustration",
      title: "3. Visit",
      desc: "Bring your license and helmet between 10:00 and 18:30 and speak to our staff.",
    },
    {
      img: "/image/howto04.png",
      alt: "Return illustration",
      title: "4. Ride & Return",
      desc: "Only the contract holder may ride and return the bike. Please refuel before returning.",
    },
  ];

  return (
    <section className="section-surface section-padding">
      <SectionHeading
        eyebrow="How to use"
        title="How to use ヤスカリ"
        description="Follow these four steps and enjoy a seamless rental experience from reservation to return."
      />
      <div className="flex flex-col items-stretch justify-center gap-6 md:flex-row md:items-start md:gap-4">
        {steps.map((step, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <FaCaretRight className="hidden text-2xl text-red-300 md:block" />
            )}
            <div className="flex flex-1 flex-col items-center gap-4 rounded-2xl border border-white/60 bg-white/80 p-6 text-center shadow-[0_20px_42px_-28px_rgba(15,23,42,0.45)]">
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
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
