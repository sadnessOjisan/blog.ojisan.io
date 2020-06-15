import * as React from "react"
import { Link } from "gatsby"
import styles from "./header.module.css"
import twitter from "../images/twitter.svg"
import github from "../images/github.svg"
import rss from "../images/rss.svg"

interface IProps {
  siteTitle: string
}

const Header: React.FC<IProps> = ({ siteTitle }) => (
  <header className={styles.header}>
    <h1 className={styles.title}>
      <Link to="/">🎉</Link>
    </h1>
    <div>
      <a href="https://blog.ojisan.io/rss.xml" aria-label="rssへのリンク">
        <img src={rss} className={styles.icon} alt="rss-logo"></img>
      </a>
       <a
        href="https://twitter.com/sadnessOjisan"
        aria-label="twitterへのリンク"
      >
        <img src={twitter} className={styles.icon} alt="twitter-logo"></img>
      </a>
      <a
        href="https://github.com/sadnessOjisan/blog.ojisan.io"
        aria-label="githubへのリンク"
      >
        <img src={github} className={styles.icon} alt="github-logo"></img>
      </a>
    </div>
  </header>
)

export default Header
