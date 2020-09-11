module.exports = {
  siteMetadata: {
    title: `blog.ojisan.io`,
    description: `sadnessOjisanファン必携！sadnessOjisanの日常を垣間見れるアプリケーション！`,
    author: `@sadnessOjisan`,
    siteUrl: `https://blog.ojisan.io`,
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-styled-components`,
    {
      resolve: `gatsby-plugin-feed`,
      options: {
        query: `
          {
            site {
              siteMetadata {
                title
                description
                siteUrl
                site_url: siteUrl
              }
            }
          }
        `,
        feeds: [
          {
            serialize: ({ query: { site, allMarkdownRemark } }) => {
              return allMarkdownRemark.nodes.map(node => {
                return Object.assign({}, node.frontmatter, {
                  description: node.excerpt,
                  date: node.frontmatter.created,
                  url: site.siteMetadata.siteUrl + node.frontmatter.path,
                  guid: site.siteMetadata.siteUrl + node.frontmatter.path,
                  custom_elements: [{ "content:encoded": node.html }],
                })
              })
            },
            query: `
              {
                allMarkdownRemark(filter: {fileAbsolutePath: {glob: "**/src/contents/**/*.md"}}, sort: {order: DESC, fields: frontmatter___created}) {
                  nodes {
                    excerpt
                    html
                    frontmatter {
                      title
                      created
                      path
                    }
                  }
                }
              }
            `,
            output: "/rss.xml",
            title: "blog.ojisan.io feed",
          },
        ],
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/src/contents`,
        name: `contents`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `blog.ojisan.io`,
        short_name: `blog`,
        start_url: `/`,
        background_color: `#663399`,
        theme_color: `#663399`,
        display: `standalone`,
        icon: `src/images/icon.png`, // This path is relative to the root of the site.
      },
    },
    `gatsby-plugin-offline`,
    {
      resolve: "gatsby-plugin-graphql-codegen",
      options: {
        fileName: `types/graphql-types.d.ts`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: "gatsby-remark-code-titles",
            options: {},
          },
          {
            resolve: `gatsby-remark-shiki`,
            options: {
              theme: "nord", // Default: 'nord'
            },
          },
          {
            resolve: `gatsby-remark-autolink-headers`,
            options: {
              // そこにジャンプした時の上からの余白
              offsetY: `80`,
              className: `anchor-link`,
            },
          },
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 590,
            },
          },
        ],
      },
    },
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: "UA-119542494-2",
        head: true,
      },
    },
    "gatsby-plugin-sitemap",
    {
      resolve: "gatsby-plugin-robots-txt",
      options: {
        host: "https://blog.ojisan.io",
        sitemap: "https://blog.ojisan.io/sitemap.xml",
        env: {
          development: {
            policy: [{ userAgent: "*", disallow: ["/"] }],
          },
          production: {
            policy: [{ userAgent: "*", allow: "/" }],
          },
        },
      },
    },
    {
      resolve: `gatsby-plugin-netlify`,
      options: {
        headers: {
          "/*.html": ["Cache-Control: public, max-age=0, must-revalidate"],
          "/page-data/*": ["Cache-Control: public, max-age=0, must-revalidate"],
          "/page-data/app-data.json": [
            "Cache-Control: public, max-age=0, must-revalidate",
          ],
          "/static/*": ["Cache-Control: public, max-age=31536000, immutable"],
          "/sw.js": ["Cache-Control: no-cache"],
          "/**/*.js": ["Cache-Control: public, max-age=31536000, immutable"],
          "/**/*.css": ["Cache-Control: public, max-age=31536000, immutable"],
        },
      },
    },
  ],
}
