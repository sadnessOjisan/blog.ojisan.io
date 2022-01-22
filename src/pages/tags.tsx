// If you don't want to use TypeScript you can delete this file!
import { graphql, Link, PageProps } from "gatsby";
import * as React from "react";

import Layout from "../components/layout";
import Seo from "../components/seo";
import { toLower } from "../util/kebab";
import { cards } from "./index.module.scss";

const TagsPage: React.FC<PageProps<GatsbyTypes.TagsQuery>> = (props) => {
  const tags = props.data.allMarkdownRemark.group;
  if (tags.some((tag) => tag === undefined)) throw new Error("invalid tag");
  const kebabTags = tags.map((tag) => ({
    ...tag,
    fieldValue: toLower(tag.fieldValue || ""),
  }));
  return (
    <Layout>
      <Seo title="blog.ojisan.io" />
      <div className={cards}>
        {kebabTags.map((node) => (
          <Link key={node.fieldValue} to={`/tags/${node.fieldValue}`}>
            <a>
              {node.fieldValue}({node.totalCount})
            </a>
          </Link>
        ))}
      </div>
    </Layout>
  );
};

export default TagsPage;

export const query = graphql`
  query Tags {
    allMarkdownRemark {
      group(field: frontmatter___tags) {
        fieldValue
        totalCount
      }
    }
  }
`;
