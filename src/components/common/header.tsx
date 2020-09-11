import * as React from "react"
import { Link } from "gatsby"
import styled from "styled-components"
import { DrawerContext } from "./layout"
import { IconButton } from "@material-ui/core"
import MenuIcon from "@material-ui/icons/Menu"
import GitHubIcon from "@material-ui/icons/GitHub"
import RssFeedIcon from "@material-ui/icons/RssFeed"

interface IPassedProps {
  className?: string;
  siteTitle: string;
}

interface IContainerProps { setDrawerState: React.Dispatch<React.SetStateAction<boolean>>; }

interface IProps extends IPassedProps, IContainerProps { }

const Component: React.FC<IProps> = ({ className, siteTitle, setDrawerState }) =>
  (
    <header className={className}>
      <h1 className='title'>
        <Link to="/">{siteTitle}</Link>
      </h1>
      <div>
        <a href="/rss.xml" aria-label="rssへのリンク">
          <IconButton
            aria-label="rssアイコン"
            style={{ color: "white", padding: 8 }}
          >
            <RssFeedIcon />
          </IconButton>
        </a>
        <a
          href="https://github.com/sadnessOjisan/blog.ojisan.io"
          aria-label="githubへのリンク"
        >
          <IconButton
            aria-label="githubアイコン"
            style={{ color: "white", padding: 8 }}
          >
            <GitHubIcon />
          </IconButton>
        </a>
        <IconButton
          aria-label="menu"
          color="default"
          onClick={() => {
            setDrawerState(true)
          }}
          style={{ color: "white", padding: 8 }}
        >
          <MenuIcon />
        </IconButton>
      </div>
    </header>
  )


const StyledComponent = styled(Component)`
background: linear-gradient(45deg, #2196f3 30%, #21cbf3 90%);
  color: white;
  height: 70px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  justify-content: space-between;
  position: fixed;
  transform: translate3d(0, 0, 0);
  top: 0;
  width: 100%;
  z-index: 1;

& .title {
  font-size: 20px;
  font-weight: 900;
}

@media screen and (max-width: 1024px) {
  & .pcOnly {
    display: none;
  }
}
`

const ContainerComponent: React.FC<IPassedProps> = (props) => {
  const drawerContext = React.useContext(DrawerContext)
  const containerProps = { setDrawerState: drawerContext.setDrawerState }
  return <StyledComponent {...props} {...containerProps}></StyledComponent >
}

export default ContainerComponent
