import type { Meta, StoryObj } from "@storybook/react";

import { Footer } from "./footer";

const meta = {
  title: "Component/Footer",
  component: Footer,
  tags: ["autodocs"],
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {},
};
