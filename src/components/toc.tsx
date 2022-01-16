import React, { VFC } from "react";

import { lists, wrapper } from "./toc.module.scss";

interface Props {
  toc: string;
}

export const Toc: VFC<Props> = ({ toc }) => {
  console.log(toc);
  return (
    <div className={wrapper}>
      <p>目次</p>
      <div
        dangerouslySetInnerHTML={{
          __html: toc,
        }}
        className={lists}
      />
    </div>
  );
};
