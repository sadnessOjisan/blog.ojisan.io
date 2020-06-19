import * as React from "react"
import { graphql, useStaticQuery } from "gatsby"
import { Link } from "gatsby"
import "../vendor/css/reset.css"
import "../vendor/css/base.css"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { AllBlogsQuery } from "../../types/graphql-types"

interface IProps {
  data: AllBlogsQuery
}

const IndexPage: React.FC<IProps> = ({ data }) => {
  console.log(data)
  return (
    <Layout>
      <SEO title="Home" />
      <h1 style={{ fontSize: "24px", marginTop: "12px", textAlign: "center" }}>
        BLOG
      </h1>
      <div>
        NEWS<br></br>
        {data.newses.nodes.map(news => {
          return (
            <ul>
              <li>{news.frontmatter?.created}</li>
              <li>{news.frontmatter?.title}</li>
            </ul>
          )
        })}
      </div>{" "}
      BLOGS<br></br>
      {data.blogs.nodes.map(node => (
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
}

export const pageQuery = graphql`
  query AllBlogs {
    blogs: allMarkdownRemark
    (
      filter: {fileAbsolutePath: {regex: "/(\/src\/contents)/.*\\.md$/"}}) {
      nodes {
        html
        frontmatter {
          title
          path
        }
      }
    }

    newses: allMarkdownRemark(filter: {fileAbsolutePath: {regex: "/(/src/news)/.*\\.md$/"}}) {
      nodes {
        frontmatter {
          title
          description
          created
          tags
        }
      }
    }
  }
`

export default IndexPage
