---
path: /firebase-batch-add-v9
created: "2021-12-18"
title: firestore v9 で batch.add を実現する
visual: "./visual.png"
tags: ["Firebase", "firestore"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

この記事は [sadnessOjisan Advent Calendar 2021](https://adventar.org/calendars/7015) 18 日目の記事です。書かれた日付は 1/12 です。

firestore には atomic な処理をすることができる口があるのですが、それを使ってデータを追加する方法についてです。

## firestore の atomic 処理

<https://firebase.google.com/docs/firestore/manage-data/transactions?hl=ja> に全部書いています。

ドキュメントには、

> オペレーション セットでドキュメントを読み取る必要がない場合は、複数の書き込みオペレーションを 1 つのバッチとして実行できます。このバッチには、set()、update()、delete() オペレーションを自由に組み合わせて含めることができます。書き込みのバッチはアトミックに実行され、また複数のドキュメントに対する書き込みを実行できます。次の例は、書き込みのバッチを作成して commit する方法を示しています。

とあります。

つまり、バッチ書き込み機能を使うと A というデータを操作し B というデータという操作し、そのどちらかに失敗した場合、もう片方の処理もなかったことにしてくれます。
そのため一連の操作をまとめ、そのまとめた操作に対して成功・失敗のどちらかしか起きないようにしてくれ、中途半端に片方の処理だけが実行されるということを防いでくれます。
具体的には batch オブジェクトを作り、命令を batch に set し、最後にその batch を commit すると可能です。

```ts
import { writeBatch, doc } from "firebase/firestore";

// Get a new write batch
const batch = writeBatch(db);

// Set the value of 'NYC'
const nycRef = doc(db, "cities", "NYC");
batch.set(nycRef, { name: "New York City" });

// Update the population of 'SF'
const sfRef = doc(db, "cities", "SF");
batch.update(sfRef, { population: 1000000 });

// Delete the city 'LA'
const laRef = doc(db, "cities", "LA");
batch.delete(laRef);

// Commit the batch
await batch.commit();
```

## データの追加を batch で行いたい

ここで、batch がサポートしている命令は、`set()`、`update()`、`delete()` のみです。つまり `add()` がありません。

firestore でいう add は、

```ts
import { collection, addDoc } from "firebase/firestore";

// Add a new document with a generated id.
const docRef = await addDoc(collection(db, "cities"), {
  name: "Tokyo",
  country: "Japan",
});
console.log("Document written with ID: ", docRef.id);
```

(<https://firebase.google.com/docs/firestore/manage-data/add-data?hl=ja#add_a_document>)

のように、ドキュメント ID を自動で発番し、それに紐づく形でデータを追加します。

そのためまだ ドキュメント ID がないようなデータの追加が容易であり、Firestore のドキュメント ID はホットスポットを避けるようなルールが推奨されたりユニークであることが求められたり、自前で発番することはめんどくさく避けたいです。

そして batch ではこの add がサポートされていないのです。

## add は set で代替できる

ところで 公式ドキュメントによると、

> .add(...) と .doc().set(...) は完全に同等なので、どちらでも使いやすい方を使うことができます。

とあります。

<https://firebase.google.cn/docs/firestore/manage-data/add-data?hl=ja>

そこで `batch.add()` ができないなら `set()` で代替する方法を模索しましょう。

## batch 上で add を set で代替する

StackOverflow に同様の質問がされており、このような回答があります。

```ts
const batch = firestore().batch()
const sampleRef = firestore().collection(‘sample’)
const id = sampleRef.doc().id
batch.set(sampleRef.doc(id), {...})
batch.commit()
```

FYI: <https://stackoverflow.com/a/56702313/16362657>

これは Firebase v8 での記法なので v9 対応します。

ハマりポイントは、`sampleRef.doc().id` です。
空っぽの doc を作ってその id を取る方法ですが、v9 では、`doc(yyyColRef).id`で取得できます。

そのため実装はこの通りになります。

```ts
export const postXxxYyy = async (xxx: XData, yyy: YData) => {
  const db = getFirestore();
  const batch = writeBatch(db);

  const xxxData = {
    // xxx fileds
  };

  const xxxColRef = collection(db, "xxx");
  const xxxId = doc(xxxColRef).id;
  const xxxDoc = doc(db, "xxx", xxxId);
  batch.set(xxxDoc, xxxData);

  const yyyData = {
    // yyy fileds
  };

  const yyyColRef = collection(db, "yyy");
  const yyyId = doc(yyyColRef).id;
  const yyyDoc = doc(db, "yyy", yyyId);
  batch.set(yyyDoc, yyyData);

  await batch.commit();
};
```
