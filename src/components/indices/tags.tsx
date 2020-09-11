import * as React from "react"
import { Link } from "gatsby"
import styled from 'styled-components'
import { Tag } from "./tag"
import { Maybe } from "../../../types/graphql-types"

interface IPassedProps {
  tags: Maybe<string>[]
  className?: string
}

const Component: React.FC<IPassedProps> = ({ tags, className }) => (
  <div className={className}>
    {tags.map(
      tag =>
        tag && (
          <Link to={`/tags/${tag}`}>
            <a>
              <Tag className={'tag'} name={tag}></Tag>
            </a>
          </Link>
        )
    )}
  </div>
)


const StyledCompoenent = styled(Component)`
display: flex;
  flex-wrap: wrap;

  > * {
    margin: 0px 8px 12px 0px;
  }
`

export const Tags = StyledCompoenent