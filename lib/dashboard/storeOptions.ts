import { STORES } from "../stores";

// 店舗の選択肢。出所は lib/stores.ts の店舗マスタ（ここでは形を変えるだけ）。
// 店舗を追加するときは lib/stores.ts を直す。

export type StoreOption = {
  id: string;
  label: string;
};

export const STORE_OPTIONS: StoreOption[] = STORES.map((s) => ({ id: s.id, label: s.label }));

export const getStoreLabel = (storeId?: string | null): string => {
  if (!storeId) {
    return "-";
  }

  return (
    STORE_OPTIONS.find((option) => option.id === storeId)?.label ?? storeId ?? "-"
  );
};
