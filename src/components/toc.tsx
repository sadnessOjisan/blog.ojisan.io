/** FIXME: useStaticQuery で toc を実現したいわね */

import * as React from "react"
import cn from "classnames"
import styles from "./toc.module.css"

interface IProps {
  tableOfContents?: string | null
  className?: string
}

const Toc: React.FC<IProps> = props => {
  return props.tableOfContents ? (
    <nav
      className={cn(props.className, styles.toc)}
      dangerouslySetInnerHTML={{ __html: props.tableOfContents }}
    />
  ) : (
    <div></div>
  )
}

export default Toc
