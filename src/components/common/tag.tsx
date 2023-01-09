import { Link } from "gatsby-link";
import { ComponentType } from "react";
import * as styles from "./tag.module.css";

interface Props {
  /**
   * the name of tag
   */
  name: string;
}

export const Tag: ComponentType<Props> = ({ name }) => {
  return (
    <div className={styles.wrapper}>
      <Link to={`/tags/${name}`}>#{name}</Link>
    </div>
  );
};
