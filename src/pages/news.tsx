import * as React from "react"
import { graphql } from "gatsby"
import Layout from "../components/common/layout"
import SEO from "../components/common/seo"
import { AllNewsQuery } from "../../types/graphql-types"
import styles from "./news.module.css"

interface IProps {
  data: AllNewsQuery
}

const IndexPage: React.FC<IProps> = ({ data }) => {
  return (
    <Layout>
      <SEO title={"ニュース一覧"} />
      <h1 className={styles.title}>ニュース一覧</h1>
      <div className={styles.items}>
        {data.newses.nodes.map(news => {
          return (
            <div className={styles.item}>
              <p className={styles.info}>
                <span className={styles.badge}>
                  {news.frontmatter.newsCategory}
                </span>
                {news.frontmatter.created}
              </p>
              <h3 className={styles.itemTitle}>{news.frontmatter.title}</h3>
              <p className={styles.description}>
                {news.frontmatter.description}
              </p>
            </div>
          )
        })}
      </div>
    </Layout>
  )
}

export const pageQuery = graphql`
  query AllNews {
    newses: allMarkdownRemark(filter: {fileAbsolutePath: {regex: "/(/src/news)/.*\\.md$/"}}, sort: {fields: frontmatter___created, order: DESC}) {
      nodes {
        frontmatter {
          title
          description
          created
          newsCategory
        }
      }
    }
  }
`

export default IndexPage
