import { ComponentType, ReactNode } from "react";
import * as styles from "./layout.module.css";

interface Props {
  children: ReactNode;
}

export const Layout: ComponentType<Props> = ({ children }) => {
  return (
    <>
      <header className={styles.header}>aaa</header>
      <div className={styles.contents}>{children}</div>
      <footer className={styles.footer}>
        <a href="https://github.com/sadnessOjisan/blog.ojisan.io">GitHub</a>
      </footer>
    </>
  );
};
