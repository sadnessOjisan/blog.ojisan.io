import { Link } from "gatsby";
import { GatsbyImage, getImage } from "gatsby-plugin-image";
import { ComponentType } from "react";
import * as styles from "./next-prev-articles-item.module.css";

interface Props {
  article:
    | NonNullable<
        Queries.NextPrevQueryQuery["allMarkdownRemark"]["edges"][number]["next"]
      >
    | NonNullable<
        Queries.NextPrevQueryQuery["allMarkdownRemark"]["edges"][number]["previous"]
      >;
  direction: "right" | "left";
}

export const NextPrevArticlesItem: ComponentType<Props> = ({
  article,
  direction,
}) => {
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
    <Link to={article.frontmatter.path} className={styles.link}>
      <div className={styles.wrapper}>
        {direction === "left" ? (
          <>
            <GatsbyImage
              image={image}
              alt="thumbnail"
              className={styles.image}
            />
            <div className={styles.body}>
              <span>
                {"<<"} {article.frontmatter.title}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className={styles.body}>
              <span>
                {">>"} {article.frontmatter.title}
              </span>
            </div>
            <GatsbyImage
              image={image}
              alt="thumbnail"
              className={styles.image}
            />
          </>
        )}
      </div>{" "}
    </Link>
  );
};
