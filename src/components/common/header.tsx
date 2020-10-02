import * as React from "react"
import { Link } from "gatsby"
import styled from "styled-components"
import { DrawerContext } from "./layout"

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
            <svg viewBox="0 0 24 24" width={24} height={24} fill="white">
              <circle cx="6.18" cy="17.82" r="2.18" />
              <path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z" />
            </svg>
          </span>
        </button>
      </a>
      <a
        href="https://github.com/sadnessOjisan/blog.ojisan.io"
        aria-label="githubへのリンク"
      >
        <button aria-label="githubアイコン" className="button">
          <span>
            {/* GitHub */}
            <svg viewBox="0 0 24 24" width={24} height={24} fill="white">
              <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2 0 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8 0 3.2.9.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1 .9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3" />
            </svg>
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
          {/* menu */}
          <svg viewBox="0 0 24 24" width={24} height={24}>
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
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
