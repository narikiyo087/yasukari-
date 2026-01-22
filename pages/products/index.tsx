import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { useMemo, useState } from "react";
import { getBikeModels, BikeModel, BikeClass, getBikeClasses } from "../../lib/bikes";
import RecentlyViewed from "../../components/RecentlyViewed";

interface Props {
  bikes: BikeModel[];
  classes: BikeClass[];
}

export default function AllProductsPage({ bikes, classes }: Props) {
  const [selectedClass, setSelectedClass] = useState<number | "all">("all");

  const classLabelMap = useMemo(
    () => new Map(classes.map((cls) => [cls.classId, cls.className])),
    [classes]
  );

  const filteredBikes = useMemo(
    () =>
      bikes.filter((bike) => {
        if (selectedClass === "all") return true;
        return bike.classId === selectedClass;
      }),
    [bikes, selectedClass]
  );

  return (
    <>
      <Head>
        <title>全ての車種一覧 - ヤスカリ</title>
      </Head>
      <main className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
              lineup
            </p>
            <h1 className="text-2xl font-bold">全ての車種一覧</h1>
            <p className="text-sm text-gray-600">
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-700">
              {filteredBikes.length} 件 / 全 {bikes.length} 件
            </div>
            {classes.length > 0 ? (
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <span className="font-semibold">クラスで絞り込む</span>
                <select
                  value={selectedClass}
                  onChange={(e) =>
                    setSelectedClass(
                      e.target.value === "all" ? "all" : Number(e.target.value)
                    )
                  }
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none"
                >
                  <option value="all">すべて</option>
                  {classes.map((cls) => (
                    <option key={cls.classId} value={cls.classId}>
                      {cls.className}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBikes.map((bike) => (
              <Link key={bike.modelCode} href={`/products/${bike.modelCode}`}>
                <div className="group bg-white rounded-2xl shadow-sm p-4 hover:-translate-y-1 hover:shadow-lg transition text-center border border-gray-100 aspect-square flex flex-col">
                  <div className="relative">
                    <img
                      src={bike.img}
                      alt={bike.modelName}
                      className="w-full aspect-[4/3] object-cover rounded-xl mb-3"
                    />
                    {bike.classId && classLabelMap.has(bike.classId) ? (
                      <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-md">
                        {classLabelMap.get(bike.classId)}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-base font-semibold truncate group-hover:text-red-600 transition-colors">
                    {bike.modelName}
                  </div>
                  {bike.description ? (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{bike.description}</p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </div>
        <RecentlyViewed />
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const [bikes, classes] = await Promise.all([getBikeModels(), getBikeClasses()]);
  return { props: { bikes, classes } };
};
