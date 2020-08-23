---
path: /-how-to-create-preact-app-2020
created: "2020-08-21 15:00"
title: preactの環境構築 of 2020
visual: "./visual.png"
tags: [preact, TypeScript]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

所用で先週preactを初めて触っていたのですが、環境構築をしているときに「この情報ドキュメントになくね？」「間違ってるくね？」っていうのを節々で感じたので、これから環境構築する人がググった時にこのドキュメントを見つけられるようにメモを残します。
とはいえ自分が初心者ということで自分が間違っている可能性も大いにあるのでそういうのがありましたら指摘していただけると助かります。

React をある程度書いたことある人が preact に挑戦することを想定して書いています。
主に「React でやるときのあれは preact でどうするんや」という情報です。

## 目指すゴール

環境構築のゴールが何かというと一つには Hello World があるとは思いますが、それよりかはもっと踏み込んでアプリケーションとして欲しくなる機能をとりあえず全部実装していこうと思います。
それが何かというのは独断と偏見でしかないのですが、

* Build できて Hello World が表示される
* ルーティングがある
* 状態管理がある
* スタイリングできる

を一旦のゴールにおこうと思います。

またいま preact を始めるならということで、

* preact X
* TypeScript

を想定しています。

## まずはHello World

TypeScript を使って Hello World する例、公式にあって欲しい・・・

### いつものおまじない

webpack でのビルド環境を作ります。

React + TS で Hello World するとき、

`npm i -D typescript webpack webpack-cli ts-loader html-webpack-plugin webpack-dev-server` みたいなことをすると思うのですが preact でも全く同じ構成を使えます。

webpack.config.js もこんな感じで書きます。

```js
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

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
};
```

そして次に TypeScriptの設定をします。

```sh
$ npx tsc --init
```

このときに、適当な preact のサンプルコードを走らせてみましょう。

```js
import { h, render } from 'preact';

const Main = () => {
    return (
        <div>hello world!</div>)
}

render(<Main></Main>, document.body);
```

これはビルドに失敗します。

### preact の h関数をビルドする

preact には h関数というReactでいうcreateElement相当の関数があります。

typescript には --jsx react というオプションでjsxをビルドできますが、いまはreactじゃないのでビルドできません。
そういうときに jsxのFactory関数 を明示する必要があり、それが jsxFactory というオプションです。

> Specify the JSX factory function to use when targeting react JSX emit, e.g. 'React.createElement' or 'h'. Requires TypeScript version 2.1 or later.

ここに h を指定します。

```json
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
    "target": "es5", /* Specify ECMAScript target version: 'ES3' (default), 'ES5', 'ES2015', 'ES2016', 'ES2017', 'ES2018', 'ES2019', 'ES2020', or 'ESNEXT'. */
    "module": "commonjs", /* Specify module code generation: 'none', 'commonjs', 'amd', 'system', 'umd', 'es2015', 'es2020', or 'ESNext'. */
    "jsx": "react", /* Specify JSX code generation: 'preserve', 'react-native', or 'react'. */
    "strict": true, /* Enable all strict type-checking options. */
    "esModuleInterop": true, /* Enables emit interoperability between CommonJS and ES Modules via creation of namespace objects for all imports. Implies 'allowSyntheticDefaultImports'. */
    "skipLibCheck": true, /* Skip type checking of declaration files. */
    "forceConsistentCasingInFileNames": true /* Disallow inconsistently-cased references to the same file. */
  }
}
```

もちろん、target や module などのオプションは好きに変えても良いです。

（せっかく preact という省エネ環境でやるので module は ESNext にして TreeShaking できるようにした方が良いと思った方もいらっしゃるとは思いますが、Hello World するだけなのでいまは `npx tsc --init` の設定をそのまま使いまわしています。）

## ルーティング

preact-router が使えます。

公式にある通り、

```jsx
import Router from 'preact-router';
import { h, render } from 'preact';
/** @jsx h */

const Main = () => (
	<Router>
		<Home path="/" />
		<About path="/about" />
		// Advanced is an optional query
		<Search path="/search/:query/:advanced?" />
	</Router>
);

render(<Main />, document.body);
```

として使え、よく見る Router という感じがします。
ただし、この書き方だと path は型定義があいません。

ドキュメントにはないのですが、

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

(nested routes が必要になるのは大規模なアプリケーションだしそんな大規模なものだったら(どうせ肥大化するので)reactでよくないかと思うし、そもそもnested routeもnestしたルーティングを平でトップレベルに持てば作れる。そりゃあサイドバーの内側やタブの中だけルーティングしたいケースは対応できないけどそれもquery parameterとかで乗り切れるはずと思っています！)

## 状態管理

hooksが使えます！
つまり useReducer と useContext があります。
なのでglobal state の管理も容易です。
バンドルサイズ増やしたくないのでこれを使いましょう！

### preact での hooksの使い方

preact/compat もしくは preact/hooks に含まれています。

### preact/compat ってなに？

> preact/compat is our compatibility layer that translates React code to Preact. For existing React users this can be an easy way to try out Preact without changing any of your code, by setting up a few aliases in your bundler configuration.

React にある機能を preact で使うための変換機能です。
もともとは [preact-compat](https://github.com/preactjs/preact-compat) という別のライブラリでしたが本体に含まれることとなりました。

> It provides the same exports as react and react-dom, meaning you can use your build tool of choice to drop it in where React is being depended on.

とあり、preact/compat があればReactに依存する3rd partyライブラリを入れることも可能になってきます。
さきほどのreact-routerの例がそれです。

ただし、[Switching to Preact (from React)](https://preactjs.com/guide/v10/switching-to-preact/)を見る限りバンドルサイズを2kbあるらしく、普通はTreeShakingやCode Eliminationが効くはずとはいえhooksを使うだけなら不用意にインストールしない方が良いのではと思います。
使っているバンドラーライブラリや設定やライブラリの依存によってはコードの最小化ができない場合があります。
（この説明あってるか自信ないので詳しい人教えてほしいです。）

### パフォーマンスがネックになるのでは？

Context は [公式の注意事項](https://ja.reactjs.org/docs/context.html#caveats)によると、

> コンテクストは参照の同一性を使用していつ再レンダーするかを決定するため、プロバイダの親が再レンダーするときにコンシューマで意図しないレンダーを引き起こす可能性があるいくつかの問題があります。

とあり、再レンダリングによって性能劣化を引き起こす可能性があります。

ただ実際のところ再レンダリングによってもっさりすることがあるのは複雑な画面を作らない限りは起きないはずなので、気にしなくてもいいかもしれません。

この手の問題は Context を分割することで防いだり、もし実装してしまっていても memo などを使って再レンダリングのための計算そのものを防ぐことで解消できます。
Contextにまつわるトラブルは[useContext + useState 利用時のパフォーマンスはProviderの使い方で決まる！かも。。。？](https://qiita.com/jonakp/items/58c9c383473d02479ea7)などにまとまっているのでご覧ください。


### Dispatchの型定義がない

Contextを使った状態管理の例としては[React Context を用いた簡易 Store](https://mizchi.dev/202005271609-react-app-context)の実装が実感が湧くと思います。
（さらっと解説もなしにContext分割してる・・・先の節に書いた性能劣化の解決策の一つです。）

Reactの場合@types/reactが提供しているDispatchという型でcreateContextのジェネリクスに渡して型をしばれます。
しかし preact の場合、Dispatchという型が提供されていません。
が、型推論させてみるとこれはuseContextで渡すaction関数そのもの型が入ることがわかるのでcreateContext時にはその型を指定します。

## スタイリング

[goober](https://github.com/cristianbote/goober) が良いと思います！

### goober は軽量でバンドルを無闇に増やさない

スタイリングに関しては、バンドルを増やしたくないしランタイムでの実行も減らしたいので CSS in JS は避けるべきなのかとも思ったのですが、設定・補完・行数の節約といった面での開発体験を考えて採用することにしました。

かといってここで入れるライブラリは慎重になりました。
例えば styled-componentsやemotion などは バンドルサイズが 10 kb あり preact 本体と同じくらいのサイズがあります。
ここでバンドルサイズを増やすと「なんのためにpreactを入れたのじゃ」となるのでどうしたらいいか頭を悩ましていました。

preactに詳しそうな先人の[ビルドサイズ要求環境でモダンフロントエンドをやる (主に preact の話)](https://mizchi.dev/202006261728-minimal-js)を見てるとどうやら goober というのがあるらしいです。
これは まさしく ちょうど僕が悩んでいたようなバンドルサイズへの懸念から生まれたライブラリで、「CSS in JSライブラリっていってもどうせstyled しか使わないこともあるからそれだけを持ってきたぜ」といったライブラリです。

### 必要なユースケースは全部満たせそう

とはいえ機能を絞っているライブラリなので本当にやりたいことが全部できるかどうかという実験はしておく必要があったので試しておきました。

#### 上書きができる

コンポーネントの上書きはできます。

emotionやstyled-componentsでやる時の方法と同じです。

コンポーネントをラップし、

```jsx
styled(Item)`

`
```

className を渡すと

```jsx
<div className={props.className} />
```

スタイリングの上書きができます。

レイアウトのようなものは親からスタイルを指定することでコンポーネントのポータビリティが上がるのでやりたいテクニックですね。

#### メディアクエリが使える

公式Docに例が書かれていないのですができます。（似た例はあるけどテンプレートリテラルでの例がない）

styled-components と同じ書き方でできます。

#### global css も簡単に読み込める

injectStyleという機能で実現できます。
reset.css の実現などにご利用ください。

## おわりに

といった感じで最低限の昨日は実現できることがわかりました。
ぶっちゃけ自分がアプリ開発する分にはこれらの機能さえあればどんなものでも作れると思っているので preact で十分に実務で戦えそうだなと思いました。
とはいえ preact が要求される過酷な環境での開発をする機会はないので、技術選定ではReact を選ぶとは思います。
いつかpreact を使わないと解決できないような仕事がもらえるようにこれからも頑張っていきます！

最後にこの設定をする上で公式Docだけ見てると多分ハマるであろうことだけまとめます。

* TSを採用するならjsxFactory の設定を忘れずに
* preact-routerでページをだし分けるにはRouterだけでなく Route がある
* preact 本体に hooks は入っていない。preact配下のpathから見つけ出そう。
* Dispatch の型定義はそもそもpreactにないが、型定義自体がないのでDispatchがなくても型検査を通せる
* スタイリングは gooberが良さそう。メディアクエリはstyled-componentsと同じ書き方ができる。

