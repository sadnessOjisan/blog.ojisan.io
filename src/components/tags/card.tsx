import { ComponentType } from "react";
import { Card as CardOrig } from "../common/card";

export const Card: ComponentType<{
  node: Queries.postsPaginationQueryQuery["allMarkdownRemark"]["nodes"][number];
}> = ({ node }) => {
  if (!node.frontmatter?.path || !node.frontmatter?.title) {
    console.error(node.frontmatter);
    throw new Error("props value is invalid.");
  }
  return <CardOrig node={node} />;
};
