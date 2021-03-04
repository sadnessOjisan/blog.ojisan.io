---
path: /storybook-first-develop
created: "2021-03-05"
title: Storybook First な開発のススメ
visual: "./visual.png"
tags: ["React", "storybook"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## Storybook first な開発とは

Storybook での呼び出され方を意識しながらアプリケーションコードを書くことをそのように呼んでいます。
道具に設計がひきづられるのはアンチパターンと言われそうな気もするのですが、コンポーネントのカタログを整備していくことは、コンポーネントが良い感じに再利用可能な形で分離できるということでもあり、やっていくとむしろ正道に近づいていくと思います。

Storybook First のコンポーネント設計や型定義をすると、パーツに限らず Storybook でカバーできる範囲が広がり、ページそのもののサンドボックスを作れます。
そして API がない状態でもデータを使って開発ができたり、特定のスナップショットの再現やタイムトラベルに近いことも可能になるというメリットがあります。

つまり、ただのコンポーネントカタログとしてではなく、開発のためのサンドボックスとしての使い方ができます。

## どのような設計をするか

### 同一 Component に階層を作る

Storybook で管理する都合、なるべく presentational な component を増やしたいです。
しかし、実際にはイベントハンドラの定義、hooks の呼び出し、なんらかの Provider へのアクセスなど、純粋な presentational なコンポーネントだけでは済みません。
そこで、そのようなコンポーネントも I/F 上では pure な presentational なコンポーネントに見せかけるために、同一 component 内で階層構造を作ります。

以前にブログでも紹介した [@takepepe](https://twitter.com/takepepe) さんの [経年劣化に耐える ReactComponent の書き方](https://qiita.com/Takepepe/items/41e3e7a2f612d7eb094a) の設計を取り入れます。

```ts
// (1) import層
import React from 'react'
import styled from 'styled-components'

// (2) Types層
type ContainerProps = {...}
type Props = {...} & ContainerProps

// (3) DOM層
const Component: React.FC<Props> = props => (...)

// (4) Style層
const StyledComponent = styled(Component)`...`

// (5) Container層
const Container: React.FC<ContainerProps> = props => {
  return <StyledComponent {...props} />
}
```

こうすることで hooks や イベントハンドラの定義は 5 の Container 層で行われるので、4 の Style 層を export すれば
Storybook 上は独立したコンポーネントとして扱えます。

```tsx
import styled from "styled-components"

type ContainerProps = { handleClickTitle: () => void }
type Props = { className?: string } & ContainerProps

const Component: React.FC<Props> = props => {
  return (
    <div className={props.className}>
      <h1 onClick={props.className}>hello</h1>
    </div>
  )
}

export const StyledComponent = styled(Component)`
  > h1 {
    font-size: 24px;
  }
`

const useClickTitle = () => {
  const handleClickTitle = () => {
    fetch("/check-posted").then(() => {
      alert("clicked title")
    })
  }
  return handleClickTitle
}

const Container: React.FC<ContainerProps> = props => {
  const handleClickTitle = useClickTitle()

  const containerProps = {
    handleClickTitle,
  }
  return <StyledComponent {...{ ...containerProps }} />
}
```

```tsx
import { StyledComponent as Component } from "./hello"
import { ComponentProps } from "react"

type Props = ComponentProps<typeof Component>

const meta = { title: "hello/hello", component: Component }

export default meta

const Template = (props: Props) => <Component {...props} />

export const Default = Template.bind({})
Default.args = {
  handleClickTitle: () => {
    alert("click from storybook")
  },
}
```

このようにすることで Container が呼び出していた custom hooks を使わなくても Storybook でイベントを呼び出すことができます。
今回は custom hooks の中に API 呼び出しが入っているので、Storybook で hooks を呼び出しませんでしたが、何も副作用がないのでしたら Storybook の管理対象に hooks 呼び出しを含めても良いです。
その場合は Container 分離は不要となります。

API 呼び出しが入っているものを Storybook で管理したくない理由としては、戻り値次第で結果が変わるので、コンポーネントカタログとして破損するかもしれないと思っているからです。
ちなみに middleware.js を拡張して Node.js のサーバーからモックを返すようにすれば Storybook 上からの API 呼び出しも可能になりますが、パターンの用意や設定がめんどくさいので個人的には好きではないです。

### バケツリレーは懸念点

ただ一方で Container から全ての値と配信するので props バケツリレーにはなります。
これは hooks 以前 / redux 以前の世界に逆行しているのであまり良くないなとは思います。

これを防ぐためには DOM 層 から Context.Provider でイベントハンドラや値を配信するのは手です。
受け取りコンポーネントが useContext で取るところもまた、階層化してしまえば hooks から独立して storybook で管理することが可能になります。

## ページが取りうる状態の型を列挙する

たとえば、API にアクセスしてその結果を表示するページがあるとしたら、

```tsx
type PageState = {
  isLoading: boolean
  data?: Posts[]
  error?: string
}p
```

ではなく、

```tsx
type PageState =
  | undefined // 初期化時
  | { isLoading: true; data: undefined; error: undefined } // ローディング中
  | { isLoading: false; data: Posts[]; error: undefined } // ロード成功
  | { isLoading: false; data: undefined; error: string } // ロード失敗
```

のように定義します。

この型定義の何が Storybook と相性が良いかというと、ページの取りうる状態が列挙されているので、この型のパターンを storybook 上に作れば、そのパーツが取りうる全ての状態を Storybook で再現できるという点です。

```tsx
type PageState =
  | undefined // 初期化時
  | { isLoading: true; data: undefined; error: undefined } // ローディング中
  | { isLoading: false; data: Posts[]; error: undefined } // ロード成功
  | { isLoading: false; data: undefined; error: string } // ロード失敗

export const Posts = (props: { pageState: PageState }) => {
  if (props.pageState === undefined || props.pageState.isLoading) {
    return <div>loading</div>
  }

  if (props.pageState.error !== undefined) {
    return <div>{error}</div>
  }

  return (
    <div>
      {props.pageState.data.map(post => (
        <Post key={post.id} data={post} />
      ))}
    </div>
  )
}
```

```tsx
import { StyledComponent as Component } from "./Posts"
import { ComponentProps } from "react"

type Props = ComponentProps<typeof Component>

const meta = { title: "posts/default", component: Component }

export default meta

const Template = (props: Props) => <Component {...props} />

export const Initial = Template.bind({})
Initial.args = {
  pageState: undefined,
}

export const Loading = Template.bind({})
Loading.args = {
  pageState: {
      isLoading: true;
      data: undefined;
      error: undefined
  },
}

export const Success = Template.bind({})
Success.args = {
  pageState: {
      isLoading: false;
      data: [{id: 1, title: 'hoge'}];
      error: undefined
  },
}

export const Fail = Template.bind({})
Fail.args = {
  pageState: {
      isLoading: false;
      data: undefined;
      error: 'network error'
  },
}
```

ユニオン型で表現されているとページの取りうるパターンの作成漏れも防ぎやすく、そういう点で Storybook と相性が良いと思っています。

また、型に合わない props を Storybook に定義すると型エラーを起こさせる Utility が Storybook から export されているので、それを駆使して Storybook の追従を行ったり、ページの型上ありえない Storybook を作成することを防げるという点でも相性は良いです。
（※ 自分で見つけたり考えた方法ではなく、さらに引用元のリンクを貼れないので具体的な方法については伏せます。）

ちなみにこの if 文の分岐でどうして全パターンを網羅できるかなどもっと詳しい説明は [@uhyo](https://twitter.com/uhyo_) さんの [TypeScript way で React を書く](https://qiita.com/uhyo/items/d74af1d8c109af43849e) にまとまっているので、こちらをご覧ください。

## storybook first に作ると何が嬉しくなるか

このように少々めんどくさい作りをすると何が嬉しくなるのでしょうか。

### API がなくても開発できる

まず一つには API から帰ってくる値を Storybook から流し込むので、API がなくてもそのコンポーネントやページの妥当性を確認できるというメリットがあります。
これは開発初期においては嬉しいことで、いろんな値のパターンを自分で作り出せるので、エッジケースの漏れを最初から気づくことにも役立てられます。

### スナップショットに対してデバッグができる

たとえば特定の操作をしないと導線に入れない画面の開発をするとき、そのデバッグをする場合は毎回その操作をしないといけません。
たとえば、フォームが紙芝居のように分割されていて、そのフォームの 3 枚目をデバッグしないといけない場合です。
3 枚目をデバッグするために 1 からフォームを入力していかないといけなかったといった経験はみなさまもあるのではないでしょうか。
ここで、 Storybook でページの全ステートを表現可能であれば、その特定の操作をした後の state を流し込めばその場面を再現することができます。
これはデバッグの上ではとても有利です。

### 有機的なカタログで結合的に眺めることで防げるバグもある

Storybook first で開発していると、Storybook で確認できるパーツの範囲が広がっていきます。
そのため複数コンポーネントを並べたときの表示崩れなどに気付けるというメリットがあります。
アプリケーション本体を動かさなくても結合的な観点でデバッグできるのは強みだと思います。
**Storybook はパーツを管理するだけでなく、アプリケーション自体を管理することができます。**

## おわりに

いかがでしたか？
Storybook は構築も手入れもめんどくさいので、なんだかんだで嫌われてしまっているのをために見かけるのですが、Storybook を使うことを目的にして開発するとそれなりの恩恵はしっかり受けられます。
ぜひとも、Storybook に向き合っていきましょう。
