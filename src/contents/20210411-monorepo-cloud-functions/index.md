---
path: /monorepo-cloud-functions
created: "2021-04-11"
title: 型安全にしたくて Cloud Functions をモノレポに切り出す
visual: "./visual.png"
tags: ["Firebase"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

Cloud Functions で作った API のレスポンスの型と、それを受け取る Client に定義するレスポンスの型を統一したいです。
例えば Firebase 経由で functions を作るとして、公式のチュートリアルにしたがって作るのなら、

```sh
firebase init functions
```

として、

```sh
myproject
 +- .firebaserc    # Hidden file that helps you quickly switch between
 |                 # projects with `firebase use`
 |
 +- firebase.json  # Describes properties for your project
 |
 +- functions/     # Directory containing all your functions code
      |
      +- .eslintrc.json  # Optional file containing rules for JavaScript linting.
      |
      +- package.json  # npm package file describing your Cloud Functions code
      |
      +- index.js      # main source file for your Cloud Functions code
      |
      +- node_modules/ # directory where your dependencies (declared in
                       # package.json) are installed
```

となります。

しかし Client と Function でレポジトリを分けていないのなら、

```sh
myproject
 +- .firebaserc    # Hidden file that helps you quickly switch between
 |                 # projects with `firebase use`
 |
 +- firebase.json  # Describes properties for your project
 |
 +- src/
 |
 +- package.json
 |
 +- functions/     # Directory containing all your functions code
      |
      +- .eslintrc.json  # Optional file containing rules for JavaScript linting.
      |
      +- package.json  # npm package file describing your Cloud Functions code
      |
      +- index.js      # main source file for your Cloud Functions code
      |
      +- node_modules/ # directory where your dependencies (declared in
                       # package.json) are installed
```

となるのではないでしょうか。（root に client application code を格納している src + その app の依存を管理する package.json を追加しました）

このとき、src にある client アプリケーション
