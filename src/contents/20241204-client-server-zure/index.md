---
path: /client-server-zure
created: "2024-12-04"
title: Firestoreのコレクションに対するスキーマを作る
visual: "./visual.png"
tags: ["firebase"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

[Firebase と添い遂げる Advent Calendar 2024](https://adventar.org/calendars/11050)、4日目です。

## スキーマレスだからこそ擬似的なスキーマを作る

３日目の記事には、スキーマレスだからこそ converter に現れる型定義をスキーマとして使ってみようと書いた。
これは Firestore のコレクションを zod などで表現し、converter の中で parse すれば、その zod の定義が Firestore のスキーマとして定義できる。
これは primitive 型はもちろん、Reference や Timestamp も有効だ。

例えば、次のような converter を作る。

```js
export const converter: FirestoreDataConverter<User> = {
  toFirestore: (model: User): DocumentData => {
    return {
        ...name,
        bookRef: db.firestore("collection").doc(model.bookId),
    };
  },
  fromFirestore: (
    snapshot: QueryDocumentSnapshot<UserCollectionSchema>
  ): User => {
    const parsed = userCollectionSchema.parse(snapshot.data());
    return {
        name: snapshot.name,
        bookId: snapshot.bookRef.id
    };
  },
};
```

この userCollectionSchema を zod で作るとすると、こうなる。

```js
export const userCollectionSchema = z.object({
  name: z.string(),
  createdAt: z.instanceof(Timestamp),
  bookRef: z.any().refine(
  (x: object): x is DocumentReference => x instanceof DocumentReference
  );
});
```

bookRef の定義の仕方が気持ち悪いかもしれないが、まあこういうものだ。
詳しくは https://blog.ojisan.io/firestore-schema-with-zod/ で解説したことがあるので見て欲しい。
private constructor を持っているので `z.instanceof` が使えないワークアラウンドだ。

このとき、userCollectionSchema が Firestore のコレクションを表現したスキーマとして言えるようになる。

## Client・Admin SDK を跨ぎたい

さて、先ほど定義したスキーマだが、ここに出てくる Timestamp や DocumentReference は firebase-admin/firestore から import しているとする。
このスキーマを使ってクライアントサイドの converter を作れるだろうか。
答えは否である。
なんと firebase/firestore の Timestamp や DocumentReference と firebase-admin/firestore のそれらでは型定義が異なるのである。
つまり、Adminもしくは Client を跨いで呼び出すと、型エラーだけでなく実行時エラーを引き起こす。
そもそも Client アプリケーションに firebase-admin/firestore を入れないといけなくなる。
これは型安全 Firestore に夢を見た人は一度は通る道だと思うし、それをなんとか突破しようとしている人もいた。

see: [型安全firestore](https://zenn.dev/arark/articles/9ef42ee801050e0f9b88)

この人のやり方は必要に応じて型を上書きしているのだが、このやり方は使いたいフィールドや機能が増えたときに面倒なので綺麗な方法ではない。
綺麗な方法で良いなら、自分はclient/admin共通の型定義を作り、それを z.extend で client 向けと admin 向けのスキーマを作り、そこからclient 向けと admin 向けのスキーマを作るだろう。

```js
const sharedSchema = z.object({
  name: z.string(),
});

export const clientSchema = sharedSchema.extend({
  createdAt: z.instanceof(Timestamp),
  bookRef: z.any().refine(
  (x: object): x is DocumentReference => x instanceof DocumentReference
  );
});

export const adminSchema = sharedSchema.extend({
  createdAt: z.instanceof(Timestamp),
  bookRef: z.any().refine(
  (x: object): x is DocumentReference => x instanceof DocumentReference
  );
});
```

しかしこれだと完成系のスキーマが見づらかったり、やっぱり良いものとは言えなさそうだ。

## 自分にとっての完全な解決策

そんな中、自分はとある完全な解決策を思いついた。

**Client SDKからFirestoreを使うのをやめる**

以上。

これは大真面目に思っていて、チャットのようなリアルタイム性のあるもの以外は一度 Admin SDK を経由させた方が良いと思っている。
つまり Admin SDK をラップしたAPIサーバーを用意するのである。
そうすれば難しい Firestore Rule も書かずに柔軟に権限管理できるし、HTTP Caching が使えたり、IOだけのパフォーマンス計測ができたり、高速化や開発生産性の観点で嬉しいことも多い。

なので自分は、FirestoreはAdminからしか使わないようにしている。

## 明日の記事もスキーマについて

クラサバでスキーマを共有するためのライブラリというのが実は存在している。
明日はそのツールが自分に救いをもたらすのかどうかということについて記事を書いてみる。
