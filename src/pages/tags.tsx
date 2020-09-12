import * as React from "react"
import { graphql, Link } from "gatsby"
import Layout from "../components/common/layout"
import { TagsQuery } from "../../types/graphql-types"

interface IProps {
  data: TagsQuery
}

const IndexPage: React.FC<IProps> = ({ data }) => {
  return (
    <Layout>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h2
          style={{ fontSize: "32px", marginTop: "32px", marginBottom: "32px" }}
        >
          タグ一覧
        </h2>
        {data.allMarkdownRemark.group.map(
          tag =>
            tag &&
            tag.fieldValue && (
              <Link
                to={tag.fieldValue ? `/tags/${tag.fieldValue}` : "/"}
                key={tag.fieldValue}
              >
                <div style={{ marginTop: "12px" }}>
                  <a>
                    {tag.fieldValue}({tag.totalCount})
                  </a>
                </div>
              </Link>
            )
        )}
      </div>
    </Layout>
  )
}

export const pageQuery = graphql`
  query Tags {
    allMarkdownRemark(sort: { order: DESC, fields: frontmatter___created }) {
      group(field: frontmatter___tags) {
        fieldValue
        totalCount
      }
    }
  }
`

export default IndexPage
