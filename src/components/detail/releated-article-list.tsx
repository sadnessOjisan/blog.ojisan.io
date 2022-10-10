import { ComponentType } from "react";
import { RelatedArticleListItem } from "./related-article-list-item";
import * as styles from "./related-article-list.module.css";

interface Props {
  articles: Queries.DetailPageQueryQuery["tags"]["nodes"];
}

export const RelatedArticlesList: ComponentType<Props> = ({ articles }) => {
  return (
    <ul className={styles.list}>
      {articles.map((n) => (
        <RelatedArticleListItem key={n.frontmatter?.path} article={n} />
      ))}
    </ul>
  );
};
