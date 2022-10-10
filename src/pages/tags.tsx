import { graphql, Link, PageProps } from "gatsby";
import { HeadFactory } from "../components/common/head";
import { Layout } from "../components/common/layout";
import * as styles from "./tags.module.css";

const RootBlogList = ({ data }: PageProps<Queries.AllTagsQuery>) => {
  return (
    <Layout>
      <h1>タグ一覧</h1>
      <ul className={styles.list}>
        {data.tags.group.map((t) => (
          <li key={t.tag} className={styles.listItem}>
            <Link to={`/tags/${t.tag}`}>
              {t.tag}({t.totalCount})
            </Link>
          </li>
        ))}
      </ul>
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
