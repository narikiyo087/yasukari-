import fs from "fs/promises";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  CustomerBlogMeta,
  isValidSlug,
  listCustomerBlogPosts,
  saveCustomerBlogPost,
} from "../../../lib/dashboard/customerBlog";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CustomerBlogMeta[] | CustomerBlogMeta | { error: string }>
) {
  try {
    if (req.method === "GET") {
      const posts = await listCustomerBlogPosts();
      return res.status(200).json(posts);
    }

    if (req.method === "POST") {
      const { slug, title, date, tags, eyecatch, showJa, showEn, content } = req.body ?? {};

      if (!slug || !title || !content) {
        return res
          .status(400)
          .json({ error: "slug, title, content は必須項目です。" });
      }

      if (!isValidSlug(slug)) {
        return res
          .status(400)
          .json({ error: "スラッグの形式が正しくありません。" });
      }

      try {
        const postPath = path.join(process.cwd(), "blog_for_custmor", `${slug}.md`);
        await fs.access(postPath);
        return res
          .status(409)
          .json({ error: "同じスラッグの記事が既に存在します。" });
      } catch {
        // 存在しない場合は作成を続行
      }

      const post = await saveCustomerBlogPost(slug, {
        title,
        date: date ?? undefined,
        tags: tags ?? undefined,
        eyecatch: eyecatch ?? undefined,
        showJa: showJa ?? true,
        showEn: showEn ?? false,
        content,
      });

      return res.status(201).json(post);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("Failed to handle customer blog request", error);
    return res.status(500).json({ error: "サーバーエラーが発生しました。" });
  }
}
