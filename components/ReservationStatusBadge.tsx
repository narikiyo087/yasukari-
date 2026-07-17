import React from "react";

// Design rule (docs ヤスカリ_デザインルール.md §4): reservation status is shown
// with colour AND label (never colour alone). A small dot reinforces the tone
// for quick scanning while the text keeps it accessible / colour-blind safe.
type Tone = "info" | "warning" | "success" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  info: "bg-blue-50 text-blue-700 ring-blue-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
};

const TONE_DOT: Record<Tone, string> = {
  info: "bg-blue-500",
  warning: "bg-amber-500",
  success: "bg-emerald-500",
  neutral: "bg-slate-400",
};

function toneForStatus(status: string): Tone {
  switch (status) {
    case "予約受付完了":
      return "info";
    case "入金待ち":
      return "warning";
    case "予約完了":
    case "返却完了":
      return "success";
    case "キャンセル":
      return "neutral";
    default:
      return "neutral";
  }
}

export default function ReservationStatusBadge({
  status,
  label,
  className = "",
}: {
  status?: string | null;
  // Optional display override (e.g. an English/i18n label). The tone is always
  // derived from the raw `status`, so colour stays consistent across locales.
  label?: string | null;
  className?: string;
}) {
  const raw = status?.trim() ?? "";
  const displayLabel = label?.trim()
    ? label.trim()
    : raw || "ステータス未設定";
  const tone = toneForStatus(raw);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold ring-1 ${TONE_CLASSES[tone]} ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[tone]}`}
        aria-hidden
      />
      {displayLabel}
    </span>
  );
}
