import React from "react"
import Image from "gatsby-image"
import Layout from "../components/common/layout"
import UserImage from "../components/common/image"
import styles from "./userTemplate.module.css"
import GitHubIcon from "@material-ui/icons/GitHub"
import Twittercon from "@material-ui/icons/Twitter"
import { IconButton, makeStyles } from "@material-ui/core"
import { UserType } from "../type"
import { graphql, Link } from "gatsby"
import { AllPostsByUserIdQuery } from "../../types/graphql-types"
import { Tags } from "../components/indices/tags"

interface IProps {
  // user.yamlの構造が入る
  pageContext: UserType
  data: AllPostsByUserIdQuery
}

const useStyles = makeStyles({
  root: { width: 20, height: 20, padding: 20 },
})

const userTemplate: React.FC<IProps> = props => {
  const classes = useStyles()
  const { pageContext } = props
  return (
    <Layout>
      <div className={styles.wrapper}>
        <div className={styles.row}>
          <UserImage
            filename={pageContext.image}
            alt={`${pageContext.image}のプロフィール写真`}
            className={styles.userIcon}
          />

          <div className={styles.info}>
            <div className={styles.snsRow}>
              <span className={styles.name}>{pageContext.name}</span>
              <div>
                <IconButton className={classes.root}>
                  <a
                    target="_blank"
                    rel="noopener"
                    href={`https://twitter.com/${pageContext.twitterId}`}
                  >
                    <Twittercon />
                  </a>
                </IconButton>
                <IconButton className={classes.root}>
                  <a
                    target="_blank"
                    rel="noopener"
                    href={`https://github.com/${pageContext.gitHubId}`}
                  >
                    <GitHubIcon />
                  </a>
                </IconButton>
              </div>
            </div>
            <p className={styles.description}>{pageContext.description}</p>
          </div>
        </div>
        <div className={styles.posts}>
          <h2 className={styles.postTitle}>{pageContext.name}の投稿</h2>
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
                    <div className={styles.postRow}>
                      <Image
                        className={styles.image}
                        // @ts-ignore FIXME: 型エラー
                        fluid={node.frontmatter.visual.childImageSharp.fluid}
                      />
                      <div className={styles.infoBox}>
                        <h3 className={styles.postTitle}>
                          {node.frontmatter.title}
                        </h3>
                        <Tags
                          tags={node.frontmatter?.tags}
                          className={styles.tags}
                        ></Tags>
                        <div className={styles.min}>
                          {node.timeToRead / 2}min
                        </div>
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

export default userTemplate
