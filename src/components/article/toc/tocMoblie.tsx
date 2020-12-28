/** FIXME: useStaticQuery で toc を実現したいわね */

import * as React from "react"
import SocialMobile from "../social/socialsMobile"
import Close from "../../../images/close.svg"
import Open from "../../../images/open.svg"
import styled from "styled-components"

interface IPassedProps {
  path: string
  title: string
  dateYYYYMMDD: string
  tableOfContents?: string | null
  className?: string
  isOpen: boolean
  setTocOpenerState: (isOpen: boolean) => void
}

interface IProps extends IPassedProps {
  className?: string
}

const Component: React.FC<IProps> = ({
  tableOfContents,
  isOpen,
  path,
  title,
  dateYYYYMMDD,
  setTocOpenerState,
  className,
}) =>
  tableOfContents ? (
    <div className={className}>
      {isOpen ? (
        <div className="wrapper">
          <SocialMobile
            path={path}
            title={title}
            dateYYYYMMDD={dateYYYYMMDD}
            className="socialIcons"
          ></SocialMobile>
          <nav
            className={"toc"}
            dangerouslySetInnerHTML={{ __html: tableOfContents }}
          />
          <button
            onClick={() => setTocOpenerState(false)}
            className="opener"
            aria-label="目次を閉じる"
          >
            <img src={Close} className="icon" alt="toc-closer"></img>
          </button>{" "}
        </div>
      ) : (
        <button
          onClick={() => setTocOpenerState(true)}
          className="opener"
          aria-label="目次を開く"
        >
          <img src={Open} className="icon" alt="toc-opener"></img>
        </button>
      )}
    </div>
  ) : (
    <div></div>
  )

const StyledComponent = styled(Component)`
  & .wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: whitesmoke;
    z-index: 2;
    overflow: scroll;
  }

  & .opener {
    position: fixed;
    z-index: 1;
    right: 16px;
    bottom: 16px;
    width: 60px;
    height: 60px;
    background: linear-gradient(45deg, #2196f3 30%, #21cbf3 90%);
    border-radius: 30px;
    text-align: center;
    box-shadow: 2px 2px 5px 0px #0000006b;
    border: solid 2px white;
  }

  & .socialIcons {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
  }

  & .toc > ul {
    position: sticky;
    top: 32px;
    color: rgba(0, 0, 0, 0.84);
    font-size: 16px;
    margin-bottom: 24px;
  }

  & .toc ul {
    margin-left: 16px;
  }

  & .toc a:hover {
    background-color: aliceblue;
  }

  & .toc a {
    display: block;
    padding: 6px;
    padding-left: 12px;
  }

  & .icon {
    width: 32px;
    color: white;
    fill: white;
  }

  @media screen and (min-width: 1024px) {
    display: none;
    .opener {
      display: none;
    }
  }
`

const ContainerComponent: React.FC<IPassedProps> = props => {
  const { setTocOpenerState } = props
  /** URLを監視し、URLが変わったらtocを閉じる */
  React.useEffect(() => {
    window.addEventListener(
      "hashchange",
      () => {
        setTocOpenerState(false)
      },
      false
    )
  }, [])
  return <StyledComponent {...props}></StyledComponent>
}

export default ContainerComponent
