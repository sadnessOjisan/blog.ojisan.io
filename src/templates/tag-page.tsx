import { graphql, PageProps } from "gatsby";
import { CardList } from "../components/tags/card-list";

const ListByTag = ({
  data,
  pageContext,
}: PageProps<Queries.ArticlesByTagQuery>) => {
  console.log(data);
  console.log(pageContext);
  return (
    <div>
      <CardList nodes={data.allMarkdownRemark.nodes} />
    </div>
  );
};

export default ListByTag;

export const postsPaginationQuery = graphql`
  query ArticlesByTag($tag: String!) {
    allMarkdownRemark(filter: { frontmatter: { tags: { in: [$tag] } } }) {
      nodes {
        id
        frontmatter {
          path
          title
          created
          path
        }
      }
    }
  }
`;
