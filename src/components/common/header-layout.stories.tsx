import { ComponentStory, ComponentMeta } from "@storybook/react";

import { HeaderLayout } from "./header-layout";

export default {
  title: "Common/Header",
  component: HeaderLayout,
} as ComponentMeta<typeof HeaderLayout>;

const Template: ComponentStory<typeof HeaderLayout> = () => <HeaderLayout />;

export const Normal = Template.bind({});
Normal.args = {};
