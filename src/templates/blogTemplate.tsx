import * as React from "react"
import { graphql } from "gatsby"
import Image from "gatsby-image"
import styles from "./blogTemplate.module.css"
import { BlogTemplateQuery } from "../../types/graphql-types"
import Layout from "../components/layout"
import SEO from "../components/seo"
import Toc from "../components/toc"

interface IProps {
  data: BlogTemplateQuery
}

export default function Template({ data }: IProps) {
  const { markdownRemark } = data // data.markdownRemark holds your post data
  console.log("markdownRemark", markdownRemark)
  return (
    <Layout>
      {markdownRemark && markdownRemark.html && markdownRemark.frontmatter ? (
        <>
          <SEO
            title={markdownRemark.frontmatter.title}
            description={markdownRemark.html}
          />
          <div className={styles.body}>
            <div className="blog-post">
              <h1 className={styles.headline}>
                {markdownRemark.frontmatter.title}
              </h1>
              <h2 className={styles.date}>
                {markdownRemark.frontmatter.created}(created)
                {markdownRemark.frontmatter.updated &&
                  `/${markdownRemark.frontmatter.updated}(updated)`}
              </h2>
              <Image
                fluid={
                  markdownRemark.frontmatter.visual?.childImageSharp?.fluid
                }
              />
              <div className={styles.main}>
                <div className={styles.socials}>hakusyu</div>
                <div
                  className={styles.content}
                  dangerouslySetInnerHTML={{ __html: markdownRemark.html }}
                />
                <Toc
                  tableOfContents={markdownRemark.tableOfContents}
                  className={styles.tocwrapper}
                ></Toc>
              </div>
            </div>
          </div>
        </>
      ) : (
        "ERROR"
      )}
    </Layout>
  )
}
export const pageQuery = graphql`
  query BlogTemplate($path: String!) {
    markdownRemark(frontmatter: { path: { eq: $path } }) {
      html
      frontmatter {
        created(formatString: "YYYY-MM-DD")
        updated(formatString: "YYYY-MM-DD")
        path
        title
        visual {
          childImageSharp {
            fluid(maxWidth: 300) {
              ...GatsbyImageSharpFluid
            }
          }
        }
      }
      tableOfContents(absolute: false)
    }
  }
`
