const path = require(`path`)
const _ = require("lodash")
const fs = require("fs")
const yaml = require("js-yaml")

exports.createPages = async ({ actions, graphql, reporter }) => {
  const { createPage } = actions
  const blogPostTemplate = path.resolve(`src/templates/blogTemplate.tsx`)
  const userTemplate = path.resolve(`src/templates/userTemplate.tsx`)
  const tagTemplate = path.resolve(`./src/templates/tagTemplate.tsx`)
  // FYI: https://www.gatsbyjs.org/docs/sourcing-content-from-json-or-yaml/
  const ymlDoc = yaml.safeLoad(
    fs.readFileSync("./src/contents/user.yaml", "utf-8")
  )

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
              userId
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

  // 記事ページ生成
  contentsResult.data.posts.edges.forEach(({ node }) => {
    // HINT: もしwriteUserが存在しなければ例外が発生してビルドが落ちるはず => 記事とユーザーが紐づいていない。
    const writeUser = ymlDoc.filter(
      item => item.id === node.frontmatter.userId
    )[0]
    createPage({
      path: node.frontmatter.path,
      component: blogPostTemplate,
      context: { userId: writeUser.id, ...writeUser },
    })
  })

  // userページ作成
  ymlDoc.forEach(element => {
    createPage({
      path: `/users/${element.id}`,
      component: userTemplate,
      context: { userId: element.id, ...element },
    })
  })
}
