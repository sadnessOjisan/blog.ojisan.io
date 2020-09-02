---
path: /-masonry-style-css
created: "2020-09-01 09:00"
title: ピンタレストっぽいMasonryレイアウトをCSSだけで実現する
visual: "./visual.png"
tags: [CSS]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

言いたいことが分かる人はタイトルを見てめちゃくちゃなタイトルと思われるかもしれませんが、言いたいことは伝わると思います。
こういうレイアウトを作ってみましょう。

![ピンタレストのトップページ](./pintarest.png)

実は筆者はこういうデザインなんといえばいいのか分かってないです。
いつも「[ピンタレスト](https://www.pinterest.jp/)っぽいやつ」「Masonry レイアウト」とか言ったり言われています。
ググってもそういう表現している人はいます、Masonry like などと言ったりもしています。
ちなみに [Masonry](https://masonry.desandro.com/) はこれを実現する jQuery プラグインです。

このUIはこのブログのトップページでも使われています。
それを実装したときの話や辛かった話をしたいと思います。

![blogのトップページ](./blogtop.png)

## 何気に難しいピンタレストUI

ピンタレストのトップページって画像を並べているだけなので簡単そうに見えるのですが、作ってみるとそうでもないことがわかります。
要素の高さが全部異なっています。
これをそのまま並べると縦幅に空白ができた状態で要素が並びます。

## よくある解決策

### Masonryのようなライブラリを使う

古典的な方法としてはMasonryというjQueryプラグインがあげられます。
このUIが流行ったときはこのプラグインがよく利用されていたらしいです。（自分はその世代ではないので伝聞ですが）
jQueryプラグインということはjQuery環境を強いられるかというとそうでもなく、VueやReactの世界からjQueryを使うことも可能なので、jQuery環境でなくても無理やり使える方法です。
ちなみに僕の初めての仕事はそれでした。
実現可能ではあるのですが、バンドルサイズを増やしたくない・依存を増やしたくなかったのでこのブログでの実装は見送りました。

### flexboxを使った実装

縦に並べることが一つの方法として挙げられます。
高さを固定し要素をすべて1列に並べ(`flex-direction: column`)、溢れたら横の列に並べるとすれば良いです。
そしてその横幅は 100/列数 %(たとえば3列なら33.3%など)とすれば定められた列数でmasonryレイアウトが実現できます。
しかし高さを溢れさせて折り返すので、高さの制限をする必要があります。
その制限はスクロール領域を産むことにつながるので将来的にスクロール周りで困ることありそうだなと思ってこのブログでの実装は見送りました。

FYI: https://digipress.info/tech/pure-css-flexbox-masonry-sample/

### gridを使う

その悩みはgridを使えば解決します。

FYI: https://w3bits.com/css-masonry/

ただしこのブログはGridに対応されていないブラウザからも見られており、その環境での動作確認ができないこともあり、さらにはポリフィルも大変そうだったので実装は見送りました。

FYI: https://ics.media/entry/17403/

## 一番簡単なMasonry対応

マルチカラムにすることです。
CSS3には `column-count` というプロパティがあり、これを使うことで断組みレイアウトが簡単に実現できます。
マルチカラムの段組みにすることで自然とMasonryになります。

しかしこのままでは中途半端に折り返しが起きるみたいなトラブルも起きるはずなので（おそらくこのブログだと左から2列目の先頭が半分途切れてずれる）、それを防ぐ `break-inside: avoid;`を追加します。
この[break-inside](https://developer.mozilla.org/ja/docs/Web/CSS/break-inside)は生成されたボックスの途中でどう領域を区切るかを指定できます。
ここでは折り返しが起こらない `avoid`を指定します。

またこのブログでもあったのですがこのままでは最下段の余白が潰れると言ったことが起きます。
それはマルチカラム内部の要素を `display: inline-block;` にしたら解消します。

FYI: https://www.bricoleur.co.jp/blog/archives/4336

このブログでも同様の問題が起きていたのは [@y_temp4](https://twitter.com/y_temp4) さんに修正してもらいました。
元のデザインがどうなっていてどう修正されたかはこの [PR](https://github.com/sadnessOjisan/blog.ojisan.io/pull/83) にまとまっているのでご覧ください。
[@y_temp4](https://twitter.com/y_temp4)さんありがとうございました。

最終的にはブログのトップページではこのようなCSSになりました。


```css
.cards {
  margin: 0 auto;
  padding: 5px;
  width: 90%;
  column-count: 4;
  column-gap: 0;
}

.card {
  margin: 16px;
  margin-top: 0;
  -webkit-column-break-inside: avoid;
  page-break-inside: avoid;
  break-inside: avoid;
  box-shadow: 8px 12px 10px -6px rgba(0, 0, 0, 0.3);
  display: inline-block;
}
```

## マルチカラムで実現した場合の欠点

残念ながら上から下に要素が並んでいきます。
そのため時系列に左から右に並べるなんていったことはできません。
このブログでもそうなっています。

これは grid を使えば解決できます。

FYI: https://codepen.io/andybarefoot/pen/XVgmxZ?editors=0100

ただ この例のHTMLを見比べると高さが足りず実は見切レていることがわかると思います。それは動的に位置計算をJSで行って調整する必要もあります。

FYI: https://medium.com/@andybarefoot/a-masonry-style-layout-using-css-grid-8c663d355ebb

## まとめ

そのために本当に完璧な Masonry を作るなら Grid + JS の組み合わせになると思います。
もし画像をただ並べたいといったような用途であればマルチカラムを使うのが一番楽だと思います。