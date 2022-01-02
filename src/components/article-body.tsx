import React, { VFC } from "react";

import { body } from "./article-body.module.scss";

type Props = {
  html: string;
};
export const ArticleBody: VFC<Props> = ({ html }) => {
  return <div className={body} dangerouslySetInnerHTML={{ __html: html }} />;
};
