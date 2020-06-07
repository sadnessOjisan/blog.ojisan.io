import * as React from "react"
import { Link } from "gatsby"
import styles from "./header.module.css"

interface IProps {
  siteTitle: string
}

const Header: React.FC<IProps> = ({ siteTitle }) => (
  <header className={styles.header}>
    <div>
      <h1>
        <Link to="/">{siteTitle || ""}</Link>
      </h1>
    </div>
  </header>
)

export default Header
