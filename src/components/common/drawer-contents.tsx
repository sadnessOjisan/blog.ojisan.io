import * as React from "react"
import styles from "./drawerContents.module.css"
import { Link, useStaticQuery, graphql } from "gatsby"
import { TagsIndicesQuery } from "../../../types/graphql-types"
import { Button } from "@material-ui/core"

const DrawerContents: React.FC = () => {
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
      <h2>Navigation</h2>
      <ul className={styles.block}>
        <li>
          <Link to="/">
            <Button>
              <a>Top</a>
            </Button>
          </Link>
        </li>
        <li>
          <Link to="/tags">
            <Button>
              <a>Tag一覧</a>
            </Button>
          </Link>
        </li>
      </ul>
      <h2>tags</h2>
      <ul className={styles.block}>
        {allMarkdownRemark.group.map(tag => (
          <li>
            <Link to={`/tags/${tag.fieldValue}`}>
              <Button>
                <a>
                  {tag.fieldValue}({tag.totalCount})
                </a>
              </Button>
            </Link>
          </li>
        ))}
      </ul>
      <h2>Link</h2>
      <ul className={styles.block}>
        <li>
          <Link to="/rss.xml">
            <Button>
              <a>RSS</a>
            </Button>
          </Link>
        </li>
        <li>
          <Link to="https://github.com/sadnessOjisan/blog.ojisan.io">
            <Button>
              <a>Github</a>
            </Button>
          </Link>
        </li>
      </ul>
    </div>
  )
}

export default DrawerContents