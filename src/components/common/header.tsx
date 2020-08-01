import * as React from "react"
import { Link } from "gatsby"
import Button from "@material-ui/core/Button"
import styles from "./header.module.css"
import github from "../../images/github.svg"
import rss from "../../images/rss.svg"
import { DrawerContext } from "./layout"

interface IProps {
  siteTitle: string
}

const Header: React.FC<IProps> = ({ siteTitle }) => {
  const drawerContext = React.useContext(DrawerContext)
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>
        <Link to="/">blog.ojisan.io</Link>
      </h1>
      <div>
        <a href="/rss.xml" aria-label="rssへのリンク">
          <img src={rss} className={styles.icon} alt="rss-logo"></img>
        </a>
        <a
          href="https://github.com/sadnessOjisan/blog.ojisan.io"
          aria-label="githubへのリンク"
        >
          <img src={github} className={styles.icon} alt="github-logo"></img>
        </a>
      </div>
      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          drawerContext.setDrawerState(true)
        }}
      >
        OPEN
      </Button>
    </header>
  )
}

export default Header
