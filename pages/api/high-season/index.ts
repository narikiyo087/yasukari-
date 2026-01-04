import type { NextApiRequest, NextApiResponse } from "next";

import { readHighSeasonRecords } from "../../../lib/server/highSeasonFeeCalendar";

export type HighSeasonResponse = {
  dates: { date: string; isHighSeason: boolean }[];
};

const MONTH_PARAM_PATTERN = /^\d{4}-\d{2}$/;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<HighSeasonResponse | { message: string }>
) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const { month } = request.query;

  if (typeof month !== "string" || !MONTH_PARAM_PATTERN.test(month)) {
    response.status(400).json({ message: "Invalid or missing month parameter" });
    return;
  }

  const monthRecords = await readHighSeasonRecords(month);

  response.status(200).json({ dates: monthRecords });
}
