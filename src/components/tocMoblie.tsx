/** FIXME: useStaticQuery で toc を実現したいわね */

import * as React from "react"
import cn from "classnames"
import styles from "./tocMobile.module.css"
import SocialMobile from "./socialsMobile"

interface IProps {
  path: string
  title: string
  dateYYYYMMDD: string
  tableOfContents?: string | null
  className?: string
}

const TocMobile: React.FC<IProps> = props => {
  const { path, title, dateYYYYMMDD, tableOfContents } = props
  const [isOpen, setOpen] = React.useState(false)
  return props.tableOfContents ? (
    isOpen ? (
      <div className={styles.wrapper}>
        <SocialMobile
          path={path}
          title={title}
          dateYYYYMMDD={dateYYYYMMDD}
          className={styles.socialIcons}
        ></SocialMobile>
        <nav
          className={cn(props.className, styles.toc)}
          dangerouslySetInnerHTML={{ __html: props.tableOfContents }}
        />
        <button onClick={() => setOpen(false)} className={styles.opener}>
          close
        </button>
      </div>
    ) : (
      <button onClick={() => setOpen(true)} className={styles.opener}>
        open
      </button>
    )
  ) : (
    <div></div>
  )
}

export default TocMobile
