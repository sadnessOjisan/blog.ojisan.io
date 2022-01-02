import { graphql, PageProps } from "gatsby";
import React, { VFC } from "react";
import { GatsbyImage, getImage, ImageDataLike } from "gatsby-plugin-image";
import Layout from "../components/layout";
import Seo from "../components/seo";
import { MetaInfo } from "../components/meta-info";
import { ArticleBody } from "../components/article-body";

const Template: VFC<PageProps<GatsbyTypes.BlogPostQuery>> = (props) => {
  const { markdownRemark } = props.data; // data.markdownRemark holds your po
  if (markdownRemark === undefined) {
    throw new Error("");
  }
  const { frontmatter, html, excerpt } = markdownRemark;
  if (frontmatter === undefined) {
    throw new Error("");
  }
  const { title, visual, isProtect, created, tags } = frontmatter;

  if (
    title === undefined ||
    visual === undefined ||
    html === undefined ||
    created === undefined ||
    tags === undefined
  )
    throw new Error("should be");
  const image = getImage(visual);
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
        image={visual.childImageSharp?.fluid?.src}
        hatebuHeader={isProtect}
      />
      <div>
        <MetaInfo image={image} tags={tagss} title={title} created={created} />

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
          childImageSharp {
            gatsbyImageData(layout: FULL_WIDTH)
          }
        }
        isProtect
        created
        tags
      }
      excerpt(pruneLength: 140)
    }
  }
`;
