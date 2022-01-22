import { GatsbyNode } from "gatsby";
import path from "path";
import { toLower } from "../util/kebab";

export const createPages: GatsbyNode["createPages"] = async ({
  actions,
  graphql,
}) => {
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
  if (tagsResult.data === undefined) throw new Error("invalid query");
  // @ts-ignore
  tagsResult.data.tags.group.forEach((data) => {
    createPage({
      path: `/tags/${toLower(data.tag)}`,
      component: tagTemplate,
      context: {
        tag: data.tag,
      },
    });
  });
};
