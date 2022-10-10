import { Link } from "gatsby";
import { ComponentType } from "react";
import * as styles from "./header.module.css";

export const Header: ComponentType = () => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContents}>
        <div className={styles.left}>
          <Link to="/" className={styles.logo}>
            blog.ojisan.io
          </Link>
        </div>
        <div className={styles.right}>
          <Link to="https://ojisan.io">About</Link>
          <Link to="/tags">Tags</Link>
        </div>
      </div>
    </header>
  );
};
