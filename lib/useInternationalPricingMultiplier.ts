import { useEffect, useState } from "react";

import { INTERNATIONAL_PRICE_MULTIPLIER, isInternationalLocale } from "./pricing";

type UserAttributesResponse = {
  attributes?: Record<string, string>;
};

const getLocaleFromAttributes = (attributes?: Record<string, string>): string => {
  if (!attributes) return "";
  return attributes["custom:locale"] ?? attributes.locale ?? "";
};

const resolveMultiplier = (pageLocale?: string, userLocale?: string): number => {
  const isPageInternational = pageLocale ? isInternationalLocale(pageLocale) : false;
  const isUserInternational = userLocale ? isInternationalLocale(userLocale) : false;
  return isPageInternational || isUserInternational ? INTERNATIONAL_PRICE_MULTIPLIER : 1;
};

const getInitialMultiplier = (pageLocale?: string): number =>
  resolveMultiplier(pageLocale);

export default function useInternationalPricingMultiplier(pageLocale?: string): number {
  const [multiplier, setMultiplier] = useState(() => getInitialMultiplier(pageLocale));

  useEffect(() => {
    let active = true;

    const loadLocale = async () => {
      try {
        const response = await fetch("/api/user/attributes", { credentials: "include" });
        if (!response.ok) return;

        const data = (await response.json()) as UserAttributesResponse;
        const locale = getLocaleFromAttributes(data.attributes);
        if (!active) return;

        setMultiplier(resolveMultiplier(pageLocale, locale));
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
  }, [pageLocale]);

  return multiplier;
}
