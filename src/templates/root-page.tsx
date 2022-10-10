import { graphql, PageProps } from "gatsby";
import { HeadFactory } from "../components/common/head";
import { Layout } from "../components/common/layout";
import { Pagination } from "../components/root/pagination";
import { CardList } from "../components/top/card-list";
import * as styles from "./root-page.module.css";

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
  return (
    <Layout>
      <CardList nodes={data.allMarkdownRemark.nodes} />
      <div className={styles.paginationSection}>
        <Pagination
          currentPage={pageContext.currentPage}
          pageSum={pageContext.numPages}
        />
      </div>
    </Layout>
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
              gatsbyImageData(width: 300, height: 300)
            }
          }
          created
          tags
        }
      }
    }
  }
`;

export const Head = () => <HeadFactory type="blog" />;
