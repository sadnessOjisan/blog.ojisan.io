import { graphql, PageProps } from "gatsby";
import Img, { FluidObject } from "gatsby-image";
import React, { VFC } from "react";

import Layout from "../components/layout";
import Seo from "../components/seo";
import {
  image,
  imageContainer,
  metaContainer,
  imageWrapper,
} from "./{MarkdownRemark.frontmatter__path}.module.scss";

const Template: VFC<PageProps<GatsbyTypes.BlogPostQuery>> = (props) => {
  const { markdownRemark } = props.data; // data.markdownRemark holds your post data
  const { frontmatter, html, excerpt } = markdownRemark || {};

  const { title, visual, isProtect, created, tags } = frontmatter || {};

  const { fluid } = visual?.childImageSharp || {};
  if (
    title === undefined ||
    fluid === undefined ||
    html === undefined ||
    created === undefined ||
    tags === undefined
  )
    throw new Error("should be");

  return (
    <Layout>
      <Seo
        title={title}
        description={excerpt}
        image={fluid.src}
        hatebuHeader={isProtect}
      />
      <div>
        <div className={imageContainer}>
          <div className={imageWrapper}>
            <Img fluid={fluid} className={image} />
          </div>
          <div className={metaContainer}>
            <div>
              <h1>{title}</h1>
              <time>{created}</time>
            </div>
          </div>
        </div>

        <div
          className="blog-post-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
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
            fluid(maxWidth: 800) {
              base64
              aspectRatio
              src
              srcSet
              sizes
            }
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
