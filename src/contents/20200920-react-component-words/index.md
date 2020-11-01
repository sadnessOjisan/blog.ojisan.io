---
path: /react-component-words
created: "2020-09-20"
title: Reactのコンポーネント周りの用語を整理する
visual: "./visual.png"
tags: [React]
userId: sadnessOjisan
isFavorite: true
isProtect: false
---

React のコンポーネント周りの用語ってごっちゃごちゃになった経験はありませんか?
友人と話すときなどはなんとなくのニュアンスで伝わるので気にしていなかったのですが、型注釈つけるときやコードリーディングするときに言葉の定義がわからなくなって何回も調べるといったことをよくやるのでこれを機に整理しようと思います。
本記事では JSX 以外にも createElement 記法の知識も要するので、自信がない方は[公式](https://ja.reactjs.org/docs/react-without-jsx.html)や[どうして JSX を使ってもエラーにならないのか？](/jsx-to-js)をご覧ください。

ここでは

- React のドキュメント
  - JSX
  - Elements
  - Components
- TypeScript の型定義
  - JSX.Element
  - ReactElement
    - DetailedReactHTMLElement
    - DOMElement
  - FunctionComponent
  - Component
  - ReactNode
  - ReactChild
  - ReactText

について扱います。
本当はもっとたくさんありますが、自分が混同したり関係ありそうなものだけを恣意的にピックアップしました。
他にも考慮した方が良いものがありましたら PR などいただけると幸いです。

## コンポーネントにまつわる用語

React 内部の話に入る前に[Glossary of React Terms](https://reactjs.org/docs/glossary.html)にで紹介されている概念を復習しましょう。
なぜならその概念と型定義を対比すると理解が捗るからです。

### JSX

いきなり説明が難しいのがきました。
一見簡単な用語ですが「どれが JSX か」ではなく、「JSX とは何か」という質問に答えられますか？

例えば、

```jsx
const A = () => {
  return <div>hello</div>
}
```

や

```jsx
<div>hello</div>
```

は JSX で書かれているということが分かりますが、内部ではそれぞれ JSX.Element や ReactElement とも呼ばれたりしています。
それらは JSX と何が違うのでしょうか。
僕はこの答えに自信を持てないので、公式や具体例を通じて JSX が何かを調べていきましょう。

JSX が何かということ自体は React の公式ページに書かれています。

> JSX is a syntax extension to JavaScript.

「JSX は JS の構文拡張である」と明記されています。
ただし このドキュメントは JSX の公式ではなくいささか定義に不安が残りました。
なぜなら例えば JSX がただの syntax extension であるならば React とは独立したものであるはずであり、だとすれば JSX 自体の公式と定義がどこかにあるだろうと考えたからです。
勉強していた当時は React の公式からはそういった JSX の原点的なものを見つけられず分かりませんでした。（もしいまくまなく探せば見つかるのかも？）
ただ一応 Facebook 配下の GitHub を漁ってみると、Draft 扱いですが、Spec が見つかるのでそれを見てみましょう。

JSX の Spec: https://github.com/facebook/jsx

Spec には、

> JSX is an XML-like syntax extension to ECMAScript without any defined semantics.

とあり、ECMAScript に XML のような構文拡張を施した syntax を JSX と読んでいます。

JSX という言葉自体はあくまで syntax であり、Component や ReactElement と同じくくりで比較するものではないことが分かります。
この感覚は Elements と JSX の混同を避けるのに役立つので意識するようにしましょう。

### Elements

そして JSX と全く異なるものであるものの外観が似てるものとして Elements があります。

Elements は、

> React elements are the building blocks of React applications. One might confuse elements with a more widely known concept of “components”.

とあり、components の一部であることがわかります。

たとえば、

```jsx
const el = <div>hello world!</div>
```

は Elements ですが、

```jsx
const El = () => <div>hello world!</div>
```

は Elements ではありません。

この Components と Elements の違いも個人的には混乱ポイントだと思っており、

```tsx
<div>
  <El></El>
</div>
```

のような JSX で書かれたコードを HTML のように解釈すると 「El 要素が〜」って言ってしまい、「あれ El は Element だっけ？」ってなりそうだなと思いました。
`El`ではなく`<El></El>`であれば、createElement に変換された後に ReactElement 型(厳密にはそれを継承した別のものが帰ってくるがそれは後述)が戻ってくるので Element と言えなくも無いのですが、React の公式の Elements の定義としては El 自体は当てはまらないので注意しましょう。
(これに関しては無邪気に Element を 要素と訳すのが悪手な気がする)

### Components

上で触れた El 関数は Components の説明で明らかになります。

そこには、

> React components are small, reusable pieces of code that return a React element to be rendered to the page.

とあり、**Components は React element を返す**ものを指すことが分かります。
それは関数だったり、 `render(){}` を実装した クラスとして実装されます。
いわゆる関数コンポーネントとクラスコンポーネントと呼ばれるものです。

## これらの区別が役立つ場面

例えば、

```tsx
import React from "react"
import ReactDOM from "react-dom"

const App = () => <div>hello</div>

ReactDOM.render(App, document.getElementById("root"))
```

のようなコードが

```sh
No overload matches this call.
  The last overload gave the following error.
    Argument of type '() => JSX.Element' is not assignable
    to parameter of type
    'ReactElement<any, string | ((props: any) =>
    ReactElement<any, string | ... | (new (props: any) =>
    Component<any, any, any>)> | null) | (new (props: any) =>
    Component<any, any, any>)>[]'.
```

とミスを報告したときにエラー文を読んで気づけるかもしれません。

ここで render に必要なのは Components ではなく Elements なので、

```tsx
ReactDOM.render(App, document.getElementById("root"))
```

ではなく

```tsx
ReactDOM.render(<App />, document.getElementById("root"))
```

が正解です。

createElement に変換される必要があるからです。

## TypeScript における型定義

実際にコードを書いたりコードジャンプを繰り返すと上の分類以外にもっと細かく分類されていることに気づくと思います。
それらについてみていきましょう。

### JSX.Element

先ほど示した

```tsx
import React from "react"
import ReactDOM from "react-dom"

const App = () => <div>hello</div>
```

の App の戻り値型は JSX.Element です。
これは React のドキュメントに書かれていた Elements に相当します。

TypeScript の中でこの JSX という namespace は

```tsx
declare global {
  namespace JSX {
    // tslint:disable-next-line:no-empty-interface
    interface Element extends React.ReactElement<any, any> {}
    ...
  }
}
```

であることが分かります。

そしてその ReactElement は

```jsx
interface ReactElement<P = any, T extends string
| JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
        type: T;
        props: P;
        key: Key | null;
    }
```

という定義です。
この定義については次の節でじっくりみていきます。

ここで注意したいのは

```jsx
const App = () => <div>hello</div>
```

の App の型は () => JSX.Element と関数であることです。
これ自体は JSX.Element ではありません。

そしてこの App を `<App></App>` として記述することで Babel によって

```js
React.createElement("div", null, "")
```

といった風に`React.createElement()`へと変換されます。
`<App></App>`として初めて JSX.Element として使えるということを覚えておきましょう。

### ReactElement

この ReactElement は下の定義の通りです。

```tsx
interface ReactElement<
  P = any,
  T extends string | JSXElementConstructor<any> =
    | string
    | JSXElementConstructor<any>
> {
  type: T
  props: P
  key: Key | null
}
```

そして JSXElementConstructor が何を指しているのかをみていくと、

```tsx
type JSXElementConstructor<P> =
  | ((props: P) => ReactElement | null)
  | (new (props: P) => Component<P, any>)
```

であることが分かります。

### JSXElementConstructor

`((props: P) => ReactElement | null)` は関数コンポーネントの型定義、`(new (props: P) => Component<P, any>)` はクラスコンポーネントの型定義です。
TypeScript では new の型を書くことでそのクラスのコンストラクタの型定義を書いたこととなります。

また ReactElement の定義に JSXElementConstructor が含まれ、JSXElementConstructor の定義に ReactElement が含まれることから、要素は入れ子にできることがわかるはずです。
つまり

```tsx
<Items>
  <List></List>
  <List></List>
  <List></List>
</Items>
```

といったコードが可能になるわけです。

### DetailedReactHTMLElement

ところで Element(UI ブロックでいう意味でのコンポーネント) は createElement() からも作れます。
これの戻り値の型は `DetailedReactHTMLElement` というものです。

```tsx
interface DetailedReactHTMLElement<
  P extends HTMLAttributes<T>,
  T extends HTMLElement
> extends DOMElement<P, T> {
  type: keyof ReactHTML
}
```

これは HTML のキーワードを引数にもらって Element を作る関数なのでそれっぽい型がたくさん含まれています。

#### DOMElement

その定義の中の DOMElement は根幹的な役割を担います。

```tsx
// string fallback for custom web-components
interface DOMElement<
  P extends HTMLAttributes<T> | SVGAttributes<T>,
  T extends Element
> extends ReactElement<P, string> {
  ref: LegacyRef<T>
}
```

というもので、ReactElement を継承しています。
そのため `createElement()` から作ったオブジェクトは JSX から作ったものと互換な機能を持つことが分かります。

#### コードジャンプや型検査における利点

先ほどは互換性がどうのこうのと言いましたが、**そもそもランタイムにおいては JSX は全て createElement になるので互換性がある**のは当然かなとも思います。
ただこのように定義されることで createElement から作った Element オブジェクトと JSX から作った Element オブジェクトは TypeScript 上で同じように評価されコードジャンプなどの恩恵が得られます。

例えば、

```tsx
const jsxel = <div></div>
jsxel.key

const crel = React.createElement("div")
crel.key
```

という二つの関数を定義して、key からコードジャンプすると、双方とも ReactElement の key にジャンプするはずです。

JSX の出力結果に型が付くのは開発支援という点では強力だったり、createElement と JSX を混ぜて型検査ができたりするのでそう言った面で役に立つ機能だと思います。

### FunctionComponent

React の型定義で

```tsx
const Hoge:React.FC<IProps> (props) => {
  return ...
}
```

とする例を見たことがあることがあるかと思います。

`React.FC` はこうなっています。

```tsx
type FC<P = {}> = FunctionComponent<P>

interface FunctionComponent<P = {}> {
  (props: PropsWithChildren<P>, context?: any): ReactElement<any, any> | null
  propTypes?: WeakValidationMap<P>
  contextTypes?: ValidationMap<any>
  defaultProps?: Partial<P>
  displayName?: string
}

type PropsWithChildren<P> = P & { children?: ReactNode }
```

このコンポーネントを使う 1 つのメリットとしては children を型推論から得られることが挙げられます。
それが実現されていることは `PropsWithChildren` の定義からわかると思います。
その結果**FunctionComponent は children を props に必ず持ち ReactElement を返すコンポーネント**と言えます。
普段僕は関数コンポーネントと口で話すときは props に children を含む前提では話していないような気もするのですが、`FunctionComponent` といえば props に children を含むものなので言葉の使い分けを意識して話していきたいです。

### Component

さて、`ReactElement` の`JSXElementConstructor` に含まれていた `Component` を見てみましょう。(可読性のためにコメントを全部消しています)

```tsx
interface Component<P = {}, S = {}, SS = any>
  extends ComponentLifecycle<P, S, SS> {}
class Component<P, S> {
  static contextType?: Context<any>
  context: any

  constructor(props: Readonly<P>)
  constructor(props: P, context?: any)
  setState<K extends keyof S>(
    state:
      | ((prevState: Readonly<S>, props: Readonly<P>) => Pick<S, K> | S | null)
      | (Pick<S, K> | S | null),
    callback?: () => void
  ): void
  forceUpdate(callback?: () => void): void
  render(): ReactNode
  readonly props: Readonly<P> & Readonly<{ children?: ReactNode }>
  state: Readonly<S>
  refs: {
    [key: string]: ReactInstance
  }
}
```

いわゆるクラスコンポーネントですね。
よく使う `render`, `state`, `setState` があることが確認できます。
ライフサイクル系は別途 `ComponentLifecycle` に含まれています。

### ReactNode

`Component`(今の文脈ではクラスコンポーネントを指す) や `FunctionComponent` で登場した `ReactNode` とはなんでしょうか。

これは

```tsx
type ReactNode =
  | ReactChild
  | ReactFragment
  | ReactPortal
  | boolean
  | null
  | undefined
```

という定義です。
だんだんと primitive になってきましたね。
さて、この ReactNode がどこで使われるかというと、`createElement` の引数です。

```tsx
function createElement<P extends HTMLAttributes<T>, T extends HTMLElement>(
  type: keyof ReactHTML,
  props?: (ClassAttributes<T> & P) | null,
  ...children: ReactNode[]
): DetailedReactHTMLElement<P, T>
```

JSX は babel や tsc によって createElement という関数に変換されますが、ここにある children は JSX が入れ子として持つ要素のことです。

たとえば

```tsx
class Hello extends React.Component {
  render() {
    return (
      <div>
        hello<span>world!</span>
      </div>
    )
  }
}

const Component: React.FC = () => {
  return (
    <div>
      hello world
      <Hello></Hello>
    </div>
  )
}
```

のようなコードはトランスパイルすると

```js
const React = __importStar(require("react"))
class Hello extends React.Component {
  render() {
    return React.createElement(
      "div",
      null,
      "hello",
      React.createElement("span", null, "world!")
    )
  }
}
const Component = () => {
  return React.createElement(
    "div",
    null,
    "hello world",
    React.createElement(Hello, null)
  )
}
```

となり、たとえば Hello コンポーネントの例で言えば ...children: ReactNode[] は `"hello"`といった文字列 や `React.createElement("span", null, "world!")` といった DetailedReactHTMLElement(ReactElement を継承している)を指します。

そのため React を書くときに意識する型になると思うので、何から構成されているかは把握しておくと良いでしょう。

### ReactChild

`ReactNode` に含まれる `ReactChild` を見てみましょう。

```tsx
type ReactChild = ReactElement | ReactText
```

Child という名前から`props.children`に関係がある何かかもしれないと思うかもしれませんが、直接は関係ないので注意しましょう。
props.children の型は ReactNode です。
ファイル内検索をしてみると、`ReactChild` は `ReactNode` の型定義で使われているだけであることが分かります。

とはいえ ReactNode の型定義の上で、ReactNode 以外の`ReactFragment| ReactPortal | boolean | null | undefined` が children として展開されることはそうそう無いと思うので、実質的には ReactNode 型である props.children に入るものは `ReactChild` と言えるかもしれません。

### ReactText

```tsx
type ReactText = string | number
```

primitive なものを 2 つ組み合わせただけのものです。
この定義があるからこそ return の中で

```jsx
class Hoge extends React.Component {
  render() {
    return "1"
  }
}

const Hoge2 = () => {
  return 1
}

const Hoge3 = () => {
  return <div>1</div>
}
```

といったことができるようになります。

つまりコンポーネントそれ自体の返り値や、コンポーネント(Class Component と区別するためにわざとカタカナで表記)の children としてコンポーネント 以外にも primitive なものを含められるようになります。
ただし関数コンポーネントの場合、戻り値に `:React.FC` をつけていると primitive な値を関数から返すと型検査に失敗するので注意しましょう。

## まとめ

依存関係と入出力を整理するとこういう形になると思います。

![依存図](./visual.png)

## これを知って何がうれしいか？

知らなくても「要素」という言葉で一括りにしてしまえばなんだかんだでコミュニケーションには困らないかなとも思ったりはしているのですが、個人的にはライブラリを読むときとかに結構役に立っています。
戻り値の型と引数を見比べるときなどに見通しが少し良くなります。
あと型注釈をつけて想像と違った時に自分が悪いか元あるコードのどっちが悪いかと一歩立ち止まる機会も得られます。
