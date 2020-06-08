import * as React from "react"
import { Link } from "gatsby"
import styles from "./header.module.css"

interface IProps {
  siteTitle: string
}

const Header: React.FC<IProps> = ({ siteTitle }) => (
  <header className={styles.header}>
    <h1 className={styles.title}>
      <Link to="/">{siteTitle || ""}</Link>
    </h1>
  </header>
)

export default Header
