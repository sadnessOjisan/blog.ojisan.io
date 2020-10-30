---
path: /preact-reading
created: "2020-11-03"
title: preact コードリーディング
visual: "./visual.png"
tags: [preact]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

preact 完全に理解した記念ブログです。jsx/compat は含んでいません。

去年のクリスマスイブの飲み会に友人に preact のコードリーディングを勧められた（クリスマスに何しとるねん）のがきっかけで読んでいました。どうも、コードベースが小さく、型の情報が合ったり、コメントが充実していたりして、仮想 DOM 系のライブラリがどう実装されているかを知るにはちょうど良いとのことでした。実際 React 本体は読もうとしてもなかなか進まなかったりしたという経験があったりもして、まずは preact から挑戦してみることにしました。

## preact とは

React の軽量版です。
読むと分かったのですが、本家といろいろレンダリングプロセスが違ったりしました。

で、(p)react は、

- 状態を持て、書き換えも可能である
- 状態を書き換えるとそれに対応して HTML が書き換わる

という特徴があると思います。
それがどのようにして実現されているか見ていきましょう。

## 前提となる知識

### 仮想 DOM とは何か

いままでブラウザが持っていたリアル DOM ツリーを、JavaScript のオブジェクトとして表現したものです。

たとえば、

```html
<div>
  <p>hello world</p>
</div>
```

を

```js
{
  type: 'div',
  childrens: [{
    type: "p",
    childrens: [
      {type: null, childrens: ["hello world"]}
    ]
  }]
}
```

のように表現したものです。

このように表現すると、部分的に変更をピンポイントに適用しやすくなり、本物の DOM を操作するときの計算コスト（HTML の解析、DOM ツリーの再構築など）を節約することができます。

仮想 DOM については、だーしのさんの [自作フレームワークをつくって学ぶ 仮想 DOM 実践入門](https://kuroeveryday.blogspot.com/2018/11/how-to-create-virtual-dom-framework.html) にとてもわかりやすくチュートリアル形式でまとまっていますのでこちらを見ると良いでしょう。

### jsx と h 関数

preact もいわゆる仮想 DOM 系のライブラリです。
そのデータ構造は VNode と呼ばれるオブジェクトに従いますが、これを作る関数が h 関数 です。

```js
import { h, Component, render } from "https://unpkg.com/preact?module"

const app = h("h1", null, "Hello World!")

render(app, document.body)
```

そしてこれだと見辛いということで使われるのが お馴染みの jsx です。
先ほどのコードは、

```jsx
import { h, Component, render } from "https://unpkg.com/preact?module"

const app = <h1>Hello World!</h1>

render(app, document.body)
```

としても書けます。

h 関数はの引数は `h(type, props, ...children)` となっており、props を持たせることもできます。
そのため例えば、

```js
h("div", { id: "foo" }, "Hello!")
```

は、

```jsx
<div id="foo">Hello!</div>
```

と同じです。

この挙動は JSX のネストがあっても、イベントハンドラを設定しても同様に動作します。
諸々の実験は[こちら](https://github.com/ojisan-toybox/preact-h-babel)でできるようにしましたので、jsx と h 関数の関係がよくわからない方は試してみてください。

preact の内部では jsx は h 関数に変換されて VNode 形式でデータをやりとりされるので、コードリーディングする上では直接見ることはありません。
しかし props や children の描画や探索をライブラリが行うので、元々はどういう形式のコードだったかを考える必要があるので、VNode, h, jsx の関係は意識しながら読んだ方が読みやすいでしょう。

## preact の全体感

### ビルド

microbundle というツールで行われています。
これは rollup のラッパーで作者が preact のビルド設定をデフォルトに設定したものです。
package.json のフィールドをみてビルドをしてくれるため、zero config でビルドできます。

### 言語

JavaScript で実装されています。
TypeScript ではありません。
ただし JSDoc に型情報があり、型を出力しています。
ちなみに TypeScript で実装しようとするとエラーがたくさん出るので、本当に型を入れるのは難しいです。

### データ構造

要素は VNode という形式で回されます。
これは preact 内部での要素表現です。
これを引数にとったり出力したりなどします。

VNode の定義はこうです。

```ts
// preact というname space で定義されている VNode
interface VNode<P = {}> {
  type: ComponentType<P> | string
  props: P & { children: ComponentChildren }
  key: Key
  ref?: Ref<any> | null
  startTime?: number
  endTime?: number
}

export interface VNode<P = {}> extends preact.VNode<P> {
  type: string | ComponentFactory<P>
  props: P & { children: preact.ComponentChildren }
  _children: Array<VNode<any>> | null
  _parent: VNode | null
  _depth: number | null
  _dom: PreactElement | null
  _nextDom: PreactElement | null
  _component: Component | null
  _hydrating: boolean | null
  constructor: undefined
  _original?: VNode | null
}
```

### preact の仕組み

DOM を VNode で表現し、なにかしらの状態変化が起きた時に新旧の VNode に差分があった箇所を検知してその箇所の DOM を書き換えます。
新旧 VNode の比較は diff 関数で行われます。
この diff 関数は VNode の子要素の差分を調べる関数 diffChildren を呼び出しており、この diffChildren も diff を呼び出すことで、DOM ツリーに対して再帰的に diff を取っていき、差分があった場所の DOM を書き換えます。

### 呼出し関係

関数単位で考えるとこのような呼び出し関係になります。

![呼び出し関係](call.png)

やっかいなのは diff を再帰的に呼ぶ関数が 2 つあり、その使い分けです。

### フォルダ構成

src 配下を解説します。
基本的には、render, component, diff, children, create-element, props が主軸となります。

![src配下の主要なフォルダ一覧](./src.png)

index.js から h と render が export されています。
これらは利用者にとっての起点になる関数で、render は内部で diff を呼び出しています。
diff を呼ぶことで初回時のレンダリング、状態変化時の再レンダリングの登録を行っています。

## コードリーディング

render から読み進めていきましょう。
目標は、

```jsx
import { h, render, Component } from "preact"

class App extends Component {
  state = {
    age: 19,
  }

  componentDidMount() {
    this.setState({ age: 12 })
  }

  render() {
    return h("h1", null, `${this.state.age}才`)
  }
}

render(h(App, null, null), document.body)
```

がどうして動作するかを理解することです。

### render

render の実装はこうなっています。

```js
import { EMPTY_OBJ, EMPTY_ARR } from "./constants"
import { commitRoot, diff } from "./diff/index"
import { createElement, Fragment } from "./create-element"
import options from "./options"

const IS_HYDRATE = EMPTY_OBJ

export function render(vnode, parentDom, replaceNode) {
  if (options._root) options._root(vnode, parentDom)
  let isHydrating = replaceNode === IS_HYDRATE
  let oldVNode = isHydrating
    ? null
    : (replaceNode && replaceNode._children) || parentDom._children
  vnode = createElement(Fragment, null, [vnode])
  let commitQueue = []
  diff(
    parentDom,
    ((isHydrating ? parentDom : replaceNode || parentDom)._children = vnode),
    oldVNode || EMPTY_OBJ,
    EMPTY_OBJ,
    parentDom.ownerSVGElement !== undefined,
    replaceNode && !isHydrating
      ? [replaceNode]
      : oldVNode
      ? null
      : parentDom.childNodes.length
      ? EMPTY_ARR.slice.call(parentDom.childNodes)
      : null,
    commitQueue,
    replaceNode || EMPTY_OBJ,
    isHydrating
  )

  commitRoot(commitQueue, vnode)
}

export function hydrate(vnode, parentDom) {
  render(vnode, parentDom, IS_HYDRATE)
}
```

簡略下のため hydrate 周りは省いて説明します。

まず、render は

```js
render(<App />, document.getElement("body"))
```

などのようにして呼ばれます。

render ではこの `<App />` が `createElement` を通して VNode という形式に変換されます。

そして `diff` で、parentDOM に対して VNode から DOM のツリーを作ります。
この diff 自体は ツリーを作るための関数ではないのですが、差分更新を行った結果ツリーができあがるので初回の render 呼び出しで呼ばれます。

そして最後に `commitRoot` にて、HTML ができたあとに各コンポーネントが持っていた componentDidMount などの関数を実行します。
それらの処理は diff を取る時に commitQueue に詰め込まれているので、それを commitRoot に渡します。

### diff

diff 関数は次のようになっています。
この関数が根幹の起点になるためかなり長いです。

全体像は[こちら]()ですが、長すぎて追いにくいので大事なところ以外削って、分岐の条件などをみやすくします。
これから読んでいくコードはこのような関数です。

```js
export function diff(
  parentDom,
  newVNode,
  oldVNode,
  globalContext,
  isSvg,
  excessDomChildren,
  commitQueue,
  oldDom,
  isHydrating
) {
  newType = newVNode.type

  try {
    // labelとうい機能.
    outer: if (typeof newType == "function") {
      // 渡されたVNodeのtypeがコンポーネントの場合
      let c, isNew, oldProps, oldState, snapshot, clearProcessingException
      let newProps = newVNode.props

      if (oldVNode._component) {
        c = newVNode._component = oldVNode._component
        clearProcessingException = c._processingException = c._pendingError
      } else {
        // 渡されたVNodeのtypeがfunctionであればComponentFactoryなので分岐
        // ClassComponent じゃなくて FC の可能性もあるのでその分岐
        if ("prototype" in newType && newType.prototype.render) {
          newVNode._component = c = new newType(newProps, componentContext)
        } else {
          newVNode._component = c = new Component(newProps, componentContext)
          c.constructor = newType
          c.render = doRender
        }

        // 作ったコンポーネントに値を詰め込む
        c.props = newProps
        if (!c.state) c.state = {}
        isNew = c._dirty = true
        c._renderCallbacks = []
      } // この 処理により必ず _nextState はなんらかの値を持つ。c.stateの初期値は {}

      if (c._nextState == null) {
        c._nextState = c.state
      }

      oldProps = c.props
      oldState = c.state

      if (isNew) {
        // 新しく渡ってきたコンポーネントの場合(VNodeがfunctionでないとき)
        if (
          newType.getDerivedStateFromProps == null &&
          c.componentWillMount != null
        ) {
          c.componentWillMount()
        }

        if (c.componentDidMount != null) {
          c._renderCallbacks.push(c.componentDidMount)
        }
      } else {
        // コンポーネントを新しく作らなかった場合(VNodeがfunctionのとき)
        if (
          newType.getDerivedStateFromProps == null &&
          newProps !== oldProps &&
          c.componentWillReceiveProps != null
        ) {
          c.componentWillReceiveProps(newProps, componentContext)
        }

        // 再レンダリング抑制
        if (
          (!c._force &&
            c.shouldComponentUpdate != null &&
            c.shouldComponentUpdate(
              newProps,
              c._nextState,
              componentContext
            ) === false) ||
          newVNode._original === oldVNode._original
        ) {
          if (c._renderCallbacks.length) {
            commitQueue.push(c)
          }

          reorderChildren(newVNode, oldDom, parentDom)
          break outer
        }

        if (c.componentWillUpdate != null) {
          c.componentWillUpdate(newProps, c._nextState, componentContext)
        }

        if (c.componentDidUpdate != null) {
          c._renderCallbacks.push(() => {
            c.componentDidUpdate(oldProps, oldState, snapshot)
          })
        }
      }

      let renderResult = isTopLevelFragment ? tmp.props.children : tmp

      // 子コンポーネントの差分を取る
      diffChildren(
        parentDom,
        Array.isArray(renderResult) ? renderResult : [renderResult],
        newVNode,
        oldVNode,
        globalContext,
        isSvg,
        excessDomChildren,
        commitQueue,
        oldDom,
        isHydrating
      )
    } else if (
      excessDomChildren == null &&
      newVNode._original === oldVNode._original
    ) {
      // typeがfunctionでない && 過剰なchildren(excessDomChildren) がない場合
      newVNode._children = oldVNode._children
      newVNode._dom = oldVNode._dom
    } else {
      // typeがfunctionでない && 過剰なchildren(excessDomChildren) がある場合
      newVNode._dom = diffElementNodes(
        oldVNode._dom,
        newVNode,
        oldVNode,
        globalContext,
        isSvg,
        excessDomChildren,
        commitQueue,
        isHydrating
      )
    }
  } catch (e) {
    // 元に戻す
    newVNode._original = null
    if (isHydrating || excessDomChildren != null) {
      newVNode._dom = oldDom
      newVNode._hydrating = !!isHydrating
      excessDomChildren[excessDomChildren.indexOf(oldDom)] = null
    }
    options._catchError(e, newVNode, oldVNode)
  }

  return newVNode._dom
}
```

では、これらを 1 つ 1 つ見ていきましょう。

#### newType

まず最初に `newType = newVNode.type;` が定義されます。
これは この `newType` は `string | ComponentFactory<P>;` を取りうります。
ComponentFactory は JavaScript の世界では function ですが、これは ClassComponent, FunctionComponent であることを示します。

実は diff は render 以外からも呼ばれ、Component は入れ子になるので、評価タイミングによってはコンポーネントが渡ってきます。
そのときに分岐をするためにこの識別子が必要となります。

#### label

分岐の説明に入る前に

```js
outer: if (typeof newType == 'function') {
```

についてみましょう。
JS でこんな JSON みたいなことを生でかけましたっけ？
これは label という機能で、break したときにここに戻すみたいなことができます。
goto みたいものなのであまり使われてはいません。

#### diff を取る対象がコンポーネントの場合

比較対象にコンポーネントを作ります。
もしすでにあるのならばそれを使いまわし、なければ新しく作ります。

```js
if (oldVNode._component) {
  c = newVNode._component = oldVNode._component
  clearProcessingException = c._processingException = c._pendingError
} else {
  // 渡されたVNodeのtypeがfunctionであればComponentFactoryなので分岐
  // ClassComponent じゃなくて FC の可能性もあるのでその分岐
  if ("prototype" in newType && newType.prototype.render) {
    newVNode._component = c = new newType(newProps, componentContext)
  } else {
    newVNode._component = c = new Component(newProps, componentContext)
    c.constructor = newType
    c.render = doRender
  }

  // 作ったコンポーネントに値を詰め込む
  c.props = newProps
  if (!c.state) c.state = {}
  c.context = componentContext
  c._globalContext = globalContext
  isNew = c._dirty = true
  c._renderCallbacks = []
} // この 処理により必ず _nextState はなんらかの値を持つ。c.stateの初期値は {}

if (c._nextState == null) {
  c._nextState = c.state
}
```

新しく作る場合、その新しい VNode の type がコンポーネントかどうかに着目します。
もしそれがコンポーネントならばその constructor を呼び出して使いまわし、そうでなければ Component のインスタンスを作ります。

```js
if ("prototype" in newType && newType.prototype.render) {
  newVNode._component = c = new newType(newProps, componentContext)
} else {
  newVNode._component = c = new Component(newProps, componentContext)
  c.constructor = newType
  c.render = doRender
}
```

もし 新しく Component インスタンスを作った場合は必要な値を初期化します。

```js
// 作ったコンポーネントに値を詰め込む
c.props = newProps
if (!c.state) c.state = {}
isNew = c._dirty = true
c._renderCallbacks = []
```

そして、コンポーネントを使いまわした場合、新しく作った場合の共通の初期化を行います。

```js
// この 処理により必ず _nextState はなんらかの値を持つ。c.stateの初期値は {}
if (c._nextState == null) {
  c._nextState = c.state
}

oldProps = c.props
oldState = c.state
```

次にライフサイクルの実行を行います。

```js
if (isNew) {
  // 新しく渡ってきたコンポーネントの場合(VNodeがfunctionでないとき)
  if (
    newType.getDerivedStateFromProps == null &&
    c.componentWillMount != null
  ) {
    c.componentWillMount()
  }

  if (c.componentDidMount != null) {
    c._renderCallbacks.push(c.componentDidMount)
  }
} else {
  // コンポーネントを新しく作らなかった場合(VNodeがfunctionのとき)
  if (
    newType.getDerivedStateFromProps == null &&
    newProps !== oldProps &&
    c.componentWillReceiveProps != null
  ) {
    c.componentWillReceiveProps(newProps, componentContext)
  }

  // 再レンダリング抑制
  if (
    (!c._force &&
      c.shouldComponentUpdate != null &&
      c.shouldComponentUpdate(newProps, c._nextState, componentContext) ===
        false) ||
    newVNode._original === oldVNode._original
  ) {
    if (c._renderCallbacks.length) {
      commitQueue.push(c)
    }

    reorderChildren(newVNode, oldDom, parentDom)
    break outer
  }

  if (c.componentWillUpdate != null) {
    c.componentWillUpdate(newProps, c._nextState, componentContext)
  }

  if (c.componentDidUpdate != null) {
    c._renderCallbacks.push(() => {
      c.componentDidUpdate(oldProps, oldState, snapshot)
    })
  }
}
```

isNew つまりコンポーネントが新規作成ならば、`componentWillMount` と `componentDidMount` を実行します。

ここで面白いのは componentDidMount です。即時実行せずに renderQueue に詰め込んでいます。
これはマウントされた後に実行したいからです。
くわしくは commitRoot の説明でみていきましょう。

このコードブロックで面白いのは、`shouldComponentUpdate` です。
パフォチューの文脈で

- 再レンダリングするとその子もされる
- 再レンダリング抑制すればその子のレンダリングを止められる

という話を聞いたことはないでしょうか。

その挙動をまさしく再現しているのが次のコードです。

```js
// 再レンダリング抑制
if (
  (!c._force &&
    c.shouldComponentUpdate != null &&
    c.shouldComponentUpdate(newProps, c._nextState, componentContext) ===
      false) ||
  newVNode._original === oldVNode._original
) {
  if (c._renderCallbacks.length) {
    commitQueue.push(c)
  }

  reorderChildren(newVNode, oldDom, parentDom)
  break outer
}
```

`shouldComponentUpdate` があればこの時点で break しています。
このブロックの先には diffChildren があるのですが、それを実行しなくて済んでいるわけです。
つまり子の再レンダリングが抑制できています。

そして本命の

```js
diffChildren(
  parentDom,
  Array.isArray(renderResult) ? renderResult : [renderResult],
  newVNode,
  oldVNode,
  globalContext,
  isSvg,
  excessDomChildren,
  commitQueue,
  oldDom,
  isHydrating
)
```

です。

これは コンポーネントの children に対して diff を取る処理です。
diff を取る対象がコンポーネント(type=='function'の分岐の場合)の場合、実は diff という関数で diff をとっているのは `diffChildren` を呼び出すことです。

diffChildren は内部で diff を呼び（つまり関数を跨いだ再帰をしている）次第に diff を取る対象が primitivie な場合である分岐に入っていきます。

詳しくは diffChildren の説明で解説します。

この diffChildren が実行されると、あとは if の分岐から出て、`return newVNode._dom;` が実行されます。つまり差分をとった後の DOM が返されるわけです。
この newVNode.\_dom が差分をとった DOM になるのは、diff を取る中で引数を破壊的変更していくからなのですが、それについても後から見ていきます。

#### diff を取る対象が primitive の場合

diff を取る対象が primitive の場合のコードブロックは次の通りです。

```js
else if (
			excessDomChildren == null &&
			newVNode._original === oldVNode._original
		) {
      // typeがfunctionでない && 過剰なchildren(excessDomChildren) がない場合
			newVNode._children = oldVNode._children;
			newVNode._dom = oldVNode._dom;
		} else {
      // typeがfunctionでない && 過剰なchildren(excessDomChildren) がある場合
			newVNode._dom = diffElementNodes(
				oldVNode._dom,
				newVNode,
				oldVNode,
				globalContext,
				isSvg,
				excessDomChildren,
				commitQueue,
				isHydrating
			);
		}
```

まず前半の

```js
else if (
			excessDomChildren == null &&
			newVNode._original === oldVNode._original
		)
```

は、過剰な children がない、\_original に差分がないということですが、このとき何も変更が生じていないとみなせるので　 diff を取る必要がないことが事前に分かります。

ちなみにこの \_original は render から diff を読んだときはセットされていないのですが、いつセットされるものなのかは コンポーネントの説明で解説します。

もしこの分岐に入らなかった場合、つまり **type が function でない and（\_original に差分がある or 余剰な children がある）**場合、VNode に対して diffElementNodes が実行されます。

```js
newVNode._dom = diffElementNodes(
  oldVNode._dom,
  newVNode,
  oldVNode,
  globalContext,
  isSvg,
  excessDomChildren,
  commitQueue,
  isHydrating
)
```

これは vnode の差分を比較し、その差分を反映した dom を返す関数です。
これもあとで詳しく見ていきましょう。

#### diff が呼び出す関数を読む

お疲れ様です。
ここまでで diff は読めました。
しかし diff 関数自体は diff をとっているわけではなく、その本命が別にいることがわかりました。

これからそれらを読んでいきましょう。

diffChildren と diffElementNodes です。

先にいうと、 diffChildren は内部で diff を呼び出し続け、その結果いつかは diffElementNodes が呼ばれる分岐に入ります。
そこで先に diffElementNodes から見ていきましょう。

### diffElementNodes

diffElementNodes は 要素の props を比較して、更新があればそれを DOM に反映する処理の起点となるものです。
diffElementNodes の定義はこうなっています。

```js
function diffElementNodes(
  dom,
  newVNode,
  oldVNode,
  globalContext,
  isSvg,
  excessDomChildren,
  commitQueue,
  isHydrating
) {
  let i

  // 比較対象の抽出
  let oldProps = oldVNode.props
  let newProps = newVNode.props

  // svg かどうかで変わる処理があるのでフラグとして持つ
  isSvg = newVNode.type === "svg" || isSvg

  if (excessDomChildren != null) {
    for (i = 0; i < excessDomChildren.length; i++) {
      const child = excessDomChildren[i]
      if (
        child != null &&
        ((newVNode.type === null
          ? child.nodeType === 3
          : child.localName === newVNode.type) ||
          dom == child)
      ) {
        dom = child
        excessDomChildren[i] = null
        break
      }
    }
  }

  // dom がないときは作る
  if (dom == null) {
    if (newVNode.type === null) {
      return document.createTextNode(newProps)
    }

    dom = isSvg
      ? document.createElementNS("http://www.w3.org/2000/svg", newVNode.type)
      : document.createElement(
          newVNode.type,
          newProps.is && { is: newProps.is }
        )
    excessDomChildren = null
    isHydrating = false
  }

  if (newVNode.type === null) {
    if (oldProps !== newProps && (!isHydrating || dom.data !== newProps)) {
      dom.data = newProps
    }
  } else {
    // 更新するVNode typeがなんらかの要素である場合
    if (excessDomChildren != null) {
      excessDomChildren = EMPTY_ARR.slice.call(dom.childNodes)
    }

    oldProps = oldVNode.props || EMPTY_OBJ

    // props の diff を取って DOM に反映する関数. この関数は 実DOM を直接操作する
    diffProps(dom, newProps, oldProps, isSvg, isHydrating)

    i = newVNode.props.children

    // 新propsにchildrenがあるのならばchildrenに対しても差分を取る
    // newVNode.typeが存在する分岐の中にいるので、何かしらのchildren(=i)は持っている
    diffChildren(
      dom,
      Array.isArray(i) ? i : [i],
      newVNode,
      oldVNode,
      globalContext,
      newVNode.type === "foreignObject" ? false : isSvg,
      excessDomChildren,
      commitQueue,
      EMPTY_OBJ,
      isHydrating
    )

    // form周りの扱い. input 要素が value や checked を持っている場合の扱い
    if (
      "value" in newProps &&
      (i = newProps.value) !== undefined &&
      (i !== dom.value || (newVNode.type === "progress" && !i))
    ) {
      setProperty(dom, "value", i, oldProps.value, false)
    }
    if (
      "checked" in newProps &&
      (i = newProps.checked) !== undefined &&
      i !== dom.checked
    ) {
      setProperty(dom, "checked", i, oldProps.checked, false)
    }
  }

  return dom
}
```

それでは一つずつ見ていきましょう。

#### フラグや変数のセット

```js
let i

// 比較対象の抽出
let oldProps = oldVNode.props
let newProps = newVNode.props

// svg かどうかで変わる処理があるのでフラグとして持つ
isSvg = newVNode.type === "svg" || isSvg
```

#### DOM の再利用

仮想ノードタイプが null で、既存のノードタイプがテキストであるか、仮想ノードタイプが既存のノードタイプと同じである場合
または、dom と既存のノードが同じである場合は、再利用します

```js
if (excessDomChildren != null) {
  for (i = 0; i < excessDomChildren.length; i++) {
    const child = excessDomChildren[i]
    if (
      child != null &&
      ((newVNode.type === null
        ? child.nodeType === 3
        : child.localName === newVNode.type) ||
        dom == child)
    ) {
      dom = child
      excessDomChildren[i] = null
      break
    }
  }
}
```

主に hydrate 用の機能です。

詳しくはこの中国語のドキュメントを日本語翻訳しながら読み解いてみてください

- https://juejin.im/post/6883003425890500615
- https://zhuanlan.zhihu.com/p/100076938

#### 初回レンダリング

DOM がない場合は作ります。
これは主に初回レンダリングのときの分岐です。

```js
if (dom == null) {
  if (newVNode.type === null) {
    return document.createTextNode(newProps)
  }

  dom = isSvg
    ? document.createElementNS("http://www.w3.org/2000/svg", newVNode.type)
    : document.createElement(newVNode.type, newProps.is && { is: newProps.is })
  excessDomChildren = null
  isHydrating = false
}
```

#### 要素のレンダリング

そして、

```js
if (newVNode.type === null) {
  if (oldProps !== newProps && (!isHydrating || dom.data !== newProps)) {
    dom.data = newProps
  }
} else {
  ...
}
```

と続きます。

これは VNode がなんらかの要素を持っていればレンダリングする分岐です。
こ k での newVNode.type は "div" や "h1" などを想定しており、else 節を詳しくみていきましょう。

#### 差分の比較と DOM への反映

```js
oldProps = oldVNode.props || EMPTY_OBJ

// props の diff を取って DOM に反映する関数. この関数は 実DOM を直接操作する
diffProps(dom, newProps, oldProps, isSvg, isHydrating)

i = newVNode.props.children

// 新propsにchildrenがあるのならばchildrenに対しても差分を取る
// newVNode.typeが存在する分岐の中にいるので、何かしらのchildren(=i)は持っている
diffChildren(
  dom,
  Array.isArray(i) ? i : [i],
  newVNode,
  oldVNode,
  globalContext,
  newVNode.type === "foreignObject" ? false : isSvg,
  excessDomChildren,
  commitQueue,
  EMPTY_OBJ,
  isHydrating
)

// form周りの扱い. input 要素が value や checked を持っている場合の扱い
if (
  "value" in newProps &&
  (i = newProps.value) !== undefined &&
  (i !== dom.value || (newVNode.type === "progress" && !i))
) {
  setProperty(dom, "value", i, oldProps.value, false)
}
if (
  "checked" in newProps &&
  (i = newProps.checked) !== undefined &&
  i !== dom.checked
) {
  setProperty(dom, "checked", i, oldProps.checked, false)
}
  }
return dom
```

diffProps で、props の 差分を比較します。
この関数は 後述する setProperty をを呼び出すことで実 DOM を直接操作を内部で行っており、差分があった箇所の DOM を実際に変更する役割をになっています。

そして続く diffChildren で、props に children があればそれを比較します。
ちなみに children は createElement 経由で VNode が作られた場合 props に埋め込まれます。

```js
if (children != null) {
  normalizedProps.children = children
}
```

`i = newVNode.props.children`　はその children を取り出しています。

そして DOM の種類によっては（主にフォーム要素を想定）、この関数の中で直接 setProperty を呼び出して DOM 要素への props 適用を行います。

このようにして編集した DOM を最終的に return します。
diffProps などは その呼び出し先の関数の中で修正済み DOM をオブジェクトを破壊的変更することで上書いてくれているので、それらの関数の呼び出し後に DOM を返すだけで、新しい構築済み DOM を返すことができます。

### 差分の比較と要素の反映をする関数たち

diffElementNodes が呼び出していた 差分の比較と要素の反映をする関数たちを見ていきましょう。
これらは diffElementNodes 以外からも呼ばれる関数なので覚えておきましょう。

#### diffProps

diffProps は 新旧の props を比較して、差分があればその差分を 後述する setProperty を使って上書く関数です。

```js
export function diffProps(dom, newProps, oldProps, isSvg, hydrate) {
  let i

  for (i in oldProps) {
    if (i !== "children" && i !== "key" && !(i in newProps)) {
      setProperty(dom, i, null, oldProps[i], isSvg)
    }
  }

  for (i in newProps) {
    if (
      (!hydrate || typeof newProps[i] == "function") &&
      i !== "children" &&
      i !== "key" &&
      i !== "value" &&
      i !== "checked" &&
      oldProps[i] !== newProps[i]
    ) {
      setProperty(dom, i, newProps[i], oldProps[i], isSvg)
    }
  }
}
```

たとえば key や value といった props の種類に応じては setProperty を読んでいないことが確認できます。

#### setProperty

その名の通り、props を要素に埋め込む関数です。

```js
export function setProperty(dom, name, value, oldValue, isSvg) {
  let useCapture, nameLower, proxy

  if (isSvg && name == "className") name = "class"

  if (name === "style") {
    if (typeof value == "string") {
      dom.style.cssText = value
    } else {
      if (typeof oldValue == "string") {
        dom.style.cssText = oldValue = ""
      }

      if (oldValue) {
        for (name in oldValue) {
          if (!(value && name in value)) {
            setStyle(dom.style, name, "")
          }
        }
      }

      if (value) {
        for (name in value) {
          if (!oldValue || value[name] !== oldValue[name]) {
            setStyle(dom.style, name, value[name])
          }
        }
      }
    }
  } else if (name[0] === "o" && name[1] === "n") {
    useCapture = name !== (name = name.replace(/Capture$/, ""))
    nameLower = name.toLowerCase()
    if (nameLower in dom) name = nameLower
    name = name.slice(2)

    if (!dom._listeners) dom._listeners = {}
    dom._listeners[name + useCapture] = value

    proxy = useCapture ? eventProxyCapture : eventProxy
    if (value) {
      if (!oldValue) dom.addEventListener(name, proxy, useCapture)
    } else {
      dom.removeEventListener(name, proxy, useCapture)
    }
  } else if (
    name !== "list" &&
    name !== "tagName" &&
    name !== "form" &&
    name !== "type" &&
    name !== "size" &&
    name !== "download" &&
    name !== "href" &&
    !isSvg &&
    name in dom
  ) {
    dom[name] = value == null ? "" : value
  } else if (typeof value != "function" && name !== "dangerouslySetInnerHTML") {
    if (name !== (name = name.replace(/xlink:?/, ""))) {
      if (value == null || value === false) {
        dom.removeAttributeNS(
          "http://www.w3.org/1999/xlink",
          name.toLowerCase()
        )
      } else {
        dom.setAttributeNS(
          "http://www.w3.org/1999/xlink",
          name.toLowerCase(),
          value
        )
      }
    } else if (value == null || (value === false && !/^ar/.test(name))) {
      dom.removeAttribute(name)
    } else {
      dom.setAttribute(name, value)
    }
  }
}
```

それぞれケースごとに分岐が書かれているので読みやすいですね。
この関数 `setProperty(dom, name, value, oldValue, isSvg)` は、`diffProps` からは

```js
for (i in newProps) {
  // 新旧propsに差分があるとsetProperty
  if (
    (!hydrate || typeof newProps[i] == "function") &&
    i !== "children" &&
    i !== "key" &&
    i !== "value" &&
    i !== "checked" &&
    oldProps[i] !== newProps[i]
  ) {
    setProperty(dom, i, newProps[i], oldProps[i], isSvg)
  }
}
```

などとして呼ばれます。

つまり name は props オブジェクトの key であり、value は props オブジェクトの値です。
それを踏まえた上で読んでみましょう。

#### style への props 適用

`if (name === "style") {` では、`setStyle(dom.style, name, value[name])` が呼ばれています。

この `setStyle` は

```js
function setStyle(style: CSSStyleDeclaration, key, value) {
  if (key[0] === "-") {
    style.setProperty(key, value)
  } else if (value == null) {
    style[key] = ""
  } else if (typeof value != "number" || IS_NON_DIMENSIONAL.test(key)) {
    style[key] = value
  } else {
    style[key] = value + "px"
  }
}
```

といった関数で、`dom.style` に対して CSS のセット（=DOM の更新）をしています。

```jsx
<div style={{ margin: 16 }}></div>
```

のように px を使わなくても動く理由もこのコードから分かって面白いですね。

#### イベントハンドラへの props 適用

`else if (name[0] === "o" && name[1] === "n") {` では、

```js
if (value) {
  if (!oldValue) dom.addEventListener(name, proxy, useCapture)
} else {
  dom.removeEventListener(name, proxy, useCapture)
}
```

と言った風にイベントリスナーの登録が行われています。

`else if (name[0] === "o" && name[1] === "n") {` のような分岐になっているのは `onXXX` をランタイムで見つけ出すときのパフォーマンスが良いかららしいです。

#### name への props 適用

```js
else if (
    name !== "list" &&
    name !== "tagName" &&
    name !== "form" &&
    name !== "type" &&
    name !== "size" &&
    name !== "download" &&
    name !== "href" &&
    !isSvg &&
    name in dom
) {}
```

という分岐では、DOM 組み込み以外の値を更新します。
つまり JSX や VNode における props の更新の分岐です。

#### value がないときへの props 適用

`else if ( value == null ||` の分岐では、`<a href={false}></a>` などが当たります。
この場合

```js
dom.removeAttribute(name)
```

としてその要素は消します。

#### それ以外への props 適用

この場合は DOM 組み込みの値の更新の分岐です。
`href` や `type` などがこれにあたります。

### diffChildren

diff や diffElementNodes から呼ばれる関数です。

```js
export function diffChildren(
  parentDom,
  renderResult,
  newParentVNode,
  oldParentVNode,
  globalContext,
  isSvg,
  excessDomChildren,
  commitQueue,
  oldDom,
  isHydrating
) {
  let i, j, oldVNode, childVNode, newDom, firstChildDom, refs
  let oldChildren = (oldParentVNode && oldParentVNode._children) || EMPTY_ARR

  let oldChildrenLength = oldChildren.length
  if (oldDom == EMPTY_OBJ) {
    if (excessDomChildren != null) {
      oldDom = excessDomChildren[0]
    } else if (oldChildrenLength) {
      oldDom = getDomSibling(oldParentVNode, 0)
    } else {
      oldDom = null
    }
  }

  newParentVNode._children = []
  for (i = 0; i < renderResult.length; i++) {
    // props.children から child を取り出す
    childVNode = renderResult[i]

    if (childVNode == null || typeof childVNode == "boolean") {
      // JSXの中に{null}とか{true}を入れてる場合の挙動
      childVNode = newParentVNode._children[i] = null
    } else if (typeof childVNode == "string" || typeof childVNode == "number") {
      // JSXの中に{1}とか{"1"}を入れてる場合の挙動
      childVNode = newParentVNode._children[i] = createVNode(
        null,
        childVNode,
        null,
        null,
        childVNode
      )
    } else if (Array.isArray(childVNode)) {
      // JSXの中に{[1, <div>hoge</div>]}などを入れてる場合の挙動
      childVNode = newParentVNode._children[i] = createVNode(
        Fragment,
        { children: childVNode },
        null,
        null,
        null
      )
    } else if (childVNode._dom != null || childVNode._component != null) {
      // JSXの中に<div>hoge</div>などコンポーネントを入れ子にしている場合の挙動
      childVNode = newParentVNode._children[i] = createVNode(
        childVNode.type,
        childVNode.props,
        childVNode.key,
        null,
        childVNode._original
      )
    } else {
      childVNode = newParentVNode._children[i] = childVNode
    }

    if (childVNode == null) {
      // loopから抜けて次のloopに移る
      continue
    }

    // 作りだしたVNodeの親が何か記録する
    childVNode._parent = newParentVNode
    childVNode._depth = newParentVNode._depth + 1

    oldVNode = oldChildren[i]

    // <<<IMPORTANT>>>
    // key の一致を調べてる
    // Key は、どの要素が変更、追加もしくは削除されたのかを識別するのに使う
    if (
      oldVNode === null ||
      (oldVNode &&
        childVNode.key == oldVNode.key &&
        childVNode.type === oldVNode.type)
    ) {
      oldChildren[i] = undefined
    } else {
      for (j = 0; j < oldChildrenLength; j++) {
        oldVNode = oldChildren[j]
        // children のうち key と type が一致したものは children の比較をしない (break する)
        if (
          oldVNode &&
          childVNode.key == oldVNode.key &&
          childVNode.type === oldVNode.type
        ) {
          oldChildren[j] = undefined
          break
        }
        oldVNode = null
      }
    }

    // 上の比較で key や type が異なっていた場合は oldVNode は null なので、oldVNode は EMPTY_OBJ として diffを取る
    // key やtype が一致していれば oldVNode は oldChildren[j] で、この値を使って diff を取る。
    oldVNode = oldVNode || EMPTY_OBJ

    // diffElementNodes が適用された DOM がここに入る
    newDom = diff(
      parentDom,
      childVNode,
      oldVNode,
      globalContext,
      isSvg,
      excessDomChildren,
      commitQueue,
      oldDom,
      isHydrating
    )

    if (newDom != null) {
      if (firstChildDom == null) {
        firstChildDom = newDom
      }

      // DOM操作
      // diff -> diffElementNodes を行った DOM を挿入する
      oldDom = placeChild(
        parentDom,
        childVNode,
        oldVNode,
        oldChildren,
        excessDomChildren,
        newDom,
        oldDom
      )
      if (!isHydrating && newParentVNode.type == "option") {
        parentDom.value = ""
      } else if (typeof newParentVNode.type == "function") {
        newParentVNode._nextDom = oldDom
      }
    } else if (
      oldDom &&
      oldVNode._dom == oldDom &&
      oldDom.parentNode != parentDom
    ) {
      oldDom = getDomSibling(oldVNode)
    }
  }

  newParentVNode._dom = firstChildDom

  if (excessDomChildren != null && typeof newParentVNode.type != "function") {
    for (i = excessDomChildren.length; i--; ) {
      if (excessDomChildren[i] != null) removeNode(excessDomChildren[i])
    }
  }

  // for ループの中で使用済みのものには undefined が詰め込まれているはず。それでも余っているものをここでunmountする
  for (i = oldChildrenLength; i--; ) {
    if (oldChildren[i] != null) unmount(oldChildren[i], oldChildren[i])
  }
}
```

### DOM 操作

#### placeChild

newDOM を DOM ツリーに追加する操作、もしくは newDOM を oldDOM の兄弟として置く操作をする。

```js
export function placeChild(
  parentDom,
  childVNode,
  oldVNode,
  oldChildren,
  excessDomChildren,
  newDom,
  oldDom
) {
  let nextDom
  if (childVNode._nextDom !== undefined) {
    nextDom = childVNode._nextDom

    childVNode._nextDom = undefined
  } else if (
    excessDomChildren == oldVNode ||
    newDom != oldDom ||
    newDom.parentNode == null
  ) {
    outer: if (oldDom == null || oldDom.parentNode !== parentDom) {
      parentDom.appendChild(newDom)
      nextDom = null
    } else {
      for (
        let sibDom = oldDom, j = 0;
        (sibDom = sibDom.nextSibling) && j < oldChildren.length;
        j += 2
      ) {
        if (sibDom == newDom) {
          break outer
        }
      }
      parentDom.insertBefore(newDom, oldDom)
      nextDom = oldDom
    }
  }

  if (nextDom !== undefined) {
    oldDom = nextDom
  } else {
    oldDom = newDom.nextSibling
  }

  return oldDom
}
```

#### getDomSibling

自分の親の子が持つ DOM を順番にみていく。
つまり自分の兄弟要素を取得し返す関数です。

```js
export function getDomSibling(vnode, childIndex) {
  if (childIndex == null) {
    return vnode._parent
      ? getDomSibling(vnode._parent, vnode._parent._children.indexOf(vnode) + 1)
      : null
  }

  let sibling
  for (; childIndex < vnode._children.length; childIndex++) {
    sibling = vnode._children[childIndex]

    if (sibling != null && sibling._dom != null) {
      return sibling._dom
    }
  }
  return typeof vnode.type == "function" ? getDomSibling(vnode) : null
}
```

#### removeNode

```js
export function removeNode(node) {
  let parentNode = node.parentNode
  if (parentNode) parentNode.removeChild(node)
}
```

#### unmount

```js
export function unmount(vnode, parentVNode, skipRemove) {
  let r
  if (options.unmount) options.unmount(vnode)

  if ((r = vnode.ref)) {
    if (!r.current || r.current === vnode._dom) applyRef(r, null, parentVNode)
  }

  let dom
  if (!skipRemove && typeof vnode.type != "function") {
    skipRemove = (dom = vnode._dom) != null
  }
  vnode._dom = vnode._nextDom = undefined

  if ((r = vnode._component) != null) {
    if (r.componentWillUnmount) {
      try {
        r.componentWillUnmount()
      } catch (e) {
        options._catchError(e, parentVNode)
      }
    }

    r.base = r._parentDom = null
  }

  if ((r = vnode._children)) {
    for (let i = 0; i < r.length; i++) {
      if (r[i]) unmount(r[i], parentVNode, skipRemove)
    }
  }

  if (dom != null) removeNode(dom)
}
```

## setState

差分更新がどう行われるのかみてみましょう。

oldChildrenLength で足りないものが unmount されることがわかります。
そしてこの差異自体は setState が生み出します。

## 読む上で出てくるであろう疑問とその答え

### VNode.type が function だとどうなるのか

### 新コンポーネントを作った後に oldProps = c.props したら意味がないのでは

まず oldProps, newProps はこのコードが呼ばれた段階であまり使わなくなります。
唯一使うのは、

```js
if (
  newType.getDerivedStateFromProps == null &&
  newProps !== oldProps &&
  c.componentWillReceiveProps != null
) {
  c.componentWillReceiveProps(newProps, componentContext)
}
```

のタイミングです。このときの比較の条件で使います。
このとき `newProps !== oldProps` が絶対に false になってこの処理が呼ばれないように見えますが、実際には大丈夫です。

そもそも componentWillReceiveProps は新規コンポーネントに対しては呼ばれないものです。
そして oldProps = c.props は新規コンポーネント作成でしか呼ばれないためです。

### なんで再帰構造になっているのか

木を辿るためです。

### key の比較のところがよく分からなかった

これは EMPTY_OBJECT が入った状態で diff が呼ばれる時のループを追うと良い。
newDom が作られることがわかる。
そのため DOM が作り直されることとなり再レンダリングが必然的には知りパフォーマンスが落ちる。

### newVNode.type === null のような分岐

VNode が null になる場面はどういうときなのでしょうか。

`createVNode` から辿ってみると、diffChildren に該当するコードがあります。

```js:title=children.js
if (childVNode == null || typeof childVNode == "boolean") {
  childVNode = newParentVNode._children[i] = null
} else if (typeof childVNode == "string" || typeof childVNode == "number") {
  childVNode = newParentVNode._children[i] = createVNode(
    null,
    childVNode,
    null,
    null,
    childVNode
  )
} else if (Array.isArray(childVNode)) {
  ...
}
```

つまり、入れ子の要素が Element ではなく string, number のような primitive な場合に作られる VNode です。

たとえば、

```jsx
<div>hoge</div>
```

のようなものです。
