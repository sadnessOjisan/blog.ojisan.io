// If you don't want to use TypeScript you can delete this file!
import { graphql, Link, PageProps } from "gatsby";
import * as React from "react";

import Layout from "../components/layout";
import Seo from "../components/seo";

const UsingTypescript: React.FC<PageProps<any>> = (props) => {
  const nodes = props.data.blogs.nodes;
  return (
    <Layout>
      <Seo title="blog.ojisan.io" />
      <h1>
        This is <Link to="/taihi-kankyo-tsukuru">本番が壊れた</Link>
        時用の退避環境
      </h1>
      {nodes.map((node: any) => {
        const { path, title } = node.frontmatter || {};
        if (
          path === null ||
          path === undefined ||
          title === null ||
          title === undefined
        ) {
          throw new Error("should be");
        }
        return (
          <Link key={path} to={path}>
            <div style={{ margin: "10px 0px" }}>{title}</div>
          </Link>
        );
      })}
      <Link to="/">Go back to the homepage</Link>
    </Layout>
  );
};

export default UsingTypescript;

export const query = graphql`
  query BlogPosts {
    blogs: allMarkdownRemark(
      sort: { order: DESC, fields: frontmatter___created }
    ) {
      nodes {
        frontmatter {
          title
          path
          created
          visual {
            childImageSharp {
              fluid {
                base64
                tracedSVG
                srcWebp
                srcSetWebp
                originalImg
                originalName
              }
            }
          }
        }
      }
    }
  }
`;
