import fs from "fs";
import path from "path";
import type { GetServerSideProps } from "next";
import { getBikeModels } from "../lib/bikes";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yasukari.com";

// Collect published (showJa !== false) blog post slugs for the sitemap.
const getBlogSlugs = (): string[] => {
  try {
    const dir = path.join(process.cwd(), "blog_for_custmor");
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .filter((file) => {
        const md = fs.readFileSync(path.join(dir, file), "utf8");
        const fm = md.match(/^---\n([\s\S]*?)\n---/);
        return !fm || !/showJa:\s*false/.test(fm[1]);
      })
      .map((file) => file.replace(/\.md$/, ""));
  } catch (error) {
    console.error("sitemap: failed to read blog posts", error);
    return [];
  }
};

// Core pages that exist in both Japanese and English.
const jaPaths = [
  "/",
  "/pricing",
  "/stores",
  "/guide",
  "/beginner",
  "/company",
  "/contact",
  "/insurance",
  "/privacy",
  "/terms",
  "/tokusyouhou",
  "/products",
  "/blog_for_custmor",
  "/news",
];

const enPaths = jaPaths.map((path) => (path === "/" ? "/en" : `/en${path}`));

// Japanese-only pages (no /en counterpart): genre landings + news detail.
const jaOnlyPaths = [
  "/t/genre/scooter-50cc",
  "/t/genre/scooter-125cc",
  "/t/genre/cc126-250",
  "/t/genre/cc251-400",
  "/t/genre/cc400-plus",
  "/t/genre/moped-manual",
  "/t/genre/gyrocanopy-moped",
  "/t/genre/gyrocanopy-minicar",
  "/news/minowa-24hour-rental",
  "/news/site-renewal",
];

type AlternateLink = {
  href: string;
  hreflang: string;
};

const buildUrlEntry = (
  path: string,
  alternates: AlternateLink[],
  priority = "0.8"
) => {
  const fullUrl = `${baseUrl}${path}`;
  const lastmod = new Date().toISOString();
  const alternateLinks = alternates
    .map(
      (alternate) =>
        `\n    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${alternate.href}" />`
    )
    .join("");

  const resolvedPriority = path === "/" || path === "/en" ? "1.0" : priority;

  return `\n  <url>\n    <loc>${fullUrl}</loc>${alternateLinks}\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${resolvedPriority}</priority>\n  </url>`;
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // Paired ja/en core pages.
  const coreEntries = jaPaths.flatMap((jaPath, index) => {
    const enPath = enPaths[index];
    const alternates = [
      { href: `${baseUrl}${jaPath}`, hreflang: "ja" },
      { href: `${baseUrl}${enPath}`, hreflang: "en" },
    ];
    return [buildUrlEntry(jaPath, alternates), buildUrlEntry(enPath, alternates)];
  });

  // Japanese-only pages.
  const jaOnlyEntries = jaOnlyPaths.map((path) =>
    buildUrlEntry(path, [{ href: `${baseUrl}${path}`, hreflang: "ja" }], "0.6")
  );

  // Individual bike model pages (dynamic). Defensive: if the catalog can't be
  // loaded, fall back to the static entries above instead of failing.
  let productEntries: string[] = [];
  try {
    const models = await getBikeModels();
    const seen = new Set<string>();
    productEntries = models.flatMap((model) => {
      const code = model.modelCode;
      if (!code || seen.has(code)) return [];
      seen.add(code);
      const jaPath = `/products/${encodeURIComponent(code)}`;
      const enPath = `/en/products/${encodeURIComponent(code)}`;
      const alternates = [
        { href: `${baseUrl}${jaPath}`, hreflang: "ja" },
        { href: `${baseUrl}${enPath}`, hreflang: "en" },
      ];
      return [
        buildUrlEntry(jaPath, alternates, "0.7"),
        buildUrlEntry(enPath, alternates, "0.7"),
      ];
    });
  } catch (error) {
    console.error("sitemap: failed to load bike models", error);
  }

  // Individual blog posts.
  const blogEntries = getBlogSlugs().map((slug) => {
    const p = `/blog_for_custmor/${slug}`;
    return buildUrlEntry(p, [{ href: `${baseUrl}${p}`, hreflang: "ja" }], "0.6");
  });

  const urlEntries = [
    ...coreEntries,
    ...jaOnlyEntries,
    ...productEntries,
    ...blogEntries,
  ].join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urlEntries}\n</urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return { props: {} };
};

export default function SiteMap() {
  return null;
}
