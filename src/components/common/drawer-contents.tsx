import * as React from "react"
import styled from "styled-components"
import { Link, useStaticQuery, graphql } from "gatsby"
import {
  TagsIndicesQuery,
  MarkdownRemarkGroupConnection,
} from "../../../types/graphql-types"

interface IPassedProps {
  /** 明示的に上書きしない場合でもclassNameは必要(なぜならStyledで絶対に上書くから) */
  className?: string
}

interface IContainerProps {
  allMarkdownRemark: {
    group: Pick<MarkdownRemarkGroupConnection, "fieldValue" | "totalCount">[]
  }
}

interface IProps extends IPassedProps, IContainerProps {}

const Component: React.FC<IProps> = ({ allMarkdownRemark, className }) => (
  <div className={className}>
    <h2 className="title">Navigation</h2>
    <ul className="block">
      <li className="item">
        <Link to="/">
          <button className="button">
            <a>Top</a>
          </button>
        </Link>
      </li>
      <li className="item">
        <Link to="/users/sadnessOjisan">
          <button className="button">
            <a>About Me</a>
          </button>
        </Link>
      </li>
      <li className="item">
        <Link to="/tags">
          <button className="button">
            <a>Tag一覧</a>
          </button>
        </Link>
      </li>
    </ul>
    <h2 className="title">Link</h2>
    <ul className="block">
      <li className="item">
        <Link to="/rss.xml">
          <button className="button">
            <a>RSS</a>
          </button>
        </Link>
      </li>
      <li className="item">
        <Link to="https://github.com/sadnessOjisan/blog.ojisan.io">
          <button className="button">
            <a>Github</a>
          </button>
        </Link>
      </li>
    </ul>
    <h2 className="title">tags</h2>
    <ul className="block">
      {allMarkdownRemark.group.map(
        tag =>
          tag.fieldValue && (
            <li className="item" key={tag.fieldValue}>
              <Link to={`/tags/${tag.fieldValue}`}>
                <button className="button">
                  <a>
                    {tag.fieldValue}({tag.totalCount})
                  </a>
                </button>
              </Link>
            </li>
          )
      )}
    </ul>
  </div>
)

const StyledComponent = styled(Component)`
  width: 200px;
  padding: 12px;
  & .title {
    text-align: center;
  }
  & .block {
    border-bottom: solid 1px #ccc;
    padding: 12px 0px;
    margin-bottom: 12px;
  }

  & .button {
    font-size: 14px;
    width: 100%;
    border: 0;
    height: 48px;
    border-radius: 3px;
    transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
      box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
      border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    &:hover {
      text-decoration: none;
      background-color: rgba(0, 0, 0, 0.04);
    }
  }

  & .item {
    margin: 24px 0px;
  }
`

const ContainerComponent: React.FC<IPassedProps> = props => {
  const {
    allMarkdownRemark,
  }: {
    allMarkdownRemark: TagsIndicesQuery["allMarkdownRemark"]
  } = useStaticQuery(
    graphql`
      query TagsIndices {
        allMarkdownRemark(
          sort: { order: DESC, fields: frontmatter___created }
        ) {
          group(field: frontmatter___tags) {
            fieldValue
            totalCount
          }
        }
      }
    `
  )

  const containerProps = { allMarkdownRemark }
  return <StyledComponent {...props} {...containerProps}></StyledComponent>
}

export default ContainerComponent
