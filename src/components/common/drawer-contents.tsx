import * as React from "react"
import styled from "styled-components"
import { Link, useStaticQuery, graphql } from "gatsby"
import {
  TagsIndicesQuery,
  MarkdownRemarkGroupConnection,
} from "../../../types/graphql-types"
import { Button, makeStyles } from "@material-ui/core"

interface IPassedProps {
  /** 明示的に上書きしない場合でもclassNameは必要(なぜならStyledで絶対に上書くから) */
  className?: string
}

interface IContainerProps {
  classes: Record<"label" | "root", string>
  allMarkdownRemark: {
    group: Pick<MarkdownRemarkGroupConnection, "fieldValue" | "totalCount">[]
  }
}

interface IProps extends IPassedProps, IContainerProps {}

const Component: React.FC<IProps> = ({
  classes,
  allMarkdownRemark,
  className,
}) => (
  <div className={className}>
    <h2 className="title">Navigation</h2>
    <ul className="block">
      <li className="item">
        <Link to="/">
          <Button className={`${classes.root} ${classes.label}`}>
            <a>Top</a>
          </Button>
        </Link>
      </li>
      <li className="item">
        <Link to="/users/sadnessOjisan">
          <Button className={`${classes.root} ${classes.label}`}>
            <a>About Me</a>
          </Button>
        </Link>
      </li>
      <li className="item">
        <Link to="/tags">
          <Button className={`${classes.root} ${classes.label}`}>
            <a>Tag一覧</a>
          </Button>
        </Link>
      </li>
    </ul>
    <h2 className="title">Link</h2>
    <ul className="block">
      <li className="item">
        <Link to="/rss.xml">
          <Button className={`${classes.root} ${classes.label}`}>
            <a>RSS</a>
          </Button>
        </Link>
      </li>
      <li className="item">
        <Link to="https://github.com/sadnessOjisan/blog.ojisan.io">
          <Button className={`${classes.root} ${classes.label}`}>
            <a>Github</a>
          </Button>
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
                <Button className={`${classes.root} ${classes.label}`}>
                  <a>
                    {tag.fieldValue}({tag.totalCount})
                  </a>
                </Button>
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

  & .item {
    margin: 24px 0px;
  }
`

const ContainerComponent: React.FC<IPassedProps> = props => {
  const useStyles = makeStyles({
    root: {
      border: 0,
      borderRadius: 3,
      height: 48,
      width: "100%",
    },
    label: {
      justifyContent: "left",
    },
  })
  const classes = useStyles()
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

  const containerProps = { classes, allMarkdownRemark }
  return <StyledComponent {...props} {...containerProps}></StyledComponent>
}

export default ContainerComponent
