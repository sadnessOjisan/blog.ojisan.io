import * as React from "react"
import styled from "styled-components"

interface IProps {
  className?: string
}

const Component: React.FC<IProps> = ({ className }) => (
  <footer className={className}>
    <p>
      © {new Date().getFullYear()}, Built with
      <a href="https://www.gatsbyjs.org" target="_blank" rel="noopener">
        {" "}
        Gatsby
      </a>
    </p>
    <p>
      createdBy
      <a
        href="https://twitter.com/sadnessOjisan"
        target="_blank"
        rel="noopener"
      >
        {" "}
        @sadnessOjisan
      </a>
    </p>
    <p>
      source code is{" "}
      <a
        href="https://github.com/sadnessOjisan/blog.ojisan.io"
        target="_blank"
        rel="noopener"
      >
        here
      </a>
    </p>
    <p>This site uses Google Analytics.</p>
  </footer>
)

const StyledComponent = styled(Component)`
  margin-bottom: 0;
  margin-top: auto;
  background: linear-gradient(45deg, #2196f3 30%, #21cbf3 90%);
  padding: 8px;
  text-align: center;
  color: white;
  min-height: 15vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  > p {
    margin-top: 12px;
  }

  > p > a {
    text-decoration: underline;
    font-weight: bold;
  }
`

export default StyledComponent
