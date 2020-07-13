import * as React from "react"
import { graphql } from "gatsby"
import "../vendor/css/reset.css"
import "../vendor/css/base.css"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { AllBlogsQuery } from "../../types/graphql-types"
import { Newses } from "../components/newses"
import styles from "./index.module.css"
import { Card } from "../components/card"
import { Tag } from "../components/tag"

interface IProps {
  data: AllBlogsQuery
}

const IndexPage: React.FC<IProps> = ({ data }) => {
  return (
    <Layout>
      <SEO title={data.site?.siteMetadata?.title || "HOME"} />
      <h1 className={styles.title}>日々のつまづき</h1>
      <Newses data={data.newses} className={styles.newses}></Newses>
      <div className={styles.cards}>
        {data.blogs.nodes.map(node => (
          <Card
            excerpt={node.excerpt}
            data={node.frontmatter}
            className={styles.card}
          ></Card>
        ))}
      </div>
    </Layout>
  )
}

export const pageQuery = graphql`
  query AllBlogs {
    blogs: allMarkdownRemark(filter: {fileAbsolutePath: {regex: "/(/src/contents)/.*\\.md$/"}}, sort: {order: DESC, fields: frontmatter___created}) {
      nodes {
        excerpt
        frontmatter {
          title
          path
          visual {
            childImageSharp {
              fluid(maxWidth: 800) {
                ...GatsbyImageSharpFluid
              }
            }
          }
          created(formatString: "YYYY-MM-DD")
          tags
        }
      }
    }

    newses: allMarkdownRemark(filter: {fileAbsolutePath: {regex: "/(/src/news)/.*\\.md$/"}}, limit: 5, sort: {fields: frontmatter___created, order: DESC}) {
      nodes {
        frontmatter {
          title
          description
          created
        }
      }
    }

    site {
      siteMetadata {
        title
        description
        author
      }
    }
  }
`

export default IndexPage
