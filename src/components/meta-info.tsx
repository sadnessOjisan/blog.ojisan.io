import { Link } from "gatsby";
import { GatsbyImage, IGatsbyImageData } from "gatsby-plugin-image";
import React, { VFC } from "react";

import {
  imageContainer,
  imageWrapper,
  img,
  innerWrapper,
  metaContainer,
} from "./meta-info.module.scss";
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
        <GatsbyImage image={image} alt="thumbnail" className={img} />
      </div>
      <div className={metaContainer}>
        <div className={innerWrapper}>
          <div>
            {tags.map((tag) => (
              <Link key={tag} to={`/tags/${tag}`}>
                <a>
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
