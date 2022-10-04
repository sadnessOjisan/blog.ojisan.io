import { graphql, useStaticQuery } from "gatsby";
import { ComponentType, ReactNode } from "react";

interface Props {
  title?: string;
}

export const HeadFactory: ComponentType<Props> = ({ title, children }) => {
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
  console.log(siteMetaDataQueryResult);
  if (!siteMetaDataQueryResult.site?.siteMetadata?.title) {
    throw new Error("data source is invalid");
  }
  return (
    <>
      <title>
        {title
          ? `${title} | ${siteMetaDataQueryResult.site.siteMetadata.title}`
          : siteMetaDataQueryResult.site.siteMetadata.title}
      </title>
    </>
  );
};
