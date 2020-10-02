import * as React from "react"
import { graphql, Link } from "gatsby"
import Layout from "../components/common/layout"
import { TagsQuery } from "../../types/graphql-types"
import styled from "styled-components"

interface IContainerProps {
  data: TagsQuery
}

interface IProps extends IContainerProps {
  /** 呼び出し元から書き換えるためのclassName */
  className?: string
}

const Component: React.FC<IProps> = ({ data, className }) => {
  return (
    <div className={className}>
      <Layout>
        <div className="pageWrapper">
          <h2 className="title">タグ一覧</h2>
          {data.allMarkdownRemark.group.map(
            tag =>
              tag &&
              tag.fieldValue && (
                <Link
                  to={tag.fieldValue ? `/tags/${tag.fieldValue}` : "/"}
                  key={tag.fieldValue}
                >
                  <div className="item">
                    <a>
                      {tag.fieldValue}({tag.totalCount})
                    </a>
                  </div>
                </Link>
              )
          )}
        </div>
      </Layout>
    </div>
  )
}

const StyledComponent = styled(Component)`
  & .pageWrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  & .title {
    font-size: 32px;
    margin-top: 32px;
    margin-bottom: 32px;
  }

  & .item {
    margin-top: 12px;
  }
`

const ContainerComponent: React.FC<IContainerProps> = ({ children, data }) => {
  return <StyledComponent data={data}>{children}</StyledComponent>
}

export const pageQuery = graphql`
  query Tags {
    allMarkdownRemark(sort: { order: DESC, fields: frontmatter___created }) {
      group(field: frontmatter___tags) {
        fieldValue
        totalCount
      }
    }
  }
`

export default ContainerComponent
