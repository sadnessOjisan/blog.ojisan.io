/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import * as React from "react"
import { useStaticQuery, graphql } from "gatsby"
import Drawer from "@material-ui/core/Drawer"
import Header from "./header"
import Footer from "./footer"
import styles from "./layout.module.css"
import DrawerContents from "./drawer-contents"

export const DrawerContext = React.createContext<{
  setDrawerState: React.Dispatch<React.SetStateAction<boolean>>
}>({
  setDrawerState: () => {},
})

const Layout: React.FC = ({ children }) => {
  const [isOpenDrawer, setDrawerState] = React.useState(false)
  const data = useStaticQuery(graphql`
    query SiteTitle {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  return (
    <DrawerContext.Provider value={{ setDrawerState }}>
      <Header siteTitle={data.site.siteMetadata.title} />
      <div>
        <main className={styles.body}>{children}</main>
        <Footer></Footer>
        <Drawer
          anchor="right"
          open={isOpenDrawer}
          onClose={() => {
            setDrawerState(false)
          }}
        >
          <DrawerContents></DrawerContents>
        </Drawer>
      </div>
    </DrawerContext.Provider>
  )
}

export default Layout
