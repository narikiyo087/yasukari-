import { useEffect, useState } from "react";
import Head from "next/head";

import type { Accessory } from "../lib/dashboard/types";

const accessoryTableColumns = [
  { label: "1日", keys: ["1d", "24h"] },
  { label: "3日", keys: ["3d", "2d", "4d"] },
  { label: "1週間", keys: ["1w"] },
  { label: "2週間", keys: ["2w"] },
  { label: "1ヶ月", keys: ["1m"] },
  { label: "追加料金24時間", keys: ["extra24h"] },
] as const;

const formatAccessoryTablePrice = (price?: number) =>
  typeof price === "number" ? `${price.toLocaleString()}円` : "—";

const getAccessoryTablePrice = (
  prices: Accessory["prices"],
  keys: readonly string[]
) => {
  const priceMap = prices as Record<string, number | undefined>;
  return keys
    .map((key) => priceMap[key])
    .find((value) => typeof value === "number");
};

export default function OptionsPage() {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [accessoryError, setAccessoryError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const loadAccessories = async () => {
      try {
        const response = await fetch("/api/accessories", { signal: controller.signal });
        if (!response.ok) {
          throw new Error("Failed to load accessories");
        }
        const data = (await response.json()) as Accessory[] | { accessories?: Accessory[] };
        if (Array.isArray(data)) {
          setAccessories(data);
        } else {
          setAccessories(data.accessories ?? []);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to load accessories", error);
        setAccessoryError("用品一覧の取得に失敗しました。");
      }
    };

    loadAccessories();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <>
      <Head>
        <title>用品オプションの説明 | Yasukari</title>
      </Head>
      <main className="bg-gray-50 py-12">
        <div className="mx-auto w-full max-w-5xl px-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-6">
            <div className="space-y-2">
              <h1 className="text-lg font-bold text-gray-900">用品オプションの説明</h1>
              <p className="text-sm text-gray-600">
                ご希望の用品オプションをご確認いただけます。
              </p>
            </div>
            <img
              src="https://yasukari-file.s3.ap-northeast-1.amazonaws.com/PhotoUploads/1767026374539-623432f1-b568-4baa-ac07-b18b108d8751-rentalitem.jpg"
              alt="用品オプションの説明"
              className="w-full rounded-xl border border-gray-100 object-cover"
            />
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-900">用品一覧</h2>
              {accessoryError ? (
                <p className="text-xs text-red-600">{accessoryError}</p>
              ) : null}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="border-b border-gray-200 text-[11px] font-semibold text-gray-500">
                    <tr>
                      <th className="px-3 py-2">レンタルオプション</th>
                      {accessoryTableColumns.map((column) => (
                        <th key={column.label} className="px-3 py-2">
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {accessories.map((accessory) => (
                      <tr key={accessory.accessory_id}>
                        <td className="px-3 py-2 font-semibold text-gray-900">
                          {accessory.name}
                        </td>
                        {accessoryTableColumns.map((column) => (
                          <td key={column.label} className="px-3 py-2">
                            {formatAccessoryTablePrice(
                              getAccessoryTablePrice(accessory.prices, column.keys)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {accessories.length === 0 ? (
                      <tr>
                        <td
                          colSpan={accessoryTableColumns.length + 1}
                          className="px-3 py-3 text-center text-gray-500"
                        >
                          用品一覧のデータがありません。
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
