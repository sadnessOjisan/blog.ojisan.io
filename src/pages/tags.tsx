import { graphql, Link, PageProps } from "gatsby";
import { HeadFactory } from "../components/common/head";
import { Layout } from "../components/common/layout";

const RootBlogList = ({ data }: PageProps<Queries.AllTagsQuery>) => {
  return (
    <Layout>
      <h1>タグ一覧</h1>
      {data.tags.group.map((t) => (
        <div key={t.tag}>
          <Link to={`/tags/${t.tag}`}>
            {t.tag}({t.totalCount})
          </Link>
        </div>
      ))}
    </Layout>
  );
};

export default RootBlogList;

export const postsPaginationQuery = graphql`
  query AllTags {
    tags: allMarkdownRemark {
      group(field: frontmatter___tags) {
        tag: fieldValue
        totalCount
      }
    }
  }
`;

export const Head = () => <HeadFactory type="blog" />;
