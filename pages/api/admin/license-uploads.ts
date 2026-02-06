import type { NextApiRequest, NextApiResponse } from "next";

import { scanAllItems } from "../../../lib/dynamodb";
import type { RegistrationData } from "../../../types/registration";

const USER_TABLE = process.env.USER_TABLE ?? "yasukariUserMain";

type LicenseUploadItem = {
  id: string;
  userId: string;
  userName: string;
  email: string;
  phone: string;
  uploadedAt: string;
  imageUrl: string;
  fileName: string;
  imageCount: number;
  images: {
    imageUrl: string;
    fileName: string;
    uploadedAt: string;
  }[];
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
  response: NextApiResponse<{ uploads: LicenseUploadItem[] } | { message: string }>
) {
  if (request.method !== "GET") {
    response.setHeader("Allow", ["GET"]);
    response.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  try {
    const items = await scanAllItems<RegistrationData>({
      TableName: USER_TABLE,
      FilterExpression: "attribute_exists(#license_url) OR attribute_exists(#license_url_2)",
      ExpressionAttributeNames: {
        "#license_url": "license_image_url",
        "#license_url_2": "license_image_url_2",
      },
    });

    const uploads = items
      .filter(
        (item) =>
          typeof item.license_image_url === "string" ||
          typeof item.license_image_url_2 === "string"
      )
      .map((item) => {
        const name = buildName(item) || item.email || "-";
        const images = [
          {
            imageUrl: item.license_image_url ?? "",
            fileName: item.license_file_name ?? "-",
            uploadedAt: item.license_uploaded_at ?? "",
          },
          {
            imageUrl: item.license_image_url_2 ?? "",
            fileName: item.license_file_name_2 ?? "-",
            uploadedAt: item.license_uploaded_at_2 ?? "",
          },
        ].filter((image) => image.imageUrl);
        const uploadedAtRaw =
          images
            .map((image) => image.uploadedAt)
            .filter(Boolean)
            .sort((a, b) => {
              const timeA = Date.parse(a);
              const timeB = Date.parse(b);
              if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
                return b.localeCompare(a);
              }
              return timeB - timeA;
            })[0] ?? "";
        return {
          id: item.user_id ?? item.email ?? "unknown",
          userId: item.user_id ?? "-",
          userName: name,
          email: item.email ?? "-",
          phone: item.mobile ?? item.tel ?? "-",
          uploadedAt: formatDateTime(uploadedAtRaw),
          imageUrl: images[0]?.imageUrl ?? "",
          fileName: images[0]?.fileName ?? "-",
          imageCount: images.length,
          images,
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
      .map(({ uploadedAtRaw, ...upload }) => upload);

    response.status(200).json({ uploads });
  } catch (error) {
    console.error("Failed to load license uploads", error);
    response.status(500).json({ message: "免許証画像の取得に失敗しました。" });
  }
}
