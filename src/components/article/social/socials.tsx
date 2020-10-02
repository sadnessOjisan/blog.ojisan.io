import * as React from "react"
import styled from "styled-components"
import GitHubIcon from "@material-ui/icons/GitHub"
import FacebookIcon from "@material-ui/icons/Facebook"
import TwitterIcon from "@material-ui/icons/Twitter"

interface IProps {
  path: string
  title: string
  dateYYYYMMDD: string
  className?: string
}

const Component: React.FC<IProps> = ({
  className,
  path,
  title,
  dateYYYYMMDD,
}) => (
  <div className={className}>
    <div className="col">
      {/* sticky container としてこのdivが必要 */}
      <a
        href={`https://twitter.com/intent/tweet?text=${title}%0ahttps://blog.ojisan.io${path}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="twitterへのリンク"
      >
        <button aria-label="twitterアイコン" className="button">
          <span>
            <TwitterIcon />
          </span>
        </button>
      </a>

      <a
        href="http://www.facebook.com/share.php?u=https://blog.ojisan.io"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="facebookへのリンク"
      >
        <button aria-label="facebookアイコン" className="button">
          <span>
            <FacebookIcon />
          </span>
        </button>
      </a>
      <a
        href={`https://github.com/sadnessOjisan/blog.ojisan.io/blob/master/src/contents/${dateYYYYMMDD}-${path.replace(
          "/",
          ""
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="githubへのリンク"
      >
        <button aria-label="githubアイコン" className="button">
          <span>
            <GitHubIcon />
          </span>
        </button>
      </a>
    </div>
  </div>
)

const StyledComponent = styled(Component)`
  > div {
    /* 9vh は headerの高さ分 */
    top: calc(9vh + 32px);
    position: sticky;
    margin-top: 30vh;
  }
  > .col {
    display: flex;
    flex-direction: column;
  }
  > .col > * {
    margin-bottom: 0px;
  }
  & .button {
    flex: 0 0 auto;
    overflow: visible;
    font-size: 1.5rem;
    text-align: center;
    transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    border-radius: 50%;
    color: rgba(0, 0, 0, 0.54);
    padding: 8px;
    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    & > span {
      // TODO: これがないと高さが揃わないのを調べる
      display: flex;
    }
  }
  @media screen and (max-width: 1024px) {
    display: none;
  }
`

export default StyledComponent
