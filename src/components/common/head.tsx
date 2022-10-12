import { graphql, useStaticQuery } from "gatsby";
import { ComponentType } from "react";

interface Props {
  title?: string;
  imagePath?: string;
  description?: string;
  created?: string;
  type: "blog" | "article";
  shouldProtect?: boolean;
}

/**
 * head component として使われること想定
 * @see: https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-head/
 */
export const HeadFactory: ComponentType<Props> = ({
  title,
  description,
  imagePath,
  type,
  created,
  shouldProtect,
}) => {
  // 他の場所でも呼び出すなら custom hooks として切り出すべき
  const siteMetaDataQueryResult: Queries.SiteMetaDataQuery =
    useStaticQuery(graphql`
      query SiteMetaData {
        site {
          siteMetadata {
            title
            description
            twitterUsername
            image
            siteUrl
          }
        }
      }
    `);
  const baseData = siteMetaDataQueryResult.site?.siteMetadata;
  if (
    !baseData?.title ||
    !baseData?.description ||
    !baseData?.siteUrl ||
    !baseData.image ||
    !baseData.twitterUsername
  ) {
    throw new Error("data source is invalid");
  }
  const pageTitle = title ? `${title} | ${baseData.title}` : baseData.title;
  const pageDiscription = description ? description : baseData.description;
  const pageImage = imagePath ? imagePath : baseData.image;
  return (
    <>
      <title>{pageTitle}</title>
      <meta property="og:title" content={title} />
      <meta name="og:description" content={pageDiscription} />
      <meta property="og:url" content={baseData.siteUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={baseData.title} />
      <meta property="og:image" content={pageImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={baseData.siteUrl} />
      <meta name="twitter:site" content={baseData.twitterUsername} />
      {shouldProtect && <meta name="Hatena::Bookmark" content="nocomment" />}
      {type === "article" && (
        <script type="application/ld+json">
          {`
        {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": "${title}",
          "image": [
            "${baseData.siteUrl}${pageImage}"
           ],
          "datePublished": "${created}",
          "author": [{
              "@type": "Person",
              "name": "sadnessOjisan",
              "url": "https://ojisan.io"
            }]
        }
        `}
        </script>
      )}
    </>
  );
};
