import * as React from "react"
import { graphql } from "gatsby"
import { Link } from "gatsby"
import "../vendor/css/reset.css"
import "../vendor/css/base.css"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { AllBlogsQuery } from "../../types/graphql-types"
import { Newses } from "../components/newses"
import Image from "gatsby-image"
import styles from "./index.module.css"

interface IProps {
  data: AllBlogsQuery
}

const IndexPage: React.FC<IProps> = ({ data }) => {
  return (
    <Layout>
      <SEO title={data.site?.siteMetadata?.title || "HOME"} />
      <h1 className={styles.title}>
        {data.site?.siteMetadata?.title || "HOME"}
      </h1>
      <Newses data={data.newses} className={styles.newses}></Newses>
      <div className={styles.cards}>
        {data.blogs.nodes.map(node => (
          <div className={styles.card}>
            <Link to={node.frontmatter?.path || "/"}>
              <Image
                style={{
                  width: "100%",
                  margin: "auto",
                }}
                // @ts-ignore FIXME: 型エラー
                fluid={node.frontmatter.visual.childImageSharp.fluid}
              />
              <h3 className={styles.articleTitle}>{node.frontmatter?.title}</h3>
            </Link>
          </div>
        ))}
      </div>
    </Layout>
  )
}

export const pageQuery = graphql`
  query AllBlogs {
    blogs: allMarkdownRemark(filter: {fileAbsolutePath: {regex: "/(/src/contents)/.*\\.md$/"}}, sort: {order: DESC, fields: frontmatter___created}) {
      nodes {
        html
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
