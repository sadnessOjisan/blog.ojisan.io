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

## 型を共有しようとしてどういう問題が起きたか

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
      +- tsconfig.json
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
 +- tsconfig.json
 |
 +- functions/     # Directory containing all your functions code
      |
      +- .eslintrc.json  # Optional file containing rules for JavaScript linting.
      |
      +- tsconfig.json
      |
      +- package.json  # npm package file describing your Cloud Functions code
      |
      +- index.js      # main source file for your Cloud Functions code
      |
      +- node_modules/ # directory where your dependencies (declared in
                       # package.json) are installed
```

となるのではないでしょうか。（root に client application code を格納している src + その app の依存を管理する package.json を追加しました）

このとき、src にある client アプリケーションと functions で型を共有したいというのが要望です。
ちなみにこのような構成になるのは、Firebase に限らず Vercel などでもこうなります。

## そのまま import すればいいじゃん

型を共有したいならそのまま import すればいいという意見もあるとは思います。
つまり、`src/repository/user.ts` 的なのがあるとして、そのファイルから

```ts
import UserResponse from "../../functions/types/user-response"
```

とするということです。

しかしこれにはいくつか問題があります。

- src/ と functions で TS のバージョンが同じという保証がない
- TypeScript の project が異なる
- NodeJS の project の単位も異なる

これにより、型検査が正しくされる保証がなかったり、補完が効かないという問題が発生します。

tsconfig や package.json の field を修正すれば解決できる問題かもしれませんが、試行錯誤するのもめんどくさかったので monorepo にしました。

## firebase stack のものは monorepo にできるのか

firebase の cli を使うと、

```sh
firebase deploy --only functions
```

というコマンドでデプロイします。

このコマンドだけでデプロイできるということは serverless function がどこにあるか CLI は知っているということです。
つまり、このコマンドは functions というフォルダに serverless function が入っていることを知っているためうまく動くわけです。
その場合モノレポにするとその規約を破ることになります。
どうすればいいでしょうか。

## firebase.json で functions の位置を指定できる

当然その target を書き換える設定は用意されています。
それが、source オプションです。

```json:title=firebase.json
{
  "functions": {
    "predeploy": "yarn workspace api run build:function",
    "source": "packages/api"
  }
}
```

とすることで functions の代わりのフォルダを指定できます。
このとき指定するのは functions の package.json が入っている階層です。
実際にデプロイすることになる lib/ などを指してはいません。

ちなみに hosting も同様にモノレポにする場合は、

```json:title=firebase.json
{
  "functions": {
    "predeploy": "yarn workspace api run build:function",
    "source": "packages/api"
  },
  "hosting": {
    "public": "packages/media/out",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

として同様の指定ができます。

## モノレポにしてみよう

yarn workspace を使います。
なので、cli が生成した package.lock は消しておきます。

yarn workspcae では root の package.json を

```json:title=のpackage.json
{
  "name": "hoge",
  "private": "true",
  "workspaces": ["packages/*"]
}
```

とします。
