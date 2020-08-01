import * as React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import { Card } from "../components/indices/card"
import styles from "./tagTemplate.module.css"
import { TagTemplateQuery } from "../../types/graphql-types"

interface IProps {
  data: TagTemplateQuery
  // gatsby-nodeで生成されている
  pageContext: { tag: string; totalCount: number }
}

export default function Template({ data, pageContext }: IProps) {
  const articles = data.allMarkdownRemark.nodes
  return (
    <Layout>
      <h2 className={styles.title}>{pageContext.tag}についての記事</h2>
      <div className={styles.cards}>
        {articles.map(article => (
          <Card
            excerpt={article.excerpt}
            data={article.frontmatter}
            className={styles.card}
          ></Card>
        ))}
      </div>
    </Layout>
  )
}

export const pageQuery = graphql`
  query TagTemplate($tag: String!) {
    allMarkdownRemark(
      limit: 2000
      filter: { frontmatter: { tags: { in: [$tag] } } }
    ) {
      nodes {
        excerpt
        frontmatter {
          title
          path
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
          tags
          created(formatString: "YYYY-MM-DD")
        }
        rawMarkdownBody
      }
    }
  }
`
