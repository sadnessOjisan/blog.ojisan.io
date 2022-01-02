import {
  image,
  imageContainer,
  imageWrapper,
  metaContainer,
} from "./meta-info.module.scss";
import {
  GatsbyImage,
  getImage,
  IGatsbyImageData,
  ImageDataLike,
} from "gatsby-plugin-image";
import React, { VFC } from "react";
type Props = {
  image: IGatsbyImageData;
  tags: string[];
  title: string;
  created: string;
};
export const MetaInfo: VFC<Props> = ({ image, tags, title, created }) => {
  return (
    <div className={imageContainer}>
      <div className={imageWrapper}>
        <GatsbyImage image={image} alt="thumbnail" />
      </div>
      <div className={metaContainer}>
        <div>
          {tags.map((tag) => (
            <span>#{tag}</span>
          ))}
          <h1>{title}</h1>
          <time>{created}</time>
        </div>
      </div>
    </div>
  );
};
