---
path: /jsx-to-js
created: "2020-09-19"
title: どうしてJSXを使ってもエラーにならないのか？
visual: "./visual.png"
tags: [React]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

一般的に JSX と言えば

```jsx
import React from "react"

export const Hoge = () => {
  return <div>Hello World</div>
}
```

の return 以下の部分を指しますが、どうしてこれが実行できるのでしょうか。

これが `createElement` 相当であることは知っていましたが、どうやってその変換をしているのだっけというのがきちんと説明できる自信がなかったので調べてみました。

## JSX は createElement の糖衣構文

JSX は `createElement` の糖衣構文であることは、React 公式の[JSX なしで React を使う](https://ja.reactjs.org/docs/react-without-jsx.html) という節に詳しく書かれています。
コンポーネントが返す UI のブロックは普段は `<div></div>` などで書いていましたが、それらは `createElement('div')` としても書けるというわけです。

ところで公式の例には

```jsx
class Hello extends React.Component {
  render() {
    return <div>Hello {this.props.toWhat}</div>
  }
}

ReactDOM.render(<Hello toWhat="World" />, document.getElementById("root"))
```

は

```jsx
class Hello extends React.Component {
  render() {
    return React.createElement("div", null, `Hello ${this.props.toWhat}`)
  }
}

ReactDOM.render(
  React.createElement(Hello, { toWhat: "World" }, null),
  document.getElementById("root")
)
```

とありますが、普段 JSX が使えているのはどうしてでしょうか？
誰が `createElement` への変換をになっているのでしょうか？

## React の外にあるものが createElement へ変換する

React そのものには JSX 用の機能があるわけでは無いので React の外側にあるものがその責務をになっているはずです。

### Babel

Babel を使っている場合、それは [@babel/plugin-transform-react-jsx](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx)で実現できます。

必要なライブラリをインストールします。

```sh
$ npm i react

$ npm i -D @babel/core @babel/cli @babel/plugin-transform-react-jsx
```

このファイルをトランスパイルしてみましょう。

```jsx
import React from "react"

const Component = () => {
  return <div>hello world</div>
}
```

上のプラグインを使うための config を書き、

```js
{
  "plugins": ["@babel/plugin-transform-react-jsx"]
}
```

ビルドします。

```sh
$ npx babel src -d dist
```

そしてこの吐き出したファイルを見ます。

```js:title=dist/index.js
import React from "react"

const Component = () => {
  return /*#__PURE__*/ React.createElement("div", null, "hello world")
}
```

と、このように `React.createElement` が生成されており Babel がその役割をになっていることがわかりました。

とはいえ最近は TypeScript でビルドすることも増えていると思います。
その場合はどうなっているのか見てみましょう。

### TypeScript

TypeScript には @babel/plugin-transform-react-jsx のようなプラグインはありませんが、どのようにして JSX の変換をしたらいいのでしょうか。
はい、そこで `--jsx` オプションです。
とりあえず実験してみましょう。

必要なライブラリをインストールします。

```sh
$ npm i react

$ npm i -D typescript @types/react
```

このファイルをトランスパイルしてみましょう。

```jsx
import React from "react"

const Component = () => {
  return <div>hello world</div>
}
```

上のプラグインを使うための config を書き、

```json:title=tsconfig.json
{
  "compilerOptions": {
    "target": "es6",
    "module": "commonjs",
    "jsx": "react",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

ビルドします。

```sh
$ npx tsc
```

そしてこの吐き出したファイルを見ます。

```js:title=dist/index.js
"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, {
          enumerable: true,
          get: function () {
            return m[k];
          },
        });
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const Component = () => {
  return React.createElement("div", null, "hello world");
};
PURE__*/ React.createElement("div", null, "hello world")
}
```

と、このように `React.createElement` が生成されており tsc でも同様のことができることがわかりました。

## import React from 'react' というおまじない

ところで 関数コンポーネントを使うときに

```jsx
import React from "react"

const Component = () => {
  return <div>hello world</div>
}
```

と言った風に、React という文字をどこにも使っていないのに、`import React from "react"` と書かないとコンパイルが通らないといった現象に出逢った経験があるはずです。
そのときに書く `import React from "react"` は JSX が `React.createElement` と変換されることを見越してのことです。
昔は Editor や Linter が強くなく未定義変数として警告が出ていたりもしていたのですが、いまではそれもなくなっているので以前ほどのおまじない感は無くなってきているとは思いますが、`import React from "react"`を忘れずに書きましょう。

ちなみに preact では `createElement` 相当なものは h 関数という別の名前になっていたりするのですが、それは`jsxFactory`という設定で制御可能です。詳しくは [Preact の環境構築 of 2020](https://blog.ojisan.io/how-to-create-preact-app-2020)をご覧ください。

## サンプルコード

もともと styled-components 製のコンポーネントをビルドしたときの中身を読むために作っていたプロジェクトなので styled とついていますが、その辺りは置き換えながら読んでいたでければと思います。

- https://github.com/ojisan-toybox/styled-babel
- https://github.com/ojisan-toybox/styled-tsc
