import * as React from "react"
import styled from "styled-components"

interface IProps {
  className?: string
  open: boolean
  onClose: () => void
}

const Component: React.FC<IProps> = props => (
  <div
    className={props.className}
    onClick={e => {
      e.stopPropagation()
      props.onClose()
    }}
  >
    <div className="contents">{props.children}</div>
  </div>
)

const StyledComponent = styled(Component)<IProps>`
  z-index: ${props => (props.open ? 1300 : 0)};
  position: fixed;
  opacity: ${props => (props.open ? 1 : 0)};
  transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  top: 0;
  left: 0;
  right: ${props => (props.open ? 0 : "100vw")};
  bottom: 0;
  position: fixed;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);

  & .contents {
    top: 0;
    flex: 1 0 auto;
    height: 100%;
    display: flex;
    outline: 0;
    z-index: ${props => (props.open ? 1200 : -1)};
    position: fixed;
    overflow-y: auto;
    flex-direction: column;
    transform: ${props => (props.open ? "none" : "translateX(30%)")};
    transition: transform 225ms cubic-bezier(0, 0, 0.2, 1) 0ms;
    left: auto;
    right: 0;
    background-color: #fff;
  }
`

const ContainerComponent: React.FC<IProps> = props => {
  return <StyledComponent {...props}></StyledComponent>
}

export const MyDrawer = ContainerComponent
