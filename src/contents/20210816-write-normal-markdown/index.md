---
path: /write-normal-markdown
created: "2021-08-16"
title: 正しく Markdown を書こうと思った
visual: "./visual.png"
tags: ["Markdown"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

いい加減 URL を直せ〜〜〜〜 と言われ続けている問題です。

## 事の発端

[ブログを さくら VPS に移管しました](https://blog.ojisan.io/sakura-vps) にある通り、このブログは一度 0 から作り直されています。
実はそれが起因しているバグがありまして、URL がリンクでなくなっています。例えば、

- <https://blog.ojisan.io/ts-jest>
- <https://blog.ojisan.io/s-c-kigo>

などに登場するリンクです。

<https://blog.ojisan.io/ts-jest> として表示されて欲しいものが、https://blog.ojisan.io/ts-jest として表示されており、リンクになっていません。

何が起きているかというと、`[]()` や `<>` を使っていないリンクが、自動的にリンクにならずにそのまま表示されてしまっています。

これはいろんな人から指摘を受けていたのですが、「すぐ直せるからよしななタイミングで直しとく」と言って放置していました。
そして、先日これは簡単に直せないことに気づきました。

## 直せない理由・直さない理由

まず、直せると思っていた理由ですが、それは使っている markdown parser [pulldown-cmark](https://github.com/raphlinus/pulldown-cmark) が autolink のサポートを持っていたからです。
pulldown-cmark には markdown の AST 表現を Node 単位で書き換えられる機能があり、 Pattern Matching で該当する https://~ 文字列を autolink 属性 に書き換えられます。
しかしいざこれをやろうとすると、 https://~ をブログの全文から抜き出して変換できないケースがあったり、そもそもこれは正しい Markdown といえなさそうでそれを見つけて直すほうが正しいアプローチな気がしたので見送りました。

## 正しい Markdown ってなんだろう

権威を求めて [RFC 7764](https://datatracker.ietf.org/doc/html/rfc7764) を参照します。
"Guidance on Markdown: Design Philosophies, Stability Strategies, and Select Registrations" という題と、

> This document elaborates upon the text/markdown media type for use with Markdown, a family of plain-text formatting syntaxes that optionally can be converted to formal markup languages such as HTML. Background information, local storage strategies, and additional syntax registrations are supplied.

という序文の通り、Markdown とは何かについての詳しい説明がされています。

[Registration Templates for Common Markdown Syntaxes](https://datatracker.ietf.org/doc/html/rfc7764#section-3) によると、Markdown の Spec/Syntax としては以下のものがあります。(全部に目を通していないですが列挙します。)

- MultiMarkdown
- GitHub Flavored Markdown(GFM)
- Pandoc
- Fountain (Fountain.io)
- CommonMark
- kramdown-rfc2629 (Markdown for RFCs)
- rfc7328 (Pandoc2rfc)
- PHP Markdown Extra

これら間で持っている機能や文法は多少異なっています。
そのため、たとえば GFM 準拠で書かれた Markdown を CommonMark の parser を通すと期待通りになりません。
ちなみに私が出会っていた問題は、GFM で書かれたものを CommonMark の parser で解読したからでした。

この [CommonMark](https://commonmark.org/) の Why is CommonMark needed? には、

> Because there is no unambiguous spec, implementations have diverged considerably over the last 10 years. As a result, users are often surprised to find that a document that renders one way on one system (say, a GitHub wiki) renders differently on another (say, converting to docbook using Pandoc). To make matters worse, because nothing in Markdown counts as a “syntax error,” the divergence often isn’t discovered right away.

> There’s no standard test suite for Markdown; MDTest is the closest thing we have. The only way to resolve Markdown ambiguities and inconsistencies is Babelmark, which compares the output of 20+ implementations of Markdown against each other to see if a consensus emerges.

> We propose a standard, unambiguous syntax specification for Markdown, along with a suite of comprehensive tests to validate Markdown implementations against this specification. We believe this is necessary, even essential, for the future of Markdown.

> That’s what we call CommonMark.

とモチベーションが説明されており、様々な仕様があって困ったことが原体験にあること、"We believe this is necessary, even essential, for the future of Markdown." と書かれていること、これまでに利用した Markdown Parser がこの記法をサポートしていたことを受け、この Spec こそが標準であり正しい Markdown とみなして使うことにします。

`essential` と書かれている通り、他の記法は CommonMark に独自の機能を足したケースが多い気もしたので、とりあえずこの CommonMark で書いておけば移植は容易になるのではと思っています。

## CommonMark の autolink と GFM, remark と pulldown_cmark

私の前のブログは <https://github.com/sadnessOjisan/blog.ojisan.io> で、依存を見たら分かる通り Gatsby で作られています。
Gatsby の仕組みとしてプラグイン機構があり、Markdown の 変換も プラグインで行っています。
[gatsby-transformer-remark](https://www.gatsbyjs.com/plugins/gatsby-transformer-remark/) がそのライブラリです。
お察しの通り、このプラグインは内部で [remark](https://github.com/remarkjs/remark) を使っています。

では、remark が GFM をサポートしているのでしょうか？試しに実験しました。

<https://github.com/ojisan-toybox/remark-playground>

```js
import { unified } from "unified";
import markdown from "remark-parse";
import remark2rehype from "remark-rehype";
import html from "rehype-stringify";

const processor = unified().use(markdown).use(remark2rehype).use(html);
const input = `
  * https://flaviocopes.com/how-to-enable-es-modules-nodejs/
  * <https://flaviocopes.com/how-to-enable-es-modules-nodejs/>
`;

processor.process(input).then((res) => {
  console.log(res);
});
```

```
VFile {
  data: {},
  messages: [],
  history: [],
  cwd: '/Users/ideyuta/Documents/100_projects/toybox/remark-playground',
  value:
    '<li>https://flaviocopes.com/how-to-enable-es-modules-nodejs/</li>\n' +
    '<li><a href="https://flaviocopes.com/how-to-enable-es-modules-nodejs/">https://flaviocopes.com/how-to-enable-es-modules-nodejs/</a></li>\n' +
    '</ul>'
}
```

autolink `<>` の記法がなければただの文字列になってしまったようです。
これは正しい挙動です。

ではなぜ 前のブログでは勝手にリンクになっていたのでしょうか。
それは、 gatsby-transformer-remark が内部で [remark-gfm](https://github.com/remarkjs/remark-gfm) を利用しているからです。

```js
if (gfm) {
  // TODO: deprecate `gfm` option in favor of explicit remark-gfm as a plugin?
  remark = remark.use(remarkGfm);
}
```

<https://github.com/gatsbyjs/gatsby/blob/a35d615f9c8d596230ecd1f121f214b9879eb7d3/packages/gatsby-transformer-remark/src/extend-node-type.js#L115>

さらにこの gfm option は default で true です。

```js
// Setup Remark.
const {
  blocks,
  footnotes = true,
  gfm = true,
  tableOfContents = {
    heading: null,
    maxDepth: 6,
  },
} = pluginOptions;
```

<https://github.com/gatsbyjs/gatsby/blob/a35d615f9c8d596230ecd1f121f214b9879eb7d3/packages/gatsby-transformer-remark/src/extend-node-type.js#L100>

この option は gatsby-transformer-remark を Gatsby に適用するときに切れるのですが、僕はそれを見落としていて(というより Markdown に様々な種類があることを知らなかったため)そのまま使っていました。

```js
// In your gatsby-config.js
plugins: [
  {
    resolve: `gatsby-transformer-remark`,
    options: {
      // GitHub Flavored Markdown mode (default: true)
      gfm: false,
      // Plugins configs
      plugins: [],
    },
  },
],
```

つまり僕は前のブログを気づかないままに GFM 形式で書いていたのです。

そして今回移行に使った pulldown_cmark は、

> This library is a pull parser for CommonMark, written in Rust. It comes with a simple command-line tool, useful for rendering to HTML, and is also designed to be easy to use from as a library.

とある通り CommonMark 形式です。
そのため自動で https://~ がリンクにならないのです。
リンクにするためには `<https://~>` と言った形で明示的に autolink にする必要があったのです。

## 僕がすべき事

Text として存在している https://~ 文字列を `<https://~>` に書き直す。

## 僕は何をすべきだったか

正しい Markdown を知り、それを順守して書くべきでした。
日頃から標準に触れて頭に叩き込むのは大事ですね。
あー悔しい。
