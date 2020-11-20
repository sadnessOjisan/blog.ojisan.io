---
path: /luxon-tukattemita
created: "2020-11-18"
title: luxon 使ってみた
visual: "./visual.png"
tags: ["JavaScript"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

「何を今さら」って感じのタイトルですが、最近 初めて luxon を使って「へぇ〜〜〜」って思ったことが色々あったのでまとめていきます。
当方 moment, dayjs しか使ったことがなかったので、「こういう差分があるんだなぁ」と学んだという話です。

## immutable

moment では、

```js
const now = moment()
console.log("now", now)
const addNow = now.add(1, "days") // これをやるとnowそのものが書き換わるから注意！
console.log("addNow", addNow)
```

などとすると、now も変更されていたのが、luxon だと

```js
const luxon = require("luxon")

const now = luxon.DateTime.local()
console.log("now", now)
const addNow = now.plus(1, "days")
console.log("addNow", addNow)
```

としても now は変更されません。

moment の後継ライブラリは基本的に immutable になっています。

## デフォルトインポートした関数を使えない

moment や dayjs は日付オブジェクトを作成するとき、

```js
const now = moment()
console.log("now", now)
```

などとできますが、luxon では DateTime というクラス（と呼んでいいかは知らないけど）を使って作る必要があります。

```js
const luxon = require("luxon")

const now = luxon.DateTime.local()
console.log("now", now)
```

dayjs も moment 気分で使えていたのでこの挙動は最初はハマりました。

## 比較関数がない

DateTime にはいわゆる isAfter や isBefore のような関数が DateTime オブジェクトに存在しません。
一応そのようなインターフェースは [Interval](https://moment.github.io/luxon/docs/class/src/interval.js~Interval.html) というパッケージに含まれていますが、これは moment-range 相当のものですのでただ比較するだけに持ち出すのはオーバーなものです。
それに [公式](https://moment.github.io/luxon/docs/manual/math.html#comparing-datetimes) の推奨方法は違ったものです。
それはただ

```js
d1 < d2
```

とするだけです。(d1, d2 は DateTime 型)

DateTime 型は valueOf としてタイムスタンプへの変換が実装されており、それは比較前に実行されるのでこのような比較方法でも前後を比較できます。

FYI: [Object.prototype.valueOf()](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf)

FYI: [比較演算子](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Comparison_Operators)

## date だけにフォーマットできる

YYYY-MM-DD 形式で取得するとき、moment だと

```js
// 日付だけを表記
const formatDate = moment().format("YYYY-MM-DD")
console.log("formatDate", formatDate)
```

としていたものが、

```js
// 日付だけを表記
const formatDate = now.toISODate()
console.log("formatDate", formatDate)
```

として取得できて便利でした。
カレンダー作るときとかに使えますね。

## timezone は標準で扱える

moment だと`require("moment-timezone");` とすることで、`.tz`を生やしていました。

```js
const samoa = utc.tz("Pacific/Apia")
console.log("samoa", samoa)
```

それが luxon では setZone として標準で使えます。

```js
const samoa = now.setZone("Pacific/Apia")
console.log("samoa", samoa)
```

便利。

## まとめ

dayjs が割と moment 気分で使えることもあり、そのようなインターフェースに慣れ切っていた自分にとって luxon は調べながらでないと満足にコードを書けなくて少し辛かったのですが、使い方さえ覚えたら moment より便利になっているなぁと感じられました。
ただ自分は moment のインターフェースに慣れ切っているので dayjs の方を好んで使うかなぁと思います。
