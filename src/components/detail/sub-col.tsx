import { Link } from "gatsby";
import { ComponentType } from "react";
import * as styles from "./sub-col.module.css";
import { Toc } from "./toc";

interface Props {
  tags: Queries.DetailPageQueryQuery["tags"]["nodes"];
  toc: NonNullable<
    Queries.DetailPageQueryQuery["markdownRemark"]
  >["tableOfContents"];
}

export const SubColumn: ComponentType<Props> = ({ tags, toc }) => {
  return (
    <div>
      <section className={styles.tocSection}>
        <h2>目次</h2>
        <Toc toc={toc} />
      </section>
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
