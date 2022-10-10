import { Link } from "gatsby";
import { GatsbyImage, getImage } from "gatsby-plugin-image";
import { ComponentType } from "react";
import * as styles from "./related-article-list-item.module.css";

interface Props {
  article: Queries.DetailPageQueryQuery["tags"]["nodes"][number];
}

export const RelatedArticleListItem: ComponentType<Props> = ({ article }) => {
  if (
    !article.frontmatter?.path ||
    !article.frontmatter?.title ||
    !article.frontmatter?.visual
  ) {
    throw new Error();
  }
  const image = getImage(article.frontmatter.visual.childImageSharp);
  if (image === undefined) {
    throw new Error("no image");
  }
  return (
    <li key={article.frontmatter.path} className={styles.wrapper}>
      <Link to={article.frontmatter.path}>
        <div className={styles.col}>
          <GatsbyImage image={image} alt="thumbnail" className={styles.image} />
          <div className={styles.body}>
            <span>{article.frontmatter.title}</span>
            <div>
              <p className={styles.excerpt}>{article.excerpt}</p>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
};
