import { ComponentType } from "react";
import { NextPrevArticlesItem } from "./next-prev-articles-item";
import * as styles from "./next-prev-articles.module.css";

interface Props {
  next: Queries.NextPrevQueryQuery["allMarkdownRemark"]["edges"][number]["next"];
  prev: Queries.NextPrevQueryQuery["allMarkdownRemark"]["edges"][number]["previous"];
}

export const NextPrevArticles: ComponentType<Props> = ({ next, prev }) => {
  return (
    <div className={styles.wrapper}>
      {prev && <NextPrevArticlesItem article={prev} direction="left" />}
      {next && <NextPrevArticlesItem article={next} direction="right" />}
    </div>
  );
};
