import { graphql, useStaticQuery } from "gatsby";
import * as React from "react";
import { Helmet } from "react-helmet";

type Props = {
  description?: string;
  title: string;
  image?: string;
  hatebuHeader?: boolean;
};

const Seo: React.VFC<Props> = ({ image, description, title, hatebuHeader }) => {
  const { site } = useStaticQuery<any>(
    graphql`
      query SeoSite {
        site {
          siteMetadata {
            title
            description
            author
          }
        }
      }
    `
  );
  const {
    title: gqlTitle,
    description: gqlDescription,
    author: gqlAuthor,
  } = site?.siteMetadata || {};

  const metaDescription = description || gqlDescription;
  const defaultTitle = gqlTitle;

  return (
    <Helmet
      htmlAttributes={{
        lang: "ja",
      }}
      title={title}
      titleTemplate={`%s | ${defaultTitle}`}
      meta={[
        {
          name: `description`,
          content: metaDescription,
        },
        {
          property: `og:title`,
          content: title,
        },
        {
          property: `og:description`,
          content: metaDescription,
        },
        {
          property: `og:type`,
          content: `website`,
        },
        {
          name: `twitter:card`,
          content: `summary`,
        },
        {
          name: `twitter:creator`,
          content: gqlAuthor,
        },
        {
          name: `twitter:title`,
          content: title,
        },
        {
          name: `twitter:description`,
          content: metaDescription,
        },
        {
          name: `twitter:image`,
          content: `https://blog.ojisan.io${image}`,
        },
        {
          name: `twitter:card`,
          content: `summary_large_image`,
        },
        hatebuHeader ? { name: `Hatena::Bookmark`, content: `nocomment` } : {},
      ]}
    />
  );
};

export default Seo;
