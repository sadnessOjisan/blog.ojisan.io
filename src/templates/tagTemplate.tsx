import * as React from "react"
import { graphql } from "gatsby"
import Layout from "../components/common/layout"
import { Card } from "../components/indices/card"
import { TagTemplateQuery } from "../../types/graphql-types"
import styled from "styled-components"

interface IPassedProps {
  // exportしたGraphQLの実行結果が埋め込まれる
  data: TagTemplateQuery
  // gatsby-nodeで生成されている
  pageContext: { tag: string; totalCount: number }
}

interface IProps extends IPassedProps {
  className?: string
}

const Component: React.FC<IProps> = ({ data, pageContext, className }) => {
  const articles = data.allMarkdownRemark.nodes
  return (
    <Layout>
      <div className={className}>
        <h2 className={'title'}>{pageContext.tag}についての記事</h2>
        <div className={'cards'}>
          {articles.map(article => (
            <Card
              excerpt={article.excerpt}
              data={article.frontmatter}
              className={'card'}
            ></Card>
          ))}
        </div></div>
    </Layout>
  )
}

const StyledComponent = styled(Component)`
& .title {
  font-size: 24px;
  text-align: center;
  margin-bottom: 32px;
  margin-top: 32px;
}

& .cards {
  margin: 0 auto;
  padding: 5px;
  width: 90%;
  column-count: 4;
  column-gap: 0;
}

& .card {
  margin: 16px;
  /* top0にしないと件数少ない時に表示崩れある */
  margin-top: 0px;
  -webkit-column-break-inside: avoid;
  page-break-inside: avoid;
  break-inside: avoid;
  box-shadow: 8px 12px 10px -6px rgba(0, 0, 0, 0.3);
}

@media screen and (max-width: 1024px) {
  & .cards {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  & .card {
    margin-bottom: 16px;
  }
}
`

const ContainerComponent: React.FC<IPassedProps> = (props) => {
  return <StyledComponent {...props}></StyledComponent>
}

export default ContainerComponent

export const pageQuery = graphql`
  query TagTemplate($tag: String!) {
    allMarkdownRemark(
      limit: 2000
      filter: { frontmatter: { tags: { in: [$tag] } } }
      sort: { order: DESC, fields: frontmatter___created }
    ) {
      nodes {
        excerpt(format: PLAIN, truncate: true)
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
