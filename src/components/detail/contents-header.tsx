import { Link } from "gatsby";
import { ComponentType } from "react";

export const ContentsHeader: ComponentType<{
  markdownMeta:
    | NonNullable<Queries.DetailPageQueryQuery["markdownRemark"]>["frontmatter"]
    | null
    | undefined;
}> = ({ markdownMeta }) => {
  if (!markdownMeta || !markdownMeta.title || !markdownMeta.tags) {
    throw new Error("markdownMeta should be");
  }
  return (
    <div>
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
