---
path: /firebase-id-saiban
created: "2024-12-02"
title: Firestore の ID 採番を人力でやりたい
visual: "./visual.png"
tags: ["firebase"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

[Firebase と添い遂げる Advent Calendar 2024](https://adventar.org/calendars/11050)、2日目です。

## 悩み

RDB を使っている条件下でレイヤードアーキテクチャをやる際の問題として、あるAPIでリクエストデータを永続化したいとき、そのリクエストデータを元に Entity を作ろうとすると、その ID はどこから持ってくるんじゃいという問題がある。
これに対する代表的な解決策は そもそもEntityを作らないといった方法があるが、入力がドメインルールに沿ったものかは永続化する前に確かめたいので、やはりEntityは作りたい。
そんなとき、DB の Auto Increment を使わずに、自前で ID を採番してEntityを作るという解決策はよく見る。
ただし、ID は ユニークであるという保証が必要となる。
そのため、Incremental な場合は競合が起こらないようにロックを取ったり、IDを UUID にしてしまうという解決策が取られがちだ。
この解決方法、Firebaseを使っているときはどうしたら良いだろうか。

## Firebase に求められる ID

有名な話ではあるが、Firebaseを使う以上、ロックを取りながら連番のIDを使う方法は採用できない。
辞書順で近い一連のドキュメントに対して、高頻度で読み取りや書き込みを行うと、ホットスポットという問題が起きるからだ。
簡単にいうと、高レンテイシーやデータ競合を引き起こす可能性がある。

see: https://firebase.google.com/docs/firestore/best-practices?hl=ja#high_read_write_and_delete_rates_to_a_narrow_document_range

see: https://firebase.google.com/docs/firestore/understand-reads-writes-scale?hl=ja#avoid_hotspots

これを避けるためには分散されるようなIDを採番する必要がある。
その一番簡単な方法はSDKの機能を使うことだ。
例えば `collecion().add()` で挿入できるドキュメントのIDは、Firestoreに優しいIDを採番できる。

## ID だけを取得したいんやが

さて、最初の問題に戻るが、いま Entityを作るためにID だけが欲しい状況だ。
IDだけをFirebaseから取り出す方法があるのだろうか。
そのためのプラクティスとして知られているのは、

```js
const id = db.collection("hoge").doc().id;
```

だ。さて、ここでこの実装が本当に正しいのか心配になる。
まず、これまで `.add()` で採番されていた id だけが欲しいのが今のニーズだ。
それが`doc()` に引数を渡さない空のドキュメントを作って得られるというのは自分は直感に合わなかった。

また、非同期関数でないことも私は引っかかった。
なぜならDBに問い合わせてユニークなもの（連番のIncrementだから必ずユニーク）を採番してもらうというのが RDB でやっていたことだったからだ。

そしてその仕組みでないならユニークである保証はないはずで、そうなると検証が必要になるのではという点だ。

なので `db.collection("hoge").doc().id` がプラクティスとあることに対しては「ほんまかいな」と思ってしまうのだが、実は doc に引数がないときに、それなりに良さそうなIDが自動で採番されることは実装から確認できるのでそれを見ていこう。
ここで確認するバージョンは https://github.com/googleapis/nodejs-firestore/tree/v7.10.0 だ。

見るのは CollectionReference だ。

```js
doc(documentPath?: string): DocumentReference<AppModelType, DbModelType> {
    if (arguments.length === 0) {
      documentPath = autoId();
    } else {
      validateResourcePath('documentPath', documentPath!);
    }

    const path = this._resourcePath.append(documentPath!);
    if (!path.isDocument) {
      throw new Error(
        `Value for argument "documentPath" must point to a document, but was "${documentPath}". Your path does not contain an even number of components.`
      );
    }

    return new DocumentReference(
      this.firestore,
      path,
      this._queryOptions.converter
    );
  }
```

see: https://github.com/googleapis/nodejs-firestore/blob/main/dev/src/reference/collection-reference.ts#L234

`doc()`に引数を渡さないなら、`documentPath = autoId();`でIDを生成しており、そのIDはpath として DocumentReference に渡していることも実装から確認できる。

そしてそのpathはDocumentReferenceで`id`として使われていることはDocumentReferenceの実装から確認できる。

```js
get id(): string {
    return this._path.id!;
}
```

see: https://github.com/googleapis/nodejs-firestore/blob/main/dev/src/reference/document-reference.ts#L152

さて、この `autoid` はどのような実装だろうか。
それも確認してみよう。

```js
/**
 * Generate a unique client-side identifier.
 *
 * Used for the creation of new documents.
 *
 * @private
 * @internal
 * @returns {string} A unique 20-character wide identifier.
 */
export function autoId(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let autoId = '';
  while (autoId.length < 20) {
    const bytes = randomBytes(40);
    bytes.forEach(b => {
      // Length of `chars` is 62. We only take bytes between 0 and 62*4-1
      // (both inclusive). The value is then evenly mapped to indices of `char`
      // via a modulo operation.
      const maxValue = 62 * 4 - 1;
      if (autoId.length < 20 && b <= maxValue) {
        autoId += chars.charAt(b % 62);
      }
    });
  }
  return autoId;
}
```

see: https://github.com/googleapis/nodejs-firestore/blob/main/dev/src/util.ts#L57

chars(68文字) から一文字ずつ、均等な確率で抽出して 20 文字作ってるという感じだ。
まあ流石に衝突はしなさそうで良さそう。

## 結論

なのでEntity生成のためにあらかじめ自動生成されたIDが欲しいなら、

```js
const id = db.collection("hoge").doc().id;
```

で作ってしまうのが良さそう。
これはサーバーに問い合わせずに、（DBに対する）クライアント側でランダムなものを生成している。
そしてユニークな保証はないが、まあ確率的に重複することはないでしょう。
