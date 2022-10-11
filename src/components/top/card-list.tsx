import { ComponentType } from "react";
import { CardList as CardListOrig } from "../common/card-list";

export const CardList: ComponentType<{
  nodes: Queries.postsPaginationQueryQuery["allMarkdownRemark"]["nodes"];
}> = ({ nodes }) => {
  return <CardListOrig nodes={nodes} />;
};
