import { Link } from "gatsby";
import * as React from "react";
import { VFC } from "react";

import { header } from "./header.module.scss";

type Props = {
  siteTitle: string;
};

const Header: VFC<Props> = ({ siteTitle }) => (
  <header className={header}>
    <div>
      <h1>
        <Link to="/">{siteTitle}</Link>
      </h1>
    </div>
  </header>
);

export default Header;
