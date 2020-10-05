---
path: /typed-firestore
created: "2020-10-02"
title: "firestore の入出力に型をつける"
visual: "./visual.png"
tags: [firestore]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

[firestore の SDK](https://firebase.google.com/docs/reference/js/firebase.firestore) に withConverter というメソッドがあるのですが、その宣伝です。

## 型が欲しいってどういうこと？

たとえば firestore 上のあるドキュメントが name と age というフィールドを持っているとして、それをクライアントが取得したときそのデータに name と age が存在する保証はあるのでしょうか。

```ts
db.collection("user")
  .withConverter(converter)
  .get()
  .then(result => {
    const data = result.docs.map(d => ({
      // 本当にnameがある？
      name: d.data().name,
      // 本当にageがある？
      age: d.data().age,
    }))
    setState(data)
  })
```

`d.data()` はクライアントバリデーションを通った訳でも型がついている訳ではないので、`d.data().name` が本当に name(string)が入っているかはクライアントサイドからすれば分からないことです。

この問題を解決するのが `withConverter` です。

## withConverter とは

[withConverter](https://firebase.google.com/docs/reference/js/firebase.firestore.FirestoreDataConverter?hl=ja) は CollectionReference が持っている関数で、firestore と クライアントでデータをやり取りするときの変換層を実装できるものです。

公式の例をあげると

```ts
class Post {
  constructor(readonly title: string, readonly author: string) {}

  toString(): string {
    return this.title + ", by " + this.author
  }
}

const postConverter = {
  toFirestore(post: Post): firebase.firestore.DocumentData {
    return { title: post.title, author: post.author }
  },
  fromFirestore(
    snapshot: firebase.firestore.QueryDocumentSnapshot,
    options: firebase.firestore.SnapshotOptions
  ): Post {
    const data = snapshot.data(options)!
    return new Post(data.title, data.author)
  },
}

const postSnap = await firebase
  .firestore()
  .collection("posts")
  .withConverter(postConverter)
  .doc()
  .get()
const post = postSnap.data()
if (post !== undefined) {
  post.title // string
  post.toString() // Should be defined
  post.someNonExistentProperty // TS error
}
```

こういうことができる訳です。

つまり、firestore とやり取りするときに converter を通して、型をつけることができます。
では、この withConverter を効果的に使う方法を紹介します。

## 自分の withConverter の使い方

### ランタイムバリデーション

取得したデータは firestore 上での型が決まっていても、クライアントからすれば unknown なので型をつけたいです。
そのためには バリデーションと is を使った [user-defined type guard](https://www.typescriptlang.org/docs/handbook/advanced-types.html)が効果的です。

```ts
const converter = {
  toFirestore(user: DataItemType): firebase.firestore.DocumentData {
    return {
      name: user.name,
      age: user.age,
    }
  },
  fromFirestore(
    snapshot: firebase.firestore.QueryDocumentSnapshot,
    options: firebase.firestore.SnapshotOptions
  ): DataItemType {
    const data = snapshot.data(options)!
    if (!isValid(data)) {
      console.error(data)
      alert("invalid data")
      throw new Error("invalid data")
    }
    return {
      name: data.name,
      age: data.age,
    }
  },
}

const isValid = (data: any): data is DataItemType => {
  if (!(data.name && typeof data.name === "string")) {
    return false
  }
  if (!(data.age && typeof data.age === "number")) {
    return false
  }
  return true
}
```

こうすることで data に不正な値が含まれていたら検知することができ、その検査に通ったことの保証を型を通じて後続処理に伝えることができます。

### DB に対する共通処理を実行する

converter には共通処理を挟むこともできます。
たとえば投稿日時を保存するコードなんかを共通で挟むことができます。

```ts
const converter = {
  toFirestore(user: DataItemType): firebase.firestore.DocumentData {
    return {
      name: user.name,
      age: user.age,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }
  },
  ...
}
```

### 必ずしもクラスを使わない

公式の例はクラスで実装されていますが、自分は React を使うことが多く UI 側では全部オブジェクトでデータを持ち回っており、そのクラス => オブジェクトの変換がめんどくさいのでクラスは最初から使わないようにしています。
「変換すればいいじゃん」と思うかもしれませんが、collection 間に親子関係があってクライアントサイドジョインをしないといけない場合はこの変換の回数も増えていき、見通しが悪くなっていった経験があるので最初からクラスを使わないようにしています。

## サンプルコード

https://github.com/ojisan-toybox/typed-firestore
