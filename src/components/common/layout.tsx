/**
 * @file Layout component. 共通レイアウトを持つと同時に、ドロワーの開閉状態とそのハンドラも持つ
 * 
 */

import * as React from "react"
import { useStaticQuery, graphql } from "gatsby"
import Drawer from "@material-ui/core/Drawer"
import Header from "./header"
import Footer from "./footer"
import DrawerContents from "./drawer-contents"
import styled from "styled-components"
import { SiteTitleQuery } from "../../../types/graphql-types"

interface IPassedProps {
  className?: string;
}

interface IContainerProps {
  isOpenDrawer: boolean;
  setDrawerState: React.Dispatch<React.SetStateAction<boolean>>
  siteTitle: string
}

interface IProps extends IPassedProps, IContainerProps { }

export const DrawerContext = React.createContext<{
  setDrawerState: React.Dispatch<React.SetStateAction<boolean>>
}>({
  setDrawerState: () => { },
})

const Component: React.FC<IProps> = ({ children, setDrawerState, isOpenDrawer, siteTitle, className }) => (
  <div className={className}>
    <DrawerContext.Provider value={{ setDrawerState }}>
      <Header siteTitle={siteTitle} />
      <div>
        <main className='body'>{children}</main>
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
    </DrawerContext.Provider></div>
)


const StyledComponent = styled(Component)`width: 100%;
min-height: 85vh;
/* 9vh は headerの高さ分 */
padding-top: 70px;
background-color: #eeeef1;`

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
    throw new Error('should set title as siteMetadata')
  }

  const containerProps = {
    isOpenDrawer, setDrawerState, siteTitle
  }
  return <StyledComponent {...containerProps}>{children}</StyledComponent>
}

export default ContainerComponent
