import * as React from "react"
import { graphql, Link } from "gatsby"
import Image from "gatsby-image"
import styles from "./blogTemplate.module.css"
import { BlogTemplateQuery } from "../../types/graphql-types"
import Layout from "../components/common/layout"
import SEO from "../components/common/seo"
import Toc from "../components/article/toc/toc"
import TocMobile from "../components/article/toc/tocMoblie"
import Social from "../components/article/social/socials"
import SocialMobile from "../components/article/social/socialsMobile"
import UserImage from "../components/common/image"
import { Tag } from "../components/indices/tag"
import { UserType } from "../type"

interface IProps {
  data: BlogTemplateQuery
  pageContext: {
    writeUser: UserType
  }
}

export default function Template({ data, pageContext }: IProps) {
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
              <div className={styles.userRow}>
                <UserImage
                  className={styles.userImage}
                  filename={pageContext.writeUser.image}
                  alt={pageContext.writeUser.image}
                ></UserImage>
                <div className={styles.userInfoRow}>
                  <Link to={`/users/${pageContext.writeUser.id}`}>
                    <div className={styles.userLink}>
                      {pageContext.writeUser.name}
                    </div>
                  </Link>
                  <a
                    href={`https://twitter.com/${pageContext.writeUser.name}`}
                    className={styles.followButton}
                    target="_blank"
                    rel="noopener"
                  >
                    Follow
                  </a>
                </div>
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
              ...GatsbyImageSharpFluid
            }
          }
        }
      }
      tableOfContents(absolute: false)
    }
  }
`
