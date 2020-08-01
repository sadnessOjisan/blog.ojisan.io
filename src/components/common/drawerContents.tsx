import * as React from "react"
import styles from "./footer.module.css"
import { Link } from "gatsby"

const DrawerContents: React.FC = () => (
  <div style={{ width: "200px" }}>
    <ul>
      <li>TOP</li>
      <li>
        <Link to="/tags">
          <a>Tags</a>
        </Link>
      </li>
    </ul>
  </div>
)

export default DrawerContents
