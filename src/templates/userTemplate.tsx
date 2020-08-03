import React from "react"
import Layout from "../components/common/layout"
import Image from "../components/common/image"
import styles from "./userTemplate.module.css"

interface IProps {
  // user.yamlの構造が入る
  pageContext: {
    id: string
    name: string
    image: string
    description: string
  }
}

const userTemplate: React.FC<IProps> = props => {
  const { pageContext } = props

  return (
    <Layout>
      <div className={styles.row}>
        <div>
          <p className={styles.name}>{pageContext.name}</p>
          <p className={styles.description}>{pageContext.description}</p>
        </div>
        <Image
          filename={styles.image}
          alt={`${styles.image}のプロフィール写真`}
          className={styles.userIcon}
        />
      </div>
    </Layout>
  )
}
export default userTemplate
