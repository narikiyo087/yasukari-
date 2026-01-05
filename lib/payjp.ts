import { isPayjpTestEmail } from "./payjpShared";

export const getPayjpPublicKey = (email?: string | null) => {
  if (isPayjpTestEmail(email)) {
    return process.env.NEXT_PUBLIC_PAYJP_PUBLIC_KEY_TEST ?? "";
  }
  return process.env.NEXT_PUBLIC_PAYJP_PUBLIC_KEY ?? "";
};

export const getPayjpPublicKeyError = (email?: string | null) => {
  if (isPayjpTestEmail(email)) {
    return process.env.NEXT_PUBLIC_PAYJP_PUBLIC_KEY_TEST
      ? ""
      : "Pay.JP のテスト公開鍵が設定されていません。管理者にお問い合わせください。";
  }
  return process.env.NEXT_PUBLIC_PAYJP_PUBLIC_KEY
    ? ""
    : "Pay.JP の公開鍵が設定されていません。管理者にお問い合わせください。";
};
