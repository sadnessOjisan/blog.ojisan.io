---
path: /multi-env-multi-site-fb
created: "2021-07-01"
title: 複数環境・複数サイトを対象としたFirebaseデプロイ
visual: "./visual.png"
tags: ["Firebase"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

Firebase を dev/prd の環境を用意した上で、hosting をそれぞれの環境で複数サイト持たせたいときのやり方をよく調べているので、今度こそ忘れないためにメモ。

## はじめに

そもそも複数環境(prd, dev など)を扱うのであれば project ごと分けます。
これは Firestore や Function が、1project 配下からでは環境を分けれないためです。

## 環境の切り替え

Firebase に複数プロジェクトを作ってあれば、 .firebaserc ファイルに宣言することで、切り替えが可能です。

```sh
{
  "projects": {
      "dev":"dev-project-name",
      "prd":"prd-project-name"
  },
}
```

```sh
firebase use dev

firebase use prd
```

このコマンドによって、firebase project を切り替え、以降の firebase コマンドはその環境に対してのコマンドとなります。

## 環境を分けたデプロイ

手元のコマンドは先ほどのやり方で実現できますが、デプロイの時は project name key をコマンドで指定することでその環境にデプロイが可能となります。

```sh
firebase deploy --project=dev --force
```

### GitHub Actions を経由したデプロイ

[w9jds/firebase-action](https://github.com/w9jds/firebase-action) を使うことで workflow から Firebase コマンドを実行できます。

```yaml
- name: Deploy to Firebase
    uses: w9jds/firebase-action@master
    with:
        args: deploy --project=dev --force
        env:
            FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN_DEV }
```

FIREBASE_TOKEN_DEV は firebase login していない環境から firebase コマンドを実行するために必要になるトークンです。
`firebase login:ci` を手元で実行することで手に入るので、それを SECRETS に設定します。

またコマンドに `--force` を付けているのは functions をデプロイする時は delete 操作が入っているときに確認処理が挟まってデプロイができなくなるのを防ぐためです。
firebase deploy は `--only hosting,storage` などの指定を付けないと全サービスをデプロイされてしまいます。

FYI: [https://firebase.google.com/docs/cli#partial_deploys](https://firebase.google.com/docs/cli#partial_deploys)

### 別環境の設定を import する

複数環境を用意したいということは dev, prd などで分けたいことだと思いますが、そうなるど prd をデプロイするときに dev 環境の firebase.rules などの設定が欲しくなります。
「最初から source code として管理して、firebase deploy しておけば問題ないのでは」と思われるかもしれませんが、firestore の index はスタックトレースにあるリンクをクリックして編集ができるため、必ずしも手元の rule と同期されているわけではありません。
そこですでに設定されている rule を手元に import したいニーズが出ます。

そんなときは `firebase firestore:indexes` とすることで、現在設定されている rule や index を表示できます。
あとはこれを

```sh
firebase firestore:indexes > firestore.indexes.json
```

などとして書き込むことで、ローカルに import してくることができます。

FYI: [https://ginpen.com/2019/06/01/firestore-indexes-json/](https://ginpen.com/2019/06/01/firestore-indexes-json/)

## 1 環境に複数サイトをデプロイする

Firebase hosting は 1 project に対して複数サイトを作れます。
それらに対してデプロイ先を切り分けるときのやり方は target 機能を使います。

```
{
  "projects": {
    "dev":"dev-project-name",
    "prd":"prd-project-name"
  },
  "targets": {
    "dev-project-name": {
      "hosting": {
        "hoge": [
          "hosting-site-nameA"
        ],
        "fuga": [
          "hosting-site-nameB"
        ]
      }
    },
    "prd-project-name": {
      "hosting": {
        "hoge": [
          "hosting-site-nameA"
        ],
        "fuga": [
          "hosting-site-nameB"
        ]
      }
    }
  }
}
```

ここでは hoge, fuga が target 名です。

各 target に対する設定も firebase.json で行えます。

```json
{
  "hosting": [
    {
      "target": "hoge",
      "public": "packages/client/out",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
    },
    {
      "target": "fuga",
      "public": "packages/admin/out",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
    }
  ]
}
```

この状態で `firebase deploy` すると、両環境へホスティングできます。
