import { graphql, PageProps } from "gatsby";
import { CardList } from "../components/tags/card-list";

const ListByTag = ({ data }: PageProps<Queries.ArticlesByTagQuery>) => {
  return (
    <div>
      <CardList nodes={data.allMarkdownRemark.nodes} />
    </div>
  );
};

export default ListByTag;

export const postsPaginationQuery = graphql`
  query ArticlesByTag($tag: String!) {
    allMarkdownRemark(
      filter: { frontmatter: { tags: { in: [$tag] } } }
      sort: { fields: [frontmatter___created], order: DESC }
    ) {
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
