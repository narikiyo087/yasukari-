import React from "react";
import Link from "next/link";
import SectionHeading from "./SectionHeading";

export type GenreItem = {
  title: string;
  keywords?: string;
  img?: string;
  href: string;
  badge?: string;
  icon?: React.ReactNode;
};

interface Props {
  items: GenreItem[];
  title?: string;
  subtitle?: string;
  headingTitle?: string;
  headingDescription?: string;
  cardDescription?: string;
  detailLabel?: string;
}

export default function GenreCarousel({
  items,
  title = "RECOMMENDED GENRES",
  subtitle = "Ready-to-rent recommendations",
  headingTitle,
  headingDescription,
  cardDescription =
    "Our staff highlights why these options are popular based on pickup ease, cargo capacity, and comfort so you can find the right fit for your situation.",
  detailLabel = "View details",
}: Props) {
  return (
    <section className="section-surface section-padding">
      <SectionHeading
        eyebrow={title}
        title={headingTitle ?? "Browse by use case"}
        description={
          headingDescription ??
          `${
            subtitle ?? "Recommended genres"
          }. Explore easy-to-imagine categories to find the perfect ride for your needs.`
        }
      />
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {items.slice(0, 9).map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-md bg-red-100/70">
                {item.img ? (
                  <img
                    src={item.img}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-3xl text-red-600">
                    {item.icon}
                  </span>
                )}
                {item.badge ? (
                  <span className="absolute -right-2 -top-2 inline-flex rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold text-slate-800">{item.title}</h3>
                {item.keywords ? (
                  <span className="text-xs font-medium uppercase tracking-wide text-red-600">
                    {item.keywords}
                  </span>
                ) : null}
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              {cardDescription}
            </p>
            <span className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold text-red-600">
              {detailLabel}
              <span aria-hidden>→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
