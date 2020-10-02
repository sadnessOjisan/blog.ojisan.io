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
    {/* TODO: ここをcolとして直指定するとこのスタイル名で外に漏れるから外部スタイルシート使うと衝突が怖かったりもする。 */}
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
            <svg viewBox="0 0 24 24">
              {/* Twitter */}
              <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
            </svg>
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
            {/* Facebook */}
            <svg viewBox="0 0 24 24">
              <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m13 2h-2.5A3.5 3.5 0 0 0 12 8.5V11h-2v3h2v7h3v-7h3v-3h-3V9a1 1 0 0 1 1-1h2V5z" />
            </svg>
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
            {/* GitHub */}
            <svg viewBox="0 0 24 24">
              <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2 0 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8 0 3.2.9.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1 .9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3" />
            </svg>
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
    flex-direction: row;
    padding-left: 12px;
    margin-top: 12px;
  }
  > .col > * {
    margin-right: 16px;
  }
  > .icon {
    width: 20px;
    cursor: pointer;
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
  @media screen and (min-width: 1024px) {
    display: none;
  }
`

export default StyledComponent
