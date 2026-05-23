import fs from "fs/promises";
import path from "path";

export type CustomerBlogMeta = {
  slug: string;
  title: string;
  date?: string;
  tags?: string;
  eyecatch?: string;
  showJa?: boolean;
  showEn?: boolean;
  excerpt?: string;
};

export type CustomerBlogPost = CustomerBlogMeta & {
  content: string;
};

const POSTS_DIR = path.join(process.cwd(), "blog_for_custmor");

export function isValidSlug(slug: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(slug);
}

function parseFrontmatter(markdown: string): {
  meta: Record<string, string>;
  body: string;
} {
  const lines = markdown.split(/\r?\n/);
  const meta: Record<string, string> = {};

  let idx = 0;
  if (lines[idx] === "---") {
    idx++;
    while (idx < lines.length && lines[idx] !== "---") {
      const line = lines[idx];
      const separatorIndex = line.indexOf(":");
      if (separatorIndex >= 0) {
        const key = line.slice(0, separatorIndex).trim();
        const value = line
          .slice(separatorIndex + 1)
          .trim()
          .replace(/^['"]|['"]$/g, "");
        if (key) {
          meta[key] = value;
        }
      }
      idx++;
    }
    if (lines[idx] === "---") {
      idx++;
    }
  }

  const body = lines.slice(idx).join("\n");
  return { meta, body };
}

function buildMarkdown(meta: Record<string, string | undefined>, body: string): string {
  const entries = Object.entries(meta).filter(([, value]) => value != null && value !== "");
  const frontmatter = [
    "---",
    ...entries.map(([key, value]) => `${key}: ${value}`),
    "---",
  ].join("\n");

  const trimmedBody = body.replace(/\s+$/, "");
  return `${frontmatter}\n\n${trimmedBody}\n`;
}

function deriveTitle(meta: Record<string, string>, slug: string, body: string): string {
  if (meta.title) return meta.title;
  const heading = body
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith("# "));
  if (heading) {
    return heading.replace(/^#\s*/, "").trim();
  }
  return slug;
}

function deriveExcerpt(body: string): string | undefined {
  const line = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#"));
  return line?.replace(/\*/g, "").slice(0, 140);
}

async function readPost(slug: string): Promise<CustomerBlogPost> {
  if (!isValidSlug(slug)) {
    throw new Error("Invalid slug");
  }
  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  const markdown = await fs.readFile(filePath, "utf8");
  const { meta, body } = parseFrontmatter(markdown);

  return {
    slug,
    title: deriveTitle(meta, slug, body),
    date: meta.date,
    tags: meta.tags,
    eyecatch: meta.eyecatch,
    showJa: meta.showJa !== "false",
    showEn: meta.showEn === "true",
    excerpt: deriveExcerpt(body),
    content: body,
  };
}

export async function listCustomerBlogPosts(): Promise<CustomerBlogMeta[]> {
  const files = await fs.readdir(POSTS_DIR);
  const posts = await Promise.all(
    files
      .filter((file) => file.endsWith(".md"))
      .map(async (file) => {
        const slug = file.replace(/\.md$/, "");
        const post = await readPost(slug);
        return post;
      })
  );

  return posts.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export async function getCustomerBlogPost(slug: string): Promise<CustomerBlogPost> {
  return readPost(slug);
}

export async function saveCustomerBlogPost(
  slug: string,
  data: {
    title: string;
    date?: string;
    tags?: string;
    eyecatch?: string;
    showJa?: boolean;
    showEn?: boolean;
    content: string;
  }
): Promise<CustomerBlogPost> {
  if (!isValidSlug(slug)) {
    throw new Error("Invalid slug");
  }

  const markdown = buildMarkdown(
    {
      title: data.title,
      date: data.date,
      tags: data.tags,
      eyecatch: data.eyecatch,
      showJa: String(data.showJa ?? true),
      showEn: String(data.showEn ?? false),
    },
    data.content
  );

  await fs.writeFile(path.join(POSTS_DIR, `${slug}.md`), markdown, "utf8");
  return readPost(slug);
}

export async function deleteCustomerBlogPost(slug: string): Promise<void> {
  if (!isValidSlug(slug)) {
    throw new Error("Invalid slug");
  }
  await fs.unlink(path.join(POSTS_DIR, `${slug}.md`));
}
