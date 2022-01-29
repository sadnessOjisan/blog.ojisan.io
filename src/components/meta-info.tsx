import { Link } from "gatsby";
import { GatsbyImage, IGatsbyImageData } from "gatsby-plugin-image";
import React, { VFC } from "react";

import { toLower } from "../util/kebab";
import {
  imageContainer,
  imageWrapper,
  img,
  innerWrapper,
  metaContainer,
  tagLink,
} from "./meta-info.module.scss";
type Props = {
  image: IGatsbyImageData;
  tags: string[];
  title: string;
  created: string;
};
export const MetaInfo: VFC<Props> = ({ image, tags, title, created }) => {
  const kebabTags = tags.map((t) => toLower(t));
  return (
    <div className={imageContainer}>
      <div className={imageWrapper}>
        <GatsbyImage image={image} alt="thumbnail" className={img} />
      </div>
      <div className={metaContainer}>
        <div className={innerWrapper}>
          <div>
            {kebabTags.map((tag) => (
              <Link key={tag} to={`/tags/${tag}/`}>
                <a className={tagLink}>
                  <span>#{tag}</span>
                </a>
              </Link>
            ))}
          </div>
          <h1>{title}</h1>
          <p>
            <time dateTime={created}>{created}</time>
          </p>
        </div>
      </div>
    </div>
  );
};
