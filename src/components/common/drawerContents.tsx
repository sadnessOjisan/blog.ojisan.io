import * as React from "react"
import styles from "./drawerContents.module.css"
import { Link, useStaticQuery, graphql } from "gatsby"
import { TagsIndicesQuery } from "../../../types/graphql-types"

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
            <a>Top</a>
          </Link>
        </li>
        <li>
          <Link to="/tags">
            <a>Tag一覧</a>
          </Link>
        </li>
      </ul>
      <h2>tags</h2>
      <ul className={styles.block}>
        {allMarkdownRemark.group.map(tag => (
          <li>
            <Link to={`/tags/${tag.fieldValue}`}>
              <a>
                {tag.fieldValue}({tag.totalCount})
              </a>
            </Link>
          </li>
        ))}
      </ul>
      <h2>Link</h2>
      <ul className={styles.block}>
        <li>
          <a href="/rss.xml" aria-label="rssへのリンク">
            RSS
          </a>
        </li>
        <li>
          <a
            href="https://github.com/sadnessOjisan/blog.ojisan.io"
            aria-label="githubへのリンク"
          >
            Github
          </a>
        </li>
      </ul>
    </div>
  )
}

export default DrawerContents
