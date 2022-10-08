import { Link } from "gatsby";
import { GatsbyImage, getImage } from "gatsby-plugin-image";
import { ComponentType } from "react";
import { Tag } from "./tag";

export const Card: ComponentType<{
  node: Queries.postsPaginationQueryQuery["allMarkdownRemark"]["nodes"][number];
}> = ({ node }) => {
  if (
    !node.frontmatter?.path ||
    !node.frontmatter?.title ||
    !node.frontmatter?.visual
  ) {
    console.error(node.frontmatter);
    throw new Error("props value is invalid.");
  }
  const image = getImage(node.frontmatter.visual.childImageSharp);
  if (image === undefined) {
    throw new Error("no image");
  }
  return (
    <Link to={`${node.frontmatter.path}`}>
      <div>{node.frontmatter.title}</div>
      <GatsbyImage image={image} alt="thumbnail" />
      {node.frontmatter.tags.map((tag) => (
        <Tag name={tag} />
      ))}
    </Link>
  );
};
