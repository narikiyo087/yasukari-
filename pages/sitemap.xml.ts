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

type AlternateLink = {
  href: string;
  hreflang: string;
};

const buildUrlEntry = (path: string, alternates: AlternateLink[]) => {
  const fullUrl = `${baseUrl}${path}`;
  const lastmod = new Date().toISOString();
  const alternateLinks = alternates
    .map((alternate) => `\n    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${alternate.href}" />`)
    .join("");

  return `\n  <url>\n    <loc>${fullUrl}</loc>${alternateLinks}\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${path === "/" || path === "/en" ? "1.0" : "0.8"}</priority>\n  </url>`;
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const urlEntries = jaPaths
    .flatMap((jaPath, index) => {
      const enPath = enPaths[index];
      const alternates = [
        { href: `${baseUrl}${jaPath}`, hreflang: "ja" },
        { href: `${baseUrl}${enPath}`, hreflang: "en" },
      ];

      return [buildUrlEntry(jaPath, alternates), buildUrlEntry(enPath, alternates)];
    })
    .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urlEntries}\n</urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();

  return { props: {} };
};

export default function SiteMap() {
  return null;
}
