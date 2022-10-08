import { Link } from "gatsby";
import * as styles from "./header-layout.module.css";

export const HeaderLayout = () => {
  return (
    <div className={styles.wrapper}>
      <Link to="/">blob.ojisan.io</Link>
    </div>
  );
};
