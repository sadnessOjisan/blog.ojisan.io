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
import { UserType } from "../type"
import styled from "styled-components"
import { createFluidImageFromImageSharp } from "../helper/createImageObject"
import { PostHeader } from "../components/article/postHeader"
import { PostFooter } from "../components/article/postFooter"

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
  const image = createFluidImageFromImageSharp(
    post?.frontmatter?.visual?.childImageSharp?.fluid
  )
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
                <PostHeader post={post} pageContext={pageContext}></PostHeader>
                {image && (
                  <Image
                    style={{
                      maxWidth: "960px",
                      margin: "auto",
                    }}
                    fluid={image}
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
            <PostFooter
              latestPosts={latestPosts}
              favoriteArticles={favoriteArticles}
            ></PostFooter>
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
    line-height: 1.6;
    padding: 0 1em;
    color: #6a737d;
    border-left: 0.25em solid #dfe2e5;
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
