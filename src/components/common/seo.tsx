import * as React from "react"
import { Helmet } from "react-helmet"
import { useStaticQuery, graphql } from "gatsby"
import { SeoQuery } from "../../types/graphql-types"
import OGP from "../images/keyvisual.png"

interface IProps {
  description?: string
  meta?: any[]
  title: string
  image?: string
}

function SEO({ description, meta, title, image }: IProps & SeoQuery) {
  const { site } = useStaticQuery(
    graphql`
      query Seo {
        site {
          siteMetadata {
            title
            description
            author
          }
        }
      }
    `
  )

  const metaDescription = description || site.siteMetadata.description
  const metaImage = image
    ? `https://blog.ojisan.io${image}`
    : `https://blog.ojisan.io${OGP}`

  return (
    <Helmet
      htmlAttributes={{
        lang: "ja",
      }}
      title={title}
      meta={[
        {
          name: `description`,
          content: metaDescription,
        },
        {
          property: `og:title`,
          content: title,
        },
        {
          property: `og:image`,
          content: metaImage,
        },
        {
          property: `og:description`,
          content: metaDescription,
        },
        {
          property: `og:type`,
          content: `website`,
        },
        {
          name: `twitter:card`,
          content: `summary_large_image`,
        },
        {
          name: `twitter:creator`,
          content: site.siteMetadata.author,
        },
        {
          name: `twitter:title`,
          content: title,
        },
        {
          name: `twitter:description`,
          content: metaDescription,
        },
        {
          property: `og:image`,
          content: metaImage,
        },
        {
          // FIXME: これなんで必要なんだっけ？GAのプラグインだけあればよかったかも
          name: "google-site-verification",
          content: "fkXw7Bl_HSSeB9JeI3GWJ9fnhax0X_MHngOd7ji7FmM",
        },
      ].concat(meta || [])}
    />
  )
}

export default SEO
