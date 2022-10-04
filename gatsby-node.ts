import path from "path";
import { GatsbyNode } from "gatsby";

export const createPages: GatsbyNode["createPages"] = async ({
  actions,
  graphql,
}) => {
  const { createPage } = actions;
  await pagination(createPage, graphql);
  await detailPage(createPage, graphql);
  await tagsPage(createPage, graphql);
};

type NextEdge =
  Queries.NextPrevQueryQuery["allMarkdownRemark"]["edges"][number]["next"];
type PrevEdge =
  Queries.NextPrevQueryQuery["allMarkdownRemark"]["edges"][number]["previous"];
export interface DetailPageContext {
  next: NextEdge;
  prev: PrevEdge;
  id: string;
}

const pagination = async (
  createPage: Parameters<
    NonNullable<GatsbyNode["createPages"]>
  >["0"]["actions"]["createPage"],
  graphql: Parameters<NonNullable<GatsbyNode["createPages"]>>["0"]["graphql"]
) => {
  const paginationIndexPageResult =
    await graphql<Queries.PaginationQueryQuery>(`
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

  if (!paginationIndexPageResult.data || paginationIndexPageResult.errors) {
    throw new Error("pagination 用のデータ取得に失敗しました。");
  }

  const posts = paginationIndexPageResult.data.allMarkdownRemark.nodes;

  if (posts === undefined) {
    throw new Error("pagination 用のデータが見つかりませんでした。");
  }

  const postsPerPage = 20;
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
};

const detailPage = async (
  createPage: Parameters<
    NonNullable<GatsbyNode["createPages"]>
  >["0"]["actions"]["createPage"],
  graphql: Parameters<NonNullable<GatsbyNode["createPages"]>>["0"]["graphql"]
) => {
  const getNextPrevsResult = await graphql<Queries.NextPrevQueryQuery>(`
    query NextPrevQuery {
      allMarkdownRemark {
        edges {
          next {
            frontmatter {
              title
              path
            }
          }
          previous {
            frontmatter {
              path
              title
            }
          }
          node {
            frontmatter {
              path
            }
            id
          }
        }
      }
    }
  `);

  if (!getNextPrevsResult.data || getNextPrevsResult.errors) {
    throw new Error("全ページURLのデータ取得に失敗しました。");
  }

  getNextPrevsResult.data.allMarkdownRemark.edges.forEach((edge) => {
    const context: DetailPageContext = {
      id: edge.node.id,
      next: edge.next,
      prev: edge.previous,
    };
    if (!edge.node.frontmatter?.path) {
      throw new Error("path 情報がありません");
    }
    createPage({
      path: `${edge.node.frontmatter.path}`,
      component: path.resolve("./src/templates/detail-page.tsx"),
      context,
    });
  });
};

export interface TagsPageContext {
  tagsInfo: ReadonlyArray<{
    tag: NonNullable<Queries.AllTagsQuery["tags"]["group"][number]["tag"]>;
    count: Queries.AllTagsQuery["tags"]["group"][number]["totalCount"];
  }>;
}
const tagsPage = async (
  createPage: Parameters<
    NonNullable<GatsbyNode["createPages"]>
  >["0"]["actions"]["createPage"],
  graphql: Parameters<NonNullable<GatsbyNode["createPages"]>>["0"]["graphql"]
) => {
  const getTagsResult = await graphql<Queries.AllTagsQuery>(`
    query AllTags {
      tags: allMarkdownRemark {
        group(field: frontmatter___tags) {
          tag: fieldValue
          totalCount
        }
      }
    }
  `);

  if (!getTagsResult.data || getTagsResult.errors) {
    throw new Error("全tagのデータ取得に失敗しました。");
  }

  // create each page
  getTagsResult.data.tags.group.forEach((tag) => {
    createPage({
      path: `/tags/${tag.tag}`,
      component: path.resolve("./src/templates/tag-page.tsx"),
      context: {
        // This is needed for query by tag in tag page.
        tag: tag.tag,
      },
    });
  });
};
