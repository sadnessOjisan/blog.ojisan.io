require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
})

// fileAbsolutePath: {regex: "/(/src/contents)/.*\\.md$/"} のようなバックスラッシュはalogliaのpluginが対応していない。そのためglob記法を使う
const myQuery = `{
  blogs: allMarkdownRemark(filter: {fileAbsolutePath: {glob: "**/src/contents/**/*.md"}}, sort: {order: DESC, fields: frontmatter___created}) {
    nodes {
      id
      # HTML直接入れるとサイズオーバーになるので無理やり上限サイズ決めてそこまで読み取るようにしている
      excerpt(pruneLength: 10000)
      frontmatter {
        title
        path
      }
    }
  }
}`

const queries = [
  {
    query: myQuery,
    transformer: ({ data }) =>
      data.blogs.nodes.map(node => {
        return {
          id: node.id,
          excerpt: node.excerpt,
          title: node.frontmatter.title,
          path: node.frontmatter.path,
        }
      }), // idを持ったobjectの配列を返す必要ある
  },
]

module.exports = {
  siteMetadata: {
    title: `blog.ojisan.io`,
    description: `sadnessOjisanファン必携！sadnessOjisanの日常を垣間見れるアプリケーション！`,
    author: `@sadnessOjisan`,
    siteUrl: `https://blog.ojisan.io`,
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
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
              return allMarkdownRemark.edges.map(edge => {
                return Object.assign({}, edge.node.frontmatter, {
                  description: edge.node.excerpt,
                  date: edge.node.frontmatter.date,
                  url: site.siteMetadata.siteUrl + edge.node.frontmatter.path,
                  guid: site.siteMetadata.siteUrl + edge.node.frontmatter.path,
                  custom_elements: [{ "content:encoded": edge.node.html }],
                })
              })
            },
            query: `
              {
                allMarkdownRemark(
                  sort: { order: DESC, fields: [frontmatter___created] },
                ) {
                  edges {
                    node {
                      excerpt
                      html
                      frontmatter {
                        title
                        created
                      }
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
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/src/news`,
        name: `news`,
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
            resolve: `gatsby-remark-prismjs`,
            options: {
              classPrefix: "language-",
              inlineCodeMarker: null,
              aliases: {},
              showLineNumbers: false,
              noInlineHighlight: false,
              prompt: {
                user: "root",
                host: "localhost",
                global: false,
              },
            },
          },
          {
            resolve: `gatsby-remark-autolink-headers`,
            options: {
              // そこにジャンプした時の上からの余白
              offsetY: `100`,
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
      // IMPORTANT: This plugin must be placed last in your list of plugins to ensure that it can query all the GraphQL data
      resolve: `gatsby-plugin-algolia`,
      options: {
        appId: process.env.ALGOLIA_APP_ID,
        // Use Admin API key without GATSBY_ prefix, so that the key isn't exposed in the application
        // Tip: use Search API key with GATSBY_ prefix to access the service from within components
        apiKey: process.env.ALGOLIA_API_KEY,
        indexName: process.env.ALGOLIA_INDEX_NAME, // for all queries
        queries,
        chunkSize: 1000, // default: 1000
        settings: {
          // optional, any index settings
        },
        enablePartialUpdates: true, // default: false
        matchFields: ["title", "excerpt", "modified", "title", "path"], // Array<String> default: ['modified']
      },
    },
  ],
}
