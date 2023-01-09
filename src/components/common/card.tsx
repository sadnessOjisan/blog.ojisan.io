import { Link } from "gatsby-link";
import { GatsbyImage, getImage } from "gatsby-plugin-image";
import { ComponentType } from "react";
import * as styles from "./card.module.css";
import { Tags } from "./tags";

export const Card: ComponentType<{
  node: Queries.postsPaginationQueryQuery["allMarkdownRemark"]["nodes"][number];
}> = ({ node }) => {
  if (
    !node.frontmatter?.path ||
    !node.frontmatter?.title ||
    !node.frontmatter?.visual ||
    !node.frontmatter?.created ||
    !node.frontmatter?.tags
  ) {
    console.error(node.frontmatter);
    throw new Error("props value is invalid.");
  }

  const image = getImage(node.frontmatter.visual.childImageSharp);
  if (image === undefined) {
    throw new Error("no image");
  }
  return (
    <Link to={`${node.frontmatter.path}`} className={styles.wrapper}>
      <GatsbyImage image={image} alt="thumbnail" />
      <div className={styles.contents}>
        <div className={styles.body}>
          <div>{node.frontmatter.title}</div>
          <div>{node.frontmatter.created}</div>
        </div>
        <div className={styles.foooter}>
          <Tags tags={node.frontmatter.tags} />
        </div>
      </div>
    </Link>
  );
};
