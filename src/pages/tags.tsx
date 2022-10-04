import { graphql, Link, PageProps } from "gatsby";
import { HeadFactory } from "../components/common/head";

const RootBlogList = ({ data }: PageProps<Queries.AllTagsQuery>) => {
  return (
    <div>
      {data.tags.group.map((t) => (
        <div key={t.tag}>
          <Link to={`/tags/${t.tag}`}>
            {t.tag}({t.totalCount})
          </Link>
        </div>
      ))}
    </div>
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
