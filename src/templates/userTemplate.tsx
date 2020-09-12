import React from "react"
import Image from "gatsby-image"
import Layout from "../components/common/layout"
import UserImage from "../components/common/image"
import GitHubIcon from "@material-ui/icons/GitHub"
import Twittercon from "@material-ui/icons/Twitter"
import { IconButton, makeStyles } from "@material-ui/core"
import { UserType } from "../type"
import { graphql, Link } from "gatsby"
import { AllPostsByUserIdQuery } from "../../types/graphql-types"
import { Tags } from "../components/indices/tags"
import styled from "styled-components"

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
                  rel="noopener"
                  href={`https://twitter.com/${pageContext.twitterId}`}
                >
                  <IconButton>
                    <Twittercon />
                  </IconButton>
                </a>
                <a
                  target="_blank"
                  rel="noopener"
                  href={`https://github.com/${pageContext.gitHubId}`}
                >
                  <IconButton>
                    <GitHubIcon />
                  </IconButton>
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
              node.timeToRead &&
              node.frontmatter &&
              node.frontmatter.title &&
              node.frontmatter.path &&
              node.frontmatter.tags && (
                <Link to={node.frontmatter.path}>
                  <a>
                    <div className={"postRow"}>
                      <Image
                        className={"image"}
                        // @ts-ignore FIXME: 型エラー
                        fluid={node.frontmatter.visual.childImageSharp.fluid}
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
