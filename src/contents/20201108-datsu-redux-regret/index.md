---
path: /datsu-redux-regret
created: "2020-11-08"
title: 脱Reduxを試みて失敗した話、その原因と対策について
visual: "./visual.png"
tags: [react, redux]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

さて、年末が近づいてきましたが今年も 「Redux 使うべき使わないべきか」という話で盛り上がりましたね。
僕もずっと悩める人なのですが、[@f_subal さんの Tweet](https://twitter.com/f_subal/status/1320051081028587520) や [@takepepe さんの Next.js の状態管理 2020](https://zenn.dev/takepepe/articles/state-manegement-in-nextjs-2020) が示すように Read 要件・Write 要件の多さで使い分けるという指針には深く納得をしました。
Redux の代替になるツールやノウハウもより活発に出てきて、Redux 以外の選択肢を考えるにあたって様々な学びがあった 1 年でした。
自分も色々と Redux 以外の選択肢を試していたのですが、その中で「やっぱ Redux を使えばよかった」と思ったときがあったので、これから Redux を剥がそうと考えている人に向けてその失敗談を語りたいと思います。
**自分も手探りで正解がわかっていないところなのでアドバイス・反論・指摘などがあれば頂きたいです。**

（あくまでも「Redux を剥がそうとしてこういう失敗しちゃった」という共有なので、Redux とそれ以外の優劣については語っていませんし何も思っていません(Redux は好きですが)。
状態管理をどうするかが適しているかは要件によると思うので Redux が一番良いとは思っていません。
むしろこういうことに最初から気をつけると Redux を剥がせますよという情報でもあります。）

## Routing で状態が吹っ飛ぶ ~Store はグローバルに欲しい~

Redux をやめて例えば Context(useContext) や custom hooks で状態管理をするとデータはそのコンポーネントで持つことになります。
当然ながらそのとき Routing でページを切り替えて戻るとその状態は消えてしまいます。

たとえば、

```jsx
<Switch>
  <Route path='index'>
    <Search></Search>
  </Route>
  <Route path='index/:id'>
    <Detail></Detail>
  </Route>
<Switch>
```

```jsx
const Index = () => {
  const data = useContext(Context)
  return <div>検索ページ
  {data.map(
      ...
  )}
  </div>
}
```

とあって、Search -> Detail に遷移し、もう一度 Search に戻ってくるとそのデータは消えています。
**routing の内側で状態を管理すると routing が切り替わるとその状態は消えます。**

しかしルーティング遷移前の状態を残しておいて欲しいといったような要件ってよく出てきませんか？
例えば、

「検索 => 詳細 => ブラウザバック => 検索状態が残っておいて欲しい」

といったようなものです。

このような要件のとき状態を 一番外側の store に保存しておけば復元することが容易で、Redux を採用していればそれは自然と満たせる要件です。
そのような要件があるにもかかわらず、Context や Hooks などで脱 Redux をすると、global store まで消えてしまって、後から状態を戻したいという要望が出た時に頭を悩ませたということがありました。

### Redux を使わない時の解決策

一応 Redux を使わなくても実現する方法もありますが、自分的には「ウッ！」となるやり方なのであまり好きではないです。
筆者にとっての感情論ですのであまり気にしなくて良いのかも知れませんが...（？）

#### URL で状態管理

検索を例に挙げると検索結果ページでその検索状態を URL に含めるというものです。
そうすればルーティングが変わってもその URL から History API 越しに検索状態を取り出して状態を復元することができます。

一見すると良さそうなのですが、例えば検索結果ではないただの状態(たとえばモーダルやトグルの ON/OFF)を復元させたい場合はどうしたらいいでしょうか。
そういったただの state も URL に含めるべきなのでしょうか。
個人的にはそれは違うんじゃないかと思ったりもしていてあまり気は進みません。
historyAPI に備わっている State も使えますが、Hooks/Context などの何かしらの状態管理機構 + URL + History API の state オブジェクト と状態が分散するので、開発した本人以外の人がコードを読んだ時は迷子になったりしないかなぁという懸念を持っていたりもします。
（脱 Redux した時点で single source of truth の考えも捨てるべきと考えると懸念は不要かもしれない）

あと、一度 URL で状態を管理するとそれを state に戻す場合に型が合うかといったバリデーションやユーザー定義ガードのチェックも挟むことになるので、無駄な計算もしている気もしており、それも悩ましいポイントです。
ただこのやり方には F5 更新したときに状態を戻せるというメリットもあり、Redux であれば localstorage からの hydrate みたいな処理をしないといけないので、それをせずに済むので嬉しい点もあるなとは思っています。

（追記: 検索結果のシェアが要件として出てくることを見越すと URL で状態管理した方が良さそうです。）

#### Provider の階層を変える

Provider を routing の外側に持てば、routing が切り替わっても状態を保持できます。
しかしこれをやると state の位置も変える必要があるので、デグレは少し怖いです。
その影響を減らしたいなら state ではなく useReducer を使うと疎結合にできて移しやすいのですが、「useReducer を使うなら Redux 使えば？」と思ったりもします。

また [react-query](https://react-query.tanstack.com/) も良い選択肢だと思います。
これには CacheProvider という仕組みが備わっており、これを routing の外で持っておけばデータを保持しておくことができます。
しかし react-query はデータ取得の状態管理のライブラリでありモーダルの開閉状態や検索フォームの状態管理などは別途やり方を考える必要はあります。

### Redux やめると global store をやめるは別の話だが・・・

この例を挙げると「Redux やめると global store をやめるは別では？」という意見もでます。
実際のところ context の provider をアプリケーションの一番親で呼べばその状態は吹っ飛びません。
しかし、context は後述する再レンダリングの問題があり、global store に押し込んでそこから読み取る形式にすると不必要な再レンダリングを引き起こすことに繋がるので、global store を作るなら Redux で作りたいなぁと思いました。

## 再レンダリングが起きる ~store は props として欲しい~

Context で状態管理するときに辛くなる話です。

### Redux はパフォーマンスチューニングしやすい

react-redux は内部で react 本体の Context を使っているのですが、何か色々よしなに差分更新判定やメモ化をしてくれるので、自前で適当に Context を使うよりかはパフォーマンスがよくなります。
Redux の強みの一つは再レンダリングのコントロールにもあります。

#### connect は設定されたコンポーネントを返す

`connect` は部分適用することでコンポーネントへの設定を返すことができます。
ここでいう設定というのは `connect(mapStateToProps, mapDispatchToProps)(HogeComponent)` のうち、`connect(mapStateToProps, mapDispatchToProps)` を実行して WrapperdComponent に必要となる props を埋め込むことです。
直接コンポーネントを返すのではなく、コンポーネントの設定を返すことで、コンポーネントを返す前に諸々のチューニング処理を挟み込めます。例えば関心のある mapStateToProps で関心のある状態だけを抜き取ったり、areStatesEqual で状態更新の条件を縛れます。

#### useSelector は関心のある props のみを監視する

connect の代わりに useSelector が導入されてそれを使うと connect の持っていたメリットが失われるようにも思えます。
なぜならコンポーネントに関心の props だけを埋め込めないからです。
しかし useSelector は内部で `useMemo` を使った最適化や`useIsomorphicLayoutEffect`(`useEffect`, `useLayoutEffect`のラッパー)を使った差分検知が施されており、関心を持つ値だけを効率よく更新ができます。
そのため react-redux を使っていれば 自然と最適化は施されます。

(connect を useSelector に置き換えた場合の影響については自分も詳しくないので、誰か補足していただけると助かります。)

### useContext をそのまま使う弊害

Redux を使うとパフォーマンスチューニングしやすいというメリットがありました。
一方で useContext をそのままコンポーネントに繋ぎ込むと再レンダリングが起きます。

#### 繋ぎ込んだ階層は再レンダリングが起きる

`shoudComponentUpdate` や `React.memo` でコントロールできる再レンダリングは props に対してです。
useContext で取得する値は props ではありません。
そのため 再レンダリング抑制をすることができません。

なので、繋ぎ込んだ層は、store の状態が変わると必ず再レンダリングします。
これを防ぐには 本来 Context を繋ぎたいコンポーネントの親で繋ぎ込んで `React.memo` などで抑制しなければいけません。

もちろん結局はその親が再レンダリングするのでどちらにせよ逃れられない、redux を使っても繋いだコンポーネント自体は再レンダリングするので同じ問題かも知れません。
ただ Context には後述する通り無関心な値が書き換わっても再レンダリングする仕組みがあり、一つ上の親で繋いで`React.memo`しないと不要な再レンダリングが起きるという問題が残ります。

#### 無関心な値が書き換わっても再レンダリングが起きる

contextAPI では Provider の value のオブジェクトの値が一部でも書き換わると、そのデータを使っている・使っていないにかかわらず再レンダリングが起きます。

たとえば、カウントする種類を 2 つ作り、

```tsx:title=app.tsx
import * as React from "react"
import { Count } from "./count"
import { Count_2nd } from "./count_2nd"

type storeType = {
  count: number
  count_2nd: number
}

export const StateContext = React.createContext<storeType>({
  count: 0,
  count_2nd: 0,
})

export const App = () => {
  const [state, setState] = React.useState<storeType>({
    count: 0,
    count_2nd: 0,
  })

  return (
    <StateContext.Provider value={state}>
      <Count></Count>
      <Count></Count>
      <Count></Count>
      <Count_2nd></Count_2nd>
      <Count_2nd></Count_2nd>
      <Count_2nd></Count_2nd>
      <button
        onClick={() => {
          setState({ ...state, count: state.count + 1 })
        }}
      >
        count up
      </button>
      <button
        onClick={() => {
          setState({ ...state, count_2nd: state.count_2nd + 1 })
        }}
      >
        count_2nd up
      </button>
    </StateContext.Provider>
  )
}
```

count.tsx, counter_2nd を次のように作り

```tsx:title=count.tsx
import * as React from "react"
import { StateContext } from "./app"

export const Count = () => {
  const context = React.useContext(StateContext)
  const getColor = () => Math.floor(Math.random() * 255)
  const style = {
    color: `rgb(${getColor()},${getColor()},${getColor()})`,
  }
  return <div style={style}>count: {context.count}</div>
}
```

それぞれを count up させると count up させていない方も再レンダリングすることを確認できるはずです。

これについては実例付きで詳しく解説している記事があるので参照してみてください。

FYI: https://leewarrick.com/blog/the-problem-with-context/

useMemo を使っても再レンダリングが起きるので厄介なことがわかります。
これに対する現実的な解決策は Context の分割です。
上の例だと Count, Count_2nd それぞれの状態を管理する Context を作ります。

#### Provider のリフトアップを考慮して位置を決めるべき

Context は参照の同一性を使用して再レンダーするかを決めるため、value を再生成すると再レンダリングを起こします。

たとえば、

```jsx
class App extends React.Component {
  render() {
    return (
      <MyContext.Provider value={{ something: "something" }}>
        <Toolbar />
      </MyContext.Provider>
    )
  }
}
```

という風に value にオブジェクトを渡していると、再レンダリングのときに必ず value 再生成されるのでそれに依存する consumer も再レンダリングします。
これを防ぐためには親の state に value をリフトアップする必要があります。

```jsx
class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      value: { something: "something" },
    }
  }

  render() {
    return (
      <Provider value={this.state.value}>
        <Toolbar />
      </Provider>
    )
  }
}
```

これに関しては公式ドキュメントでも注意事項としてあげられています。

FYI: https://ja.reactjs.org/docs/context.html#caveats

ただ、リフトアップをするなら たとえば createContext する位置は ReactDOM の関数の中に置くことはできず（なぜなら state を定義できないから）、どこに state を置くかを考慮して決める必要があります。

#### 関数を渡すと再レンダリングが起きる

context に詰めた値は当然変更もしたいわけですがそのハンドラはどう渡したら良いでしょうか。
ハンドラを value につめるとリフトアップしていないので先ほどの問題が発生します。
リフトアップを考慮したらこれも state に入れるべきですが、state に関数を詰め込むのは不自然な気もします。
これに対する解決策はハンドラだけ別の Provider に分割することで、よく見かけるノウハウです。

```jsx
import * as React from "react";
import * as ReactDOM from "react-dom";

import { App } from "./app";

type storeType = {
  count: number;
  count_2nd: number;
};

export const StateContext = React.createContext<storeType>({
  count: 0,
  count_2nd: 0,
});

export const StateHandleContext = React.createContext<
  React.Dispatch<React.SetStateAction<storeType>>
>(undefined as any);

const Root = () => {
  const [state, setState] = React.useState<storeType>({
    count: 0,
    count_2nd: 0,
  });
  return (
    <StateContext.Provider value={state}>
      <StateHandleContext.Provider value={setState}>
         <App></App>
      </StateHandleContext.Provider>
    </StateContext.Provider>
  );
};

ReactDOM.render(
  <Root></Root>,
  document.getElementById("root")
);
```

### Redux 使った方が楽なのでは

と、Redux 以外で状態管理をしようとするとこういった考慮をする必要があり、Redux 使った方が楽かなぁと僕は思っています。
もちろん再レンダリングを考慮しなくても良い要件であればここまでの考慮は不要とは思いますがプロダクトが育って機能が増えた時にパフォーマンスが問題になって直したいという時、その変更は大変だろうなと思うので僕は最初から Redux を使っています。

## サンプルコード

- routing で store を吹っ飛ばす例、関心外の変更で再レンダリングされる例
  - https://github.com/ojisan-toybox/store-context
- routing の外で状態管理すれば store が吹っ飛ばない例
  - https://github.com/ojisan-toybox/store-context-outer
- useSelector は関心のある値しか再レンダリングしない
  - https://github.com/ojisan-toybox/use-selector-interest
