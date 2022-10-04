import { Link } from "gatsby";
import { GatsbyImage, getImage } from "gatsby-plugin-image";
import { ComponentType } from "react";
import "../../styles/prism-node.css";

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
      <GatsbyImage image={image} alt="thumbnail" />
      <div>{markdownMeta.title}</div>
      <div>
        {markdownMeta.tags.map((tag) => {
          return (
            <Link key={tag} to={`/tags/${tag}`}>
              {tag}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
