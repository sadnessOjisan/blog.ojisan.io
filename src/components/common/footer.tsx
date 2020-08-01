import * as React from "react"
import styles from "./footer.module.css"

const Footer: React.FC = () => (
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
)

export default Footer
