import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";

// Unified approval queue (docs ヤスカリ_サイト構成_設計.md §7):
// consolidate 免許証確認 / 事故・転倒報告 / 返却完了確認 into one place so
// pending items are not overlooked. Read-only aggregation of the existing
// admin endpoints — no change to how each queue is processed.

type ApprovalItem = {
  id: string;
  userId?: string;
  userName?: string;
  email?: string;
  phone?: string;
  uploadedAt?: string;
};

type QueueConfig = {
  key: string;
  title: string;
  endpoint: string;
  dataKey: "uploads" | "reports";
  listHref: string;
  detailHref: ((id: string) => string) | null;
};

const QUEUES: QueueConfig[] = [
  {
    key: "license",
    title: "免許証確認",
    endpoint: "/api/admin/license-uploads",
    dataKey: "uploads",
    listHref: "/admin/dashboard/photo-uploads/license-uploads",
    detailHref: (id) => `/admin/dashboard/photo-uploads/license-uploads/${id}`,
  },
  {
    key: "accident",
    title: "事故・転倒報告",
    endpoint: "/api/admin/accident-reports",
    dataKey: "reports",
    listHref: "/admin/dashboard/photo-uploads/accident-reports",
    detailHref: (id) => `/admin/dashboard/photo-uploads/accident-reports/${id}`,
  },
  {
    key: "return",
    title: "返却完了確認",
    endpoint: "/api/admin/return-completions",
    dataKey: "reports",
    listHref: "/admin/dashboard/photo-uploads/return-completions",
    detailHref: null,
  },
];

const MAX_ROWS = 6;

type QueueState = {
  items: ApprovalItem[];
  isLoading: boolean;
  error: boolean;
};

const initialState: QueueState = { items: [], isLoading: true, error: false };

export default function ApprovalsHubPage() {
  const [states, setStates] = useState<Record<string, QueueState>>(() =>
    Object.fromEntries(QUEUES.map((q) => [q.key, initialState]))
  );

  useEffect(() => {
    let isMounted = true;
    QUEUES.forEach(async (queue) => {
      try {
        const response = await fetch(queue.endpoint);
        if (!response.ok) {
          throw new Error(`Failed to load ${queue.key}`);
        }
        const data = (await response.json()) as Record<string, ApprovalItem[]>;
        const items = data[queue.dataKey] ?? [];
        if (isMounted) {
          setStates((prev) => ({
            ...prev,
            [queue.key]: { items, isLoading: false, error: false },
          }));
        }
      } catch (error) {
        console.error("Failed to load approval queue", queue.key, error);
        if (isMounted) {
          setStates((prev) => ({
            ...prev,
            [queue.key]: { items: [], isLoading: false, error: true },
          }));
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <Head>
        <title>承認待ち（統合） | 管理ダッシュボード</title>
      </Head>
      <DashboardLayout
        title="承認待ち（統合）"
        description="免許証確認・事故/転倒報告・返却完了確認の確認待ちを1画面に集約しています。見落とし防止のため、ここから各詳細へ進めます。"
      >
        <div className="flex flex-col gap-6">
          {/* Summary tiles */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {QUEUES.map((queue) => {
              const state = states[queue.key];
              return (
                <Link
                  key={queue.key}
                  href={queue.listHref}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {queue.title}
                  </p>
                  <p className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold tabular-nums text-slate-900">
                      {state.isLoading ? "…" : state.error ? "—" : state.items.length}
                    </span>
                    <span className="text-xs text-slate-500">
                      {state.error ? "取得失敗" : "件 確認待ち"}
                    </span>
                  </p>
                </Link>
              );
            })}
          </div>

          {/* Per-queue lists */}
          {QUEUES.map((queue) => {
            const state = states[queue.key];
            const visible = state.items.slice(0, MAX_ROWS);
            const remaining = state.items.length - visible.length;
            return (
              <section
                key={queue.key}
                className="rounded-lg border border-slate-200 bg-white shadow-sm"
              >
                <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      {queue.title}
                    </h2>
                    {!state.isLoading && !state.error ? (
                      <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 tabular-nums">
                        {state.items.length}
                      </span>
                    ) : null}
                  </div>
                  <Link
                    href={queue.listHref}
                    className="text-sm font-semibold text-red-600 hover:text-red-700"
                  >
                    すべて見る →
                  </Link>
                </header>

                {state.isLoading ? (
                  <p className="px-4 py-6 text-sm text-slate-500">読み込み中です…</p>
                ) : state.error ? (
                  <p className="px-4 py-6 text-sm text-red-700">
                    取得に失敗しました。時間をおいて再度お試しください。
                  </p>
                ) : state.items.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-slate-500">
                    現在、確認待ちはありません。
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {visible.map((item) => {
                      const href = queue.detailHref
                        ? queue.detailHref(item.id)
                        : queue.listHref;
                      return (
                        <li key={item.id}>
                          <Link
                            href={href}
                            className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {item.userName || "（氏名未取得）"}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {[item.email, item.uploadedAt]
                                  .filter(Boolean)
                                  .join(" ・ ")}
                              </p>
                            </div>
                            <span className="flex-shrink-0 text-sm font-semibold text-red-600">
                              確認
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                    {remaining > 0 ? (
                      <li className="px-4 py-3 text-center">
                        <Link
                          href={queue.listHref}
                          className="text-sm font-semibold text-slate-600 hover:text-slate-900"
                        >
                          他 {remaining} 件を見る
                        </Link>
                      </li>
                    ) : null}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </DashboardLayout>
    </>
  );
}
