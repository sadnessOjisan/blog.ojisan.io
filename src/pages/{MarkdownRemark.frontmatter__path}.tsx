import { graphql, PageProps } from "gatsby";
import { ComponentType } from "react";
import { ContentsHeader } from "../components/detail/contents-header";

const Template: ComponentType<PageProps<Queries.BlogPostQuery>> = (props) => {
  console.log(props);
  return (
    <div>
      <p>{props.data.markdownRemark?.frontmatter?.title}</p>
      <ContentsHeader markdownMeta={props.data.markdownRemark?.frontmatter} />
      <div>
        <div
          dangerouslySetInnerHTML={{
            __html: props.data.markdownRemark?.html || "",
          }}
        ></div>
      </div>
    </div>
  );
};

export default Template;

/**
 * file system routing を使った場合、query が id に入ってくる。
 * > Collection route components are passed two dynamic variables.
 * > The id of each page’s node and the URL path as params.
 * > The params is passed to the component as props.params and the id as props.pageContext.id.
 * @see https://www.gatsbyjs.com/docs/reference/routing/file-system-route-api/#collection-route-components
 */
export const pageQuery = graphql`
  query BlogPost($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        title
        path
        isProtect
        created
        tags
      }
      excerpt(pruneLength: 140)
    }
  }
`;
