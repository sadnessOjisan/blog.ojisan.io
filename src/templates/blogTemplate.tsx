import * as React from "react"
import { graphql, Link } from "gatsby"
import Image from "gatsby-image"
import styles from "./blogTemplate.module.css"
import { BlogTemplateQuery } from "../../types/graphql-types"
import Layout from "../components/layout"
import SEO from "../components/seo"
import Toc from "../components/toc"
import TocMobile from "../components/tocMoblie"
import Social from "../components/socials"
import SocialMobile from "../components/socialsMobile"
import { Tag } from "../components/tag"

interface IProps {
  data: BlogTemplateQuery
}

export default function Template({ data }: IProps) {
  const [isOpen, setTocOpenerState] = React.useState(false)
  const { markdownRemark } = data
  return (
    <Layout>
      {markdownRemark &&
      markdownRemark.html &&
      markdownRemark.frontmatter &&
      markdownRemark.frontmatter.title &&
      markdownRemark.frontmatter.path &&
      markdownRemark.frontmatter.created &&
      markdownRemark.frontmatter.tags &&
      markdownRemark.excerpt ? (
        <>
          <SEO
            title={markdownRemark.frontmatter.title}
            description={markdownRemark.excerpt.slice(0, 100)}
            image={
              markdownRemark.frontmatter.visual?.childImageSharp?.fluid?.src
            }
          />
          <div className={isOpen && styles.modalOpenBody}>
            <div className={styles.articleHeader}>
              <h1 className={styles.headline}>
                {markdownRemark.frontmatter.title}
              </h1>
              <h2 className={styles.date}>
                {markdownRemark.frontmatter.created}(created)
                {markdownRemark.frontmatter.updated &&
                  `/${markdownRemark.frontmatter.updated}(updated)`}
              </h2>
              <div className={styles.tags}>
                {markdownRemark.frontmatter.tags.map(
                  tag =>
                    tag && (
                      <Link to={`/tags/${tag}`}>
                        <a>
                          <Tag className={styles.tag} name={tag}></Tag>
                        </a>
                      </Link>
                    )
                )}
              </div>
            </div>
            {markdownRemark.frontmatter.visual?.childImageSharp?.fluid && (
              <Image
                style={{
                  maxWidth: "960px",
                  margin: "auto",
                }}
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
                isOpen={isOpen}
                setTocOpenerState={(isOpen: boolean) =>
                  setTocOpenerState(isOpen)
                }
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
      excerpt(format: PLAIN, truncate: true)
      html
      rawMarkdownBody
      frontmatter {
        created(formatString: "YYYY-MM-DD")
        updated(formatString: "YYYY-MM-DD")
        path
        title
        tags
        visual {
          childImageSharp {
            fluid(maxWidth: 800) {
              tracedSVG
              srcWebp
              srcSetWebp
              srcSet
              src
              sizes
              presentationWidth
              presentationHeight
              originalName
              originalImg
              base64
              aspectRatio
            }
          }
        }
      }
      tableOfContents(absolute: false)
    }
  }
`
