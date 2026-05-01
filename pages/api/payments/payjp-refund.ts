import type { NextApiRequest, NextApiResponse } from "next";

import { COGNITO_ID_TOKEN_COOKIE, verifyCognitoIdToken } from "../../../../lib/cognitoServer";
import { getPayjpSecretKey, getPayjpSecretKeyError } from "../../../../lib/payjpServer";

type RefundRequest = {
  chargeId?: string;
  email?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<{ refunded?: boolean; error?: string }>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method ?? "unknown"} Not Allowed` });
  }

  const token = req.cookies?.[COGNITO_ID_TOKEN_COOKIE];
  const payload = await verifyCognitoIdToken(token);
  if (!payload?.sub) {
    return res.status(401).json({ error: "認証が必要です" });
  }

  const body = req.body as RefundRequest;
  if (!body.chargeId) {
    return res.status(400).json({ error: "chargeId が必要です。" });
  }

  try {
    const secretKeyError = getPayjpSecretKeyError(body.email);
    if (secretKeyError) {
      return res.status(500).json({ error: secretKeyError });
    }

    const secretKey = getPayjpSecretKey(body.email);
    const basicAuth = Buffer.from(`${secretKey}:`).toString("base64");

    const response = await fetch(`https://api.pay.jp/v1/charges/${body.chargeId}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "",
    });

    const responseData = (await response.json()) as { refunded?: boolean; error?: { message?: string } };

    if (!response.ok || !responseData.refunded) {
      return res.status(400).json({ error: responseData.error?.message ?? "返金処理に失敗しました。" });
    }

    return res.status(200).json({ refunded: true });
  } catch (error) {
    console.error("Failed to refund Pay.JP charge", error);
    return res.status(500).json({ error: "返金処理中にエラーが発生しました。" });
  }
}
