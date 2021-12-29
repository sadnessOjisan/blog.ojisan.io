---
path: /firebase-config-guard
created: "2021-12-05"
title: firebase の設定ファイルの検証や補完ができるツールを作った
visual: "./visual.png"
tags: ["firebase"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

この記事は [sadnessOjisan Advent Calendar 2021](https://adventar.org/calendars/7015) 5 日目の記事です。

「firebase の設定ファイルに何を書いたら良いか分からない」、「firebase.json と .firebaserc ってどっちがどっちだっけ」とよく悩むので、それを解決するライブラリを作りました。

それが firebase-config-type-definition です。

FYI: https://github.com/sadnessOjisan/firebase-config-type-definition

## 使い方

設定ファイルに型注釈をつけるとどこが間違っているかを教えてくれたり、補完ができるようになります。

```ts
import { Firebaserc } from "firebase-config-type-definition";
const json: Firebaserc = {
  hosting: [
    {
      target: "hoge",
      public: "packages/lib/hoge",
      ignore: ["firebase.json", "**/.*", "**/node_modules/**"],
    },
    {
      target: "fuga",
      public: "packages/fuga/public",
      ignore: ["firebase.json", "**/.*", "**/node_modules/**"],
    },
  ],
};
```

現実には設定ファイルは TS ファイルではないので、それをオンラインで簡単に試せるよう CodeSandbox にチェックできる環境を用意しました。

<iframe src="https://codesandbox.io/embed/firebase-config-type-definition-sandbox-2dbzv?fontsize=14&hidenavigation=1&theme=dark"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="firebase-config-type-definition-sandbox"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

## 仕組み

.firebaserc に関しては手動で型定義ファイルを書きましたが、 firebase-config.json は本家が JSON Schema を持っているので、そこから生成しました。

FYI: https://github.com/firebase/firebase-tools/blob/master/schema/firebase-config.json

このような schema があるので、あとは [quicktype](https://quicktype.io/) などを通せば TS の定義を生成できるというわけです。
