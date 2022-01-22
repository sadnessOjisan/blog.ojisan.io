const path = require(`path`);

exports.createPages = async ({ actions, graphql }) => {
  const { createPage } = actions;
  const tagTemplate = path.resolve(`./src/templates/tags-template.tsx`);

  const tagsResult = await graphql(`
    {
      tags: allMarkdownRemark {
        group(field: frontmatter___tags) {
          tag: fieldValue
          totalCount
        }
      }
    }
  `);

  tagsResult.data.tags.group.forEach((data) => {
    createPage({
      path: `/tags/${data.tag}`,
      component: tagTemplate,
      context: {
        tag: data.tag,
      },
    });
  });
};
