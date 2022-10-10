import { ComponentType } from "react";
import { Tag } from "./tag";
import * as styles from "./tags.module.css";

interface Props {
  tags: NonNullable<
    NonNullable<
      Queries.postsPaginationQueryQuery["allMarkdownRemark"]["nodes"][number]["frontmatter"]
    >["tags"]
  >;
}

export const Tags: ComponentType<Props> = ({ tags }) => {
  return (
    <div className={styles.tags}>
      {tags.map((t) => {
        if (t === null) {
          throw new Error("tag should be");
        }
        return <Tag key={t} name={t} />;
      })}
    </div>
  );
};
