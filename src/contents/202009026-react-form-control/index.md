---
path: /react-form-control
created: "2020-09-26"
title: Reactのフォームをコントロールしたときのデメリットを考える
visual: "./visual.png"
tags: [React, お気持ち]
userId: sadnessOjisan
isFavorite: false
isProtect: true
---

公式では制御されたコンポーネントを推奨し、`<input type="text" value={this.state.value} onChange={this.handleChange} />` のように onChange を使って更新、value に state を入れて制御するようにしているのですが、推奨は言いすぎではと思っていることについて書きます。
「公式のここがおかしいのではないか」という問いかけはだいたい自分が間違っているだけという場合がほとんであることは自覚していますので、もし間違っていたら """優しく""" 指摘してくれると嬉しいです。

## React は制御されたコンポーネントを推奨している

まず制御されたコンポーネントについて、公式の定義をみましょう。

> HTML では `<input>`、`<textarea>`、そして `<select>` のようなフォーム要素は通常、自身で状態を保持しており、ユーザの入力に基づいてそれを更新します。React では、変更されうる状態は通常はコンポーネントの state プロパティに保持され、setState() 関数でのみ更新されます。React の state を “信頼できる唯一の情報源 (single source of truth)” とすることで、上述の 2 つの状態を結合させることができます。そうすることで、フォームをレンダーしている React コンポーネントが、後続するユーザ入力でフォームで起きることも制御できるようになります。このような方法で React によって値が制御される入力フォーム要素は「制御されたコンポーネント」と呼ばれます。

FYI: https://ja.reactjs.org/docs/forms.html#controlled-components

制御されたコンポーネントがあると言うことは制御されていないコンポーネントもあるのですが、その説明では **制御されたコンポーネントの利用の推奨が明記されています**。

> ほとんどの場合では、フォームの実装には制御されたコンポーネントを使用することをお勧めしています。

しかし僕は制御されたコンポーネントを使いたくないです。

FYI: https://ja.reactjs.org/docs/uncontrolled-components.html

## 制御されたコンポーネントを使いたくない

使いたくない理由としては次の 2 つがあります。

### パフォーマンスへの懸念

制御されたコンポーネントでは入力内容を信頼できる唯一の情報源 (single source of truth)に書き込み、それをフォームの value にバインドします。
そして入力のたびにその内容を state に書き込むので、state を配置している階層によっては再レンダリングがたくさん走ります。

React.memo などを駆使すればある程度緩和ができるものだとは思いますが、これらはコンポーネントが更新されないといった事故の元にもなるので、memo の導入は慎重にならなければいけません。
特に誰かから引き継いだコードの実装だと state 周りのリファクタリングはそれ用の工数をもらわないと厳しいところがあります。

FYI: https://ja.reactjs.org/docs/react-api.html#reactmemo

ただフォーム入力にまつわる UI 反映のパフォーマンス周りの懸念は（近い？遠い？）将来的には Concurrent mode によって緩和されるはずなので気にしなくていい問題になるのかもしれません。

### 制御したい場合のユースケースへ対応したときのコスパが良いとは思えない

フォームの入力内容を制御したいとき主にその用途はバリデーションと動的修正(リセット含む)だと思います。
（他に何かメリット見落としているかもなのでもしありましたら教えてください。）

そのためそれらの機能の実装のためには制御されたコンポーネントが好ましいのですが、そもそも入力時にバリデーションや修正って本当に必要でしょうか？
**入力後、つまり onBlur のタイミングで行ってもいいのでは**と思っており、onBlur を使うと入力時に再レンダリングによってもっさりするといった問題は解消できます。

唯一、他のフォームの入力状態に応じて入力内容を変換するというユースケースはありそうですが（たとえば二つの数値入力フォームがあって片方を入力するともう片方が合計 100 になるように自動で修正されるなど）、onBlur を使った修正やバリデーションで勘弁してほしいと実装者都合では思っています。

**もっとも エクセルのような動的にリアルタイムに制御できるフォームを作りやすくなったという恩恵を React がもたらしているとは思うので onChange 軸の制御されたコンポーネントを否定することはできないのですが、少なくともリアルタイムに入力内容を制御しなくていいユースケースなら onChange や 制御されたフォームを使う必要はないと思います。**

(※ onBlur を使うと value に state を入れられなくなるので onBlur を使うと非制御コンポーネントになるという認識です。制御されたフォームに登録できるイベントハンドラは onChange のみです。)

### こぼれ話

昔から名が知れている多くの form ライブラリは制御されたコンポーネントを内部で使っています。
そのため form ライブラリを使うとパフォーマンスチューニングで苦労するなんてこともあったりします。

一方で react-hook-form はその問題を非制御コンポーネントを使うことで回避しています。
もし form のパフォーマンスで悩んでいる + ライブラリを入れたい場合は検討してみるといいと思います。

FYI: https://react-hook-form.com/jp/

## 非制御コンポーネントを使う

ADVANCED GUIDES に非制御コンポーネントの説明があります。（これ Advanced に書かない方が良いと思うんだよなぁ・・・）

> 制御されたコンポーネントでは、フォームのデータは React コンポーネントが扱います。非制御コンポーネントはその代替となるものであり、フォームデータを DOM 自身が扱います。

FYI: https://ja.reactjs.org/docs/uncontrolled-components.html

実 DOM を使うのでフォームの入力内容は ref を通して取得します。
そうすることで React の state を経由せずとも制御が可能になり、他のフォームの入力状態に応じて入力内容を変換するというユースケースにも対応できます。（=制御したい場合のユースケースも満たせる）

### 中途半端な制御コンポーネントとして使う

非制御コンポーネントを使うと入力時の再レンダリングの問題から完全に開放されるのでこれに寄せたい気持ちが強いのですが、ref を使うのは少し抵抗があったりします。
たくさん項目があるフォームの場合それぞれに ref を持たせるのもちょっと大変です。
**そこで、DOM の中で状態管理をしながら、再レンダリングが問題にならないタイミングで React 側に同期させる設計にしてみます。**

#### onBlur で同期

onBlur は input からフォーカスが外れた時に発火するイベントです。
このとき入力内容を取得できます。
フォーカスが外れるタイミングは入力後なので入力時にパフォーマンスが落ちません。
フォーカスは input の外をクリックしたとき、つまり送信ボタンを押したときなどでも発火します。

```jsx
import React from "react"

export default function App() {
  const [state, setState] = React.useState({})
  const handleBlur = e => {
    setState({ ...state, first: e.target.value })
  }
  return (
    <div>
      <form>
        <label htmlFor="first">firlst</label>
        <input name="first" id="first" onBlur={handleBlur}></input>
      </form>
      {JSON.stringify(state)}
    </div>
  )
}
```

#### onSubmit で同期

onBlur を使った方法は万能な気もするのですが、input が 1 つのフォームでエンターキー押して submit させる仕様だと onBlur は実行されない場合があります。
その場合は onSubmit を使いましょう。
1 回の submit で複数の input 要素の情報も取得できるのでハンドラ関数の節約にもなります

submit イベントからは name 経由でフォームの内容を取得できます。

```jsx
import React from "react"

export default function App() {
  const [state, setState] = React.useState({})
  const handeSubmit = e => {
    e.preventDefault()
    setState({ ...state, second: e.target["second"].value })
  }
  return (
    <div>
      <form onSubmit={handeSubmit}>
        <label htmlFor="second">second</label>
        <input name="second" id="second"></input>
        <button type="submit">submit</button>
      </form>
      {JSON.stringify(state)}
    </div>
  )
}
```

ただし name で掘っていくので null チェックなどを挟まないと null へのアクセスなど思わぬ事故につながります。
TS 環境であるならば バリデーション関数と is を駆使して掘るとよいでしょう。

### 初期値は defaultValue で上書く

input 要素に placeholder とは別で value を初期値で埋め込みたい場合があると思います。
例えば前回の入力内容などです。(localstorage とか store から復旧させるケースを考えてください。)
このとき onChange と state を使わないとこの value は書き換えられません。
なぜなら input のイベントが持つ入力内容は value そのもので、value は変数でなければ書き換えることができないからです。
そうなると value を入力のたびに state で書き換えないといけなくなり、制御されたコンポーネントとして扱う必要が出てきます。

それを回避できるのが defaultValue です。
最初の入力時に有効な value で初期値として使えます。

```jsx
<input name="second" id="second" defaultValue="hey"></input>
```

FYI: https://ja.reactjs.org/docs/uncontrolled-components.html#default-values

## 何が言いたかったか

公式の例は基本的に制御されたコンポーネントですが、制御されたコンポーネントを使わないといけないときは入力内容の動的修正などケースが限られるので、それ以外の場合は非制御のコンポーネントを使った方が良いと思います。
そして再レンダリングをあまり起きないタイミング(=onBlur)で React の state に同期させれば使い勝手も良いと思います。

## おわりに

最近は個人的には onBlur だけを使うようにしています。
特に困ったことは起きていないです。

あと react-hook-form はちゃんと試してみたいなと思っています。
react-hook-form は onBlur も使わずに ref を使って非制御コンポーネントをコントロールしています。

**ただのお気持ち表明なので何か自信やエビデンスに裏付けられたものではありません。onBlur 使うかどうかは一度周りの詳しい大人に相談するとよいでしょう！**

(エクセルやエディタのような気合が必要なものを作るときは onChange + debounce で頑張っています。)

## サンプルコード

FYI: https://codesandbox.io/s/hiseigyo-20k02?file=/src/App.js
