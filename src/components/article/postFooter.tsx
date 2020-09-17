import * as React from "react"
import styled from "styled-components"
import { Link } from "gatsby"
import { BlogTemplateQuery } from "../../../types/graphql-types"
import { UserType } from "../../type"
import { Tag } from "../indices/tag"
import UserImage from "../common/image"
import { Card } from "../indices/card"
import { Swiper } from "../common/swiper"

interface IPassedProps {
  latestPosts: NonNullable<BlogTemplateQuery["latestPosts"]>
  favoriteArticles: NonNullable<BlogTemplateQuery["favoriteArticles"]>
}

interface IProps extends IPassedProps {
  className?: string
}

const Component: React.FC<IProps> = props => {
  const { latestPosts, favoriteArticles, className } = props

  return (
    <div className={className}>
      <div
        style={{
          maxWidth: "95vw",
          marginLeft: "auto",
        }}
      >
        <h3 className={"sectionTitle"}>最新の記事</h3>
        <Swiper className={"swiper"}>
          {latestPosts.nodes.map(
            node =>
              node.frontmatter?.path && (
                <Card
                  data={node.frontmatter}
                  className={"card"}
                  key={node.frontmatter.path}
                ></Card>
              )
          )}
        </Swiper>
        <h3 className={"sectionTitle"}>人気の記事</h3>
        <Swiper className={"swiper"}>
          {favoriteArticles.nodes.map(
            node =>
              node.frontmatter?.path && (
                <Card
                  data={node.frontmatter}
                  className={"card"}
                  key={node.frontmatter.path}
                ></Card>
              )
          )}
        </Swiper>
      </div>
    </div>
  )
}

const StyledComponent = styled(Component)`
  margin-top: 60px;
  padding: 24px;
  padding-right: 0;
  background-color: white;
  & .sectionTitle {
    font-size: 32px;
    margin: 20px 0px;
    font-weight: bold;
  }

  & .card {
    flex-shrink: 0;
    width: 30%;
    border: solid 3px #ccc;
    display: block;
  }

  & .card:not(:first-child) {
    margin-left: 12px;
  }

  & .swiper {
    scroll-margin-right: 12px;
    margin-right: 12px;
  }

  @media screen and (max-width: 1024px) {
    & .card {
      width: 90%;
      border: solid 3px #ccc;
    }
  }
`

export const PostFooter = StyledComponent
