import * as React from "react"
import styles from "./swiper.module.css"

const Swiper: React.FC = props => (
  <div className={styles.wrapper}>{props.children}</div>
)

export default Swiper
