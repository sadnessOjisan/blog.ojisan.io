---
path: /gatsby-auto-react
created: "2022-09-12"
title: Gatsby で React の import なしで利用する
visual: "./visual.png"
tags: ["gatsby", "react"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## createElement はもう不要

昔 [どうして JSX を使ってもエラーにならないのか？](https://blog.ojisan.io/jsx-to-js/) に書いたのですが、JSX と React を動かすためには React モジュールそのものもしくは、createElement が import されていないといけません。

それが babel 7.9, もしくあ h typescript 4.1 によって自動でそれらを差し込んでくれる機能をコンパイラが提供してくれるようになりました。

FYI: https://ja.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html#how-to-upgrade-to-the-new-jsx-transform

というわけで Gatsby での対応もそれをすればおしまいですね。

とはなりません。

## Gatsby + TS 環境における react import 対応

まず Gatsby を TS から利用しているとしても gatsby の FW 自体は babel を使います。そのため babel を使う前提での import 対応をしなければいけません。

実はそれは Gatsby が内部で使っているプラグインの設定で対応できて、あらたに .babelrc を追加して

```json
{
  "presets": [
    [
      "babel-preset-gatsby",
      {
        "reactRuntime": "automatic"
      }
    ]
  ]
}
```

を書けば良いです。これはこの preset が内部で `@babel/plugin-transform-runtime` を使っているのでできることです。

Gatsby は .babelrc をプロジェクトルートに追加するだけで設定を上書くことができるのですが、実は gatsby-node に onCreateBabelConfig と setBabelPlugin という API があり、そこでも設定を上書いて対応できたりもします。やり方はお好きな方にお任せします。

FYI: <https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/#onCreateBabelConfig>

## 型エラー

しかしこのままではまだ抑制できず、今度は TypeScript 側でエラーが出ます。gatsby init が生成する tsconfig は `jsx: react` で設定されています。これは `import React from 'react'` を手で書かせる前提の設定であり、

> 'React' refers to a UMD global, but the current file is a module. Consider adding an import instead.ts(2686)`

といったエラーが表示されます。そのためここは `jsx: react-jsx` としておく必要があります。

FYI: <https://www.typescriptlang.org/docs/handbook/jsx.html>

Gatsby では型検査にしか使わないので、ここはそのように変更しても問題がないです。
