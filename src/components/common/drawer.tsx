import * as React from "react"
import styled from "styled-components"

interface IProps {
  className: string
}

const Component: React.FC<IProps> = props => (
  <div className={props.className}>{props.children}</div>
)

const StyledComponent = styled(Component)``

export const Swiper = StyledComponent
