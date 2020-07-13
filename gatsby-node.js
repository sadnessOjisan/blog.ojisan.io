const path = require(`path`)
const _ = require("lodash")

exports.createPages = async ({ actions, graphql, reporter }) => {
  const { createPage } = actions
  const blogPostTemplate = path.resolve(`src/templates/blogTemplate.tsx`)
  const tagTemplate = path.resolve(`./src/templates/tagTemplate.tsx`)
  // もっと正確にfilter書いた方が良い

  const contentsResult = await graphql(`
    {
      posts: allMarkdownRemark(
        sort: { order: DESC, fields: [frontmatter___created] }
        filter: { fileAbsolutePath: { regex: "/src/contents/" } }
        limit: 1000
      ) {
        edges {
          node {
            frontmatter {
              path
            }
          }
        }
      }
      tags: allMarkdownRemark(limit: 1000) {
        group(field: frontmatter___tags) {
          tag: fieldValue
          totalCount
        }
      }
    }
  `)
  const tags = contentsResult.data.tags.group

  tags.forEach(data => {
    console.log("data", data)
    createPage({
      path: `/tags/${data.tag}`,
      component: tagTemplate,
      context: {
        // FIXME: ここの型はどうやって取ればいい？
        tag: data.tag,
      },
    })
  })
  // Handle errors
  if (contentsResult.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`)
    return
  }
  contentsResult.data.posts.edges.forEach(({ node }) => {
    createPage({
      path: node.frontmatter.path,
      component: blogPostTemplate,
      context: {},
    })
  })
}
