---
path: /syntax-highlight-battle
created: "2021-05-08"
title: 最強の syntax highlight を知りたくてバトルするサイトを作った話
visual: "./visual.png"
tags: ["Rust", "svelte", "クソアプリ"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## 背景

いまこのブログを作り直しているのですが、新しいブログの syntax highlight をどうするかを悩んでいました。
highlight.js を使っているのですが、たくさん例があってどれにしたらいいかが分かりませんでした。
そこで 2 つの syntax highlight を並べて戦わせるサイトを作りました。

[https://syntax-hilight-battle-client.pages.dev/](https://syntax-hilight-battle-client.pages.dev/)

どんな色にするかはここから決めようと思います。

## 集計結果

で、集計結果はこんな感じでした。

### 1 位: atom-one-dark

![atom-one-dark](./atom-one-dark.png)

### 2 位: night-owl

![night-owl](./night-owl.png)

### 3 位: ocean

![ocean](./ocean.png)

### 4 位: a11y-dark

![a11y-dark](./a11y-dark.png)

### 5 位: atelier-cave-dark

![atelier-cave-dark](./atelier-cave-dark.png)

### 残り

こんな感じでした。

![結果](result.png)

久々の SQL でめちゃくちゃ苦労しました。

```sql
select id, name, cnt from hilights left outer join (select winner_id, count(*) as cnt from results group by results.winner_id) as res on id = res.winner_id order by cnt desc;
```

いかがでしたか！？

## おまけ: 実装について

要件的に小さいアプリなので普段使っていない技術で作ってみました。

### Client は svelte

#### ハマったところ

svelte はビルド時にスタイリング用のクラスを割り振ってそうで、highlight.js でランタイムで DOM を書き換えると、そこにはスタイルが当たらなくて泣きました。
なのであらかじめ highlight.js の関数を実行して吐き出した DOM を svelte にハードコーディングしています。

### Server は Rust

#### actix-web

actor モデルを使いたいといったわけでなく、ただの server fw として使っています。
Result 型で持ちまわっておけば異常系を FW がよしなにしてくれるのが気に入っています。

#### diesel

いわゆる ORM です。
たまには Firestore 以外を使いたかったので、RDB を利用するために使いました。
ただ生の SQL を書くには connection pool 周りの設定が苦手なので、その辺もまとめてやってくれそうなライブラリを使いました。

### Infra は GCP

Cloud Run で actix-web を動かし、GCE 上の MySQL にアクセスしています。
最近書いたブログのこれらの記事は、このサイトを作るためのものです。

- [GCE & Container Optimized OS で MySQL サーバーを楽に安価に作る](https://blog.ojisan.io/gce-mysql)
- [actix-web を Cloud Run で動かす](https://blog.ojisan.io/actix-web-cloud-run)
