// If you don't want to use TypeScript you can delete this file!
import { graphql, Link, PageProps } from "gatsby";
import * as React from "react";

import Layout from "../components/layout";
import Seo from "../components/seo";
import { cards } from "./index.module.scss";

const TagsPage: React.FC<PageProps<GatsbyTypes.TagsQuery>> = (props) => {
  const nodes = props.data.allMarkdownRemark.group;
  return (
    <Layout>
      <Seo title="blog.ojisan.io" />
      <div className={cards}>
        {nodes.map((node) => (
          <Link key={node.fieldValue} to={`/tags/${node.fieldValue}`}>
            <a>
              {node.fieldValue}({node.totalCount})
            </a>
          </Link>
        ))}
      </div>
      <Link to="/">Go back to the homepage</Link>
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
