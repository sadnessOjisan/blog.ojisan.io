---
path: /firebase-v9-storage
created: "2021-12-08"
title: Firebase v9 + cloud storage チュートリアル
visual: "./visual.png"
tags: ["Firebase"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

この記事は [sadnessOjisan Advent Calendar 2021](https://adventar.org/calendars/7015) 8 日目の記事です。

firebase v9 のリリースによって firebase SDK の記法は大幅に変わりました。
この変更の大きな目玉は tree shaking が効きやすくなったというものですが、その代償として全てを chain して書くことができなくなり、様々な関数を組み合わせて書いていくスタイルへとなりました。

そのためドキュメントは大幅に書き換える必要があり実際書き換わっているのですが、auth や firestore と比較して利用者が少ない storage は日本語ドキュメントが書き換わっていません。
このままだと新 API でどう書けばいいか分からないと思いますので、firebase v9 で storage を使う方法を紹介します。

また、いま初めて storage を使うという人が ~v8 のドキュメントを読まなくても良いように、cloud storage の基本的な概念や用語の解説をしながら解説します。

## storage の構造

参照: ファイル、フォルダへのポインタ

ファイル: データ。JS でいう File や Blob を想定しているが、文字列も保存できる

フォルダ: 階層。参照を作るときに `/` で区切ることで作れる。昔は child メソッドでも作れたが v9 では `/` 区切りで作る。

バケット: 開発者にとっての保存領域すべてそのもの。firebase config で設定する URL であり firebase project に紐づいている storage を設定するが、別 project の storage へのアクセスも可能になる。それにはその URL を指定した storage を作る必要がある。

## 使い方

default storage を作る。つまり、default のバケットを作る。

```js
import { getStorage } from "firebase/storage";

const storage = getStorage();
```

bucket 名を明示して storage を作る

```js
import { getStorage } from "firebase/storage";

const BUCKET_NAME = "gs://my-project.appspot.com";

export const storage = getStorage(app, BUCKET_NAME);
```

ファイルへの参照を作る

```js
import { ref } from "firebase/storage";

const imageRef = ref(storage, `${user_name}.png`);
```

フォルダとファイルを同時に作る

```js
import { ref } from "firebase/storage";

const userImageRef = ref(storage, `user_images/${user_name}.png`);
```

上記からフォルダへの参照を作る

```js
import { ref } from "firebase/storage";

const userImagesRef = userImageRef.parent;
```

参照に対して画像をアップロードする

```js
import { uploadBytes } from "firebase/storage";

uploadBytes(userImageRef, file).then((snapshot) => {
  // no op
});
```

文字列ファイルをアップロードする

```js
import { uploadString } from "firebase/storage";

uploadString(ref(storage, "hoge/fuga/piyo"), "hogeeeeeee");
```

## 終わりに

ドキュメントを **英語版で** 見ると全部書いてある。

FYI: https://firebase.google.com/docs/storage/web/start
