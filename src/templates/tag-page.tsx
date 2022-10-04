import { graphql, Link, PageProps } from "gatsby";
import { DetailPageContext } from "../../gatsby-node";
import { ContentsHeader } from "../components/detail/contents-header";

const RootBlogList = ({
  data,
  pageContext,
}: PageProps<Queries.ArticlesByTagQuery, DetailPageContext>) => {
  return <div></div>;
};

export default RootBlogList;

export const postsPaginationQuery = graphql`
  query ArticlesByTag($id: [String]) {
    tags: allMarkdownRemark(filter: { frontmatter: { tags: { in: $id } } }) {
      edges {
        node {
          frontmatter {
            tags
          }
        }
      }
    }
  }
`;
