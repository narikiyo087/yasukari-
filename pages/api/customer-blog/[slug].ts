import type { NextApiRequest, NextApiResponse } from "next";
import {
  CustomerBlogPost,
  deleteCustomerBlogPost,
  getCustomerBlogPost,
  isValidSlug,
  saveCustomerBlogPost,
} from "../../../lib/dashboard/customerBlog";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CustomerBlogPost | { error: string }>
) {
  const { slug } = req.query;
  const slugString = Array.isArray(slug) ? slug[0] : slug;

  if (!slugString || !isValidSlug(slugString)) {
    return res.status(400).json({ error: "不正なスラッグです。" });
  }

  try {
    if (req.method === "GET") {
      const post = await getCustomerBlogPost(slugString);
      return res.status(200).json(post);
    }

    if (req.method === "PUT") {
      const { title, date, tags, eyecatch, showJa, showEn, content } = req.body ?? {};

      if (!title || !content) {
        return res
          .status(400)
          .json({ error: "title と content は必須項目です。" });
      }

      const post = await saveCustomerBlogPost(slugString, {
        title,
        date: date ?? undefined,
        tags: tags ?? undefined,
        eyecatch: eyecatch ?? undefined,
        showJa: showJa ?? true,
        showEn: showEn ?? false,
        content,
      });

      return res.status(200).json(post);
    }

    if (req.method === "DELETE") {
      await deleteCustomerBlogPost(slugString);
      return res.status(204).end();
    }

    res.setHeader("Allow", "GET, PUT, DELETE");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error(`Failed to handle customer blog request for ${slugString}`, error);
    return res.status(500).json({ error: "サーバーエラーが発生しました。" });
  }
}
