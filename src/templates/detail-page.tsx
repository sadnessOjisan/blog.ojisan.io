import { graphql, HeadProps, PageProps } from "gatsby";
import { getSrc } from "gatsby-plugin-image";
import { DetailPageContext } from "../../gatsby-node";
import { HeadFactory } from "../components/common/head";
import { Layout } from "../components/common/layout";
import { ContentsHeader } from "../components/detail/contents-header";
import { MainColumn } from "../components/detail/main-col";
import { NextPrevArticles } from "../components/detail/next-prev-articles";
import { SubColumn } from "../components/detail/sub-col";
import * as styles from "./detail-page.module.css";

const RootBlogList = ({
  data,
  pageContext,
}: PageProps<Queries.DetailPageQueryQuery, DetailPageContext>) => {
  if (!data.markdownRemark) {
    throw new Error("markdown data should be");
  }
  return (
    <Layout>
      <div className={styles.wrapper}>
        <ContentsHeader markdownMeta={data.markdownRemark.frontmatter} />
        <div className={styles.contentsBox}>
          <MainColumn detailPage={data.markdownRemark} />
          <aside className={styles.subCol}>
            <SubColumn
              tags={data.tags.nodes}
              toc={data.markdownRemark.tableOfContents}
            />
          </aside>
          <section className={styles.nextPrevSection}>
            <NextPrevArticles next={pageContext.next} prev={pageContext.prev} />
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default RootBlogList;

export const postsPaginationQuery = graphql`
  query DetailPageQuery($id: String!, $tags: [String!]) {
    markdownRemark(id: { eq: $id }) {
      id
      html
      frontmatter {
        path
        title
        tags
        visual {
          childImageSharp {
            gatsbyImageData(width: 1280, height: 600)
          }
        }
        created
      }
      tableOfContents
      timeToRead
    }
    tags: allMarkdownRemark(
      filter: { frontmatter: { tags: { in: $tags } } }
      limit: 10
      sort: { fields: [frontmatter___created], order: DESC }
    ) {
      nodes {
        frontmatter {
          path
          title
          visual {
            childImageSharp {
              gatsbyImageData(width: 160, height: 100)
            }
          }
        }
        timeToRead
        excerpt(pruneLength: 40)
      }
    }
  }
`;

export const Head = ({ data }: HeadProps<Queries.DetailPageQueryQuery>) => {
  if (
    !data.markdownRemark?.frontmatter?.title ||
    !data.markdownRemark?.frontmatter?.visual?.childImageSharp
  ) {
    throw new Error("title should be");
  }

  // getImage と違って null を引数に取れないので上で null チェックしている
  // OGP 生成に使われてる関数: https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-plugin-image/#getsrc
  const imageSrc = getSrc(
    data.markdownRemark.frontmatter.visual.childImageSharp
  );

  if (!imageSrc) {
    throw new Error("image path should be");
  }
  return (
    <HeadFactory
      title={data.markdownRemark?.frontmatter?.title}
      type="article"
      imagePath={imageSrc}
      created={data.markdownRemark.frontmatter?.created}
    />
  );
};
