import { graphql, Link, PageProps } from "gatsby";
import * as React from "react";

import { Card } from "../../components/card";
import Layout from "../../components/layout";
import Seo from "../../components/seo";
import { cards } from "./{MarkdownRemark.frontmatter__tags}.module.scss";

const Template: React.VFC<PageProps<GatsbyTypes.BlogPostByTagQuery>> = (
  props
) => {
  const { allMarkdownRemark } = props.data;
  const { nodes } = allMarkdownRemark;
  const frontmatters = nodes.map((node) => node.frontmatter);
  console.log("frontmatters", frontmatters);
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
      <Link to="/">Go back to the homepage</Link>
    </Layout>
  );
};

export default Template;

export const query = graphql`
  query BlogPostByTag($frontmatter__tags: [String]) {
    allMarkdownRemark(
      filter: { frontmatter: { tags: { in: $frontmatter__tags } } }
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
