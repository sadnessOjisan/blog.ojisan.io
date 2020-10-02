import * as React from "react"
import { Link } from "gatsby"
import styled from "styled-components"
import { DrawerContext } from "./layout"
import MenuIcon from "@material-ui/icons/Menu"
import GitHubIcon from "@material-ui/icons/GitHub"
import RssFeedIcon from "@material-ui/icons/RssFeed"

interface IPassedProps {
  className?: string
  siteTitle: string
}

interface IContainerProps {
  setDrawerState: React.Dispatch<React.SetStateAction<boolean>>
}

interface IProps extends IPassedProps, IContainerProps {}

const Component: React.FC<IProps> = ({
  className,
  siteTitle,
  setDrawerState,
}) => (
  <header className={className}>
    <h1 className="title">
      <Link to="/">{siteTitle}</Link>
    </h1>
    <div>
      <a href="/rss.xml" aria-label="rssへのリンク">
        <button aria-label="rssアイコン" className="button">
          <span>
            <RssFeedIcon />
          </span>
        </button>
      </a>
      <a
        href="https://github.com/sadnessOjisan/blog.ojisan.io"
        aria-label="githubへのリンク"
      >
        <button aria-label="githubアイコン" className="button">
          <span>
            <GitHubIcon />
          </span>
        </button>
      </a>
      <button
        aria-label="menu"
        onClick={() => {
          setDrawerState(true)
        }}
        className="button"
      >
        <span>
          <MenuIcon />
        </span>
      </button>
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

  & .button {
    flex: 0 0 auto;
    overflow: visible;
    font-size: 1.5rem;
    text-align: center;
    transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    border-radius: 50%;
    color: white;
    padding: 8px;
    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    & > span {
      // TODO: これがないと高さが揃わないのを調べる
      display: flex;
    }
  }

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

const ContainerComponent: React.FC<IPassedProps> = props => {
  const drawerContext = React.useContext(DrawerContext)
  const containerProps = { setDrawerState: drawerContext.setDrawerState }
  return <StyledComponent {...props} {...containerProps}></StyledComponent>
}

export default ContainerComponent
