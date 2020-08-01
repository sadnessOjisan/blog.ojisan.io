import * as React from "react"
import styles from "./footer.module.css"
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
    <div style={{ width: "200px" }}>
      <ul>
        <li>TOP</li>
        <li>
          <Link to="/tags">
            <a>Tags</a>
          </Link>
        </li>
      </ul>
      <h2>tags</h2>
      <ul>
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
    </div>
  )
}

export default DrawerContents
