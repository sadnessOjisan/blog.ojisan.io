import * as React from "react"
import cn from "classnames"
import { Link } from "gatsby"
import styles from "./tags.module.css"
import { Tag } from "./tag"
import { Maybe } from "../../types/graphql-types"

interface IProps {
  tags: Maybe<string>[]
  className?: string
}

export const Tags: React.FC<IProps> = ({ tags, className }) => {
  return (
    <div className={cn(className, styles.tags)}>
      {tags.map(
        tag =>
          tag && (
            <Link to={`/tags/${tag}`}>
              <a>
                <Tag className={styles.tag} name={tag}></Tag>
              </a>
            </Link>
          )
      )}
    </div>
  )
}
