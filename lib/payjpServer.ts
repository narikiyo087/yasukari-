import { isPayjpTestEmail } from "./payjpShared";

export const getPayjpSecretKey = (email?: string | null) => {
  if (isPayjpTestEmail(email)) {
    return process.env.PAYJP_SECRET_KEY_TEST ?? "";
  }
  return process.env.PAYJP_SECRET_KEY ?? "";
};

export const getPayjpSecretKeyError = (email?: string | null) => {
  if (isPayjpTestEmail(email)) {
    return process.env.PAYJP_SECRET_KEY_TEST
      ? ""
      : "PAYJP_SECRET_KEY_TEST が設定されていません。";
  }
  return process.env.PAYJP_SECRET_KEY ? "" : "PAYJP_SECRET_KEY が設定されていません。";
};
