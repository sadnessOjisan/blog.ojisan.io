---
path: /firestore-nest-v9
created: "2021-12-19"
title: firestore v9 における subcollection へのクエリ
visual: "./visual.png"
tags: ["Firebase", "firestore"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

この記事は [sadnessOjisan Advent Calendar 2021](https://adventar.org/calendars/7015) 19 日目の記事です。書かれた日付は 1/12 です。

firestore v9 における subcollection の扱いについてです。

## subcollection について

firestore は col -> doc -> col -> doc -> ... といった階層構造を作れます。
これはクエリにおいても

```ts
const messageRef = db.collection("rooms").doc("roomA").collection("messages");
```

として現れます。

## v9 における subcollection の取得方法

v9 では collection を指定する関数に `collection()` があります。

これは

```ts
const citiesRef = collection(db, "cities");
```

として使います。

FYI: <https://firebase.google.com/docs/firestore/query-data/get-data>

さて、この関数を使って subcollection を取得するにはどうするでしょうか。

それはこうです。

```ts
const citiesRef = collection(db, "cities", "docId", "subcollection");
```

直感的ではありませんが、

- 引数を増やしてネストを表現
- doc id を引数に含める

がポイントです。

## v9 における subcollection の doc 取得

v8 までは subcollection の ref を作って取得していましたが、v9 からは

```ts
const citiesRef = doc(db, "cities", "docId", "subcollection", "docId2");
```

として取得可能です。

ちなみに doc 関数は db を除く引数が偶数であることが仕様として決まっています。
