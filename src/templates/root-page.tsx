import { graphql, Link, PageProps } from "gatsby";
import { HeadFactory } from "../components/common/head";
import { CardList } from "../components/top/card-list";

const RootBlogList = ({
  data,
  pageContext,
}: PageProps<
  Queries.postsPaginationQueryQuery,
  Queries.postsPaginationQueryQueryVariables & {
    // context defined by gatsby-node
    numPages: number;
    currentPage: number;
  }
>) => {
  const isFirst = pageContext.currentPage === 1;
  const isLast = pageContext.currentPage === pageContext.numPages;
  return (
    <div>
      <CardList nodes={data.allMarkdownRemark.nodes} />
      {!isFirst &&
        (pageContext.currentPage - 1 === 1 ? (
          <Link to={`/`}>back</Link>
        ) : (
          <Link to={`/posts/${pageContext.currentPage - 1}`}>back</Link>
        ))}
      {pageContext.currentPage}/{pageContext.numPages}
      {!isLast && (
        <Link to={`/posts/${pageContext.currentPage + 1}`}>next</Link>
      )}
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
        id
        frontmatter {
          path
          title
          visual {
            childImageSharp {
              gatsbyImageData(width: 400)
            }
          }
        }
      }
    }
  }
`;

export const Head = () => <HeadFactory />;
