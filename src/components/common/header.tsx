import { Link } from "gatsby";
import { ComponentType } from "react";
import * as styles from "./header.module.css";

export const Header: ComponentType = () => {
  return (
    <header className={styles.header}>
      <Link to="/">blog.ojisan.io</Link>
    </header>
  );
};
