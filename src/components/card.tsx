import * as React from "react"
import cn from "classnames"
import { Link } from "gatsby"
import Image from "gatsby-image"
import { AllBlogsQuery } from "../../types/graphql-types"
import styles from "./card.module.css"

interface IProps {
  data: AllBlogsQuery["blogs"]["nodes"][0]["frontmatter"]
  className?: string
  excerpt: AllBlogsQuery["blogs"]["nodes"][0]["excerpt"]
}

export const Card: React.FC<IProps> = ({ data, className, excerpt }) => {
  const [isHover, setHover] = React.useState(false)
  return (
    <div
      className={cn(className, styles.wrapper)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link to={data?.path || "/"}>
        <div className={styles.imageWrapper}>
          <Image
            className={cn(styles.image, isHover && styles.hover)}
            style={{}}
            // @ts-ignore FIXME: 型エラー
            fluid={data.visual.childImageSharp.fluid}
          />
        </div>
        <div className={styles.body}>
          <p className={styles.date}>{data?.created}</p>
          <h3 className={cn(styles.articleTitle, isHover && styles.hover)}>
            {data?.title}
          </h3>
          <p className={styles.excerpt}>{excerpt}</p>
        </div>
      </Link>
    </div>
  )
}
