---
path: /monorepo-cloud-functions
created: "2021-04-11"
title: 型を共有したくて Cloud Functions をモノレポで切り出す
visual: "./visual.png"
tags: ["Firebase", "Yarn"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

にゃーん workspace ってなｗ

やりたいこと: Cloud Functions で作った API のレスポンスの型と、それを受け取る Client に定義するレスポンスの型を統一したい

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

FYI: https://firebase.google.com/docs/functions/get-started?hl=ja

そして実際は Client と Function でレポジトリを分けずに開発してると、

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
ちなみにこのような構成になるのは、Firebase に限らず Vercel も該当します。

## そのまま import すればいいじゃん

型を共有したいならそのまま import すればいいという意見もあるとは思います。
つまり、`src/repository/user.ts` 的なのがあるとして、そのファイルから

```ts
import type { UserResponse } from "../../functions/types/user-response"
```

とするということです。

しかしこれにはいくつか問題があります。

- src/ と functions で TS のバージョンが同じという保証がない
- TypeScript の project が異なる
- NodeJS の project の単位も異なる

これにより、型検査が正しくされる保証がなかったり、補完が効かないという問題が発生します。

```sh
myproject
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
      +- tsconfig.json
      |
      +- package.json  # npm package file describing your Cloud Functions code
      |
      +- index.js      # main source file for your Cloud Functions code
```

をみると、functions はそれ自体が pakcage.json や tsconfig.json を持っていて別プロジェクトであるためです。

そこで、tsconfig や package.json の field を適切に修正すれば解決できる問題かもしれませんが、試行錯誤するのもめんどくさかったので monorepo にしました。

## firebase stack のものは monorepo にできるのか

firebase の cli を使うと、

```sh
firebase deploy --only functions
```

というコマンドでデプロイします。

このコマンドだけでデプロイできるということは serverless function がどこにあるか CLI は知っているということです。
つまり、このコマンドは functions というフォルダに serverless function が入っていることを知っています。
その場合モノレポにするとその規約を破ることになります。
どうすればいいでしょうか。

## firebase.json で functions の位置を指定できる

当然その target を書き換える設定は用意されています。
それが、source オプションです。

```json:title=firebase.json
{
  "functions": {
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

yarn workspace では root の package.json を

```json:title=package.json
{
  "name": "hoge",
  "private": "true",
  "workspaces": ["packages/*"]
}
```

とします。

こうすると、`packages/**` を各 module として使えます。
ここでは `packages/api` の中に これまで functions フォルダにあった内容を展開します。
そしてクライアントとして `packages/client` と その中に package.json を作ります。

これらのフォルダ間で型を共有させます。
そのために双方で TypeScript が使えるようにします。
双方が使うモノなので root の依存に含めましょう。

```sh
yarn add -D typescript -W
```

`-W` は root で使うことの表明です。
root で使わないなら各フォルダで`yarn add hoge`すればいいです。

こうすれば、`packages/client` から `packages/api/src/types/response` にある型を

```ts
import type { UserResponse } from "api/src/types/response"
```

として import できます。

## 注意点

Cloud Functions をモノレポ化するにあたって、やっておいた方が良い設定があります。

### predeploy のコマンド修正

初期状態では firebase.json の predeploy 設定は

```json
{
  "functions": {
    "predeploy": "npm --prefix \"$RESOURCE_DIR\" run build:function"
  }
}
```

となっています。

これは npm を想定しています。
これを yarn workspace 想定のものに書き換えましょう。

```json:title=firebase.json
{
  "functions": {
    "predeploy": "yarn workspace api run build",
    "source": "packages/api"
  }
}
```

yarn workspace では `yarn workspace ${workspace名}` とすればそのフォルダにあるコマンドを叩けますので使いましょう。

### Node.js v12 を使うようにする

cloud functions では runtime が NodeJS の v10, v12 を使います。
そのため functions の pakcage.json では

```json
{
  "name": "api",
  "version": "1.0.0",
  "description": "",
  "main": "lib/index.js",
  "engines": {
    "node": "12"
  },
  "dependencies": {
    "firebase-admin": "^9.2.0",
    "firebase-functions": "^3.11.0"
  }
}
```

といったように engines が 12 で固定されています。

そのためこのレポジトリそのものを v14 の環境で動く CI に入れると CI がこけます。
それを回避するためには

- engine を消す
- functions をテストする環境以外では engine を無視する(`--ignore-engines` を使う)
- v12 で CI を回す

という手があります。

ここでは v12 で CI を回してみましょう。

```yml
name: Deploy to Firebase Functions on merge
"on":
  push:
    branches:
      - main
jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js
        uses: actions/setup-node@v1
        with:
          node-version: "12.x"
      - name: Install npm packages
        working-directory: ./packages/api
        run: |
          yarn install
      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only functions --project=default
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

## さいごに

monorepo にしなくても型を使いまわせる方法があればそれを使いたい
