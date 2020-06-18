import * as React from "react"
import posed, { PoseGroup } from "react-pose"

const timeout = 0

interface IProps {
  location: Location
}

const Transition: React.FC<IProps> = props => {
  const { children, location } = props

  const RoutesContainer = posed.div({
    enter: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      delay: timeout,
      delayChildren: timeout,
    },
    exit: {
      opacity: 0,
      filter: "blur(30px)",
      y: 10,
    },
  })

  return (
    <PoseGroup>
      <RoutesContainer key={location.pathname}>{children}</RoutesContainer>
    </PoseGroup>
  )
}

export default Transition
