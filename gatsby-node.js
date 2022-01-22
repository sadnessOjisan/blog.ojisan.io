const path = require(`path`);

exports.createPages = async ({ actions, graphql, reporter }) => {
  const { createPage } = actions;
  const tagTemplate = path.resolve(`./src/templates/tags-template.tsx`);

  const contentsResult = await graphql(`
    {
      tags: allMarkdownRemark {
        group(field: frontmatter___tags) {
          tag: fieldValue
          totalCount
        }
      }
    }
  `);

  contentsResult.data.tags.group.forEach((data) => {
    createPage({
      path: `/tags/${data.tag}`,
      component: tagTemplate,
      context: {
        tag: data.tag,
      },
    });
  });
};
