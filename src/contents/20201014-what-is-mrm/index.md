---
path: /react-re-render-history
created: "2020-10-13"
title: mrm で JavaScript のエコシステムを整える
visual: "./visual.png"
tags: [JavaScript, NodeJS]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

[lint-staged](https://github.com/okonet/lint-staged) の設定をしているとき公式の Installation and setup に

```sh
npx mrm lint-staged
```

とあるのですが、ここは `npm i -D lint-staged` でもよく、この `mrm` が何なのかを調べてみました。

## mrm とは

[mrm](https://github.com/sapegin/mrm) の公式曰く、

> Command line tool to help you keep configuration (package.json, .gitignore, .eslintrc, etc.) of your open source projects in sync.

とのことで、拙訳すると「いろんな設定ファイルをよしなにしてくれるコマンドラインツール」です。

例えば何かしらのツールを入れるときは package.json に依存を追加するだけでなく、そのツールが要求する設定ファイルを追加したりする必要がありますが、その設定をまるっとまとめて行ってくれるツールです。

この jest の例が分かりやすいでしょう。

![jestのmrmを実行するとpackage.json以外にも.gitignoreやjest.config.jsなども修正される](./jest.png)
