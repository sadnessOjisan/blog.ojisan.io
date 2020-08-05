import * as React from "react"
import cn from "classnames"
import styles from "./socialMobile.module.css"
import GitHubIcon from "@material-ui/icons/GitHub"
import FacebookIcon from "@material-ui/icons/Facebook"
import TwitterIcon from "@material-ui/icons/Twitter"
import { IconButton } from "@material-ui/core"

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
        aria-label="twitterへのリンク"
      >
        <IconButton aria-label="twitterアイコン">
          <TwitterIcon />
        </IconButton>
      </a>

      <a
        href="http://www.facebook.com/share.php?u=https://blog.ojisan.io"
        target="_blank"
        rel="noopener"
        aria-label="facebookへのリンク"
      >
        <IconButton aria-label="facebookアイコン">
          <FacebookIcon />
        </IconButton>
      </a>
      <a
        href={`https://github.com/sadnessOjisan/blog.ojisan.io/blob/master/src/contents/${dateYYYYMMDD}-${path.replace(
          "/",
          ""
        )}`}
        target="_blank"
        rel="noopener"
        aria-label="githubへのリンク"
      >
        <IconButton aria-label="githubアイコン">
          <GitHubIcon />
        </IconButton>
      </a>
    </div>
  </div>
)

export default SocialMobile
