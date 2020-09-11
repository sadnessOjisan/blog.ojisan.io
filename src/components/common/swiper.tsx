import * as React from "react"
import styled from "styled-components"

interface IProps {
  className: string
}

const Component: React.FC<IProps> = props => (
  <div className={props.className}>{props.children}</div>
)

const StyledComponent = styled(Component)` overflow: auto;
scroll-snap-type: x mandatory;
display: flex;
// あまり良くないかもだけど、swiperとして必要なスタイルなので親側で子供のスタイルを書き換える
> * {
  scroll-snap-align: start;
}
}`

export default StyledComponent
