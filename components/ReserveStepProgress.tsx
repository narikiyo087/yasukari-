import React from "react";

// Reservation flow progress (design system §8: "ステップ").
// step1 内容確認 -> step2 オプション -> step3 お支払い -> 完了
const DEFAULT_STEPS = ["内容確認", "オプション", "お支払い", "完了"];

export default function ReserveStepProgress({
  current,
  steps = DEFAULT_STEPS,
  ariaLabel = "予約の進捗",
  className = "",
}: {
  current: 1 | 2 | 3 | 4;
  // Optional label override (e.g. English on /en). Length should match DEFAULT_STEPS.
  steps?: string[];
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <nav aria-label={ariaLabel} className={`w-full ${className}`}>
      <ol className="flex items-center">
        {steps.map((label, i) => {
          const n = i + 1;
          const state =
            n < current ? "done" : n === current ? "current" : "upcoming";
          const isLast = n === steps.length;
          return (
            <li
              key={label}
              className={`flex items-center ${isLast ? "flex-none" : "flex-1"}`}
            >
              <div className="flex items-center gap-2">
                <span
                  aria-current={state === "current" ? "step" : undefined}
                  className={[
                    "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1",
                    state === "done"
                      ? "bg-red-600 text-white ring-red-600"
                      : state === "current"
                        ? "bg-white text-red-700 ring-red-600"
                        : "bg-white text-slate-400 ring-slate-300",
                  ].join(" ")}
                >
                  {state === "done" ? "✓" : n}
                </span>
                <span
                  className={[
                    "text-xs font-semibold whitespace-nowrap",
                    state === "current"
                      ? "text-red-700"
                      : state === "done"
                        ? "text-slate-700"
                        : "text-slate-400",
                  ].join(" ")}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <span
                  aria-hidden
                  className={`mx-2 h-px flex-1 ${
                    n < current ? "bg-red-600" : "bg-slate-200"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
