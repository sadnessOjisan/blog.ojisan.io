import * as React from "react"
import cn from "classnames"
import { AllBlogsQuery } from "../../../types/graphql-types"
import styles from "./newses.module.css"

interface IProps {
  /** ニュース一覧 */
  data: AllBlogsQuery["newses"]
  /**  */
  className: string
}

export const Newses: React.FC<IProps> = ({ data, className }) => {
  return (
    <div className={cn(styles.wrapper, className)}>
      <h2 className={styles.title}>NEWS</h2>
      {data.nodes.map(news => {
        return (
          <div className={styles.list}>
            <div className={styles.date}>{news.frontmatter?.created}</div>
            <div>{news.frontmatter?.title}</div>
          </div>
        )
      })}
    </div>
  )
}
