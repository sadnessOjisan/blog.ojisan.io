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
    <h1 style={{ fontSize: "24px", marginTop: "12px", textAlign: "center" }}>
      そろそろ飽きそうブログ
    </h1>
    {data.allMarkdownRemark.nodes.map(node => (
      <li
        style={{
          marginTop: "12px",
          color: "blue",
          textDecoration: "underline",
        }}
      >
        <Link to={node.frontmatter?.path || "/"}>
          {node.frontmatter?.title}
        </Link>
      </li>
    ))}
    <p
      style={{
        color: "red",
        fontSize: "40px",
        marginTop: "40px",
        fontWeight: "bold",
      }}
    >
      工事中
    </p>
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
