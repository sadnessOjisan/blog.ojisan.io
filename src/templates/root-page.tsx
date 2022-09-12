import { graphql, PageProps } from "gatsby";
import { CardList } from "../components/top/card-list";

const RootBlogList = ({
  data,
}: PageProps<Queries.postsPaginationQueryQuery>) => {
  console.log("data: ", data);
  return (
    <div>
      <CardList nodes={data.allMarkdownRemark.nodes} />
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
        }
      }
    }
  }
`;
