import * as React from "react"
import { graphql } from "gatsby"
import Image from "gatsby-image"
import styles from "./blogTemplate.module.css"
import { BlogTemplateQuery } from "../../types/graphql-types"
import Layout from "../components/layout"
import SEO from "../components/seo"
import Toc from "../components/toc"
import TocMobile from "../components/tocMoblie"
import Social from "../components/socials"
import SocialMobile from "../components/socialsMobile"

interface IProps {
  data: BlogTemplateQuery
}

export default function Template({ data }: IProps) {
  const { markdownRemark } = data // data.markdownRemark holds your post data
  console.log("markdownRemark", markdownRemark)
  return (
    <Layout>
      {markdownRemark &&
      markdownRemark.html &&
      markdownRemark.frontmatter &&
      markdownRemark.frontmatter.title &&
      markdownRemark.frontmatter.path &&
      markdownRemark.frontmatter.created ? (
        <>
          <SEO
            title={markdownRemark.frontmatter.title}
            description={markdownRemark.rawMarkdownBody?.slice(0, 100)}
            image={
              markdownRemark.frontmatter.visual?.childImageSharp?.fluid?.src
            }
          />
          <div className={styles.body}>
            <h1 className={styles.headline}>
              {markdownRemark.frontmatter.title}
            </h1>
            <h2 className={styles.date}>
              {markdownRemark.frontmatter.created}(created)
              {markdownRemark.frontmatter.updated &&
                `/${markdownRemark.frontmatter.updated}(updated)`}
            </h2>

            {markdownRemark.frontmatter.visual?.childImageSharp?.fluid && (
              <Image
                style={{ maxHeight: "60vh" }}
                // @ts-ignore FIXME: 型エラー
                fluid={markdownRemark.frontmatter.visual.childImageSharp.fluid}
              />
            )}
            <SocialMobile
              path={markdownRemark.frontmatter.path}
              title={markdownRemark.frontmatter.title}
              dateYYYYMMDD={markdownRemark.frontmatter.created.replace(
                /-/g,
                ""
              )}
            ></SocialMobile>
            <div className={styles.main}>
              <Social
                className={styles.socials}
                path={markdownRemark.frontmatter.path}
                title={markdownRemark.frontmatter.title}
                dateYYYYMMDD={markdownRemark.frontmatter.created.replace(
                  /-/g,
                  ""
                )}
              ></Social>
              <div
                className={styles.content}
                dangerouslySetInnerHTML={{ __html: markdownRemark.html }}
              />
              <Toc
                tableOfContents={markdownRemark.tableOfContents}
                className={styles.tocwrapper}
              ></Toc>
              <TocMobile
                tableOfContents={markdownRemark.tableOfContents}
                path={markdownRemark.frontmatter.path}
                title={markdownRemark.frontmatter.title}
                dateYYYYMMDD={markdownRemark.frontmatter.created.replace(
                  /-/g,
                  ""
                )}
              ></TocMobile>
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
      rawMarkdownBody
      frontmatter {
        created(formatString: "YYYY-MM-DD")
        updated(formatString: "YYYY-MM-DD")
        path
        title
        visual {
          childImageSharp {
            fluid(maxWidth: 800) {
              ...GatsbyImageSharpFluid
            }
          }
        }
      }
      tableOfContents(absolute: false)
    }
  }
`
