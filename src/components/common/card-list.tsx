import { ComponentType } from "react";
import { Card } from "./card";
import * as styles from "./card-list.module.css";

export const CardList: ComponentType<{
  nodes: Queries.postsPaginationQueryQuery["allMarkdownRemark"]["nodes"];
}> = ({ nodes }) => {
  return (
    <ul className={styles.list}>
      {nodes.map((node) => (
        <li key={node.id} className={styles.listItem}>
          <Card node={node} />
        </li>
      ))}
    </ul>
  );
};
