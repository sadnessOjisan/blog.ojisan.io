/** FIXME: useStaticQuery で toc を実現したいわね */

import * as React from "react"
import styled from "styled-components"

interface IProps {
  tableOfContents?: string | null
  className?: string
}

const Component: React.FC<IProps> = props => {
  return props.tableOfContents ? (
    <nav
      className={props.className}
      dangerouslySetInnerHTML={{ __html: props.tableOfContents }}
    />
  ) : (
    <div></div>
  )
}

const StyledComponent = styled(Component)`
  > ul {
    position: sticky;
    /* 9vh は headerの高さ分 */
    top: calc(9vh + 32px);
    color: rgba(0, 0, 0, 0.84);
    font-size: 16px;
    margin-bottom: 24px;
    overflow-y: auto;
    max-height: 75vh;
    background-color: white;
    border-radius: 8px;
    padding: 12px;
    margin-top: 30vh;
  }

  & ul {
    margin-left: 16px;
  }

  a:hover {
    background-color: aliceblue;
  }

  & a {
    display: block;
    padding: 6px;
    padding-left: 12px;
  }

  @media screen and (max-width: 1024px) {
    display: none;
  }
`

export default StyledComponent
