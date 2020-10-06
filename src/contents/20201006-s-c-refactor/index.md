---
path: /s-c-refactor
created: "2020-10-06"
title: ブログに CSS in JS 環境下での スタイル分離リファクタリングを施してみた
visual: "./visual.png"
tags: [React, "styled-components"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

そろそろブログを大幅に改修しようと思っており、その前準備をしてリファクタリングをしていました。
具体的には css modules からの脱却と、スタイル周りのリファクタリングをしていました。

そのとき、[経年劣化に耐える ReactComponent の書き方](https://qiita.com/Takepepe/items/41e3e7a2f612d7eb094a) と [styled-components の採用と既存資産を捨てた理由](https://blog.cybozu.io/entry/2020/06/25/105457) という記事を参考にしました。

これらは styled を一つのコンポーネントに当ててその中で SASS 記法で中にスタイルを当てていくというもので、CSS in JS 環境下において、styled と DOM を分離するテクニックとして学びがあるものでした。

僕は styled-compoennts ユーザーですが、[styled-components の採用と既存資産を捨てた理由](https://blog.cybozu.io/entry/2020/06/25/105457)でも触れられているように、

- styled なラッパーコンポーネントとかがいっぱい作られていろいろつらそう
- JSX に styled なコンポーネントと React コンポーネントが混ざって視認性が悪くなりそう

という懸念は持っていました。(そのため一時期僕は styled-jsx を好んで使っていました。)

ただ、

> styled はコンポーネントを引数に取ってスタイルをあてる以外の使い方をしない

といった使い方をすることで、この手の問題は回避できそうだったので実際に試しました。
このやり方を実際に手を動かすことで見えたことや感じたことを共有がてら書き留めます。

## やったこと

よくあるお作法で作られた Component に対して次の切り出し処理をしました。

- DOM だけを返す関数を切り出す
- DOM にスタイリングを施す処理を切り出す
- スタイリングされた DOM に振る舞いを付け加える関数を切り出す

具体的な説明は上で紹介した [経年劣化に耐える ReactComponent の書き方](https://qiita.com/Takepepe/items/41e3e7a2f612d7eb094a)を読んでください。

早い話が、こういうコンポーネントを作りました。

```tsx
interface IContainerProps {
  data: AllBlogsQuery
}

interface IProps extends IContainerProps {
  className?: string
}

// DOM だけを返すコンポーネント
const Component: React.FC<IProps> = ({ data, className }) => {
  return (
    <div className={className}>
      <Layout>
        <SEO title={data.site?.siteMetadata?.title || "HOME"} />
        <div className="cards">
          {data.blogs.nodes.map(node =>
            node.frontmatter?.path ? (
              <Card
                className="card"
                key={node.frontmatter.path}
                excerpt={node.excerpt}
                data={node.frontmatter}
              ></Card>
            ) : (
              <div>invalid data</div>
            )
          )}
        </div>
      </Layout>
    </div>
  )
}

// コンポーネントにスタイルを埋め込むラッパーコンポーネント
const StyledComponent = styled(Component)`
  & .cards {
    margin: 24px auto;
    padding: 5px;
    width: 90%;
    column-count: 3;
    column-gap: 0;
    max-width: 1024px;

    & .card {
      margin: 16px;
      margin-top: 0;
      -webkit-column-break-inside: avoid;
      page-break-inside: avoid;
      break-inside: avoid;
      box-shadow: 8px 12px 10px -6px rgba(0, 0, 0, 0.3);
      display: inline-block;
    }
  }
`

// スタイリングされたコンポーネントにデータや振る舞いを埋め込むコンポーネント
// Gatsby環境下では graphql から得たdataをpropsから取得できるのでそれを
// 下位のコンポーネントに伝える役割を担う
const ContainerComponent: React.FC<IProps> = ({ children, data }) => {
  return <StyledComponent data={data}>{children}</StyledComponent>
}

export const pageQuery = graphql`
  query AllBlogs {
    blogs: allMarkdownRemark {
      ...
    }

    site {
      ...
    }
  }
`

export default ContainerComponent
```

## 気付いたこと

で、実際に書いてみた感想や感じたメリット・デメリットが次の通りです。

### 行数が減ってみやすい

hooks を使うようになってから 関数の中にイベントハンドラ関数をたくさん定義するといったことをして長くなったりなどしていましたが、それらを全部 ConatinerComponent に押し込めることができ、DOM と振る舞いを分離することができて読みやすくなったと思います。

```jsx
const ContainerComponent: React.FC<PassedProps> = props => {
  const [isOpen, setOpen] = React.useState(false)
  const containerProps = { isOpen, setOpen }
  return <StyledComponent {...props} {...containerProps}></StyledComponent>
}
```

### HTML から CSS に埋め込むためだけの props が消える

これまでは `<Wrapper isOpen={isOpen} />` のようなことをしていたわけですが、HTML だけに分離すると `<div isOpen={isOpen} />` と書くことになります。しかし div に isOpen はないのでこのコードは動きません。

そのため container 側でフラグを全部作って埋め込むという実装になります。

```jsx
const Component: React.FC<Props> = (props) => {
  const { setShowState, showState, message } = props;
  return (
    <div className={props.className}>
      {showState ? message : ""}
      <button
        onClick={() => {
          setShowState(!showState);
        }}
        className="button"
      >
        toggle state
      </button>
      <ButtonA></ButtonA>
      <ButtonB className={"passedClass"}></ButtonB>
    </div>
  );
};

...

const ContainerComponent: React.FC<PassedProps> = (props) => {
  const [isOpen, setOpen] = React.useState(false);
  const containerProps = { isOpen, setOpen };
  return <StyledComponent {...props} {...containerProps}></StyledComponent>;
};
```

その結果、StyledComponents 内で動的計算するときに渡していた props は DOM 側からではなく Container 側に移ります。これは DOM に登場する変数が減って DOM の見通しが良くなります。

### 謎命名から解放される

これまでの経験上、

```tsx
const Container = styled.div``
const ContentWrapper = styled.div``
const StyledText = styled.p``
```

といった命名をする人は僕以外にもそれなりにいることを知っているのですが、今の運用では

```tsx
const StyledComponent = styled(Component)``
```

しか登場しないので命名で悩んだり、「これ絶対意味ない名前だろ」みたいな心配から解放されます。

### 同じクラス名だと衝突するので注意

```tsx
const Component = props => {
  return (
    <div className={props.className}>
      <p className="hoge"></p>
    </div>
  )
}

export const Hoge = styled(Component)`
  & .hoge {
    color: red;
  }
`
```

をビルドすると、div タグには hash が入りますが、p タグは hoge のままです。
そのため 外部に .hoge に対するスタイルシートがあれば衝突します。

また、同一コンポーネント内で同じ className のコンポーネントがある場合も衝突します。
「なにを当たり前のことを」と思うかもしれませんが、コンポーネントを入れ子にしていると気づけないはずです。

```tsx
const Hoge = () => {
  return <div className="piyo"></div>
}

const Piyo = () => {
  return <div className="piyo"></div>
}

const Component = props => {
  return (
    <div className={props.className}>
      <p className="piyo"></p>
      <Hoge />
      <Piyo />
    </div>
  )
}

export const Fuga = styled(Component)`
  & .piyo {
    color: red;
  }
`
```

このとき `& > .piyo` とすれば解決できますが、クラスの衝突が起きるという問題の本質的な解決方法ではないので、どう扱うかは考えものです。
きっとこのルールでスタイルを書くときは「あとから触る人がこの配下にコンポーネントを作ってそれと衝突しないか？」を意識して書く必要があると思います。

**パーツごとにスタイルを作る運用であれば全部のクラスネームが異なるため、あるスタイルの変更がその子コンポーネントに影響を及ぼすことは考えなくてよかった**のですが、この運用だと衝突問題があるので対応は少し悩んでます。
解決策は色々思いつきますが、デファクトはコレみたいな話にはなってないので、ゆっくり考えておきたいです。
ひとまずは 直下セレクタを使ってスタイルが外に漏れないように気をつけて書いていきます。

### props が自然と分離できる

外から渡される props, 自パーツが作る props と自然に分けられます。
そしてそれらに対して型をつけると、型の表現範囲(この言い方伝われ！)が増します。
(昔 FlowType で Redux に型を付け回っていた人だったら懐かしい気持ちになるのではないでしょうか？)

```tsx
interface IPassedProps {
  message: string
}

interface IContainerProps {
  state: boolean
  setState: (state: boolean) => void
}

interface IProps extends IPassedProps, IContainerProps {
  className?: string
}

const Component = props => {
  return (
    <div className={props.className}>
      {props.state && props.message}
      <button
        onClick={() => {
          setState(!state)
        }}
      >
        toggle
      </button>
    </div>
  )
}

const StyledComponent = styled(Component)``

const ContainerComponent: React.FC<IPassedProps> = props => {
  const [state, setState] = useState(null)
  return (
    <StyledComponent
      state={state}
      setState={setState}
      {...props}
    ></StyledComponent>
  )
}
```

ここでミソなのは

```tsx
interface IProps extends IPassedProps, IContainerProps {
  className?: string
}
```

です。

この className は styled-components が作る className なのでユーザーが渡す訳でも container コンポーネントが作るものでもありません。
ユーザーが自分で埋められるものではないので ? を付けています。

反対にこのコンポーネントを呼び出し側から上書きさせるなら、

```tsx
interface IPassedProps {
  message: string
  className?: string
}

interface IContainerProps {
  state: boolean
  setState: (state: boolean) => void
}

interface IProps extends IPassedProps, IContainerProps {}
```

と、IPassedProps に移動します。
こうすることで上書き可能であることがコンポーネント呼び出し側から分かります。

ちなみに上書くときは ContainerComponent で親から className を受け取って 伝搬させる必要があるので、ContainerComponent で className をバケツリレーするのを忘れないようにしましょう。

それに関してはこのように spread 演算子で props を全部渡すようにすると良いです。

```tsx
const ContainerComponent: React.FC<PassedProps> = props => {
  return <StyledComponent {...props}></StyledComponent>
}
```

### 拡張しようとすると mui の API ぽくなる

これはただの感想なのですが、なんか material-ui でみた API を作っている感じがしました。
[component api](https://material-ui.com/api/alert/#css) を withStyles などで渡すやり方とほとんど同じでした。

```jsx
const StyledButton = withStyles({
  root: {
    background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
    borderRadius: 3,
    border: 0,
    color: "white",
    height: 48,
    padding: "0 30px",
    boxShadow: "0 3px 5px 2px rgba(255, 105, 135, .3)",
  },
  label: {
    textTransform: "capitalize",
  },
})(Button)
```

特に何か嬉しくなる情報ではないのですが、別のレイヤーからスタイルを渡すテクニックとしてここにつながって自分の中では「うおー」ってなりました。

## おわりに

最初このやり方を見たとき、なにか大袈裟な感じがしたし、公式の例として紹介されているものでもなかったので心配だったのですが、いざやってみると行数が減るわ、見通しが良くなるわでいいことづくしだったので、このやり方いいなって思いました。

## サンプルコード

https://github.com/ojisan-toybox/separable-s-c
