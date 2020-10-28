---
path: /babel-plugin-to-tsx
created: "2020-10-29"
title: Babel の Plugin で .tsx をビルドする
visual: "./visual.png"
tags: [TypeScript, React]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

[@babel/preset-typescript](https://babeljs.io/docs/en/babel-preset-typescript) を使わず、[@babel/plugin-transform-typescript](https://babeljs.io/docs/en/babel-plugin-transform-typescript) で React + TSX をビルドしてみましょう。

@babel/plugin-transform-typescript の公式ドキュメントには

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
$ npx babel

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

うまく動きます。

## まとめ

babel の preset はいわば plugin の詰め合わせだが、preset 側がなんかしらのオプションを設定してくれているので、ただ plugin に置き換えるだけでは動きません。
何かしらの最小構成を作りたい時は plugin を使うことになると思いますが、わざわざ plugin を使うのならばこういうオプションに気をつけたいです。

## サンプルコード

https://github.com/ojisan-toybox/plugin-with-isTSX
