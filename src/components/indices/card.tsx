import * as React from "react"
import styled from 'styled-components'
import { Link } from "gatsby"
import Image from "gatsby-image"
import { AllBlogsQuery } from "../../../types/graphql-types"
import { Tags } from "./tags"

interface IPassedProps {
  /** ブログコンテンツのfrontmatter */
  data: AllBlogsQuery["blogs"]["nodes"][number]["frontmatter"]
  /** 呼び出し元から書き換えるためのclassName */
  className?: string
  /** カードに表示するブログの出だし */
  excerpt?: AllBlogsQuery["blogs"]["nodes"][number]["excerpt"]
}

interface IContainerProps {
  setHover: (state: boolean) => void;
  isHover: boolean
}

interface IProps extends IPassedProps, IContainerProps { }

const Component: React.FC<IProps> = ({ className, data, excerpt, setHover, isHover }) => (
  <div
    className={className}
    onMouseEnter={() => setHover(true)}
    onMouseLeave={() => setHover(false)}
  >
    <Link to={data?.path || "/"}>
      <div className={'imageWrapper'}>
        <Image
          className={'image'}
          // @ts-ignore FIXME: 型エラー
          fluid={data.visual.childImageSharp.fluid}
        />
      </div>
      <div className={'body'}>
        <p className={'date'}>{data?.created}</p>
        <h3 className={'articleTitle'}>
          {data?.title}
        </h3>
        {excerpt && <p className={'excerpt'}>{excerpt}</p>}
      </div>
      <div className={'footer'}>
        <Tags tags={data?.tags || []} className={'tags'}></Tags>
      </div>
    </Link>
  </div>
)

const StyledComponent = styled(Component) <{ isHover: boolean }>`
background: white;
  border-radius: 8px;
  border: solid 1px transparent;


${props => props.isHover && `& .wrapper {
  border-color: #2196f3;
}`}

& .body {
  padding: 24px;
}

& .date {
  text-align: left;
}

& .articleTitle {
  font-size: 24px;
  font-weight: 600;
  margin-top: 12px;
}

& .excerpt {
  margin-top: 20px;
  color: gray;
}

& .imageWrapper {
  border-radius: 8px 8px 0px 0px;
  overflow: hidden;
}

& .image {
  width: 100%;
  margin: auto;
  transition: 0.5s all;
}


${props => props.isHover && `& .image {
  transform: scale(1.2, 1.2);
  transition: 0.5s all;
}`}

& .tags {
  margin-left: 12px;
}
`

const CardContainer: React.FC<IPassedProps> = props => {
  const [isHover, setHover] = React.useState(false)
  return <StyledComponent {...{ ...props, isHover, setHover }} />
}

export const Card = CardContainer 