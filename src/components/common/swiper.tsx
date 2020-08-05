import * as React from "react"
import cn from "classnames"
import styles from "./swiper.module.css"

interface IProps {
  className: string
}

const Swiper: React.FC<IProps> = props => (
  <div className={cn(props.className, styles.wrapper)}>{props.children}</div>
)

export default Swiper
