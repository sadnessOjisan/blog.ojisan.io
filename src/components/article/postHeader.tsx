import * as React from "react"
import styled from "styled-components"
import { Link } from "gatsby"
import { BlogTemplateQuery } from "../../../types/graphql-types"
import { UserType } from "../../type"
import { Tag } from "../indices/tag"
import UserImage from "../common/image"

interface IPassedProps {
  post: NonNullable<BlogTemplateQuery["post"]>
  pageContext: UserType
}

interface IProps extends IPassedProps {
  className?: string
}

const Component: React.FC<IProps> = props => {
  const { post, pageContext, className } = props
  const { frontmatter } = post
  if (!frontmatter || !frontmatter.tags) {
    throw new Error("invalit")
  }
  return (
    <div className={className}>
      <h1 className={"headline"}>{frontmatter.title}</h1>
      <h2 className={"date"}>
        {frontmatter.created}(created)
        {frontmatter.updated && `/${frontmatter.updated}(updated)`}
      </h2>
      {/* TODO: tasgsコンポーネントで置き換える */}
      {/* FIXME: Cardのtagとclassが衝突する事故 */}
      <div className={"tags"}>
        {frontmatter.tags.map(
          tag =>
            tag && (
              <Link to={`/tags/${tag}`} key={tag}>
                <a>
                  <Tag className={"tag"} name={tag}></Tag>
                </a>
              </Link>
            )
        )}
      </div>
      <div className={"userRow"}>
        <Link to={`/users/${pageContext.id}`}>
          <UserImage
            className={"userImage"}
            filename={pageContext.image}
            alt={pageContext.image}
          ></UserImage>{" "}
        </Link>
        <div className={"userInfoRow"}>
          <Link to={`/users/${pageContext.id}`}>
            <div className={"userLink"}>{pageContext.name}</div>
          </Link>
          <a
            href={`https://twitter.com/${pageContext.name}`}
            className={"followButton"}
            target="_blank"
            rel="noreferrer noopener"
          >
            Follow
          </a>
        </div>
      </div>
    </div>
  )
}

const StyledComponent = styled(Component)`
  max-width: 768px;
  margin-bottom: 12px;
  padding: 8px;
  min-height: 20vh;
  & .headline {
    color: #2c2e31;
    line-height: 48px;
    font-size: 32px;
    margin: 8px 0px;
    padding: 0 8px;
  }

  @media screen and (max-width: 1024px) {
    & .headline {
      margin: 8px 0px;
      font-size: 28px;
      line-height: 36px;
    }
  }

  & .date {
    color: rgba(0, 0, 0, 0.54);
    font-size: 16px;
    margin-bottom: 12px;
    padding: 0 8px;
  }

  & .tags {
    display: flex;
    margin: 8px 0px;
  }

  & .tag {
    margin-right: 12px;
    margin-bottom: 8px;
  }

  & .userRow {
    display: flex;
    align-items: center;
    margin-top: 16px;
  }

  & .userImage {
    width: 48px;
    height: 48px;
    border-radius: 24px;
    border: solid 1px #ccc;
  }

  & .userInfoRow {
    display: flex;
    flex-direction: column;
    margin-left: 12px;
  }

  & .userLink {
    text-decoration: underline;
    font-size: 16px;
  }

  & .followButton {
    border: solid 1px #2196f3;
    color: #2196f3;
    /* TIPS: 引き延ばし防止, https://www.webcreatorbox.com/tech/flexbox-tips */
    align-self: flex-start;
    margin-top: 4px;
    padding: 4px;
    border-radius: 4px;
    font-size: 12px;
  }

  & .followButton:hover {
    display: block;
    background-color: white;
  }
`

export const PostHeader = StyledComponent
