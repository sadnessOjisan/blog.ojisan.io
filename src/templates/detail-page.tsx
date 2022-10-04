import { graphql, HeadProps, Link, PageProps } from "gatsby";
import { DetailPageContext } from "../../gatsby-node";
import { HeadFactory } from "../components/common/head";
import { ContentsHeader } from "../components/detail/contents-header";

const RootBlogList = ({
  data,
  pageContext,
}: PageProps<Queries.DetailPageQueryQuery, DetailPageContext>) => {
  return (
    <div>
      <ContentsHeader markdownMeta={data.markdownRemark?.frontmatter} />
      <div>
        <div
          dangerouslySetInnerHTML={{
            __html: data.markdownRemark?.html || "",
          }}
        ></div>
      </div>
      <div>
        {pageContext.prev?.frontmatter?.path && (
          <Link to={pageContext.prev.frontmatter.path}>prev</Link>
        )}
        {pageContext.next?.frontmatter?.path && (
          <Link to={pageContext.next.frontmatter.path}>next</Link>
        )}{" "}
      </div>
    </div>
  );
};

export default RootBlogList;

export const postsPaginationQuery = graphql`
  query DetailPageQuery($id: String!) {
    markdownRemark(id: { eq: $id }) {
      id
      html
      frontmatter {
        path
        title
        tags
      }
    }
  }
`;

export const Head = ({ data }: HeadProps<Queries.DetailPageQueryQuery>) => {
  if (!data.markdownRemark?.frontmatter?.title) {
    throw new Error("title should be");
  }
  return (
    <HeadFactory
      title={data.markdownRemark?.frontmatter?.title}
      type="article"
    />
  );
};
