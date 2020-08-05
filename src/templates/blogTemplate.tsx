import * as React from "react"
import { Helmet } from "react-helmet"
import { graphql, Link } from "gatsby"
import Image from "gatsby-image"
import styles from "./blogTemplate.module.css"
import { BlogTemplateQuery } from "../../types/graphql-types"
import Layout from "../components/common/layout"
import SEO from "../components/common/seo"
import Toc from "../components/article/toc/toc"
import TocMobile from "../components/article/toc/tocMoblie"
import Social from "../components/article/social/socials"
import UserImage from "../components/common/image"
import { Tag } from "../components/indices/tag"
import { UserType } from "../type"
import { Card } from "../components/indices/card"
import Swiper from "../components/common/swiper"

interface IProps {
  data: BlogTemplateQuery
  pageContext: UserType
}

export default function Template({ data, pageContext }: IProps) {
  const [isOpen, setTocOpenerState] = React.useState(false)
  const { post, latestPosts, favoriteArticles } = data
  return (
    <Layout>
      {post &&
      post.html &&
      post.frontmatter &&
      post.frontmatter.title &&
      post.frontmatter.path &&
      post.frontmatter.created &&
      post.frontmatter.tags &&
      post.frontmatter.isProtect &&
      post.excerpt ? (
        <>
          <SEO
            title={post.frontmatter.title}
            description={post.excerpt.slice(0, 100)}
            image={post.frontmatter.visual?.childImageSharp?.fluid?.src}
          />
          {post.frontmatter.isProtect && (
            <Helmet
              meta={[
                {
                  name: "Hatena::Bookmark",
                  content: "nocomment",
                },
              ]}
            />
          )}
          <div className={isOpen && styles.modalOpenBody}>
            <div className={styles.main}>
              <Social
                className={styles.socials}
                path={post.frontmatter.path}
                title={post.frontmatter.title}
                dateYYYYMMDD={post.frontmatter.created.replace(/-/g, "")}
              ></Social>
              <div className={styles.contentWrapper}>
                <div className={styles.articleHeader}>
                  <h1 className={styles.headline}>{post.frontmatter.title}</h1>
                  <h2 className={styles.date}>
                    {post.frontmatter.created}(created)
                    {post.frontmatter.updated &&
                      `/${post.frontmatter.updated}(updated)`}
                  </h2>
                  <div className={styles.tags}>
                    {post.frontmatter.tags.map(
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
                    <Link to={`/users/${pageContext.id}`}>
                      <UserImage
                        className={styles.userImage}
                        filename={pageContext.image}
                        alt={pageContext.image}
                      ></UserImage>{" "}
                    </Link>
                    <div className={styles.userInfoRow}>
                      <Link to={`/users/${pageContext.id}`}>
                        <div className={styles.userLink}>
                          {pageContext.name}
                        </div>
                      </Link>
                      <a
                        href={`https://twitter.com/${pageContext.name}`}
                        className={styles.followButton}
                        target="_blank"
                        rel="noopener"
                      >
                        Follow
                      </a>
                    </div>
                  </div>
                </div>
                {post.frontmatter.visual?.childImageSharp?.fluid && (
                  <Image
                    style={{
                      maxWidth: "960px",
                      margin: "auto",
                    }}
                    // @ts-ignore FIXME: 型エラー
                    fluid={post.frontmatter.visual.childImageSharp.fluid}
                  />
                )}
                <div
                  className={styles.content}
                  dangerouslySetInnerHTML={{ __html: post.html }}
                />
              </div>

              <Toc
                tableOfContents={post.tableOfContents}
                className={styles.tocwrapper}
              ></Toc>
              <TocMobile
                isOpen={isOpen}
                setTocOpenerState={(isOpen: boolean) =>
                  setTocOpenerState(isOpen)
                }
                tableOfContents={post.tableOfContents}
                path={post.frontmatter.path}
                title={post.frontmatter.title}
                dateYYYYMMDD={post.frontmatter.created.replace(/-/g, "")}
              ></TocMobile>
            </div>
            <div className={styles.posts}>
              <div
                style={{
                  maxWidth: "95vw",
                  marginLeft: "auto",
                }}
              >
                <h3 className={styles.sectionTitle}>最新の記事</h3>
                <Swiper>
                  {latestPosts.nodes.map(node => (
                    <Card
                      data={node.frontmatter}
                      className={styles.card}
                    ></Card>
                  ))}
                </Swiper>
                <h3 className={styles.sectionTitle}>人気の記事</h3>
                <Swiper>
                  {favoriteArticles.nodes.map(node => (
                    <Card
                      data={node.frontmatter}
                      className={styles.card}
                    ></Card>
                  ))}
                </Swiper>
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
    post: markdownRemark(frontmatter: { path: { eq: $path } }) {
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
        isProtect
      }
      tableOfContents(absolute: false)
    }

    favoriteArticles: allMarkdownRemark(filter: {fileAbsolutePath: {regex: "/(/src/contents)/.*\\.md$/"},frontmatter: {isFavorite: {eq: true}}},limit: 6, sort: {order: DESC, fields: frontmatter___created}) {
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
    latestPosts: allMarkdownRemark(filter: {fileAbsolutePath: {regex: "/(/src/contents)/.*\\.md$/"}},limit: 6, sort: {order: DESC, fields: frontmatter___created}) {
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
  }
`
