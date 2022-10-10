import { Link } from "gatsby";
import { ComponentType } from "react";

interface Props {
  tags: Queries.DetailPageQueryQuery["tags"]["nodes"];
}

export const SubColumn: ComponentType<Props> = ({ tags }) => {
  return (
    <div>
      <h2>関連記事</h2>
      <ul>
        {tags.map((n) => (
          <LinkItem key={n.frontmatter?.path} tag={n}></LinkItem>
        ))}
      </ul>
    </div>
  );
};

const LinkItem: ComponentType<{
  tag: Queries.DetailPageQueryQuery["tags"]["nodes"][number];
}> = ({ tag }) => {
  if (!tag.frontmatter?.path || !tag.frontmatter?.title) {
    throw new Error();
  }
  return (
    <li key={tag.frontmatter.path}>
      <Link to={tag.frontmatter.path}>{tag.frontmatter.title}</Link>
    </li>
  );
};
