import { Link } from "gatsby";
import { ComponentType } from "react";
import * as styles from "./header.module.css";

export const Header: ComponentType = () => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContents}>
        <div>
          <Link to="/" className={styles.logo}>
            blog.ojisan.io
          </Link>
        </div>
        <div>
          <div>
            <Link to="https://ojisan.io">About me</Link>
            <Link to="/tags">タグ一覧</Link>
          </div>
        </div>
      </div>
    </header>
  );
};
