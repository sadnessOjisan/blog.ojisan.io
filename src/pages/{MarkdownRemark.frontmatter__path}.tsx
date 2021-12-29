import { graphql, PageProps } from "gatsby";
import Img, { FluidObject } from "gatsby-image";
import React, { VFC } from "react";

import Layout from "../components/layout";
import Seo from "../components/seo";

const Template: VFC<PageProps<any>> = (props) => {
  const { markdownRemark } = props.data; // data.markdownRemark holds your post data
  const { frontmatter, html, excerpt } = markdownRemark || {};

  const { title, visual, isProtect } = frontmatter;

  const { fluid } = visual.childImageSharp || {};
  if (fluid === null || fluid === undefined) throw new Error("should be");

  return (
    <Layout>
      <Seo
        title={title}
        description={excerpt}
        image={fluid.src}
        hatebuHeader={isProtect}
      />
      <div className="blog-post">
        <h1>{frontmatter.title}</h1>
        <Img
          fluid={fluid as FluidObject}
          style={{ maxHeight: 500, marginBottom: 32 }}
        />
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
      }
      excerpt(pruneLength: 140)
    }
  }
`;
