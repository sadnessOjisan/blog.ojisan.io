import { graphql, HeadProps, Link, PageProps } from "gatsby";
import { getSrc } from "gatsby-plugin-image";
import { DetailPageContext } from "../../gatsby-node";
import { HeadFactory } from "../components/common/head";
import { ContentsHeader } from "../components/detail/contents-header";

const RootBlogList = ({
  data,
  pageContext,
}: PageProps<Queries.DetailPageQueryQuery, DetailPageContext>) => {
  if (!data.markdownRemark) {
    throw new Error("markdown data should be");
  }
  return (
    <div>
      <ContentsHeader markdownMeta={data.markdownRemark.frontmatter} />
      <div>
        <div
          dangerouslySetInnerHTML={{
            __html: data.markdownRemark.html || "",
          }}
        ></div>
      </div>
      <div>
        {pageContext.prev?.frontmatter?.path && (
          <Link to={pageContext.prev.frontmatter.path}>prev</Link>
        )}
        {pageContext.next?.frontmatter?.path && (
          <Link to={pageContext.next.frontmatter.path}>next</Link>
        )}
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
        visual {
          childImageSharp {
            gatsbyImageData(width: 1024, height: 400)
          }
        }
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
    />
  );
};