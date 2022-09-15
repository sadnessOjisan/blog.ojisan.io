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
          return <span key={tag}>{tag}</span>;
        })}
      </div>
    </div>
  );
};
