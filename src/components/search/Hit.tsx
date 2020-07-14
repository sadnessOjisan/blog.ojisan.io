import * as React from "react"
import { Link } from "gatsby"
import { Hit as HitType } from "react-instantsearch-core"

interface IProps {
  hit: HitType
}

export const Hit: React.FC<IProps> = props => {
  const { hit } = props
  return (
    <div>
      {/* FIXME: hitの中身はgqlから生成したわけではないので型安全ではない */}
      <Link to={`${hit.path}`}>
        <div>{hit.title}</div>
      </Link>
    </div>
  )
}
