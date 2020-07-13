import * as React from "react"
import { graphql, Link } from "gatsby"
import Layout from "../components/layout"
import { TagsQuery } from "../../types/graphql-types"

interface IProps {
  data: TagsQuery
}

const IndexPage: React.FC<IProps> = ({ data }) => {
  return (
    <Layout>
      {data.allMarkdownRemark.group.map(tag => (
        <Link href={tag.fieldValue ? `tags/${tag.fieldValue}` : "/"}>
          <a>
            {tag.fieldValue}({tag.totalCount})
          </a>
        </Link>
      ))}
    </Layout>
  )
}

export const pageQuery = graphql`
  query Tags {
    allMarkdownRemark {
      group(field: frontmatter___tags) {
        fieldValue
        totalCount
      }
    }
  }
`

export default IndexPage
