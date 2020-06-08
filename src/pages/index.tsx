import * as React from "react"
import { graphql } from "gatsby"
import { Link } from "gatsby"
import "../vendor/css/reset.css"
import "../vendor/css/base.css"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { AllBlogsQuery } from "../../types/graphql-types"

interface IProps {
  data: AllBlogsQuery
}

const IndexPage: React.FC<IProps> = ({ data }) => (
  <Layout>
    <SEO title="Home" />
    {data.allMarkdownRemark.nodes.map(node => (
      <li>
        <Link to={node.frontmatter?.path || "/"}>
          {node.frontmatter?.title}
        </Link>
      </li>
    ))}
    <b style={{ color: "red", fontSize: "48px" }}>工事中</b>
  </Layout>
)

export const pageQuery = graphql`
  query AllBlogs {
    markdownRemark {
      tableOfContents(absolute: false)
    }
    allMarkdownRemark {
      nodes {
        html
        frontmatter {
          title
          path
        }
      }
    }
  }
`

export default IndexPage
