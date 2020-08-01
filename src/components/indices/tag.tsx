import * as React from "react"
import cn from "classnames"
import styles from "./tag.module.css"

interface IProps {
  name: string
  className: string
}

export const Tag: React.FC<IProps> = ({ name, className }) => {
  return <div className={cn(className, styles.tag)}>{name}</div>
}
