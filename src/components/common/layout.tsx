import { ComponentType, ReactNode } from "react";
import { Footer } from "./footer";
import { Header } from "./header";
import * as styles from "./layout.module.css";

interface Props {
  children: ReactNode;
}

export const Layout: ComponentType<Props> = ({ children }) => {
  return (
    <>
      <Header />
      <div className={styles.contentsWrapper}>
        <div className={styles.contents}>{children}</div>
      </div>
      <Footer />
    </>
  );
};
