import { graphql, Link, PageProps } from "gatsby";

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
