import React from "react"
import Layout from "../components/common/layout"
import Image from "../components/common/image"
import styles from "./userTemplate.module.css"
import GitHubIcon from "@material-ui/icons/GitHub"
import Twittercon from "@material-ui/icons/Twitter"
import { IconButton, makeStyles } from "@material-ui/core"
import { UserType } from "../type"

interface IProps {
  // user.yamlの構造が入る
  pageContext: UserType
}

const useStyles = makeStyles({
  root: { width: 20, height: 20, padding: 20 },
})

const userTemplate: React.FC<IProps> = props => {
  const classes = useStyles()
  const { pageContext } = props
  return (
    <Layout>
      <div className={styles.wrapper}>
        <div className={styles.row}>
          <Image
            filename={pageContext.image}
            alt={`${pageContext.image}のプロフィール写真`}
            className={styles.userIcon}
          />

          <div className={styles.info}>
            <div className={styles.snsRow}>
              <span className={styles.name}>{pageContext.name}</span>
              <div>
                <IconButton className={classes.root}>
                  <a
                    target="_blank"
                    rel="noopener"
                    href={`https://twitter.com/${pageContext.twitterId}`}
                  >
                    <Twittercon />
                  </a>
                </IconButton>
                <IconButton className={classes.root}>
                  <a
                    target="_blank"
                    rel="noopener"
                    href={`https://github.com/${pageContext.gitHubId}`}
                  >
                    <GitHubIcon />
                  </a>
                </IconButton>
              </div>
            </div>

            <p className={styles.description}>{pageContext.description}</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
export default userTemplate
