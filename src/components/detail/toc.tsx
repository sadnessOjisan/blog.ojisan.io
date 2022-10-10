import { ComponentType } from "react";
import * as styles from "./toc.module.css";

interface Props {
  toc: NonNullable<
    Queries.DetailPageQueryQuery["markdownRemark"]
  >["tableOfContents"];
}

export const Toc: ComponentType<Props> = ({ toc }) => {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: toc || "" }}
      className={styles.tocWrapper}
    />
  );
};
