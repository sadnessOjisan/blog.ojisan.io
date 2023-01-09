import type { StoryObj } from "@storybook/react";

import { Card } from "./card";

// More on how to set up stories at: https://storybook.js.org/docs/7.0/react/writing-stories/introduction
const meta = {
  title: "Component/Card",
  component: Card,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/7.0/react/writing-stories/args
export const Normal: Story = {
  args: {
    node: {
      id: "a",
      frontmatter: {
        title: "hoge",
        created: "2022-01-12",
        path: "a",
        tags: [],
        visual: {
          childImageSharp: {
            gatsbyImageData: {
              width: 1,
              height: 3,
              layout: "constrained",
              images: {},
            },
          },
        },
      },
    },
  },
};
