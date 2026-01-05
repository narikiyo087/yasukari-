import type { GetServerSideProps } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yasukaribike.com";

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

const buildUrlEntry = (path: string) => {
  const fullUrl = `${baseUrl}${path}`;
  const lastmod = new Date().toISOString();

  return `\n  <url>\n    <loc>${fullUrl}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${path === "/" || path === "/en" ? "1.0" : "0.8"}</priority>\n  </url>`;
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const urlEntries = [...jaPaths, ...enPaths].map(buildUrlEntry).join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}\n</urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return { props: {} };
};

export default function SiteMap() {
  return null;
}
