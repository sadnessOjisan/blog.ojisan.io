import { ComponentType } from "react";
import { RelatedArticlesList } from "./releated-article-list";
import * as styles from "./sub-col.module.css";
import { Toc } from "./toc";

interface Props {
  tags: Queries.DetailPageQueryQuery["tags"]["nodes"];
  toc: NonNullable<
    Queries.DetailPageQueryQuery["markdownRemark"]
  >["tableOfContents"];
}

export const SubColumn: ComponentType<Props> = ({ tags, toc }) => {
  return (
    <div>
      <section className={styles.tocSection}>
        <h2>目次</h2>
        <Toc toc={toc} />
      </section>
      <section className={styles.relArticleSection}>
        <h2>関連記事</h2>
        <RelatedArticlesList articles={tags} />
      </section>
    </div>
  );
};
