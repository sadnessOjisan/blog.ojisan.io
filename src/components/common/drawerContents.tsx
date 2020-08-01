import * as React from "react"
import styles from "./footer.module.css"
import { Link } from "gatsby"

const DrawerContents: React.FC = () => (
  <>
    <ul>
      <li>TOP</li>
      <li>
        <Link to="/tags">
          <a>Tags</a>
        </Link>
      </li>
    </ul>
  </>
)

export default DrawerContents
