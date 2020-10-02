import React from "react"
import Image from "gatsby-image"
import Layout from "../components/common/layout"
import UserImage from "../components/common/image"
import { UserType } from "../type"
import { graphql, Link } from "gatsby"
import { AllPostsByUserIdQuery } from "../../types/graphql-types"
import { Tags } from "../components/indices/tags"
import styled from "styled-components"
import { createFluidImageFromImageSharp } from "../helper/createImageObject"

interface IPassedProps {
  // user.yamlの構造が入る
  pageContext: UserType
  data: AllPostsByUserIdQuery
}

interface IProps extends IPassedProps {
  className?: string
}

const Component: React.FC<IProps> = props => {
  const { pageContext, className } = props
  return (
    <Layout>
      <div className={className}>
        <div className={"row"}>
          <UserImage
            filename={pageContext.image}
            alt={`${pageContext.image}のプロフィール写真`}
            className={"userIcon"}
          />
          <div className={"info"}>
            <div className={"snsRow"}>
              <span className={"name"}>{pageContext.name}</span>
              <div>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://twitter.com/${pageContext.twitterId}`}
                  aria-label="twitterへのリンク"
                >
                  <button aria-label="twitterアイコン" className="button">
                    <span>
                      <svg
                        viewBox="0 0 24 24"
                        width={24}
                        height={24}
                        fill="rgba(0, 0, 0, 0.54)"
                      >
                        {/* Twitter */}
                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                      </svg>
                    </span>
                  </button>
                </a>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://github.com/${pageContext.gitHubId}`}
                  aria-label="githubへのリンク"
                >
                  <button aria-label="githubアイコン" className="button">
                    <span>
                      {/* GitHub */}
                      <svg
                        viewBox="0 0 24 24"
                        width={24}
                        height={24}
                        fill="rgba(0, 0, 0, 0.54)"
                      >
                        <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2 0 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8 0 3.2.9.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1 .9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3" />
                      </svg>
                    </span>
                  </button>
                </a>
              </div>
            </div>
            <p className={"description"}>{pageContext.description}</p>
          </div>
        </div>
        <div className={"posts"}>
          <h2 className={"postTitle"}>{pageContext.name}の投稿</h2>
          <hr></hr>
          {props.data.postsByUserId.nodes.map(
            node =>
              // TODO: 判定関数にくくり出す
              node.timeToRead &&
              node.frontmatter &&
              node.frontmatter.title &&
              node.frontmatter.path &&
              node.frontmatter.tags &&
              node.frontmatter?.visual?.childImageSharp?.fluid && (
                <Link to={node.frontmatter.path}>
                  <a>
                    <div className={"postRow"}>
                      <Image
                        className={"image"}
                        // TODO: JSを実行するのは本当にいいのかはあとで検討する。
                        fluid={createFluidImageFromImageSharp(
                          node.frontmatter?.visual?.childImageSharp?.fluid
                        )}
                      />
                      <div className={"infoBox"}>
                        <h3 className={"postTitle"}>
                          {node.frontmatter.title}
                        </h3>
                        <Tags
                          tags={node.frontmatter?.tags}
                          className={"tags"}
                        ></Tags>
                        <div className={"min"}>{node.timeToRead / 2}min</div>
                      </div>
                    </div>
                  </a>
                </Link>
              )
          )}
        </div>
      </div>
    </Layout>
  )
}

export const pageQuery = graphql`
  query AllPostsByUserId($userId: String!) {
    postsByUserId: allMarkdownRemark(filter: {fileAbsolutePath: {regex: "/(/src/contents)/.*\\.md$/"},frontmatter: {userId: {eq: $userId}}}, sort: {order: DESC, fields: frontmatter___created}) {
      nodes {
        timeToRead
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

const StyledComponent = styled(Component)`
  max-width: 960px;
  margin: auto;

  & .row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin: auto;
    margin-top: 32px;
    justify-content: safe center;
  }

  & .info {
    margin-left: 24px;
  }

  & .userIcon {
    width: 100px;
    height: 100px;
    border-radius: 50px;
    /* 画像が潰れないように. https://coliss.com/articles/build-websites/operation/css/making-width-and-flexible-items.html */
    flex-shrink: 0;
  }

  & .name {
    font-size: 24px;
    font-weight: bold;
    margin-right: 12px;
  }

  & .snsRow {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 12px;
  }

  & .posts {
    margin-top: 32px;
  }

  & .postRow {
    display: flex;
    border: solid 1px #ccc;
    background-color: white;
    margin: 16px 0px;
    border-radius: 8px;
  }

  & .image {
    width: 240px;
    height: 150px;
    flex-shrink: 0;
  }

  & .postRow:hover {
    background-color: rgb(245, 245, 245);
  }

  & .postTitle {
    font-size: 24px;
    font-weight: bold;
  }

  & .infoBox {
    padding: 12px;
    display: flex;
    flex-direction: column;
  }

  & .tags {
    margin-top: 12px;
  }

  & .min {
    margin-top: auto;
    color: #2196f3;
  }

  @media screen and (max-width: 1024px) {
    padding: 16px;

    & .row {
      flex-direction: column;
    }

    & .snsRow {
      flex-direction: column;
      margin-bottom: 12px;
    }

    & .name {
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      margin: 8px 0px;
      margin-bottom: 0;
    }

    & .info {
      margin-left: 0px;
    }

    & .image {
      display: none;
    }
  }
`

const ContainerComponent: React.FC<IPassedProps> = props => {
  return <StyledComponent {...props}></StyledComponent>
}

export default ContainerComponent
