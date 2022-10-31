import { GatsbyImage, getImage } from "gatsby-plugin-image";
import { ComponentType } from "react";
import "../../styles/prism-node.css";
import { Tags } from "../common/tags";
import * as styles from "./contents-header.module.css";

export const ContentsHeader: ComponentType<{
  markdownMeta:
    | NonNullable<
        Queries.DetailPageQueryQuery["markdownRemark"]
      >["frontmatter"];
}> = ({ markdownMeta }) => {
  if (
    !markdownMeta ||
    !markdownMeta.title ||
    !markdownMeta.created ||
    !markdownMeta.tags ||
    !markdownMeta.visual
  ) {
    throw new Error("markdownMeta should be");
  }
  const image = getImage(markdownMeta.visual.childImageSharp);
  if (image === undefined) {
    throw new Error("no image");
  }

  return (
    <div className={styles.wrapper}>
      <h1>{markdownMeta.title}</h1>
      <p>
        <time dateTime={markdownMeta.created}>{markdownMeta.created}</time>
      </p>
      <Tags tags={markdownMeta.tags} />
      <GatsbyImage image={image} alt="thumbnail" />
    </div>
  );
};
