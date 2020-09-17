---
path: /noreferer-noopener
created: "2020-09-17"
title: noopener と noreferrer の整理、結局どっちを使えば良いのか
visual: "./visual.png"
tags: [HTML]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

a タグに`target=_blank`をつける時はとりあえず rel 属性に　`noopener noreferrer` と脳死で書いておけばいいと思ったのですが、どうして noreferrer だけだとだめなんだろうと気になったので調べてみました。

## 結論

noreferrer だけでも問題はないが、ちょーーーーーーーーーーーーーーーっとだけ問題がある。

## 前回までのあらすじ！

### どうして noopener noreferrer が必要なの？

a タグ には target=\_blank という設定があり、別タブで開かせることができます。

```jsx
<a href="http://example.com" target="_blank">
  アンカーリンク
</a>
```

そこで `rel="noreferrer noreferrer"` を付けようという話があり、

```jsx
<a href="http://example.com" target="_blank" rel="noreferrer noreferrer">
  アンカーリンク
</a>
```

とすることが推奨されます。

どうしてでしょうか。

#### 脆弱性対応

良い説明がたくさんあるのでそれらを引用します。

> target="\_blank"で開かれたページは、元のページを window.opener オブジェクトとして持つので、リンク先のページから window.opener.location = "danger site url" のように元ページを操作することが出来てしまうようです。rel="noopener" を使うことで、新しく開いたページから window.opener オブジェクトを使って元ページの操作をできなくできるようです。no・opener ですね。

FYI: https://chaika.hatenablog.com/entry/2018/12/06/110000

#### パフォーマンス

> target="\_blank"で開かれたページは、元ページと JavaScript が同じプロセス・スレッドで動作するようです。なので、target="\_blank"で開かれたページに負荷の高い JavaScript が実行されていると、元ページのパフォーマンス低下など影響がある可能性があるようです。

FYI: https://chaika.hatenablog.com/entry/2018/12/06/110000

#### IE 対応

しかし、noopener は古いブラウザ(例えば Chronium 以前の Edge(~79)など)ではサポートされていません。
そこで noreferrer です。
これはリファラを送らないようにする指定であり、さらに noopener と同様の効果も持ちます。

それは HTML の Spec にも書かれています。

```sh
<a href="..." rel="noreferrer" target="_blank"> has the same behavior as <a href="..." rel="noreferrer noopener" target="_blank">.
```

FYI: https://html.spec.whatwg.org/multipage/links.html#link-type-noreferrer

実際、noreferrer の方がサポートしているブラウザは広いです。

![noopenerの Can I See](./noopener.png)

![noreferrerの Can I See](./noreferrer.png)

### ESLint の警告が変わっていたよ

ところでこの rel がついていないこのコード

```jsx
<a href="http://example.com" target="_blank">
  アンカーリンク
</a>
```

をそのまま JSX に書いて eslint にかけると、

```sh
error  Using target="_blank" without rel="noreferrer" is a security risk: see https://html.spec.whatwg.org/multipage/links.html#link-type-noopener  react/jsx-no-target-blank
```

のような警告が出ます。

なので、

```jsx
<a href="http://example.com" target="_blank" rel="noreferrer">
  アンカーリンク
</a>
```

とすることで回避できます。

が、ここの警告が昔は

```sh
Using target="_blank" without rel="noopener noreferrer" is a security risk: see https://mathiasbynens.github.io/rel-noopener/
```

でした。
このときは `rel="noreferrer"` ではなく `rel="noopener noreferrer"` をつけようという話でした。

なのにいつの間にか `rel="noreferrer"` でよくなっているみたいです。

どうしてでしょうか？

### noreferrer だけを外したい動機

一方でアフィリエイトサイトに使われがちな某 CMS などで noreferrer を調べてみると、「noreferrer を外す方法を紹介します！」といった記事がたくさん出てきます。
ESLint の世界では noreferrer を付けようぜという温度感になっていたのにどうしてなんだと思っていくつか記事を読んでいくと、どうやらアフィリエイトに使う目的の一貫として、referrer が取れない = 成果がわからない といった問題が起きてしまうらしく、そういった悩みを解決する記事のようでした。
そしてそれらは 「noopener があるからセキュリティ的には大丈夫だよ」とのことでプラグインやスクリプトとして公開されており、noreferrer を外すことを望んでそうなことがみて取れました。（少数派だとは思いますが）

## ここで整理

- セキュリティへの対応として noopener をつける必要がある
- noopener と同様の効果は noreferer にもある
- noreferer のほうがブラウザのサポートが広い
- ESLint は noreferrer だけを推奨するようになった（両方つけることを非推奨にしているわけではないことに注意）
- 一方で アフィリエイト業界では noopener だけをつけたい要望が上がっている

ESLint と アフィリエイト CMS の動向が反対なのが気になりますね。
結局何を指定すれば良いのでしょうか。
そこでそれらの組み合わせについて整理していきましょう。

### 何も付けない

せめてどれか付けましょう。

### noopener のみ

[noopener](https://html.spec.whatwg.org/multipage/links.html#link-type-noopener) は spec によると

> The keyword indicates that any newly created top-level browsing context which results from following the hyperlink will not be an auxiliary browsing context. E.g., its window.opener attribute will be null.

とあり、開き元の情報を見えなくする働きを持っています。

つまりこれを使うことで、リンク先のページから元ページの操作を防げます。

ただし、 noreferrer に比べてブラウザのサポートはされません。

### noreferrer のみ

[noreferrer](https://html.spec.whatwg.org/multipage/links.html#link-type-noreferrer) は

> It indicates that no referrer information is to be leaked when following the link and also implies the noopener keyword behavior under the same conditions.

とあり、referrer を送らないだけでなく、noopener と同じ効果も持ちます。

つまりこれを使うことで、リンク先のページから元ページの操作を防げます。

そして noopener より広いサポート範囲を持ちます。

ただし referrer が送られなくなるので、トラッキングツールや広告 SDK に影響があるかもしれません。
おそらくアフィリエイトツールが気にしているのはこの辺のことです。
個人的には利用者のセキュリティを第一に考えて欲しい気持ちもありますが、アフィリエイトツールの要件次第では noreferrer と比較してサポート範囲は狭まりますが、noopener を付けましょう。

### noopener noreferrer の双方

一番安全なパターンです。
しかし ブラウザの守備範囲としては noreferrer のみ でいいと思っていますが双方をつけるメリットって一体何なのでしょうか。

noopener もつけるメリットとしては　https://github.com/yannickcr/eslint-plugin-react/issues/2022 によると、noreferrer がついていると別タブでそもそも開かなくなる不具合がある Firefox 33–35 の対応とのことです。
ただし Firefox のバージョンは自動で上がるため考慮せず、何も rel の指定がなければ noreferrer のみをつけるように警告はするが noopener がついていることに対して警告しないとなったとのことです。

上記のドキュメントは ESLint のプラグインの話なので、本当はまた違ったメリットもあるのかもしれません。
もしご存知でしたらどなたか教えてください。

と、両方つけるメリットも少しはありそうと書いたのですがそもそも spec には

```sh
<a href="..." rel="noreferrer" target="_blank"> has the same behavior as <a href="..." rel="noreferrer noopener" target="_blank">.
```

とあるので、noopener をつける必要は本当になさそうです。
付けても微々たるバンドルサイズ以外の損はないと思うので僕は付けていますが・・・
