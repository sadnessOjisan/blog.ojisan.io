---
path: /swipe-fix
created: "2020-09-20"
title: CSS スワイプ 固定 横スクロール
visual: "./visual.png"
tags: [CSS]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

これは「要素のスワイプ機能作りたいなー、そういや Slick とか Swiper とかが実現してる、スワイプした時にピタッって固定する機能が CSS だけで作れるようになったらしいんだけど、あのプロパティ名ってなんだっけ？」ってなった時に読む記事です。
きっとあなたが探しているものは、`scroll-snap-type` です。
どうしても `overflow: x` や ライブラリを使ったやり方の方がまだまだ有名で `scroll-snap-type` という単語を知らないと検索に引っかからなさそうと思ったのでこの記事を書いています。

## scroll-snap-type

CSS の比較的新しい機能として `scroll-snap-type` があります。
約 2 年前に Chrome Dev Summit 2019 の[Next-generation web styling](https://youtu.be/-oyeaIirVC0)で取り上げられた時に一時的に盛り上がり、記憶に残っている方もいらっしゃるのではないでしょうか。（自分はこの記憶しかなかったのでこの機能を検索する時にとても苦労したという・・・）

このプロパティは[MDN](https://developer.mozilla.org/ja/docs/Web/CSS/scroll-snap-type)の説明をそのまま借りると

> スナップ点が存在する場合にスクロールコンテナーにどれだけ厳密にスナップ点を強制するかを設定

できるものです。
どういう挙動かは MDN に例が埋め込まれているので確かめてみてください。

これまでスライドショーとかを実装しようとすると、スクロール時に慣性スクロールがきいてコンテンツを最適な位置でユーザーに見せることができなかったと言ったような問題が解決できるようになります。

## 使い方

### scroll-snap-type

スクロール対象の親(コンテナ)が持つプロパティです。

```css
scroll-snap-type: x mandatory;
scroll-snap-type: y proximity;
scroll-snap-type: both mandatory;
```

などを持ちます。

`x` は横方向、`y` は縦方向を表します。
`mandatory` はユーザーがスクロールを終えた時に スナップ位置に固定、`proximity` はスクロールアクション終了以外のタイミング(例えば要素の追加・削除など)でも スナップ位置に固定します。

### scroll-snap-align

スクロール対象(アイテム)が持つプロパティです。

スクロールコンテナのどの位置で固定するか、そのスナップ位置はユーザーが指定することができます。
そのプロパティが `scroll-snap-align` です。
`start`, `end`, `center` を指定できます。

たとえばカードをスワイプさせるだけなら左固定でもいいかもしれませんが、スライドショーとかだと真ん中で固定したいというニーズもあるのではないでしょうか。
それを実現するプロパティです。

### scroll-margin

スクロール対象(アイテム)が持つプロパティです。

scroll-margin はスクロールスナップ領域の margin を定義できます。
`scroll-margin-top`, `scroll-margin-right` といった指定ができます。
つまり 固定位置からどれだけずらして固定するか を指定できます。
これがあると隣の要素をちらみせすることでユーザーにスワイプ可能であることを示すことができます。

例えばこのブログもスマホで見た時はページ下部が Swipable な領域になるのですが、次のアイテムがちょっと見えているはずでスクロール可能であることが分かるはずです。
それを実現できるプロパティです。
また、ページ全体でレイアウトが決まっていてカードの位置を固定する時にそのレイアウトに揃えたい(たとえばスクロールコンテナの親が padding を持つ)時のレイアウト調整でも私は使っています。

## まとめ

昔は Snap 位置を固定する Swipable エリアを作るためには Slick や Swiper などのライブラリが必要だったが、scroll-snap-type を使えば今は CSS だけでも実現できるので覚えておこう！

## 参考資料

- https://triple-underscore.github.io/css-scroll-snap-ja.html
- https://youtu.be/-oyeaIirVC0
