import * as React from "react"
import { Link } from "gatsby"
import styles from "./header.module.css"
import github from "../../images/github.svg"
import rss from "../../images/rss.svg"
import { DrawerContext } from "./layout"
import { IconButton } from "@material-ui/core"
import MenuIcon from "@material-ui/icons/Menu"
import GitHubIcon from "@material-ui/icons/GitHub"
import RssFeedIcon from "@material-ui/icons/RssFeed"

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
          <IconButton aria-label="rssアイコン" color="default">
            <RssFeedIcon />
          </IconButton>
        </a>
        <a
          href="https://github.com/sadnessOjisan/blog.ojisan.io"
          aria-label="githubへのリンク"
        >
          <IconButton aria-label="githubアイコン" color="default">
            <GitHubIcon />
          </IconButton>
        </a>
        <IconButton
          aria-label="delete"
          color="default"
          onClick={() => {
            drawerContext.setDrawerState(true)
          }}
        >
          <MenuIcon />
        </IconButton>
      </div>
    </header>
  )
}

export default Header
