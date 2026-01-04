import type { NextApiRequest, NextApiResponse } from "next";

import {
  removeHighSeasonRecord,
  upsertHighSeasonRecord,
} from "../../../lib/server/highSeasonFeeCalendar";

const DATE_PARAM_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<
    { date: string; isHighSeason: boolean } | { message: string }
  >
) {
  const { date } = request.query;

  if (typeof date !== "string" || !DATE_PARAM_PATTERN.test(date)) {
    response.status(400).json({ message: "Invalid date parameter" });
    return;
  }

  if (request.method === "PUT") {
    const { is_high_season: isHighSeason } = request.body ?? {};

    if (isHighSeason !== true && isHighSeason !== false) {
      response.status(400).json({ message: "is_high_season must be boolean" });
      return;
    }

    await upsertHighSeasonRecord({
      date,
      isHighSeason,
    });

    response.status(200).json({
      date,
      isHighSeason,
    });
    return;
  }

  if (request.method === "DELETE") {
    await removeHighSeasonRecord(date);
    response.status(204).end();
    return;
  }

  response.setHeader("Allow", "PUT, DELETE");
  response.status(405).json({ message: "Method Not Allowed" });
}
