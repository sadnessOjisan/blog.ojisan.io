import * as React from "react"
import styled from "styled-components"

interface IPassedProps {
  name: string
  className: string
}

const Component: React.FC<IPassedProps> = ({ name, className }) => (
  <div className={className}>{name}</div>
)

const StyledComponent = styled(Component)`
  border: solid 1px #cccccc;
  padding: 4px 8px;
  border-radius: 8px;
  background-color: white;
  color: #2c2e31;
  font-size: 14px;

  :hover {
    background-color: #f5f5f5;
  }
`

export const Tag = StyledComponent
