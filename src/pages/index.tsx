// If you don't want to use TypeScript you can delete this file!
import { graphql, Link, PageProps } from "gatsby";
import * as React from "react";

import { Card } from "../components/card";
import Layout from "../components/layout";
import Seo from "../components/seo";
import { cards } from "./index.module.scss";

const UsingTypescript: React.FC<PageProps<GatsbyTypes.BlogPostsQuery>> = (
  props
) => {
  const nodes = props.data.blogs.nodes;
  const frontmatters = nodes.map((node) => node.frontmatter);
  if (frontmatters.some((f) => f === undefined)) {
    throw new Error();
  }
  frontmatters;
  return (
    <Layout>
      <Seo title="blog.ojisan.io" />
      <div className={cards}>
        {frontmatters.map((f) => {
          return <Card data={f} key={f?.path} />;
        })}
      </div>
      <Link to="/">Go back to the homepage</Link>
    </Layout>
  );
};

export default UsingTypescript;

export const query = graphql`
  query BlogPosts {
    blogs: allMarkdownRemark(
      sort: { order: DESC, fields: frontmatter___created }
    ) {
      nodes {
        frontmatter {
          title
          path
          created
          tags
          visual {
            childImageSharp {
              gatsbyImageData(placeholder: BLURRED)
            }
          }
        }
      }
    }
  }
`;
