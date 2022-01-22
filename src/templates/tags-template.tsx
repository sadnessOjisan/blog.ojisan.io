// If you don't want to use TypeScript you can delete this file!
import { graphql, Link, PageProps } from "gatsby";
import * as React from "react";

import { Card } from "../components/card";
import Layout from "../components/layout";
import Seo from "../components/seo";
import { cards } from "./tags-template.module.scss";

const UsingTypescript: React.FC<PageProps<GatsbyTypes.TagTemplateQuery>> = (
  props
) => {
  const nodes = props.data.allMarkdownRemark.nodes;
  const frontmatters = nodes.map((node) => node.frontmatter);
  if (frontmatters.some((f) => f === undefined)) {
    throw new Error();
  }
  return (
    <Layout>
      <Seo title="blog.ojisan.io" />
      <div className={cards}>
        {frontmatters.map((f) => {
          return <Card data={f} key={f?.path} />;
        })}
      </div>
    </Layout>
  );
};

export default UsingTypescript;

export const query = graphql`
  query TagTemplate($tag: String!) {
    allMarkdownRemark(
      limit: 2000
      filter: { frontmatter: { tags: { in: [$tag] } } }
    ) {
      nodes {
        excerpt
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
