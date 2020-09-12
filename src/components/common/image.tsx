import React from "react"
import { graphql, useStaticQuery } from "gatsby"
import Img from "gatsby-image"
import { ImagesQuery } from "../../../types/graphql-types"
import { createFluidImageFromImageSharp } from "../../helper/createImageObject"

interface IProps {
  className?: string
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
    <Img
      fluid={createFluidImageFromImageSharp(image.node.childImageSharp.fluid)}
      alt={props.alt}
      className={props.className}
    />
  )
}

export default Image
