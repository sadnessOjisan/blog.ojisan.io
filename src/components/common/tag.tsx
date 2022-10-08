import { ComponentType } from "react";

interface Props {
  name: string;
}

export const Tag: ComponentType<Props> = ({ name }) => {
  return <span>#{name}</span>;
};
