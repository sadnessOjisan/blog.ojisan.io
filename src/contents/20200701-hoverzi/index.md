---
path: /hover-next-style
created: "2020-07-01"
title: Hover時に他の要素にスタイルを当てたい
visual: "./visual.png"
tags: [CSS]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

(iframe の実験用の記事)

Twitter のメニューなどそうなのですが、Hover した要素の中や隣接した要素のスタイルが変わるデザインってありますよね。
↓ こういうの ↓

![Twitterのメニューのホバー時デザイン](cursor.png)

これって実装しようとしたらちょっとめんどくさそうじゃないですか。
hover した要素を光らせるだけでよさそうなものの、実際は hover 可能な領域が光らせる領域より広いため、hover 属性を使えば解決というわけではありません。

こういうデザインを作る一つの例としては、コンポーネントに状態を持たせて hover してるかどうかを管理し、その状態に合わせて動的に class や CSS を書き換える方法があります。

?????????????????????

はい、「直下要素を使え」、そうですね。
JS を使わなくても大丈夫なやつでした。

**state を利用した動的なスタイル変更は楽なのでついやってしまいがちですが、これは CSS のセレクタだけで解決できる問題です**。

※ちなみ Twitter は動的に JS でスタイルを書き換えています。自分も動的にスタイルを書き換えていました（すみません・・・）

## CSS セレクタ

さきほどの Twitter の例は簡略に書くとこのように `div:hover > span` とすると、CSS だけでスタイルを当てることができます。
box を hover したときにその中にある文字にだけスタイルを当てます。

<iframe
     src="https://codesandbox.io/embed/twitternoli-y6zc2?fontsize=14&hidenavigation=1&theme=dark"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="Twitterの例"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

この `:hover` も 「hover したとき」 と考えると、分かりやすいです。
`:hober > div` なら 「hover したときその子供に〜」と考えられます。

hover したときにどうするかは CSS セレクタの種類を覚えておく必要があります。
[ここの記事](https://webllica.com/css-combinators/)が完結にまとまってて分かりやすいので、慣れていない人は見ておくとよいでしょう。
CSS に隣接セレクタ・直下セレクタ・間接セレクタがあります。
これらのセレクタを使うことで、該当要素の隣接要素や子要素にスタイルを当てられます。

たとえば、

`:hober + div` なら hover した要素の隣接する div 要素ひとつのみにスタイルを当てる、`:hober ~ div` なら hover した要素の隣接する div 要素すべてにスタイルを当てる、`:hober > div` なら hover した要素の直下の子要素すべてにスタイルを当てる

となります。

## 光らせてみた

で、:hover を「hover したとき」と考えると比較的何でもありなことができるようになります。
たとえば nth を使えば hover 時に規則を持って要素のスタイルを**JS を使わずに**書き換えることができることもできます。

たとえば以下の例では、Hover したら 2, 3, 4 の倍数ごとに光を切り替えられます。
高速に hover in/out すると目がチカチカします。

<iframe
     src="https://codesandbox.io/embed/metutiyahikaru-jvchn?fontsize=14&hidenavigation=1&theme=dark"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="めっちゃひかる"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

CSS にはそのうち親の要素に遡ってスタイルを当てられるようになる[夢の仕様](https://developer.mozilla.org/ja/docs/Web/CSS/:has)があり、 これがブラウザに実装されると hover したところを起点にいろんなものを光らせられるようになるので、pad 演奏 アプリが作りやすくなりそうだなーと妄想していたりします。（UI の書き換えによる JS の実行を削って、Audio の処理にリソースを割ける）。

↓ こういうのを CSS だけで作りたい ↓

<iframe src="https://www.youtube.com/embed/DpFkeoUU5VE" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen id="youtube"></iframe>

以上、hover の状態を使ってスタイルを書き換える必要があるとき、隣接・子要素なら CSS だけでできるので、動的な CSS は使わなくても良いよ（というよりやるな！）という自戒記事でした〜
