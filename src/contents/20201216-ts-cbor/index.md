---
path: /ts-cbor
created: "2020-12-16"
title: RFCからCBORのエンコーダー/デコーダーを作る
visual: "./visual.png"
tags: ["NodeJS"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

今年のゴールデンウィーク明けに CBOR のエンコーダー・デコーダーを作っていました。
CBOR を使う機会があったわけではなく、jxck さんがゴールデンウィークに開催してくださった mozaic bootcamp という勉強会で推奨されたワークの一つとして、RFC を読みそれを実装するというものがあり、それに挑戦しました。
2020 年版では緊急事態宣言真っ只中ということもあり、オンライン環境下で実現できるのかという実験も兼ねて参加の機会を頂きました。

FYI: https://blog.jxck.io/entries/2019-05-12/mozaic-bootcamp-2019.html

講義の中で RFC を読んでいく最初のトレーニングとしては CBOR, UDP, WebSocket がオススメとのことでしたので、僕は CBOR を選びました。
（一緒に受けた受講生の方は WebSocket を選んでいたので、ちょっと逆張りしてみました。）

そのときに作った実装は[これ](https://github.com/sadnessOjisan/ts-cbor)なのですが、僕はそもそもビットが何か分からないレベル(0b, 0x から始まる形式が何かわからなくてググるも曖昧な言葉すぎて引っ掛からなくて途方に暮れていたレベル)の人なので、まあ迷走を極めておりひどい実装です。
そのため RFC を元にテストコードだけ先に作って、それを試行錯誤してテストを通してようやく作れたという感じです。
（ちなみに RFC を実装したものの正統性の担保をどうするのかということはめちゃくちゃ悩みました。）

それをそろそろ書き直したいなと思ってちょろちょろ調べていまして、ある程度できましたので、アドベントカレンダーの記事として選びました。

## CBOR とはなにか

CBOR は [RFC 7049](https://tools.ietf.org/html/rfc7049) で提案された仕様で、

> The Concise Binary Object Representation (CBOR) is a data format
> whose design goals include the possibility of extremely small code
> size, fairly small message size, and extensibility without the need
> for version negotiation.

とあるように、少ないコード・サイズを実現するためのデータ構造です。

形式としては微かに JSON が意識されていますが、見た目はかなり異なります。

例えば、`23`という数字は CBOR では`17` と表現され、 `a` という文字は CBOR では `6161` と表現されます。
`[1, [2, 3]` は `8201820203` と表現され、`{ a9: { あ: 1 } }` は `A1626139A163E3818201` と表現されます。

このように表現できるのは CBOR の形式が定まっており、エンコーダー・デコーダーを実装できるからです。

CBOR は 16bit のフレームに、Major type, Additional information, Payload length, payload を詰め込みデータを表現します。
wikipedia のこの図が非常にイメージとして良いものです。

![]()

### Major Type

先頭 3bit は Major type と呼ばれるものでいわばデータの型です。
その型には

- Positive integer -> 0
- Negative integer -> 1
- Byte string -> 2
- Text string -> 3
- Array of data items -> 4
- Map of pairs of data items -> 5
- Semantic tag -> 6
- Primitives -> 7

があり、それぞれ 0 - 7 のカテゴリが割り当てられ、先頭の 3bit ではこのカテゴリが格納されます。
つまり、000 - 111 のビット列で表現されます。

### Additional information

続く 5bit には Additional information が格納されます。
これは Major Type の種類によって意味は変わってくるのですが、だいたいデータの大きさを表します。例えば数字の桁数や文字数の長さや配列の長さがここに入ります。

### フォーマットを実際に読んでみよう

#### Positive Integer

Positive Integer を例にすれば、Additional information が 0 - 23(つまり 0b00000 - 0b10111) ならそれがそのままデータの値となります。Additional information が 24(つまり 0b11000) なら続く 1byte がデータの値になります。つまりその場合は 24-255 までの数値を表現できます。さらに Additional information が 25(0b11001)なら続く 2byte(つまり 256-65535)がデータの値となります。

そのため先ほどの図にあったデータフォーマットとは違ってデータの種類によっては 短く終わります。これも wikipedia の図がわかりやすいと思います。

![]()

#### Text string

Additional information が 0 - 23(つまり 0b00000 - 0b10111) ならその分だけの長さの文字列が Additional information の直後の bit 以降に格納されています。
当然ここでの文字列は人間が読める文字列ではなく、bit 列です。
この bit 列を 16 進数に変換し、それを UTF-8 の形式でデコードしたものが該当の文字です。

例えば、16 進数で「6161」が送られて来ればそれは「あ」と表現されます。

詳しくはこのテストコードを読むとイメージが掴めると思います。

FYI: https://github.com/sadnessOjisan/ts-cbor/blob/master/src/decoder/__tests__/StringDecoder.ts

注意が必要なのは長いテキストです。たとえば Additional Information が 24 であれば、続く 8bit は文字列の長さを表します。そのためその 8bit を読んだ先の bit を指定文字数だけ読む必要があります。同様に 25 であれば 続く 16bit が文字列の長さを表し、16bit を読んだ先の bit を指定文字数だけ読む必要があります。このように Additional Information 次第で読み進めるべきデータが変わってきます。

### フォーマットをルールにした関数を作るだけでは

このように MajorType と Additional information がデータの読み方を教えてくれるので、そのルールに従う関数を書けば簡単にデコード・エンコードができます。

## 自分の実装とその拙さ

では、実装していきましょう。

先ほども述べたとおり、CBOR では Positive integer, Negative integer, Byte string, Text string, Array of data items, Map of pairs of data items, Semantic tag, Primitives というカテゴリに分けられます。

Positive integer, Negative integer, Byte string, Text string の対応ができれば、Array や Map といったはそれらを組み合わせることで実装できます。
そのため再帰的にエンコーダー・デコーダーを呼び出す実装にします。

基本的には Major Type と Additional type を参考に読み進めていって、なにか矛盾が起きたら例外を投げるといった設計しにします。

```ts
// ここに実装
```

しかし複雑な構造になったり、とてつもない長さの配列を扱うときはその分計算が増える場合に、この再帰を回すのかというと「う〜〜〜〜ん」という気持ちがあります。
CBOR は何らかの構造を持つ以上、そのデコードは何らかの繰り返し表現を使うこととなりますが、再帰で行うとメモリはどんどん消費してしまいます。
なんとか良い方法を考えたいです。
そしていかにもなプログラミングが得意でない人が書いたぽさも出ているので直したいです。

## 既存実装から学んだこと

じゃあ既存ライブラリはどうしているのかと思い調べていました。
一応あることにはあって、

- https://github.com/PelionIoT/cbor-sync
- https://github.com/hildjj/node-cbor

があります。

ちなみにこれらは stream を使う以上、NodeJS でしか動かないので、実は僕が作ったものはブラウザ上で動かす方法としては優位性があるのかもしれないです。まあブラウザ版も既存実装はあって、それは似たような実装がされていました。[(cbor-js)](https://github.com/paroga/cbor-js)

## ソースコード

ごめんなさい、間に合いませんでした・・・
