import path from "path";
import { GatsbyNode } from "gatsby";

export const createPages: GatsbyNode["createPages"] = async ({
  actions,
  graphql,
}) => {
  const { createPage } = actions;

  const result = await graphql<Queries.PaginationQueryQuery>(`
    query PaginationQuery {
      allMarkdownRemark(
        sort: { fields: [frontmatter___created], order: DESC }
        limit: 1000
      ) {
        nodes {
          frontmatter {
            path
          }
        }
      }
    }
  `);

  const posts = result.data?.allMarkdownRemark.nodes;

  if (posts === undefined) {
    throw new Error("posts should be");
  }

  const postsPerPage = 6;
  console.log(posts);
  const numPages = Math.ceil(posts.length / postsPerPage);
  Array.from({ length: numPages }).forEach((_, i) => {
    createPage({
      path: i === 0 ? `/` : `/posts/${i + 1}`,
      component: path.resolve("./src/templates/root-page.tsx"),
      context: {
        limit: postsPerPage,
        skip: i * postsPerPage,
        numPages,
        currentPage: i + 1,
      },
    });
  });

  console.log(result);
};
