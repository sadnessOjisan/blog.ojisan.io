import { ComponentType } from "react";
import { Card } from "./card";

export const CardList: ComponentType<{
  nodes: Queries.postsPaginationQueryQuery["allMarkdownRemark"]["nodes"];
}> = ({ nodes }) => {
  return (
    <div>
      {nodes.map((node) => (
        <Card key={node.id} node={node} />
      ))}
    </div>
  );
};
