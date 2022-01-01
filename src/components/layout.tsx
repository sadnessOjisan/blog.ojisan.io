/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import { graphql, useStaticQuery } from "gatsby";
import PropTypes from "prop-types";
import * as React from "react";
import { FC } from "react";

import Header from "./header";
import { footer, wrapper } from "./layout.module.scss";

const Layout: FC = ({ children }) => {
  const data = useStaticQuery<GatsbyTypes.SiteTitleQuery>(graphql`
    query SiteTitle {
      site {
        siteMetadata {
          title
        }
      }
    }
  `);

  const title = data?.site?.siteMetadata?.title;

  if (title === undefined || title === null) {
    throw new Error("title should be");
  }

  return (
    <>
      <Header siteTitle={title} />
      <div className={wrapper}>
        <main>{children}</main>
        <footer className={footer}>
          <div>
            please HELP ME!!{" "}
            <a href="https://patron.ojisan.io">patron.ojisan.io</a>
          </div>
          <div>
            © {new Date().getFullYear()}, Built with
            {` `}
            <a href="https://www.gatsbyjs.com">Gatsby</a>
          </div>
        </footer>
      </div>
    </>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
