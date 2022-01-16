import * as React from "react";
import { graphql, Link, PageProps } from "gatsby";
import Layout from "../../components/layout";

const IndexPage: React.VFC<PageProps<GatsbyTypes.TagsQuery>> = ({ data }) => {
  const allTags = data.allMarkdownRemark.group;

  let hashMap = {};
  allTags.forEach(({ fieldValue, totalCount }) => {
    if (hashMap[fieldValue.toLowerCase()]) {
      hashMap[fieldValue.toLowerCase()] += totalCount;
    } else {
      hashMap[fieldValue.toLowerCase()] = totalCount;
    }
  });
  let cleanTags = Object.entries(hashMap).map(([key, value]) => ({
    fieldValue: key,
    totalCount: value,
  }));
  return (
    <Layout>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h2
          style={{ fontSize: "32px", marginTop: "32px", marginBottom: "32px" }}
        >
          タグ一覧
        </h2>
        <div>
          {cleanTags.map((g) => (
            <div key={g.fieldValue}>
              <Link to={`/tags/${g.fieldValue}`}>
                <a>
                  {g.fieldValue}
                  {g.totalCount}
                </a>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export const pageQuery = graphql`
  query Tags {
    allMarkdownRemark {
      group(field: frontmatter___tags) {
        fieldValue
        totalCount
      }
    }
  }
`;

export default IndexPage;
