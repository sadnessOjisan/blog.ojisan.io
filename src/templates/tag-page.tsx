import { graphql, Link, PageProps } from "gatsby";

const ListByTag = ({
  data,
  pageContext,
}: PageProps<Queries.ArticlesByTagQuery>) => {
  console.log(data);
  console.log(pageContext);
  return (
    <div>
      {data.allMarkdownRemark.edges.map((t) => (
        <Link
          to={t.node.frontmatter?.path || ""}
          key={t.node.frontmatter?.path}
        >
          <div>{t.node.frontmatter?.title}</div>
        </Link>
      ))}
    </div>
  );
};

export default ListByTag;

export const postsPaginationQuery = graphql`
  query ArticlesByTag($tag: String!) {
    allMarkdownRemark(filter: { frontmatter: { tags: { in: [$tag] } } }) {
      edges {
        node {
          frontmatter {
            title
            tags
            created
            path
          }
        }
      }
    }
  }
`;
