import { graphql, HeadProps, PageProps } from "gatsby";
import { TagPageContext } from "../../gatsby-node";
import { HeadFactory } from "../components/common/head";
import { Layout } from "../components/common/layout";
import { CardList } from "../components/tags/card-list";

const ListByTag = ({
  data,
  pageContext,
}: PageProps<Queries.ArticlesByTagQuery, TagPageContext>) => {
  return (
    <Layout>
      <h1>{pageContext.tag} の記事一覧</h1>
      <CardList nodes={data.allMarkdownRemark.nodes} />
    </Layout>
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

export const Head = ({
  pageContext,
}: HeadProps<Queries.ArticlesByTagQuery, TagPageContext>) => {
  return <HeadFactory type="blog" title={`${pageContext.tag} の記事一覧`} />;
};
