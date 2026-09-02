// 海外のお客様向けの料金倍率。既定は2倍。
// 変更は環境変数 NEXT_PUBLIC_INTL_PRICE_MULTIPLIER で（クライアント側でも使うため NEXT_PUBLIC_）。
// ビルド時に埋め込まれるので、変更後は再デプロイが必要。
const parsedMultiplier = Number(process.env.NEXT_PUBLIC_INTL_PRICE_MULTIPLIER);
export const INTERNATIONAL_PRICE_MULTIPLIER =
  Number.isFinite(parsedMultiplier) && parsedMultiplier > 0 ? parsedMultiplier : 2;

export const isInternationalLocale = (locale?: string): boolean => {
  if (!locale) return false;
  const normalized = locale.trim().toLowerCase();
  if (!normalized) return false;
  return !(normalized.startsWith("ja") || normalized.startsWith("jp"));
};

export const parseYenPrice = (value: string): number | undefined => {
  const sanitized = value.replace(/[^\d.]/g, "");
  if (!sanitized) return undefined;
  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const formatYen = (value: number): string => `${value.toLocaleString()}円`;

export const applyInternationalMultiplier = (value: number, multiplier: number): number =>
  multiplier === 1 ? value : Math.round(value * multiplier);

export const formatAdjustedYenPrice = (
  value: string | number | undefined,
  multiplier: number
): string | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return formatYen(applyInternationalMultiplier(value, multiplier));
  }
  if (typeof value === "string") {
    const parsed = parseYenPrice(value);
    if (parsed == null) {
      return value;
    }
    return formatYen(applyInternationalMultiplier(parsed, multiplier));
  }
  return undefined;
};
