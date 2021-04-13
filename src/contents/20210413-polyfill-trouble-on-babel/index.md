---
path: /polyfill-trouble-on-babel
created: "2021-04-13"
title: babel/preset-env で polyfill するとビルドに失敗する問題の解決
visual: "./visual.png"
tags: ["Babel"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

この解決策を教えてくれた [@about_hiroppy](https://twitter.com/about_hiroppy)さん、ありがとうございます。

## 起きていた問題

少し前に Zenn にこういう質問を立てました。（こいつ質問サービスとして使ってやがる・・・）

[preset-env 経由で polyfill を入れると react が import されなくなる](https://zenn.dev/sadness_ojisan/scraps/450370d8d8cba5)

この質問は、IE 対応をするために @babel/preset-env と useBuiltin を使うと、ビルド時に react, react-dom の依存解決ができなくなってしまうものです。

IE 対応のための polyfill は babel を使うと簡単に導入できそうですが、

```js
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        useBuiltIns: "usage",
        corejs: 3,
      },
    ],
    [
      "@babel/preset-react",
      {
        runtime: "automatic",
      },
    ],
  ],
}
```

というシンプルな設定でビルドに失敗します。
気になる方は以下のレポジトリで試してみてください。

https://github.com/ojisan-toybox/react-ie11/tree/%E5%8B%95%E3%81%8B%E3%81%AA%E3%81%84

結局このときは解決できずにビルドを TypeScript で行い、手動で polyfill をしていまして、babel を使った IE 対応は諦めました。

この投稿はその解決策を最近知ったという話です。

## sourceType を使うことで解決する。

ビルドができる例をお見せすると、

```ts
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        useBuiltIns: "usage",
        corejs: 3,
      },
    ],
    [
      "@babel/preset-react",
      {
        runtime: "automatic",
      },
    ],
  ],
  sourceType: "unambiguous",
}
```

です。

`sourceType: "unambiguous",` がキモです。

### sourceType とは

https://babeljs.io/docs/en/options#sourcetype によると、

> Type: "script" | "module" | "unambiguous"
> Default: "module"

> unambiguous can be quite useful in contexts where the type is unknown, but it can lead to false matches because it's perfectly valid to have a module file that does not use import/export statements.

> This option is important because the type of the current file affects both parsing of input files, and certain transforms that may wish to add import/require usage to the current file.

> For instance, @babel/plugin-transform-runtime relies on the type of the current document to decide whether to insert an import declaration, or a require() call. @babel/preset-env also does the same for its "useBuiltIns" option. Since Babel defaults to treating files are ES modules, generally these plugins/presets will insert import statements. Setting the correct sourceType can be important because having the wrong type can lead to cases where Babel would insert import statements into files that are meant to be CommonJS files. This can be particularly important in projects where compilation of node_modules dependencies is being performed, because inserting an import statements can cause Webpack and other tooling to see a file as an ES module, breaking what would otherwise be a functional CommonJS file.

とのことです。

要約すると、@babel/plugin-transform-runtime や useBuiltin はトランスパイル対象のファイルに応じて依存の読み込み設定(import, require)を挿入しますが、このときデフォルトの設定では import を挿入する一方で、`sourceType: "unambiguous"` を設定しておけば ESModule と決めつけずにファイルを見てから import ,require を挿入するように決めます。これによって適切に依存を import する文を差し込め、react, react-dom の依存解決ができます。
