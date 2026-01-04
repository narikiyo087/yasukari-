import { useEffect, useState } from "react";

import { INTERNATIONAL_PRICE_MULTIPLIER, isInternationalLocale } from "./pricing";

type UserAttributesResponse = {
  attributes?: Record<string, string>;
};

const getLocaleFromAttributes = (attributes?: Record<string, string>): string => {
  if (!attributes) return "";
  return attributes["custom:locale"] ?? attributes.locale ?? "";
};

const getInitialMultiplier = (): number => {
  if (typeof window === "undefined") return 1;
  const browserLocale = window.navigator?.language ?? "";
  return isInternationalLocale(browserLocale) ? INTERNATIONAL_PRICE_MULTIPLIER : 1;
};

export default function useInternationalPricingMultiplier(): number {
  const [multiplier, setMultiplier] = useState(getInitialMultiplier);

  useEffect(() => {
    let active = true;

    const loadLocale = async () => {
      try {
        const response = await fetch("/api/user/attributes", { credentials: "include" });
        if (!response.ok) return;

        const data = (await response.json()) as UserAttributesResponse;
        const locale = getLocaleFromAttributes(data.attributes);
        if (!locale || !active) return;

        setMultiplier(
          isInternationalLocale(locale) ? INTERNATIONAL_PRICE_MULTIPLIER : 1
        );
      } catch (error) {
        if (active) {
          console.error("Failed to load user locale for pricing", error);
        }
      }
    };

    void loadLocale();

    return () => {
      active = false;
    };
  }, []);

  return multiplier;
}
