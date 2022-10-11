import { Link } from "gatsby";
import { ComponentType } from "react";
import * as styles from "./tag.module.css";

interface Props {
  name: string;
}

export const Tag: ComponentType<Props> = ({ name }) => {
  return (
    <div className={styles.wrapper}>
      <Link to={`/tags/${name}`}>#{name}</Link>
    </div>
  );
};
