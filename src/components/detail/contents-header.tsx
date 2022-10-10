import { GatsbyImage, getImage } from "gatsby-plugin-image";
import { ComponentType } from "react";
import "../../styles/prism-node.css";
import { Tags } from "../common/tags";

export const ContentsHeader: ComponentType<{
  markdownMeta:
    | NonNullable<
        Queries.DetailPageQueryQuery["markdownRemark"]
      >["frontmatter"];
}> = ({ markdownMeta }) => {
  if (
    !markdownMeta ||
    !markdownMeta.title ||
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
    <div>
      <h1>{markdownMeta.title}</h1>
      <Tags tags={markdownMeta.tags} />
      <GatsbyImage image={image} alt="thumbnail" />
    </div>
  );
};
