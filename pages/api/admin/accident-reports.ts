import type { NextApiRequest, NextApiResponse } from "next";

import { scanAllItems } from "../../../lib/dynamodb";
import type { RegistrationData } from "../../../types/registration";

const USER_TABLE = process.env.USER_TABLE ?? "yasukariUserMain";

type AccidentReportItem = {
  id: string;
  userId: string;
  userName: string;
  email: string;
  phone: string;
  uploadedAt: string;
  imageUrl: string;
  description: string;
};

const formatDateTime = (value?: string): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  }).format(date);
};

const buildName = (record: RegistrationData) =>
  `${record.name1 ?? ""} ${record.name2 ?? ""}`.trim();

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<{ reports: AccidentReportItem[] } | { message: string }>
) {
  if (request.method !== "GET") {
    response.setHeader("Allow", ["GET"]);
    response.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  try {
    const items = await scanAllItems<RegistrationData>({
      TableName: USER_TABLE,
      FilterExpression: "attribute_exists(#report_url)",
      ExpressionAttributeNames: {
        "#report_url": "accident_report_url",
      },
    });

    const reports = items
      .filter((item) => typeof item.accident_report_url === "string")
      .map((item) => {
        const name = buildName(item) || item.email || "-";
        const uploadedAtRaw = item.accident_report_uploaded_at ?? "";
        return {
          id: item.user_id ?? item.email ?? "unknown",
          userId: item.user_id ?? "-",
          userName: name,
          email: item.email ?? "-",
          phone: item.mobile ?? item.tel ?? "-",
          uploadedAt: formatDateTime(uploadedAtRaw),
          imageUrl: item.accident_report_url ?? "",
          description: item.accident_report_description ?? "-",
          uploadedAtRaw,
        };
      })
      .sort((a, b) => {
        const timeA = Date.parse(a.uploadedAtRaw);
        const timeB = Date.parse(b.uploadedAtRaw);
        if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
          return b.uploadedAtRaw.localeCompare(a.uploadedAtRaw);
        }
        return timeB - timeA;
      })
      .map(({ uploadedAtRaw, ...report }) => report);

    response.status(200).json({ reports });
  } catch (error) {
    console.error("Failed to load accident reports", error);
    response.status(500).json({ message: "事故・転倒報告の取得に失敗しました。" });
  }
}
