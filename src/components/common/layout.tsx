import { ComponentType, ReactNode } from "react";
import { Header } from "./header";
import * as styles from "./layout.module.css";

interface Props {
  children: ReactNode;
}

export const Layout: ComponentType<Props> = ({ children }) => {
  return (
    <>
      <Header />
      <div className={styles.contents}>{children}</div>
      <footer className={styles.footer}>
        <a href="https://github.com/sadnessOjisan/blog.ojisan.io">GitHub</a>
      </footer>
    </>
  );
};
