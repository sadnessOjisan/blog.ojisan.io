import * as React from "react"
import styles from "./drawer-contents.module.css"
import { Link, useStaticQuery, graphql } from "gatsby"
import { TagsIndicesQuery } from "../../../types/graphql-types"
import { Button, makeStyles } from "@material-ui/core"

const useStyles = makeStyles({
  root: {
    border: 0,
    borderRadius: 3,
    height: 48,
    width: "100%",
  },
  label: {
    justifyContent: "left",
  },
})

const DrawerContents: React.FC = () => {
  const classes = useStyles()
  const {
    allMarkdownRemark,
  }: {
    allMarkdownRemark: TagsIndicesQuery["allMarkdownRemark"]
  } = useStaticQuery(
    graphql`
      query TagsIndices {
        allMarkdownRemark(
          sort: { order: DESC, fields: frontmatter___created }
        ) {
          group(field: frontmatter___tags) {
            fieldValue
            totalCount
          }
        }
      }
    `
  )

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Navigation</h2>
      <ul className={styles.block}>
        <li className={styles.item}>
          <Link to="/">
            <Button className={`${classes.root} ${classes.label}`}>
              <a>Top</a>
            </Button>
          </Link>
        </li>
        <li className={styles.item}>
          <Link to="/tags">
            <Button className={`${classes.root} ${classes.label}`}>
              <a>Tag一覧</a>
            </Button>
          </Link>
        </li>
        <li className={styles.item}>
          <Link to="/news">
            <Button className={`${classes.root} ${classes.label}`}>
              <a>News一覧</a>
            </Button>
          </Link>
        </li>
      </ul>{" "}
      <h2 className={styles.title}>Link</h2>
      <ul className={styles.block}>
        <li className={styles.item}>
          <Link to="/rss.xml">
            <Button className={`${classes.root} ${classes.label}`}>
              <a>RSS</a>
            </Button>
          </Link>
        </li>
        <li className={styles.item}>
          <Link to="https://github.com/sadnessOjisan/blog.ojisan.io">
            <Button className={`${classes.root} ${classes.label}`}>
              <a>Github</a>
            </Button>
          </Link>
        </li>
      </ul>
      <h2 className={styles.title}>tags</h2>
      <ul className={styles.block}>
        {allMarkdownRemark.group.map(tag => (
          <li className={styles.item}>
            <Link to={`/tags/${tag.fieldValue}`}>
              <Button className={`${classes.root} ${classes.label}`}>
                <a>
                  {tag.fieldValue}({tag.totalCount})
                </a>
              </Button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default DrawerContents
