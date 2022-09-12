import { Link } from "gatsby";
import { ComponentType } from "react";

export const Card: ComponentType<{
  node: Queries.postsPaginationQueryQuery["allMarkdownRemark"]["nodes"][number];
}> = ({ node }) => {
  if (!node.frontmatter?.path) {
    console.error(node.frontmatter);
    throw new Error("props value is invalid.");
  }
  return (
    <Link to={`${node.frontmatter.path}`}>
      <div>{node.id}</div>
    </Link>
  );
};
