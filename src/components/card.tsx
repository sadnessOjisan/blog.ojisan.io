import "./card.css";

import Img, { FluidObject } from "gatsby-image";
import * as React from "react";
import { VFC } from "react";

type Props = {
  title: string;
  createdAt: Date;
  image: FluidObject;
};

export const Card: VFC<Props> = (props) => {
  return (
    <div className="card">
      <Img fluid={props.image} style={{ maxHeight: 500, marginBottom: 32 }} />
      <p>{props.title}</p>
      <p>{props.createdAt}</p>
    </div>
  );
};
