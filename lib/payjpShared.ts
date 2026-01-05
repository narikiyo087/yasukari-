export const PAYJP_TEST_EMAILS = [
  "narikiyo_001@jimusuru.info",
  "info@yasukaribike.com",
  "maruyama_001@jimusuru.info",
];

export const isPayjpTestEmail = (email?: string | null) =>
  Boolean(email && PAYJP_TEST_EMAILS.includes(email));
