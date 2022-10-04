import { graphql, useStaticQuery } from "gatsby";
import { ComponentType } from "react";

interface Props {
  title?: string;
  imagePath?: string;
  description?: string;
}

/**
 * head component として使われること想定
 * @see: https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-head/
 */
export const HeadFactory: ComponentType<Props> = ({ title, description }) => {
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
  if (!baseData?.title || !baseData?.description || !baseData?.siteUrl) {
    throw new Error("data source is invalid");
  }
  return (
    <>
      <title>{title ? `${title} | ${baseData.title}` : baseData.title}</title>
      <meta
        name="description"
        content={description ? description : baseData.description}
      />
      <meta name="twitter:url" content={baseData.siteUrl} />
      <script type="application/ld+json">
        {`{
        }`}
      </script>
    </>
  );
};
