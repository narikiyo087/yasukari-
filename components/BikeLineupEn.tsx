import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BikeClass, BikeModel } from "../lib/bikes";
import SectionHeading from "./SectionHeading";

const fallbackCategories = [
  { label: "Over 401cc", value: 0 },
  { label: "251-400cc", value: 1 },
  { label: "126-250cc", value: 2 },
  { label: "51-125cc", value: 3 },
  { label: "50cc and below", value: 4 },
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

export default function BikeLineupEn({ bikes, classes }: Props) {
  const categories = useMemo(
    () =>
      classes?.length
        ? classes.map((cls) => ({ label: cls.className, value: cls.classId }))
        : fallbackCategories,
    [classes]
  );

  const [filter, setFilter] = useState<number>(categories[2]?.value ?? categories[0]?.value ?? 0);

  useEffect(() => {
    setFilter(categories[2]?.value ?? categories[0]?.value ?? 0);
  }, [categories]);

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
        eyebrow="Bike Line Up"
        title="Find the perfect displacement"
        description="From nimble 50cc scooters to powerful 400cc+ tourers, explore curated picks tuned for different riding styles."
      />

      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {categories.map((c) => {
          const active = filter === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => setFilter(c.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                active
                  ? "bg-red-500 text-white shadow-lg shadow-red-200/60"
                  : "bg-white/70 text-slate-600 hover:bg-white/90 border border-white/60"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {displayList.map((bike) => (
          <article
            key={bike.modelCode}
            className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-[0_28px_42px_-30px_rgba(15,23,42,0.6)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_32px_56px_-28px_rgba(220,38,38,0.4)]"
          >
            <Link href={`/en/products/${bike.modelCode}`} className="flex h-full flex-col">
              <div className="bike-lineup-card__image relative aspect-[3/4] w-full overflow-hidden">
                <img
                  src={bike.img}
                  alt={bike.modelName}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {bike.badge ? (
                  <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-red-500 shadow">
                    {bike.badge}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
                <h3
                  className="text-base font-semibold text-slate-800"
                  dangerouslySetInnerHTML={{ __html: bike.modelName.replace(/\\n/g, "<br>") }}
                />
                <p className="text-sm text-slate-500">
                  Maintained by certified mechanics and ready for your next ride at a moment’s notice.
                </p>
                <span className="text-sm font-semibold text-red-500">View details →</span>
              </div>
            </Link>
          </article>
        ))}
      </div>

      {filtered.length > displayList.length ? (
        <div className="mt-8 text-center">
          <Link href="/en/products" className="btn-primary">
            View all bikes by displacement
          </Link>
        </div>
      ) : null}
    </section>
  );
}
