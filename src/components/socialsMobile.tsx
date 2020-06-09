import * as React from "react"
import cn from "classnames"
import styles from "./socialMobile.module.css"
import clap from "../images/clap.svg"
import facebook from "../images/facebook.svg"
import twitter from "../images/twitter.svg"
import github from "../images/github.svg"

interface IProps {
  path: string
  title: string
  dateYYYYMMDD: string
  className?: string
}

const SocialMobile: React.FC<IProps> = ({
  className,
  path,
  title,
  dateYYYYMMDD,
}) => (
  <div className={cn(className, styles.wrapper)}>
    <div className={styles.col}>
      {/* sticky container としてこのdivが必要 */}
      <a
        href={`https://twitter.com/intent/tweet?text=${title}%0ahttps://blog.ojisan.io${path}`}
        target="_blank"
        rel="noopener"
      >
        <img src={twitter} className={styles.icon}></img>
      </a>
      <a
        href="http://www.facebook.com/share.php?u=https://blog.ojisan.io"
        target="_blank"
        rel="noopener"
      >
        <img src={facebook} className={styles.icon}></img>
      </a>
      {/* このaタグがないとsafariでのデザインが崩れる */}
      <a>
        <img
          src={clap}
          className={styles.icon}
          onClick={() => {
            alert("Thank you!")
          }}
        ></img>
      </a>
      <a
        href={`https://github.com/sadnessOjisan/blog.ojisan.io/blob/master/src/contents/${dateYYYYMMDD}-${path.replace(
          "/",
          ""
        )}`}
        target="_blank"
        rel="noopener"
      >
        <img src={github} className={styles.icon}></img>
      </a>
    </div>
  </div>
)

export default SocialMobile
