import { ComponentType } from "react";
import * as styles from "./main-col.module.css";

interface Props {
  detailPage: NonNullable<Queries.DetailPageQueryQuery["markdownRemark"]>;
}

export const MainColumn: ComponentType<Props> = ({ detailPage }) => {
  return (
    <div>
      <article
        dangerouslySetInnerHTML={{
          __html: detailPage.html || "",
        }}
        className={styles.article}
      ></article>
    </div>
  );
};
