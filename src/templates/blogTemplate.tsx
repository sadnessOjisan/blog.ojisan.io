import * as React from "react"
import { Helmet } from "react-helmet"
import { graphql, Link } from "gatsby"
import Image from "gatsby-image"
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
import styled from "styled-components"

interface IPassedProps {
  data: BlogTemplateQuery
  pageContext: UserType
}

interface IContainerProps {
  isOpen: boolean
  setTocOpenerState: React.Dispatch<React.SetStateAction<boolean>>
}

interface IProps extends IPassedProps, IContainerProps {
  className?: string
}

const Component: React.FC<IProps> = ({
  data,
  pageContext,
  className,
  isOpen,
  setTocOpenerState,
}) => {
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
      post.excerpt ? (
        <>
          <SEO
            title={post.frontmatter.title}
            description={post.excerpt.slice(0, 100)}
            image={post.frontmatter.visual?.childImageSharp?.fluid?.src}
          />
          {/* はてぶ炎上プロテクト: frontmatterのisProtectをtrueにすると動作する */}
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
          <div className={className}>
            <div className={"main"}>
              <Social
                className={"socials"}
                path={post.frontmatter.path}
                title={post.frontmatter.title}
                dateYYYYMMDD={post.frontmatter.created.replace(/-/g, "")}
              ></Social>
              <div className={"contentWrapper"}>
                <div className={"articleHeader"}>
                  <h1 className={"headline"}>{post.frontmatter.title}</h1>
                  <h2 className={"date"}>
                    {post.frontmatter.created}(created)
                    {post.frontmatter.updated &&
                      `/${post.frontmatter.updated}(updated)`}
                  </h2>
                  {/* TODO: tasgsコンポーネントで置き換える */}
                  {/* FIXME: Cardのtagとclassが衝突する事故 */}
                  <div className={"article-tags"}>
                    {post.frontmatter.tags.map(
                      tag =>
                        tag && (
                          <Link to={`/tags/${tag}`}>
                            <a>
                              <Tag className={"article-tag"} name={tag}></Tag>
                            </a>
                          </Link>
                        )
                    )}
                  </div>
                  <div className={"userRow"}>
                    <Link to={`/users/${pageContext.id}`}>
                      <UserImage
                        className={"userImage"}
                        filename={pageContext.image}
                        alt={pageContext.image}
                      ></UserImage>{" "}
                    </Link>
                    <div className={"userInfoRow"}>
                      <Link to={`/users/${pageContext.id}`}>
                        <div className={"userLink"}>{pageContext.name}</div>
                      </Link>
                      <a
                        href={`https://twitter.com/${pageContext.name}`}
                        className={"followButton"}
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
                  className={"content"}
                  dangerouslySetInnerHTML={{ __html: post.html }}
                />
              </div>
              {/* TODO: hiddenかどうかはこの階層のCSSで制御すべき */}
              <Toc
                tableOfContents={post.tableOfContents}
                className={"tocwrapper"}
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
            <div className={"posts"}>
              <div
                style={{
                  maxWidth: "95vw",
                  marginLeft: "auto",
                }}
              >
                <h3 className={"sectionTitle"}>最新の記事</h3>
                <Swiper className={"swiper"}>
                  {latestPosts.nodes.map(node => (
                    <Card data={node.frontmatter} className={"card"}></Card>
                  ))}
                </Swiper>
                <h3 className={"sectionTitle"}>人気の記事</h3>
                <Swiper className={"swiper"}>
                  {favoriteArticles.nodes.map(node => (
                    <Card data={node.frontmatter} className={"card"}></Card>
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

const StyledComponent = styled(Component)`
  & .main {
    display: flex;
    justify-content: center;
  }

  & .main > .socials {
    width: 5%;
    padding-top: 32px;
    padding-right: 36px;
  }

  & .main > .tocwrapper {
    width: 25%;
    padding-left: 16px;
    padding-top: 32px;
  }

  & .articleHeader {
    max-width: 768px;
    margin-bottom: 12px;
    padding: 8px;
    min-height: 20vh;
  }

  & .headline {
    color: #2c2e31;
    line-height: 48px;
    font-size: 32px;
    margin: 8px 0px;
    padding: 0 8px;
  }

  @media screen and (max-width: 1024px) {
    & .headline {
      margin: 8px 0px;
      font-size: 28px;
      line-height: 36px;
    }
  }

  & .date {
    color: rgba(0, 0, 0, 0.54);
    font-size: 16px;
    margin-bottom: 12px;
    padding: 0 8px;
  }

  & .article-tags {
    display: flex;
    margin: 8px 0px;
  }

  & .article-tag {
    margin-right: 12px;
    margin-bottom: 8px;
  }

  & .userRow {
    display: flex;
    align-items: center;
    margin-top: 16px;
  }

  & .userImage {
    width: 48px;
    height: 48px;
    border-radius: 24px;
    border: solid 1px #ccc;
  }

  & .userInfoRow {
    display: flex;
    flex-direction: column;
    margin-left: 12px;
  }

  & .userLink {
    text-decoration: underline;
    font-size: 16px;
  }

  & .followButton {
    border: solid 1px #2196f3;
    color: #2196f3;
    /* TIPS: 引き延ばし防止, https://www.webcreatorbox.com/tech/flexbox-tips */
    align-self: flex-start;
    margin-top: 4px;
    padding: 4px;
    border-radius: 4px;
    font-size: 12px;
  }

  & .followButton:hover {
    display: block;
    background-color: white;
  }

  @media screen and (max-width: 1024px) {
    .contentWrapper {
      width: 100%;
    }

    .socials {
      display: none;
    }
    .content {
      width: 90%;
      margin: 0 auto;
    }
  }

  // .contentが記事本体
  & .content {
    max-width: 768px;
    padding: 32px;
    color: #2c2e31;
    background-color: white;
  }

  @media screen and (max-width: 1024px) {
    .content {
      padding: 0px;
      margin-top: 16px;
      border-radius: 8px;
      background-color: initial;
      box-shadow: initial;
    }
  }

  & .content > p,
  & .content > ul {
    font-size: 16px;
    line-height: 1.6;
  }

  & .content > h1 {
    font-size: 32px;
    line-height: 32px;
    margin-top: 40px;
    font-weight: bold;
  }

  & .content > h2 {
    font-size: 28px;
    margin-top: 50px;
    font-weight: bold;
  }

  & .content > h3 {
    font-size: 22px;
    margin-top: 20px;
    font-weight: bold;
  }

  & .content > h4 {
    font-size: 20px;
    margin-top: 16px;
    font-weight: bold;
  }

  @media screen and (max-width: 1024px) {
    & .content > h1 {
      font-size: 30px;
      line-height: 32px;
      margin-top: 3px;
    }

    & .content > h2 {
      font-size: 28px;
      margin-top: 30px;
    }

    & .content > h3 {
      font-size: 24px;
      margin-top: 16px;
    }

    & .content > h4 {
      font-size: 20px;
      margin-top: 12px;
    }
  }

  & .content > blockquote {
    font-style: italic;
  }

  & .content > p,
  & .content > img,
  & .content > div,
  & .content > ul,
  & .content > blockquote {
    margin-bottom: 20px;
    word-break: break-all;
  }

  & .content > h1,
  & .content > h2,
  & .content > h3,
  & .content > h4 {
    margin-bottom: 12px;
    word-break: break-all;
  }

  & .content li {
    margin-bottom: 8px;
  }

  & .content ul {
    list-style: circle inside;
    margin-left: 16px;
  }

  & .content > ul {
    list-style: square inside;
  }

  & .content li p {
    display: inline;
  }

  & .content a {
    color: #368ccb;
  }

  & .content iframe {
    display: block;
    margin: 32px auto;
  }

  & .content iframe {
    width: 560px;
    height: 315px;
  }

  @media screen and (max-width: 1024px) {
    & .content iframe {
      width: initial;
      height: initial;
    }
  }

  // 記事以下
  & .posts {
    margin-top: 60px;
    padding: 24px;
    padding-right: 0;
    background-color: white;
  }

  & .sectionTitle {
    font-size: 32px;
    margin: 20px 0px;
    font-weight: bold;
  }

  & .card {
    flex-shrink: 0;
    width: 30%;
    border: solid 3px #ccc;
    display: block;
  }

  & .card:not(:first-child) {
    margin-left: 12px;
  }

  & .swiper {
    scroll-margin-right: 12px;
    margin-right: 12px;
  }

  @media screen and (max-width: 1024px) {
    & .card {
      width: 90%;
      border: solid 3px #ccc;
    }
  }
`

const ContainerComponent: React.FC<IPassedProps> = props => {
  const [isOpen, setTocOpenerState] = React.useState(false)
  const containerProps = { isOpen, setTocOpenerState }
  return <StyledComponent {...props} {...containerProps}></StyledComponent>
}

export default ContainerComponent

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
        excerpt(format: PLAIN, truncate: true)
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
        excerpt(format: PLAIN, truncate: true)
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
