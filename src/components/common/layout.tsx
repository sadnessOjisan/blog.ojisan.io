/**
 * @file Layout component. 共通レイアウトを持つと同時に、ドロワーの開閉状態とそのハンドラも持つ
 *
 */

import * as React from "react"
import { useStaticQuery, graphql } from "gatsby"
import Header from "./header"
import Footer from "./footer"
import DrawerContents from "./drawer-contents"
import styled from "styled-components"
import { SiteTitleQuery } from "../../../types/graphql-types"
import { MyDrawer } from "./drawer"

interface IPassedProps {
  className?: string
}

interface IContainerProps {
  isOpenDrawer: boolean
  setDrawerState: React.Dispatch<React.SetStateAction<boolean>>
  siteTitle: string
}

interface IProps extends IPassedProps, IContainerProps {}

export const DrawerContext = React.createContext<{
  setDrawerState: React.Dispatch<React.SetStateAction<boolean>>
}>({
  setDrawerState: () => {
    // no op
  },
})

const Component: React.FC<IProps> = ({
  children,
  setDrawerState,
  isOpenDrawer,
  siteTitle,
  className,
}) => (
  <div className={className}>
    <MyDrawer
      open={isOpenDrawer}
      onClose={() => {
        setDrawerState(false)
      }}
    >
      <DrawerContents isOpenDrawer={isOpenDrawer}></DrawerContents>
    </MyDrawer>
    <DrawerContext.Provider value={{ setDrawerState }}>
      <Header siteTitle={siteTitle} />
      <div>
        <main className="body">{children}</main>
        <Footer></Footer>
      </div>
    </DrawerContext.Provider>
  </div>
)

const StyledComponent = styled(Component)`
  width: 100%;
  min-height: 85vh;
  /* 9vh は headerの高さ分 */
  padding-top: 70px;
  background-color: #eeeef1;
`

const ContainerComponent: React.FC = ({ children }) => {
  const [isOpenDrawer, setDrawerState] = React.useState(false)
  const data: SiteTitleQuery = useStaticQuery(graphql`
    query SiteTitle {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)
  const siteTitle = data.site?.siteMetadata?.title
  if (!siteTitle) {
    throw new Error("should set title as siteMetadata")
  }

  const containerProps = {
    isOpenDrawer,
    setDrawerState,
    siteTitle,
  }
  return <StyledComponent {...containerProps}>{children}</StyledComponent>
}

export default ContainerComponent
