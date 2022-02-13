import { graphql, PageProps } from "gatsby";
import { getImage, ImageDataLike } from "gatsby-plugin-image";
import React, { VFC } from "react";

import { ArticleBody } from "../components/article-body";
import Layout from "../components/layout";
import { MetaInfo } from "../components/meta-info";
import Seo from "../components/seo";
import { Toc } from "../components/toc";
import { toc } from "./{MarkdownRemark.frontmatter__path}.module.scss";

const Template: VFC<PageProps<GatsbyTypes.BlogPostQuery>> = (props) => {
  const { markdownRemark } = props.data; // data.markdownRemark holds your po
  if (markdownRemark === undefined) {
    throw new Error("");
  }
  const { frontmatter, html, excerpt, tableOfContents } = markdownRemark;
  if (frontmatter === undefined || tableOfContents === undefined) {
    throw new Error("");
  }
  const { title, visual, isProtect, created, tags, path } = frontmatter;

  if (
    title === undefined ||
    visual === undefined ||
    html === undefined ||
    created === undefined ||
    tags === undefined ||
    path === undefined
  )
    throw new Error("should be");

  // HACK: absolutePath があると型変換できないので。
  const image = getImage({ ...visual.childImageSharp } as ImageDataLike);
  if (image === undefined) {
    throw new Error("aa");
  }

  // TODO: throw して narrowing するコードにする
  const tagss = tags.filter((tag) => {
    return typeof tag === "string";
  }) as string[];
  return (
    <Layout>
      <Seo
        title={title}
        description={excerpt}
        image={visual.publicURL}
        hatebuHeader={isProtect}
        jsonLD={JSON.stringify({
          "@context": "http://schema.org",
          "@type": "Article",
          name: title,
          headline: excerpt,
          datePublished: created,
          dateModified: created,
          url: `https://blog.ojisan.io/${path}`,
          mainEntityOfPage: `https://blog.ojisan.io/${path}`,
          image: [`https://blog.ojisan.io/${visual.publicURL}`],
          description: excerpt,
          author: {
            "@type": "Person",
            url: "https://twitter.com/sadnessOjisan",
            name: "sadnessOjisan",
          },
          publisher: {
            "@type": "Organization",
            name: "sadnessOjisan",
            logo: {
              "@type": "ImageObject",
              url: "https://pbs.twimg.com/profile_images/1106559155874074625/doWoL3em_400x400.png",
            },
          },
        })}
      />
      <div>
        <MetaInfo image={image} tags={tagss} title={title} created={created} />
        <div className={toc}>
          <Toc toc={tableOfContents} />
        </div>
        <ArticleBody html={html} />
      </div>
    </Layout>
  );
};

export default Template;

export const pageQuery = graphql`
  query BlogPost($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        title
        path
        visual {
          publicURL
          childImageSharp {
            gatsbyImageData(layout: FULL_WIDTH)
          }
        }
        isProtect
        created
        tags
      }
      tableOfContents
      excerpt(pruneLength: 140)
    }
  }
`;
