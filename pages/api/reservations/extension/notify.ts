import type { NextApiRequest, NextApiResponse } from "next";

import { COGNITO_ID_TOKEN_COOKIE, verifyCognitoIdToken } from "../../../../lib/cognitoServer";
import { sendRentalExtensionCompletionEmail } from "../../../../lib/rentalExtensionCompletionEmail";
import { fetchReservationById } from "../../../../lib/reservations";

type ExtensionNotifyRequest = {
  reservationId?: string;
  previousReturnAt?: string;
  newReturnAt?: string;
  extensionDays?: number;
  amount?: number;
  paymentId?: string;
};

type ExtensionNotifyResponse = {
  ok: true;
  simulated: boolean;
};

const parseDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExtensionNotifyResponse | { error: string }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method ?? "unknown"} Not Allowed` });
  }

  const token = req.cookies?.[COGNITO_ID_TOKEN_COOKIE];
  const payload = await verifyCognitoIdToken(token);
  if (!payload?.sub) {
    return res.status(401).json({ error: "認証が必要です" });
  }

  const body = req.body as ExtensionNotifyRequest;
  if (!body.reservationId || typeof body.reservationId !== "string") {
    return res.status(400).json({ error: "reservationId is required" });
  }
  if (!body.previousReturnAt || typeof body.previousReturnAt !== "string") {
    return res.status(400).json({ error: "previousReturnAt is required" });
  }
  if (!body.newReturnAt || typeof body.newReturnAt !== "string") {
    return res.status(400).json({ error: "newReturnAt is required" });
  }
  if (typeof body.extensionDays !== "number" || Number.isNaN(body.extensionDays)) {
    return res.status(400).json({ error: "extensionDays is required" });
  }
  if (typeof body.amount !== "number" || Number.isNaN(body.amount)) {
    return res.status(400).json({ error: "amount is required" });
  }

  const reservation = await fetchReservationById(body.reservationId);
  if (!reservation) {
    return res.status(404).json({ error: "予約が見つかりませんでした" });
  }

  const storedReturnAt = parseDate(reservation.returnAt);
  const requestedReturnAt = parseDate(body.newReturnAt);
  if (storedReturnAt && requestedReturnAt && storedReturnAt.getTime() !== requestedReturnAt.getTime()) {
    return res.status(409).json({ error: "返却日時が最新ではありません" });
  }

  try {
    const result = await sendRentalExtensionCompletionEmail({
      reservation,
      previousReturnAt: body.previousReturnAt,
      newReturnAt: body.newReturnAt,
      extensionDays: body.extensionDays,
      amount: body.amount,
      paymentId: body.paymentId,
    });

    return res.status(200).json({ ok: true, simulated: result.simulated });
  } catch (error) {
    console.error("Failed to send rental extension completion email", error);
    return res.status(500).json({ error: "レンタル延長完了メールの送信に失敗しました。" });
  }
}
