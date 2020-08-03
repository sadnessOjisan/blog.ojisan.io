import React from "react"
import { StaticQuery, graphql, useStaticQuery } from "gatsby"
import Img from "gatsby-image"
import { ImagesQuery } from "../../../types/graphql-types"

interface IProps {
  filename: string
  alt: string
}

const Image: React.FC<IProps> = props => {
  const data: ImagesQuery = useStaticQuery(
    graphql`
      query Images {
        allFile {
          edges {
            node {
              relativePath
              name
              childImageSharp {
                fluid(maxWidth: 300) {
                  ...GatsbyImageSharpFluid
                }
              }
            }
          }
        }
      }
    `
  )

  const image = data.allFile.edges.find(n => {
    return n.node.relativePath.includes(props.filename)
  })
  if (!image || !image.node.childImageSharp) {
    return null
  }

  return (
    /*<Img alt={props.alt} sizes={imageSizes} /> ←サイズFIXしたい時 */
    <Img fluid={image.node.childImageSharp.fluid} alt={props.alt} />
  )
}

export default Image
