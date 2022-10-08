import { ComponentType } from "react";
import * as styles from "./tag.module.css";

interface Props {
  name: string;
}

export const Tag: ComponentType<Props> = ({ name }) => {
  return <span className={styles.wrapper}>#{name}</span>;
};
