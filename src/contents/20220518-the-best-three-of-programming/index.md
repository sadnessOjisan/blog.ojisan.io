---
path: /the-best-three-of-programming
created: "2022-05-18"
title: プログラミングの勉強で爆笑したこと３選
visual: "./visual.png"
tags: ["雑記"]
userId: sadnessOjisan
isFavorite: false
isProtect: true
---

プログラミングに関することで偶然見つけたり教えてもらったことのうち、面白かったものランキングです。
みんなも自分のお気に入りを教えてね。

## 第 3 位: Jeff Dean 伝説

Qiita のこの記事。

FYI: https://qiita.com/umegaya/items/ef69461d6f4967d5c623

Jeff Dean とは、

> Google の Senior Fellow. Google の基盤となる分散システムのほぼ全てに中心的に関わり、圧倒的なエンジニアリング能力を発揮したらしい。あまりにも尊敬されているため、IT 業界において全盛期のイチロー伝説のような破天荒なホラ話のネタにされている人。

とのこと。

特に面白かったのは、

> - Jeff Dean にとっては NP は"No Problem"をあらわす。
> - Jeff Dean は抽象クラスをインスタンス化できる。
> - Jeff Dean のコードはとても速いので、終了させるために HALT コードを３回も呼び出す必要がある。
> - Jeff Dean の腕時計は 1970/1/1 00:00:00 からの経過秒数を表示するが、彼は決して遅刻しない。
> - Jeff Dean が Big Table を作ったのは、彼の履歴書の項目が多すぎて記録しておく場所がなかったから。
> - 神が"光あれ"とおっしゃたとき、Jeff Dean はコードレビューするためにそこにいた。
> - ある日 Graham Bell がついに電話を発明すると、そこには Jeff Dean から不在着信が来ていた。

です。

これを知った時はプログラミングを始めたばかりで Big Table とか知らなかったのですが、そういう意味を知った今読むとまた面白くてたまに読み返しています。

## 第 2 位: True = False

Python 2.7 は True に False を代入できる。

```python
True = False
```

その結果、 `if True` のような条件分岐が逆転してしまう。

```python

if True:
  print "True"
else:
  print "False"

# False
```

これは 2.7 では組み込み定数は True, False, None などあるが、

> 注釈 None と **debug** という名前は再代入できないので (これらに対する代入は、たとえ属性名としてであっても SyntaxError が送出されます)、これらは「真の」定数であると考えることができます。
> バージョン 2.7 で変更: 属性名としての **debug** への代入が禁止されました。

とあるとおり、True, False には再代入が禁止されていないことが原因です。

FYI: https://docs.python.org/ja/2.7/library/constants.html

この現象については公式ドキュメントのどこかに「危険」みたいな感じで言及があったはずなのだが、古いので見つけられなかったです。
生きている URL を知っている人がいたら教えて欲しいです。

ちなみに最新の 3.10 ではそんなことはないので安心してください。

> 注釈 名前 None 、 False 、 True 、 \_\_debug\_\_ は再代入できない (これらに対する代入は、たとえ属性名としてであっても SyntaxError が送出されます) ので、これらは「真の」定数であると考えられます。

FYI: https://docs.python.org/ja/3/library/constants.html

## 第 1 位: fuck fuck

fuck という

> Magnificent app which corrects your previous console command.

をいったライブラリがあるのですが、`fuck` コマンドを 2 回叩くと怖いという話です。

FYI: <https://github.com/nvbn/thefuck>

fuck はコマンド実行の typo に対して、`fuck` と打てば、本来打ちたかったであろうコマンドを実行してくれるツールです。
公式の gif を見るとイメージがつきやすいと思います。

![サンプル](https://raw.githubusercontent.com/nvbn/thefuck/master/example.gif)

そして何が面白いかと言うと `fuck` に対して `fuck` を打つことで、`fsck` が走りそうになったと言う話です。

FYI: https://github.com/nvbn/thefuck/issues/1

本来の挙動では起きないはずなのですが、fuck コマンドはコマンドの履歴をパースして正しいコマンドを知るため、そのパース結果によっては起きうる現象のようです。

なにより

> running "fuck" twice almost gave me a heartattack #1

というタイトルからしてもう面白いですよね。

## いかがでしたか？

いかがでしたか？
