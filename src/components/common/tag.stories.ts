import type { StoryObj } from "@storybook/react";

import { Tag } from "./tag";

// More on how to set up stories at: https://storybook.js.org/docs/7.0/react/writing-stories/introduction
const meta = {
  title: "Component/Tag",
  component: Tag,
  tags: ["autodocs"],
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/7.0/react/writing-stories/args
export const Normal: Story = {
  args: {
    name: "react",
  },
};
