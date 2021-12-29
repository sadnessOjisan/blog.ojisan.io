---
path: /firebase-multi-site
created: "2021-10-05"
title: 1Project で複数の Firebase Hosting を使う
visual: "./visual.png"
tags: ["firebase"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

以前、[複数環境・複数サイトを対象とした Firebase デプロイ](https://blog.ojisan.io/multi-env-multi-site-fb) という記事を書いたのですが、今読み返すと複数環境を使う話と、複数サイトを扱う話が混ざっていて、１プロジェクトから複数サイトをデプロイするときに自分でも読み直して困ったので、１プロジェクトで複数サイトをデプロイする方法だけ紹介します。

公式ドキュメント的にはこのあたりです。

<https://firebase.google.com/docs/hosting/multisites?hl=ja>

## 正解の手順

### Firebase Hosting で複数サイトを作る

Firebae の GUI で設定、もしくは `firebase hosting:sites:create SITE_ID` で作れます。
この SITE_ID がややこしいですが、サイト名だと思っておいて問題がないです。
この文字列がデフォルトの URL に含まれます。

例えば、

```sh
firebase hosting:sites:create ojisan_blog
```

### サイトのデプロイ ターゲットを設定する

これは公式ドキュメントに書いてあるやり方と、それに従わなくて良いやり方があります。

#### コマンドでターゲットを追加する

公式ドキュメントに書かれているやり方です。

```sh
firebase target:apply hosting TARGET_NAME RESOURCE_IDENTIFIER
```

すでに ojisan_blog というサイトがあるものとして、

```sh
firebase target:apply hosting ojisan_blog_site ojisan_blog
```

として使います。
ojisan_blog_site がターゲットです。

このコマンドを実行すると、`.firebaserc` には

```json
{
  ...,
  "targets": {
    "YOUR_PROJECT_NAME": {
      "hosting": {
        ...,
        "ojisan_blog_site": ["ojisan_blog"]
      }
    }
  }
}
```

として追加されます。

#### 直接 .firebaserc に書き込む

実は firebase のデプロイで肝心なのは、firebase.json と .firebaserc なので先ほどのコマンドを叩かなくても直接ファイルを編集すれば問題なかったりします。
ただし site 自体の追加は設定ファイルではできないので GUI かコマンドを使っておく必要があります。

## 構成を設定する

あとはそれぞれのサイトに何をデプロイするかを firebase.json に定義します。

```json
{
  "hosting": [
    {
      "target": "ojisan_blog_site",
      "public": "packages/lib/storybook-static",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
    },
    ...
  ]
}
```

## デプロイする

あとは `firebase deploy` とすれば、複数サイトがデプロイできます。

## 終わりに

- .firebaserc と firebase.json のそれぞれの値に何を入れるべきか
- site 名と target 名のどっちがどっちか

を理解しないと混乱しがちですが、上の手順に従えばとりあえずはデプロイできるでしょう。
