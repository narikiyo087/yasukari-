import type { NextApiRequest, NextApiResponse } from "next";

import { fetchMemberDetail, updateMemberManagement } from "../../../../lib/adminMembers";

type MemberDetailResponse = Awaited<ReturnType<typeof fetchMemberDetail>>;

const parseRequestBody = (req: NextApiRequest): Record<string, unknown> => {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch (error) {
      throw new Error("リクエストデータが不正です。");
    }
  }
  return req.body as Record<string, unknown>;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "PATCH") {
    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.query;
  const memberId = Array.isArray(id) ? id[0] : id;

  if (!memberId) {
    return res.status(400).json({ message: "会員IDが指定されていません。" });
  }

  if (req.method === "PATCH") {
    try {
      const body = parseRequestBody(req);
      const notesValue = typeof body.notes === "string" ? body.notes.trim() : "";
      const isBlacklistedValue = body.isBlacklisted === true;

      await updateMemberManagement(memberId, {
        notes: notesValue,
        isBlacklisted: isBlacklistedValue,
      });
      return res.status(200).json({
        notes: notesValue,
        isBlacklisted: isBlacklistedValue,
      });
    } catch (error) {
      console.error("Failed to update member notes", error);
      const message =
        error instanceof Error ? error.message : "備考の更新に失敗しました。";
      return res.status(500).json({ message });
    }
  }

  try {
    const detail = await fetchMemberDetail(memberId);
    if (!detail.member) {
      return res.status(404).json({ message: "会員情報が見つかりませんでした。" });
    }
    const response: MemberDetailResponse = detail;
    return res.status(200).json(response);
  } catch (error) {
    console.error("Failed to fetch member detail", error);
    const message =
      error instanceof Error ? error.message : "会員詳細の取得に失敗しました。";
    return res.status(500).json({ message });
  }
}
