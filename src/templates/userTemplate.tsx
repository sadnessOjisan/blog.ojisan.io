import React from "react"
import Layout from "../components/common/layout"
import Image from "../components/common/image"

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
      <Image filename="sadnessOjisan" alt="sadnessOjisan" />
      <p>{pageContext.name}</p>
      <p>{pageContext.description}</p>
    </Layout>
  )
}
export default userTemplate
