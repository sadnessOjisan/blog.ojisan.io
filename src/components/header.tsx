import * as React from "react"
import { Link } from "gatsby"
import algoliasearch from "algoliasearch/lite"
import { InstantSearch, SearchBox, Configure } from "react-instantsearch-dom"
import styles from "./header.module.css"
import github from "../images/github.svg"
import rss from "../images/rss.svg"
import { SearchResultList } from "./search/SearchResult"
import "../vendor/css/algolia.css"

interface IProps {
  siteTitle: string
}

const searchClient = algoliasearch(
  "IE1UJ8Y60A",
  "22d86efe2fa32d6c0e5b1d4c0e91c8e5"
)

const Header: React.FC<IProps> = ({ siteTitle }) => (
  <header className={styles.header}>
    <h1 className={styles.title}>
      <Link to="/">blog.ojisan.io</Link>
    </h1>
    <div className={styles.pcOnly}>
      <InstantSearch indexName="blog" searchClient={searchClient}>
        <Configure
          // https://www.algolia.com/doc/api-reference/search-api-parameters/
          hitsPerPage={20}
          removeStopWords
          analytics
          analyticsTags={["on-site-search"]}
        />
        <div>
          <SearchBox
            showLoadingIndicator
            submit={undefined}
            reset={undefined}
          />
          <SearchResultList />
        </div>
      </InstantSearch>
    </div>
    <div>
      <a href="https://blog.ojisan.io/rss.xml" aria-label="rssへのリンク">
        <img src={rss} className={styles.icon} alt="rss-logo"></img>
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
