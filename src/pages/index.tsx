import * as React from "react"
import { graphql } from "gatsby"
import Layout from "../components/common/layout"
import SEO from "../components/common/seo"
import { AllBlogsQuery } from "../../types/graphql-types"
import styled from "styled-components"
import { Card } from "../components/indices/card"

interface IProps {
  data: AllBlogsQuery
}

const IndexPage: React.FC<IProps> = ({ data }) => {
  return (
    <Layout>
      <SEO title={data.site?.siteMetadata?.title || "HOME"} />
      <Title>ブログのためのブログ</Title>
      <Cards>
        {data.blogs.nodes.map(node =>
          node.frontmatter?.path ? (
            <StyledCard
              key={node.frontmatter.path}
              excerpt={node.excerpt}
              data={node.frontmatter}
            ></StyledCard>
          ) : (
            <div>invalid data</div>
          )
        )}
      </Cards>
    </Layout>
  )
}

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 24px 0px;
  text-align: center;
`

const Cards = styled.div`
  margin: 0 auto;
  padding: 5px;
  width: 90%;
  column-count: 4;
  column-gap: 0;
  @media (max-width: 1024px) {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
`

const StyledCard = styled(Card)`
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
`

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

export default IndexPage
