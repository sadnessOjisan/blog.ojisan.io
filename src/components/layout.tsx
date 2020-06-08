/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import * as React from "react"
import { useStaticQuery, graphql } from "gatsby"

import Header from "./header"
import styles from "./layout.module.css"

const Layout: React.FC = ({ children }) => {
  const data = useStaticQuery(graphql`
    query SiteTitle {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  return (
    <>
      <Header siteTitle={data.site.siteMetadata.title} />
      <div>
        <main className={styles.body}>{children}</main>
        <footer className={styles.footer}>
          <p>
            © {new Date().getFullYear()}, Built with
            <a href="https://www.gatsbyjs.org" target="_blank" rel="noopener">
              {" "}
              Gatsby
            </a>
          </p>
          <p>
            createdBy
            <a
              href="https://twitter.com/sadnessOjisan"
              target="_blank"
              rel="noopener"
            >
              {" "}
              @sadnessOjisan
            </a>
          </p>
          <p>
            source code is{" "}
            <a
              href="https://github.com/sadnessOjisan/blog.ojisan.io"
              target="_blank"
              rel="noopener"
            >
              here
            </a>
          </p>
          <p>This site uses Google Analytics.</p>
        </footer>
      </div>
    </>
  )
}

export default Layout
