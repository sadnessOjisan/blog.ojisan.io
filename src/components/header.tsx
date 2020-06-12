import * as React from "react"
import { Link } from "gatsby"
import styles from "./header.module.css"
import twitter from "../images/twitter.svg"
import github from "../images/github.svg"

interface IProps {
  siteTitle: string
}

const Header: React.FC<IProps> = ({ siteTitle }) => (
  <header className={styles.header}>
    <h1 className={styles.title}>
      <Link to="/">😭</Link>
    </h1>
    <div>
      <a href="https://twitter.com/sadnessOjisan">
        <img src={twitter} className={styles.icon}></img>
      </a>
      <a href="https://github.com/sadnessOjisan/blog.ojisan.io">
        <img src={github} className={styles.icon}></img>
      </a>
    </div>
  </header>
)

export default Header
