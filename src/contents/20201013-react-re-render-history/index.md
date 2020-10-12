---
path: /react-re-render-history
created: "2020-10-13"
title: Reactのパフォーマンスチューニングの歴史をまとめてみた
visual: "./visual.png"
tags: [React]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

最近 React のパフォーマンスチューニング、特に再レンダリング抑制について調べたのでそのまとめです。
特に昔からおまじないとして書いていたことを、「なんであの書き方していたんだっけ」というのを調べてまとめました。
古いものを調べたのは、今あるチューニング方法とその当時の解決方法を比較したかったからです。

## 再レンダリングとはなにか

公式に説明があったのでそのまま引用します。（https://ja.reactjs.org/docs/optimizing-performance.html#avoid-reconciliation）

> React では、コンポーネントの props や state が変更された場合、React は新しく返された要素と以前にレンダーされたものとを比較することで、実際の DOM の更新が必要かを判断します。それらが等しくない場合、React は DOM を更新します。

この更新によるパフォーマンスの劣化が再レンダリングの問題としてよく扱われています。

ここで要素を更新するだけならばレンダリングのコストは重くないように思うかもしれませんが、実際は **あるコンポーネントが再レンダリングされると、その子コンポーネントもレンダリングされ**、また再レンダリングが短期間に多数連続して起きる可能性もあり、コストが小さいとは限りません。
さらに JavaScript はシングルスレッドで動作するのでここで重たい処理が挟まると UI の描画がもっさりしてきます。

そのため再レンダリング問題は積み重なりによって**だんだんパフォーマンスを機能不備レベルに蝕んでいく**こともあり、放置できない問題です。

## なにをするとパフォーマンスが向上するのか

そこでパフォーマンスチューニングをしていくのですが方針は 2 つです。

- 再レンダリングの回数を減らす
- 再レンダリング時の計算コストを減らす

この方針に基づいて僕たちはどのようにパフォーマンスチューニングをしてきたかを復習しました。

## Class Component に対するチューニング

まずは懐かしの Class Component、React ~v16.7 時代を思い出しましょう。

### 不要な再レンダリングをスキップする

Class Component は

```jsx
export Hoge extends React.Component{
  render(){
    // no op
  }
}
```

として、`Component` を `extends` したクラスの中で render を実装することで使えます。

この `Component` に　再レンダリングをスキップできる機能が備わっています。

#### PureComponent を使う

再レンダリングを抑制するとき、[PureComponent](https://ja.reactjs.org/docs/react-api.html#reactpurecomponent) は有力です。
これは 新旧の `props` と `state` を比較し、異なってるときにレンダリングするコンポーネントです。
つまり**コンポーネントの state と props に変更がなければレンダリングをし直さない**コンポーネントであり、これを使えば再レンダリングを防ぐことができます。
ちなみにこのときの比較は shallow な比較(= 参照の比較)です。
そのため React を書く時に口酸っぱく言われる「immutable に！state を直接書き換えるな、新しいオブジェクトで置き換えろ」はここにも効いてきます。

#### shouldComponentUpdate を利用する

`PureComponent` は有力ですが、全てをそれで置き換えても必ずしもパフォーマンスが上がるとは限りません。
なぜなら、再レンダリングのコストは下がるものの、新たに `props`/`state` の新旧比較のコストがかかるからです。

そこで [shouldComponentUpdate](https://ja.reactjs.org/docs/react-component.html#shouldcomponentupdate) を使ってこの新旧比較ロジックをオーバーライドして計算コストを節約します。

```jsx
export Hoge extends React.Component{
  shouldComponentUpdate(nextProps, nextState){
    // 再レンダリングさせたいときの条件でtrueを返す
  }
  render(){
    // no op
  }
}
```

この `shouldComponentUpdate` の中に好きな比較条件を入れることができます。
もし `state`/`props`の全体比較より簡単に済む比較方法があればそれを使うことで計算コストを節約できます。

#### PureComponent VS shouldComponentUpdate

`PureComponent` と `shouldComponentUpdate` はどちらを使えばいいのでしょうか。
`PureComponent` はいわば React 公式が実装した `shouldComponentUpdate` と言えます。

イメージ的には、

```tsx
class PureComponent extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
        return !(shallowEqual(this.props, nextProps) && shallowEqual(this.state, nextState));
    }
    …
}
```

です。

FYI: https://qiita.com/wifecooky/items/23fd1da041f707c1b78b#2-purecomponent%E3%81%A8%E3%81%AF

そのため shouldComponentUpdate の方が自由度は高いですが、公式は

> このメソッドはパフォーマンスの最適化としてのみ存在します。バグを引き起こす可能性があるので、レンダーを「抑止する」ためにそれを使用しないでください。shouldComponentUpdate() を書く代わりに、組み込みの PureComponent を使用することを検討してください。PureComponent は props と state を浅く比較し、必要なアップデートをスキップする可能性を減らします。

と言っており、危険度も高いです。
つまり比較関数のミスによって **再レンダリングしてほしいけどされない**といったバグも起きうるというわけです。

一方で 全部 `PureComponent` にしたらいいかというとそれも違って、組み込まれた`shouldComponentUpdate`が比較するオブジェクトが大きすぎるとそこがボトルネックになったりします。(`shouldComponentUpdate` を自分で実装しているとここは自分の好きな範囲だけで比較できるのでチューニングしやすい)。とはいえそもそも `shouldComponentUpdate` を自分で実装したとしてもそのコストが再レンダリングのコストより安いかどうかは計測しないとわからないので、どれを使うかはその時次第としか言えません。

ただ通説としては、

- `props`と `state`が常に変化していれば、`PureComponent`を使わず、`Component`を使うべし。（理由：shouldComponentUpdate 内の shallowEqual も時間かかる）
- `props` と `state`があまり変わらなければ、`PureComponent`を使うべし。
- `props`と `state`が変わらなければ、どちらでも OK.

と言われているので、そのように従うと良いでしょう。

FYI: https://qiita.com/wifecooky/items/23fd1da041f707c1b78b#2-purecomponent%E3%81%A8%E3%81%AF

### アロー関数を props に即時関数で渡さない

ハンドラ登録やバケツリレーで

```tsx
return <Hoge handleClick={() => this.handleClick()}></Hoge>
```

のようにインラインでアロー関数を渡せますが、アロー関数を `props` に渡すと再レンダリングの火種になります。

アロー関数を渡された側からすれば、親の `render` が呼ばれるたびに別オブジェクトして関数オブジェクトが伝わってくるからです。
またこれは `PureComponent` を使っていても、その再レンダリング判定の実装は shallow な比較であり、別オブジェクトになると参照が変わるので再レンダリング対象と判断されてしまいます。

#### this.bind を使う

これを防ぐ方法は

- インラインで関数を渡さない。クラスフィールドにハンドラを作る
- bind する

です。

つまり、

```tsx
export class _ClassComponent extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      count: 0,
    }
    this.handleClick = this.hoge.bind(this)
  }

  handleClick() {
    this.setState({ ...this.state, count: this.state.count + 1 })
  }

  render() {
    return (
      <div>
        now is {this.state.count}
        <button onClick={this.handleClick}>increment</button>
      </div>
    )
  }
}
```

といった風に、`handleClick` をアロー関数で渡さずクラスフィールドに用意して、それを `bind` しましょう。

React と `bind` については公式の FAQ にもまとめられています。

FYI: https://ja.reactjs.org/docs/faq-functions.html

#### class-fields を使う

また `bind` は class-field を使えば不要です。

```tsx
class Foo extends Component {
  handleClick = () => {}
  render() {
    return <button onClick={this.handleClick}>Click Me</button>
  }
}
```

とすることができます。

class-field は まだ experimental な機能なので、ビルド環境によっては Babel や tsc の追加設定は必要になるかもしれません。

FYI: https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Classes

#### それでもやっぱり render 内でアロー使いたい

実際このように `bind` を使うのはめんどくさいところがあります。
また環境によっては class-field も使えません。

一応のところ公式は、

> レンダー内でアロー関数を使用しても良いのか？ 一般的には問題ありません。コールバック関数にパラメータを渡すのに最も簡単な方法です。しかしパフォーマンス上の問題が出た際には、ぜひ最適化しましょう！

と言っているので、そこは気にせずに arrow を使っていいかもしれません。
僕もよく使っています。

ただ再レンダリングを抑える必要が出てきた時に、`PureComponent` を使ってもレンダリングが走っている場合はこれが犯人の可能性もあるので常に意識はしておきましょう。

## Stateless Functioal Component に対するチューニング

Stateless Functioal Component(SFC) を使えるところは SFC で置き換えることもパフォーマンスチューニングです。
なぜなら SFC はクラスコンポーネントと違ってライフサイクルがない分だけ早いからです。
ベンチマークからも早いことが分かります。

FYI: https://medium.com/missive-app/45-faster-react-functional-components-now-3509a668e69f

ただ、このベンチマークは SFC をただ単純なデータで描画するだけに使っている場合なので一概に SFC の方が優れているとは言えないかもしれません。
なぜなら **SFC 単体では shouldComponentUpdate が使えないため再レンダリングは抑制できない**ためです。
この SFC を親からもらった props を元に描画、それが大量にある場合にアプリケーション全体で計測したら話が変わってくるかもしれません。

そういうことを書くなら「いろんなパターンで計測してからブログ書け」と言われそうですが、今は根本から事情が変わってるので今日はやりません。
もしなにかベンチマークの結果など知っている人がいたら教えていただけたらと思います。

これは Hooks の登場でそもそも SFC(厳密には FC、理由は後述)のみを使うようになってきているので、もしかしたら今は考えなくていい問題かもしれません。

## Redux に対するチューニング

Class Component 時代は 外部 `store` としては Redux を使っていました。
そのときのチューニングテクニックを復習します。

### なぜ Redux のチューニングが必要なのか

Redux は中央集権的な状態管理をします。
その結果 `store` が膨れすぎていき、そこへの読み書きがボトルネックになったり、関心外の `store` の更新に巻き込まれた再レンダリングなどの問題が起き、Redux の使い方にもチューニングが必要になりました。

### mapStateToProps を作る

`store` は全アプリケーションの状態を持ちます。
これをそのままコンポーネントに `connect` して購読すると、そのコンポーネントで必要な情報以外の更新でもそのコンポーネントで再レンダリングが起きます。
これを解決するものが `mapStateToProps`です。
これは state のうち自分が欲しいものだけを切り出せるもので、`connect` の第一引数です。

```tsx:title=container.tsx
const mapStateToProps = (state: any) => ({
  cnt: state.cnt,
})

export const ClassComponent = connect(mapStateToProps, null)(_ClassComponent)
```

```tsx:title=reducer.ts
const initialState = {
  cnt: 0,
  dummy: 100,
}
```

このとき dummy の値を書き換えても `mapStateToProps` で読み込むフィールドを指定しているので再レンダリングは起きません。
ここで `state.cnt` ではなく `state`をそのまま返していると再レンダリングは起きます。

### selector のメモ化

さて、この `mapStateToProps` は単に監視対象を切り出すだけならいいのですが、なんらかの計算をするとなるとボトルネックになるかもしれません。
たとえば、isDone が true な todos だけを visibleTodos として切り出すような場合です。
なぜなら **state の変更に応じて毎回 mapStateToProps が呼び出され、この計算が何度も走るから**です。
そこでメモ化をしてこの計算コストを節約します。
それを可能にするものが [reselect](https://github.com/reduxjs/reselect) です。

公式の例にならうと、

`createSelector`でメモ化するセレクタを作り、

```ts
import { createSelector } from "reselect"

const getVisibilityFilter = state => state.visibilityFilter
const getTodos = state => state.todos

export const getVisibleTodos = createSelector(
  [getVisibilityFilter, getTodos],
  (visibilityFilter, todos) => {
    switch (visibilityFilter) {
      case "SHOW_ALL":
        return todos
      case "SHOW_COMPLETED":
        return todos.filter(t => t.completed)
      case "SHOW_ACTIVE":
        return todos.filter(t => !t.completed)
    }
  }
)
```

`mapStateToProps` の中で呼び出します。

```tsx
import { connect } from "react-redux"
import { toggleTodo } from "../actions"
import TodoList from "../components/TodoList"
import { getVisibleTodos } from "../selectors"

const mapStateToProps = state => {
  return {
    todos: getVisibleTodos(state),
  }
}

const mapDispatchToProps = dispatch => {
  return {
    onTodoClick: id => {
      dispatch(toggleTodo(id))
    },
  }
}

const VisibleTodoList = connect(mapStateToProps, mapDispatchToProps)(TodoList)

export default VisibleTodoList
```

これだけで使えるので、`mapStateToProps` で何か計算をしている場合は入れると良いでしょう。

### アクションの発行をしすぎない

たとえば `redux` に form の要素を紐づけるのはやめましょう。
`action` の発行のたびに `store` が書き換わるので、短時間に大量の `action` を発行するとその分再レンダリングが大量に発生します。
よくあるのは `onChange` などを `store` に紐づけて ユーザー入力を流し込むとパフォーマンスが劣化するというものです。
こういうのは ephemeral state に紐付けましょう。
その問題を指摘した Formik やその根拠になった作者のコメントにも書かれています。

> Use React for ephemeral state that doesn't matter to the app globally and doesn't mutate in complex ways. For example, a toggle in some UI element, a form input state. Use Redux for state that matters globally or is mutated in complex ways. For example, cached users, or a post draft.

FYI: https://github.com/reduxjs/redux/issues/1287

また `redux` の `action` は `setState` や `useState` と違ってデフォルトではバッチ処理されないため 何も考えていないと大量の action を発行していたみたいなこともあるので注意しましょう。

(バッチ処理についてはこちらを参照: https://ja.reactjs.org/docs/faq-state.html#when-is-setstate-asynchronous)

### 比較関数のチューニング

connect の options には `areStatesEqual`, `areOwnPropsEqual`, `areStatePropsEqual`, `areMergedPropsEqual` があります。

FYI: https://react-redux.js.org/api/connect#options-object

これは redux の store の更新判定に使われる関数で、いわば `shouldComponentUpdate` に近いものとも言えます。

ただ公式では、

> While the defaults are probably appropriate 99% of the time, you may wish to override them with custom implementations for performance or other reasons.

とあり、99%が使わなくても正しく動くとされているので、オーバーライドする必要はあまりないと思っています。
末端コンポーネントに直接 `connect` してそれを再レンダリング抑制したい場合などは使いたいかもしれません。
(自分は Container Component からデータ流し込むのでこのやり方はしたことがないです。)

ちなみにこれらの扱いを間違える（例えば boolean を返さない）などをすると、`mapStateToProps` で切り出したコンポーネントも切り出し外の `props` 変更によって再レンダリングが走るなんてこともあるので扱いには注意しましょう。

## Function Component に対するチューニング

やっときました、Hooks の話です。
多分これはほぼほぼ現役な情報でいろんな人がまとめているのでそれをみた方が良いと思うので、さらっとだけ書いていきます。

またここからは、いわゆるライフサイクルや state を持てる SFC(`useState`, `useEffect`を呼べるという意味) をこれまでの Stateless Functional Component と対比するため、 Function Component と呼びます。

（呼び方混同するから Function Component と呼ぼうみたいな内容のツイートかブログがあった気がします。）

### React.memo

[memo](https://ja.reactjs.org/docs/react-api.html#reactmemo)はいわば関数コンポーネントでも使える `shouldComponentUpdate` です。
`memo` のおかげで `PureComponent` か `shouldComponentUpdate` か `Function Component` かと考える必要はほぼ無くなりました。

`memo` は

```jsx
const Button = React.memo(props => {
  return <div>{props.value}</div>
})
```

のようにして書けます。
`PureComponent` と同じく、新旧 `props` で浅い比較が行われます。
また第二引数に比較関数をとることができ、`shouldComponentUpdate` 同等のこともできます。

```jsx
const Button = React.memo(
  props => {
    return <div>{props.value}</div>
  },
  (nextProps, prevProps) => {
    return nextProps.value === prevProps.value
  }
)
```

#### memo と shouldComponentUpdate を比較した注意点

まず `memo` の比較関数 には `state` が現れません。渡されるのは新旧の `props` です。
そのため `this.props` や `this.state` を使った比較は必要ありません。

また、`shouldComponentUpdate` は再レンダリングさせたい時に true を返していましたが、`memo` では メモ化したものをそのまま返す時に true を返します。
つまり `memo` で再レンダリングさせたい場合は false を返します。
ここは逆になっているので注意しましょう。

### useMemo

[useMemo](https://ja.reactjs.org/docs/hooks-reference.html#usememo) は変数のメモ化をする hooks です。
その変数を作るコストが高い時に有効です。
つまり`useMemo`は **再レンダリングのコストを節約する**のに役立ちます。

```ts
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b])
```

とすればよく、作成用の関数とそれが依存する値の配列を渡すと作れます。

### useCallback

[useCallback](https://ja.reactjs.org/docs/hooks-reference.html#usecallback)はメモ化したコールバック関数です。

```tsx
const memoizedCallback = useCallback(() => {
  doSomething(a, b)
}, [a, b])
```

useCallback を利用しない場合、コールバック関数は Function Component の再レンダリングの度に新しい関数インスタンスを生成します。
そのため生成コストがかかったり、渡された子の再レンダリング発火にもつながります。
これは `this.bind` で同等の問題を回避できる Class Component に対して `FC` を使うデメリットにもなります。

そのため `useMemo` に似たこの `useCallback` は Class Component で行っていた `this.bind` への回避策だと覚えておきましょう。

FYI: https://qiita.com/seya/items/8291f53576097fc1c52a#usecallbackusememo-%E8%87%AA%E4%BD%93%E3%81%AE%E5%87%A6%E7%90%86%E3%82%B3%E3%82%B9%E3%83%88%E3%82%92%E8%80%83%E3%81%88%E3%82%8B

## おわりに

久しぶりに Class Component 周りを調べて懐かしい気持ちになりました。
個人的にはひたすら意味を理解せずにコピペで乗り切っていた時代の構文なので、いろいろ謎が解けて楽しかったです。

パフォーマンスチューニングはあまり得意な分野ではないので誤りがあれば指摘していただいたり、また他にも覚えておいた方がいいテクニックがあれば教えてくれると嬉しいです！
