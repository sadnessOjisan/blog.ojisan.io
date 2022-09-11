import { graphql, PageProps } from "gatsby";
import React from "react";

const RootBlogList = ({ data }: PageProps<Queries.PaginationQueryQuery>) => {
  return (
    <div>
      {data.allMarkdownRemark.nodes.map((node) => (
        <p key={node.frontmatter?.path}>{node.frontmatter?.path}</p>
      ))}
    </div>
  );
};

export default RootBlogList;

export const postsPaginationQuery = graphql`
  query postsPaginationQuery($skip: Int!, $limit: Int!) {
    allMarkdownRemark(
      sort: { fields: [frontmatter___created], order: DESC }
      limit: $limit
      skip: $skip
    ) {
      nodes {
        frontmatter {
          path
        }
      }
    }
  }
`;
