/** FIXME: useStaticQuery で toc を実現したいわね */

import * as React from "react"
import cn from "classnames"
import styles from "./tocMobile.module.css"
import SocialMobile from "./socialsMobile"
import Close from "../images/close.svg"
import Open from "../images/open.svg"

interface IProps {
  path: string
  title: string
  dateYYYYMMDD: string
  tableOfContents?: string | null
  className?: string
}

const TocMobile: React.FC<IProps> = props => {
  const { path, title, dateYYYYMMDD } = props
  const [isOpen, setOpen] = React.useState(false)
  React.useEffect(() => {
    window.addEventListener(
      "hashchange",
      () => {
        setOpen(false)
      },
      false
    )
  }, [])
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
          <img src={Close} className={styles.icon}></img>
        </button>
      </div>
    ) : (
      <button onClick={() => setOpen(true)} className={styles.opener}>
        <img src={Open} className={styles.icon}></img>
      </button>
    )
  ) : (
    <div></div>
  )
}

export default TocMobile
