import type { NextApiRequest, NextApiResponse } from "next";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

import { getDocumentClient } from "../../../../lib/dynamodb";
import { fetchReservationById } from "../../../../lib/reservations";
import type { RegistrationData } from "../../../../types/registration";

const TABLE_NAME = "yasukariUserMain";

type RegistrationResponse = {
  registration: RegistrationData | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegistrationResponse | { message: string }>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const reservationId = req.query.reservationId;
  if (typeof reservationId !== "string") {
    return res.status(400).json({ message: "reservationId is required" });
  }

  try {
    const reservation = await fetchReservationById(reservationId);
    if (!reservation?.memberId) {
      return res.status(404).json({ message: "予約情報が見つかりませんでした。" });
    }

    const client = getDocumentClient();
    const { Item } = await client.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { user_id: reservation.memberId },
      })
    );

    if (!Item) {
      return res.status(404).json({ message: "本登録情報が見つかりません。", registration: null });
    }

    return res.status(200).json({ registration: Item as RegistrationData });
  } catch (error) {
    console.error("Failed to load registration by reservation", error);
    const message =
      error instanceof Error ? error.message : "本登録情報の取得に失敗しました。";
    return res.status(500).json({ message });
  }
}
