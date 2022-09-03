import { graphql, HeadFC, type PageProps } from "gatsby";
import * as React from "react";

const IndexPage = ({ data }: PageProps) => {
  return (
    <main>
      NODE_ENV: {process.env["NODE_ENV"]} / 
      GATSBY_ACTIVE_ENV: {process.env["GATSBY_ACTIVE_ENV"]}
      {/* eslint-disable-next-line */}
      {/* @ts-ignore */}
      {data.allMarkdownRemark.nodes.map((node) => (
        <p key={node.id}>{node.frontmatter.title}</p>
      ))}
    </main>
  );
};

export default IndexPage;

export const query = graphql`
  query HomePageQuery {
    site {
      siteMetadata {
        description
      }
    }
    allMarkdownRemark {
      nodes {
        frontmatter {
          title
        }
      }
    }
  }
`;

export const Head: HeadFC = () => <title>Home Page</title>;
