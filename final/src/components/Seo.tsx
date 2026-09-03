import { Helmet } from "react-helmet-async";

interface SeoProps {
  title: string;
  description?: string;
  noindex?: boolean;
  ogImage?: string;
  jsonLd?: Record<string, unknown>;
}

export const Seo = ({ title, description, noindex, ogImage, jsonLd }: SeoProps) => {
  const fullTitle = title.includes("SkinScan") ? title : `${title} | SkinScan AI`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content="website" />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "/"} />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
};
