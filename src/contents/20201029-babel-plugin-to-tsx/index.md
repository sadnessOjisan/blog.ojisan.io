---
path: /babel-plugin-to-tsx
created: "2020-10-29"
title: Babel の Plugin で .tsx をビルドする
visual: "./visual.png"
tags: [TypeScript, React, Babel]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

[@babel/preset-typescript](https://babeljs.io/docs/en/babel-preset-typescript) を使わず、[@babel/plugin-transform-typescript](https://babeljs.io/docs/en/babel-plugin-transform-typescript) で React + TSX をビルドしてみましょう。

@babel/preset-typescript の公式ドキュメントには

> This preset is recommended if you use TypeScript, a typed superset of JavaScript. It includes the following plugins: @babel/plugin-transform-typescript

とあるので、@babel/plugin-transform-typescript を使うとビルドできそうですが、それだけだとは動きません。

```js:title=babel.config.js
module.exports = {
  plugins: [
    "@babel/plugin-transform-typescript",
    "@babel/plugin-transform-react-jsx",
  ],
  presets: ["@babel/env"],
}
```

```sh
# babel-loader でビルドするという前提
$ npx webpack

ERROR in ./src/index.tsx
Module build failed (from ./node_modules/babel-loader/lib/index.js):
SyntaxError: /toybox/plugin-with-isTSX/src/index.tsx: Unexpected token, expected "," (4:27)

  2 | import * as ReactDOM from "react-dom";
  3 |
> 4 | ReactDOM.render(<div>hello world</div>, document.getElementById("root"));
```

[ドキュメント](https://babeljs.io/docs/en/babel-plugin-transform-typescript#istsx)や[実装](https://github.com/babel/babel/blob/main/packages/babel-preset-typescript/src/index.js#L48)を見てみると、preset はファイルが tsx かどうかのフラグを渡しており、この設定を忘れていると preset を plugin で置き換えても動きません。

そのためフラグを渡すように書き換えると、

```js:title=babel.config.js
module.exports = {
  plugins: [
    ["@babel/plugin-transform-typescript", { isTSX: true }],
    "@babel/plugin-transform-react-jsx",
  ],
  presets: ["@babel/env"],
}
```

```sh
$ npx webpack

[webpack-cli] Compilation finished
Hash: fa7edfa667f1198f0b7b
Version: webpack 4.44.2
Time: 609ms
Built at: 10/29/2020 5:50:09 AM
     Asset       Size  Chunks             Chunk Names
  build.js    129 KiB       0  [emitted]  main
index.html  145 bytes          [emitted]
Entrypoint main = build.js
[0] ./node_modules/react/index.js 190 bytes {0} [built]
[1] ./node_modules/object-assign/index.js 2.06 KiB {0} [built]
[2] ./node_modules/react-dom/index.js 1.33 KiB {0} [built]
[3] ./src/index.tsx 183 bytes {0} [built]
[4] ./node_modules/react/cjs/react.production.min.js 6.3 KiB {0} [built]
[5] ./node_modules/react-dom/cjs/react-dom.production.min.js 118 KiB {0} [built]
[6] ./node_modules/scheduler/index.js 198 bytes {0} [built]
[7] ./node_modules/scheduler/cjs/scheduler.production.min.js 4.72 KiB {0} [built]
Child HtmlWebpackCompiler:
                          Asset   Size  Chunks  Chunk Names
    __child-HtmlWebpackPlugin_0  4 KiB       0  HtmlWebpackPlugin_0
    Entrypoint HtmlWebpackPlugin_0 = __child-HtmlWebpackPlugin_0
    [0] ./node_modules/html-webpack-plugin/lib/loader.js!./src/index.html 420 bytes {0} [built]
```

うまく動きます。

## まとめ

babel の preset はいわば plugin の詰め合わせだが、preset 側がなんかしらのオプションを設定してくれているので、ただ plugin に置き換えるだけでは動きません。
何かしらの最小構成を作りたい時は plugin を使うことになると思いますが、わざわざ plugin を使うのならばこういうオプションに気をつけたいです。

## サンプルコード

https://github.com/ojisan-toybox/plugin-with-isTSX
