import * as React from "react"
import { graphql } from "gatsby"
import Layout from "../components/common/layout"
import SEO from "../components/common/seo"
import { AllBlogsQuery } from "../../types/graphql-types"
import styled from "styled-components"
import { Card } from "../components/indices/card"

interface IContainerProps {
  data: AllBlogsQuery
}

interface IProps extends IContainerProps {
  /** 呼び出し元から書き換えるためのclassName */
  className?: string
}

const Component: React.FC<IProps> = ({ data, className }) => {
  return (
    <div className={className}>
      <Layout>
        <SEO title={data.site?.siteMetadata?.title || "HOME"} />
        <div className="cards">
          {data.blogs.nodes.map(node =>
            node.frontmatter?.path ? (
              <Card
                className="card"
                key={node.frontmatter.path}
                excerpt={node.excerpt}
                data={node.frontmatter}
              ></Card>
            ) : (
              <div>invalid data</div>
            )
          )}
        </div>
      </Layout>
    </div>
  )
}

const StyledComponent = styled(Component)`
  & .cards {
    margin: 24px auto;
    padding: 5px;
    width: 90%;
    column-count: 3;
    column-gap: 0;
    max-width: 1024px;
    @media (max-width: 768px) {
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    & .card {
      margin: 16px;
      margin-top: 0;
      -webkit-column-break-inside: avoid;
      page-break-inside: avoid;
      break-inside: avoid;
      box-shadow: 8px 12px 10px -6px rgba(0, 0, 0, 0.3);
      display: inline-block;
      @media (max-width: 1024px) {
        margin-bottom: 16px;
      }
    }
  }
`

const ContainerComponent: React.FC<IProps> = ({ children, data }) => {
  return <StyledComponent data={data}>{children}</StyledComponent>
}

export const pageQuery = graphql`
  query AllBlogs {
    blogs: allMarkdownRemark(filter: {fileAbsolutePath: {regex: "/(/src/contents)/.*\\.md$/"}}, sort: {order: DESC, fields: frontmatter___created}) {
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

    site {
      siteMetadata {
        title
        description
        author
      }
    }
  }
`

export default ContainerComponent
