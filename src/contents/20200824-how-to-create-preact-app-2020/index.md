---
path: /how-to-create-preact-app-2020
created: "2020-08-24 09:00"
title: Preactの環境構築 of 2020
visual: "./visual.png"
tags: [preact, TypeScript]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

所用で先週[preact](https://preactjs.com/)を初めて触っていたのですが、環境構築をしているときに「この情報ドキュメントにないよね？」「情報が間違ってそう？」っていうのを節々で感じた部分があって難航したので、これから環境構築する人がググった時の助けになるようメモを残しておきます。
とはいえ自分が preact 初心者で自分が間違っている可能性も大いにあるので、そういうのがありましたら指摘していただけると助かります。

React をある程度書いたことある人が preact に挑戦することを想定して書いています。
主に「React でやるときのあれは preact でどうするんだっけ」という情報です。

## 目指すゴール

環境構築のゴールが何かというと一つには Hello World があるとは思いますが、それよりかはもっと踏み込んでアプリケーションとして欲しくなる機能をとりあえず全部実装していこうと思います。
それが何かというのは独断と偏見で言うと、

- Build できて Hello World が表示される
- ルーティングがある
- 状態管理がある
- スタイリングできる

を一旦のゴールにおこうと思います。
ということで詳細ページ付き TODO リストを作ってみようと思います。

またいま preact を始めるならということで、

- Preact X
- TypeScript

の利用を想定しています。

## まずは Hello World

TypeScript を使って Hello World するところまでまず作ります。
この例が公式にあって欲しい・・・

### いつものおまじない

webpack でのビルド環境を作ります。

React + TS で Hello World するとき、

`npm i -D typescript webpack webpack-cli ts-loader html-webpack-plugin webpack-dev-server` みたいなことをすると思うのですが preact でも全く同じ構成を使えます。

webpack.config.js もいつも通りの感じで書きます。

```js:title=twebpack.config.js
const HtmlWebpackPlugin = require("html-webpack-plugin")
const path = require("path")

module.exports = {
  mode: process.env.NODE_ENV,
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "build.js",
  },
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".js", ".ts", ".tsx", ".css", ".gif", ".json", ".png", ".mp4"],
  },
  plugins: [new HtmlWebpackPlugin({ template: "./src/index.html" })],
  devServer: {
    historyApiFallback: true,
  },
}
```

そして次に TypeScript の設定をします。

```sh
$ npx tsc --init
```

そしてこのまま、適当な preact のサンプルコードを走らせてみましょう。

```tsx:title=src/index.tsx
import { h, render } from "preact"

const Main = () => {
  return <div>hello world!</div>
}

render(<Main></Main>, document.body)
```

これはビルドに失敗します。

### preact の h 関数をビルドする

先ほどのビルドエラーは

```sh
TS17004: Cannot use JSX unless the '--jsx' flag is provided.
```

とでるはずなので、jsx オプションに react をつけて実行します。
すると、

```sh
TS2686: 'React' refers to a UMD global, but the current file is a module.
Consider adding an import instead.
```

というエラーがでます。

これはつまり、

```sh
import React from 'react'
```

を書いておく必要があります。
React コンポーネントで使いもしないのに書く必要があるおまじないのあれです。

これは [公式 Doc の React がスコープ内にあること](https://ja.reactjs.org/docs/jsx-in-depth.html#react-must-be-in-scope) にある通り、

> JSX は React.createElement の呼び出しへとコンパイルされるため、React ライブラリは常に JSX コードのスコープ内にある必要があります。

という制限があるためです。

でもいまは preact 環境です。
これを解決する方法を考えないといけません。

そこで preact の h 関数を使います。
h 関数は React でいう createElement 相当の関数です。

preact の世界では h 関数を import しておけばビルドが通るようになります。
ただしそれをチェックしてくれている TypeScript コンパイラはそれを知らないので、この h 関数の存在を知らせる必要があります。
とはいえ createElement 相当のもの が何かをコンパイラに教えればいいだけなので、jsx の Factory 関数が h であることをオプションで指定します。

それが jsxFactory です。

> Specify the JSX factory function to use when targeting react JSX emit, e.g. 'React.createElement' or 'h'. Requires TypeScript version 2.1 or later.

ここに h を指定します。

```json:title=tsconfig.json
{
  "compilerOptions": {
    "jsxFactory": "h",
    "jsx" : "react"
    ...
}
```

なので tsconfig はこうなります。

```json:title=tsconfig.json
{
  "compilerOptions": {
    "jsxFactory": "h",
    "target": "es5",
    "module": "commonjs",
    "jsx": "react",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

もちろん、target や module などのオプションは好きに変えても良いです。

（せっかく preact という省エネ環境でやるので module は ESNext にした方が良いと思った方もいらっしゃるとは思いますが、Hello World するだけなのでいまは `npx tsc --init` の設定をそのまま使いまわしています。）

これでビルドできるようになったので、アプリケーションを開発していきます。

## ルーティング

ルーターには [preact-router](https://github.com/preactjs/preact-router) が使えます。

公式にある通り、

```jsx
import Router from "preact-router"
import { h, render } from "preact"
/** @jsx h */

const Main = () => (
  <Router>
    <Home path="/" />
    <About path="/about" />
    // Advanced is an optional query
    <Search path="/search/:query/:advanced?" />
  </Router>
)

render(<Main />, document.body)
```

として使え、よく見る Router という感じがします。
ただし、この書き方だと path は型定義が合いません。

```sh
type '{ path: string; }' is not assignable to type 'IntrinsicAttributes'.
  Property 'path' does not exist on type 'IntrinsicAttributes'.ts(2322)
```

そこで、ドキュメントにはない API なのですが

```jsx
<Router>
  <Route path="/" component={Home}></Route>
  <Route path="/:id" component={Detail}></Route>
</Router>
```

と書くと path の型定義を通せます。

一応ドキュメントには

> Note: This is not a preact-compatible version of React Router. preact-router is a simple URL wiring and does no orchestration for you. If you're looking for more complex solutions like nested routes and view composition, react-router works great with preact as long as you alias in preact/compat.

とあるので、そもそも preact-router を使わずに react-router を使えば解決できる問題だったのかもしれません。ただ個人的には preact-router でも問題なさそうなのでこれを使います。

(nested routes が必要になるのは大規模なアプリケーションだしそんな大規模なものだったら(どうせ肥大化するので)react でよくないかと思うし、そもそも nested route も nest したルーティングを平でトップレベルに持てば作れるので react-router を採用する理由ってあまりないような気がします。もちろんサイドバーの内側やタブの中だけルーティングしたいといったケースは対応できませんが、それも query parameter とかで乗り切れるはずです。)

## 状態管理

Preact では hooks が使えます！
つまり useReducer と useContext があります。
なので global state の管理も容易です。
一応 [preact-redux](https://github.com/developit/preact-redux) というのはありますが、バンドルサイズ増やしたくないので採用を見送りました。
middleware のような物が欲しくなるとこちらを検討してもいいかもしれません。

### preact での hooks の使い方

preact/compat もしくは preact/hooks に含まれています。

```jsx
import { useReducer } from "preact/compat"
```

### preact/compat ってなに？

> preact/compat is our compatibility layer that translates React code to Preact. For existing React users this can be an easy way to try out Preact without changing any of your code, by setting up a few aliases in your bundler configuration.

React にある機能を preact で使うための変換機能です。
もともとは [preact-compat](https://github.com/preactjs/preact-compat) という別のライブラリでしたが本体に含まれることとなりました。

> It provides the same exports as react and react-dom, meaning you can use your build tool of choice to drop it in where React is being depended on.

とあり、preact/compat があれば React に依存する 3rd party ライブラリを入れることも可能になってきます。
さきほどの react-router の例がそれです。

### パフォーマンスがネックになるのでは？

Context は [公式の注意事項](https://ja.reactjs.org/docs/context.html#caveats)によると、

> コンテクストは参照の同一性を使用していつ再レンダーするかを決定するため、プロバイダの親が再レンダーするときにコンシューマで意図しないレンダーを引き起こす可能性があるいくつかの問題があります。

とあり、再レンダリングによって性能劣化を引き起こす可能性があります。

ただ実際のところ再レンダリングによってもっさりすることがあるのは複雑な画面を作らない限りは起きないはずなので、気にしなくてもいいかもしれません。

この手の問題は Context を分割することで防いだり、もし実装してしまっていても memo などを使って再レンダリングのための計算そのものを防ぐことで解消できます。
Context にまつわるトラブルは[useContext + useState 利用時のパフォーマンスは Provider の使い方で決まる！かも。。。？](https://qiita.com/jonakp/items/58c9c383473d02479ea7)などにまとまっているのでご覧ください。

あと memo を解決策についてはこちらの Issue をご覧ください。まとまっててとても助かりました。

FYI: https://github.com/facebook/react/issues/15156

### Dispatch の型定義がない

Context を使った状態管理の例としては[React Context を用いた簡易 Store](https://mizchi.dev/202005271609-react-app-context)の実装が実感が湧くと思います。

React の場合@types/react が提供している Dispatch という型で createContext のジェネリクスに渡して型をしばれます。
**しかし preact の場合、Dispatch という型が提供されていません。**
**ここは React との差分となります。**
が、型推論させてみるとこれは useContext で渡す action 関数そのもの型が入ることがわかるので createContext 時にはその型を指定すれば問題ないです。

```ts
export const TodoDispatchContext = createContext<{
  dispatch: (action: ActionType) => void
}>({ dispatch: () => {} })
```

### 実装例

reducer の定義

```ts:title=src/reducer/TodoReducer.ts
// action type

import { TodoType } from "../type"

const SELECT_TODO = "SELECT_TODO"
const SAVE_TODO = "SAVE_TODO"

const actionTypes = {
  SELECT_TODO,
  SAVE_TODO,
} as const

// action

const selectTodo = (todo: TodoType) => ({
  type: actionTypes.SELECT_TODO,
  payload: todo,
})
const saveTodo = (todo: TodoType) => ({
  type: actionTypes.SAVE_TODO,
  payload: todo,
})

export const actions = {
  selectTodo,
  saveTodo,
}

export type ActionType =
  | ReturnType<typeof selectTodo>
  | ReturnType<typeof saveTodo>

// store
export type StoreType = {
  selectedTodo: TodoType | null
  todos: TodoType[]
}

export const initialState: StoreType = {
  selectedTodo: null,
  todos: [],
}

export default (state: StoreType, action: ActionType): StoreType => {
  switch (action.type) {
    case "SELECT_TODO":
      return { ...state, selectedTodo: action.payload }
    case "SAVE_TODO":
      return { ...state, todos: [...state.todos, action.payload] }
    default:
      throw new Error("unexpected action type")
  }
}
```

context

```ts:title=src/context/TodoContext.ts
import { createContext } from "preact"
import { StoreType, ActionType, initialState } from "../reducer/TodoReducer"

export const TodoStateContext = createContext<{
  state: StoreType
}>({ state: initialState })

export const TodoDispatchContext = createContext<{
  dispatch: (action: ActionType) => void
}>({ dispatch: () => {} })
```

reducer を context で配信

```tsx:title=src/index.tsx
import { h, render } from "preact"
import { useReducer } from "preact/hooks"
import { Router, Route } from "preact-router"
import reducer, { initialState } from "./reducer/TodoReducer"
import { TodoStateContext, TodoDispatchContext } from "./context/TodoCotext"
import { Todos } from "./pages/Todos"
import { Detail } from "./pages/Detail"

const Main = () => {
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <TodoStateContext.Provider value={{ state }}>
      <TodoDispatchContext.Provider value={{ dispatch }}>
        <Router>
          <Route path="/" component={Todos}></Route>
          <Route path="/todos/:id" component={Detail}></Route>
        </Router>
      </TodoDispatchContext.Provider>
    </TodoStateContext.Provider>
  )
}

render(<Main></Main>, document.body)
```

UI から利用

```tsx:title=src/pages/Todo.tsx
import { h } from "preact"
import { useContext } from "preact/hooks"
import { Link } from "preact-router"
import { TodoStateContext, TodoDispatchContext } from "../context/TodoCotext"
import { actions } from "../reducer/TodoReducer"
import { genRandomId } from "../helper"
import { Item } from "../component/Item"

export const Todos = () => {
  const todoStateContext = useContext(TodoStateContext)
  const todoDispatchContext = useContext(TodoDispatchContext)
  const { state } = todoStateContext
  const { dispatch } = todoDispatchContext
  return (
    <div>
      <hi>TODO LIST</hi>
      <div>
        {state.todos.map(todo => (
          <Link
            href={`/todos/${todo.id}`}
            onClick={() => {
              dispatch(actions.selectTodo(todo))
            }}
          >
            <Item data={todo} key={todo.id}></Item>
          </Link>
        ))}
      </div>
      <form
        onSubmit={e => {
          e.preventDefault()
          try {
            // @ts-ignore
            const todo = e.target.todo.value as string
            const id = genRandomId()
            dispatch(actions.saveTodo({ id, todo }))
          } catch (e) {
            console.error(e)
            alert("入力の保存に失敗しました。")
          }
        }}
      >
        <Input name="todo"></Input>
        <button>submit</button>
      </form>
    </div>
  )
}
```

## スタイリング

[goober](https://github.com/cristianbote/goober) が良いと思います。

### goober は軽量でバンドルを無闇に増やさない

スタイリングに関しては、バンドルサイズを増やしたくないしランタイムでの実行コストも減らしたいので CSS in JS は避けるべきなのかとも思ったのですが、設定・補完・行数の節約といった面での開発体験を考えて採用することにしました。

とはいえここで入れるライブラリは慎重になりました。
例えば styled-components や emotion などは バンドルサイズが 10 kb あり preact 本体と同じくらいのサイズがあります。
ここでバンドルサイズを増やすと「なんのために preact を入れたのじゃ」となるのでどうしたらいいか頭を悩ましていました。

preact に詳しそうな先人の[ビルドサイズ要求環境でモダンフロントエンドをやる (主に preact の話)](https://mizchi.dev/202006261728-minimal-js)を見てるとどうやら goober というのがあるらしいです。
これは まさしく ちょうど僕が悩んでいたようなバンドルサイズへの懸念から生まれたライブラリのようで、「CSS in JS ライブラリっていってもどうせ styled しか使わないこともあるからそれだけを持ってきたぜ」といった解決策が実装されています。

### 必要なユースケースは全部満たせそう

とはいえ機能を絞っているライブラリなので本当にやりたいことが全部できるかどうかという実験はしておく必要があったので試しておきました。

#### 上書きができる

コンポーネントの上書きはできます。
emotion や styled-components でやる時の方法と同じです。

コンポーネントをラップし、

```tsx
import { styled } from "goober"
import { Item as _Item } from "../component/Item"

const Item = styled(_Item)`
  border: solid 1px #ccc;
  border-radius: 8px;
  margin: 4px 12px;
  @media screen and (max-width: 450px) {
    flex-direction: column;
    margin: 12px 0px;
  }
`
```

ラップ対象に className を渡すと

```jsx
<div className={props.className} />
```

スタイリングの上書きができます。

レイアウトのようなものは親からスタイルを指定することでコンポーネントのポータビリティが上がるのでやりたいテクニックなので使っていきましょう。

#### メディアクエリが使える

公式 Doc に例が書かれていないのですができます。（似た例はあるけどテンプレートリテラルでの例がない）

styled-components と同じ書き方でできます。

```tsx
const Items = styled("div")`
  display: flex;
  flex-direction: row;
  @media screen and (max-width: 450px) {
    flex-direction: column;
  }
`
```

#### global css も簡単に読み込める

glob という機能で実現できます。(global の略っぽい)
reset.css の実現に使えます。

```jsx
import { glob } from "goober"

glob`
  *,
  *:after,
  *:before {
    margin: 0;
    padding: 0;
    box-sizing: inherit;
  }

  html {
    font-size: 62.5%;
  }

  body {
    box-sizing: border-box;
  }
`
```

これを呼ぶだけで GlobalCSS が適用されます。

## おわりに

といった感じで preact を使って見た感想としては、環境構築が React との差分があったりドキュメントを見つけられなかったりで苦戦するところがあったのですが、最低限の機能は実現できることがわかりました。
ぶっちゃけ自分がアプリ開発する分にはこれらの機能さえあればどんなものでも作れると思っているので preact で十分に実務で戦えそうだなと思いました。
とはいえ preact が要求される過酷な環境での開発をする機会は今のところはないので、技術選定では React を選ぶとは思います。
ただいつか preact を使わないと解決できないような限界を追求する系の仕事をしたいので、そういった仕事が任されるようにこれからも勉強を頑張ります！

最後にこの設定をする上で公式 Doc だけ見てると多分ハマるであろうことだけまとめます。

- TS を採用するなら jsxFactory の設定を忘れずに, それ以外は React の設定と全く同じものが使える
- preact-router でページを出し分けるには Router だけでなく Route も使う
- preact 本体に hooks は入っていない。preact 配下の path から見つけ出そう。
- Dispatch の型定義はそもそも preact にないが、型定義自体がないので Dispatch がなくても型検査を通せる
- スタイリングは goober が良さそう。メディアクエリは styled-components と同じ書き方ができる。

## ソースコード

https://github.com/ojisan-toybox/preact-todo
