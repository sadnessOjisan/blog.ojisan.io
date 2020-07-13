import * as React from "react"
import { Link } from "gatsby"
import algoliasearch from "algoliasearch/lite"
import { InstantSearch, SearchBox, Hits } from "react-instantsearch-dom"
import styles from "./header.module.css"
import twitter from "../images/twitter.svg"
import github from "../images/github.svg"
import rss from "../images/rss.svg"

interface IProps {
  siteTitle: string
}

const searchClient = algoliasearch(
  "latency",
  "6be0576ff61c053d5f9a3225e2a90f76"
)

const Header: React.FC<IProps> = ({ siteTitle }) => (
  <header className={styles.header}>
    <h1 className={styles.title}>
      <Link to="/">blog.ojisan.io</Link>
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
      <InstantSearch indexName="bestbuy" searchClient={searchClient}>
        <SearchBox />
        <Hits />
      </InstantSearch>
    </div>
  </header>
)

export default Header
