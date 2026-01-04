export const INTERNATIONAL_PRICE_MULTIPLIER = 1.5;

export const isInternationalLocale = (locale?: string): boolean => {
  if (!locale) return false;
  const normalized = locale.trim().toLowerCase();
  if (!normalized) return false;
  return !normalized.startsWith("ja");
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
