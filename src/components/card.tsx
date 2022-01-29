import { Link } from "gatsby";
import { GatsbyImage, getImage, ImageDataLike } from "gatsby-plugin-image";
import * as React from "react";
import { VFC } from "react";

import { card, imageWrapper, link } from "./card.module.scss";

type Props = {
  data: GatsbyTypes.BlogPostsQuery["blogs"]["nodes"][0]["frontmatter"];
};

export const Card: VFC<Props> = ({ data }) => {
  if (data === undefined) {
    throw new Error("should be");
  }
  const { title, tags, visual, path, created } = data;
  if (
    path === undefined ||
    tags === undefined ||
    title === undefined ||
    visual === undefined ||
    created === undefined
  ) {
    throw new Error("should be");
  }
  // TODO: as 消したい
  const image = getImage(visual as ImageDataLike);
  if (image === undefined) {
    throw new Error("aa");
  }
  return (
    <Link key={path} to={`${path}/`} className={link}>
      <a>
        <div className={card}>
          <GatsbyImage image={image} alt="thumbnail" className={imageWrapper} />
          <p>
            <time dateTime={created}>{created}</time>
          </p>
          <p>{title}</p>
        </div>
      </a>
    </Link>
  );
};
