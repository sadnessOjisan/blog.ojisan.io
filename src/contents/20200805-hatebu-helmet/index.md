---
path: /hatebu-helmet
created: "2020-08-05 18:00"
title: はてブのネガティブなコメントからreact-helmetで守る
visual: "./visual.png"
tags: [React]
userId: sadnessOjisan
isProtect: true
---

はてブにおけるネガティブなコメントやそれが引き起こす炎上から自分を守るための、そのプロテクト機能をこのブログに実装した話です。

## 燃えたくないけど目立ちたい

私はこのブログを運用する上で 「燃えたくないけど目立ちたい」という気持ちを持っています。
ブログを書くからにはやっぱり反応は欲しいし、たくさんの人に見られたいというのが率直な感想です。
そのため、燃えるのを防ぐためにも誰かを煽ったり傷つけたりせずに、健全に運営して行こうというのを意識して運営しています。

### 言及したら負けに対処したい

とはいえ、健全にブログを書こうとしても燃えることもあるなというのもあるなというのが最近思うことです。
特に何らかの意見を発信したり、とある技術・ライブラリに言及したらネガティブなコメントがつくといったことを日々観測しています。

例えば、

- 「Y を使うと X を解決できる」と言っただけで「Y を採用する人と仕事したくない」のようなコメントだったり
- 「その書き方(漢字や平仮名の運用)が気に食わないから読む気失せた」のようなコメントだったり
- 「誤字があるから読む気失せた」のようなコメントだったり

ネガティブなコメントが付いたりしています。
そしてそのようなコメントが拡散された結果、そういったコメントがさらにつきやすくなって炎上に到るケースも見ます。

もちろんデメリットがあるという指摘は正しいもので、意見に対する反論も正しいものですが、そこで人格否定までされてしまうと書き手としては落ち込むと思います。
また記事の主題と異なったところで否定されるのも落ち込みます。

実はこのブログではそういったネガティブコメントはあまり受け取ったことはないのですが、定期的に更新する以上はいつか炎上まで繋がる日が来るだろうなと思って少し凹んでいます。
ただ、炎上する時は書く前から分かっていて、自分の中でも「これ書いたら燃えそうだなぁ」って察しているネタもあったりして、そういったネタを記事化できるように先手を打って行こうと思います。

## はてブのコメント欄は非表示にできる

はてブ歴が長い人はご存知だと思いますが、はてブのコメント欄は非表示にできます。

![非表示](./mienai.png)

これはページの metatag に

```html
<meta name="Hatena::Bookmark" content="nocomment" />
```

とすることで実現できます。
詳しくは[公式のヘルプ](https://b.hatena.ne.jp/help/entry/nocomment)をご参照ください。

ただメタタグに書くので SPA などの構成だとアプリケーションの全体にその設定が波及してしまいます。
**燃えたくないけど読まれたい**といった考えを持つ私にとっては全部をオフにしたくはないです。
そこで部分的にメタタグを書き換えれる react-helmet を使います。

## 燃えそうな記事だけコメントを非表示にする

### react-helmet とは

> This reusable React component will manage all of your changes to the document head.

FYI: https://github.com/nfl/react-helmet

React アプリケーションで `<head>`タグを書き換えることができるものです。
JSX の中に書くので JS の変数を展開できます。

使い方はシンプルで

```jsx
import React from "react"
import { Helmet } from "react-helmet"

class Application extends React.Component {
  render() {
    return (
      <div className="application">
        <Helmet>
          <meta charSet="utf-8" />
          <title>My Title</title>
          <link rel="canonical" href="http://mysite.com/example" />
        </Helmet>
        ...
      </div>
    )
  }
}
```

のように使います。（公式例）

### 実装例

ではこのブログにも react-helmet を適用していきましょう。

このブログは Gatsby で作られているので SPA ではないのですが、メタタグの埋め込みは react-helmet で行っており、公式の標準構成です。
OGP 画像がセットされているのもこの react-helmet の恩恵であり、すでに利用しているものです。

部分的に helmet を適用させたいので、適用したい記事の frontmatter に

```yml
---
path: /hatebu-helmet
created: "2020-08-05 18:00"
title: はてブの炎上をreact-helmetで守る
visual: "./visual.png"
tags: [React]
userId: sadnessOjisan
isProtect: true
---

```

という風に isProtect というフラグを渡しておき、

記事取得のクエリで

```js
export const pageQuery = graphql`
  query BlogTemplate($path: String!) {
    post: markdownRemark(frontmatter: { path: { eq: $path } }) {
      // 省略
      frontmatter {
        isProtect
      }
    }
  }
`
```

として isProtect のフラグを取得し、記事コンポーネントで

```tsx
post.frontmatter.isProtect && (
  <Helmet
    meta={[
      {
        name: "Hatena::Bookmark",
        content: "nocomment",
      },
    ]}
  />
)
```

としてフラグが true のものだけ Helmet を被せると完了です。

## これで燃えないから好き放題言ってオーケー？

とこれで炎上対策できたので、安全圏から好き放題言えそうなのですが、そうではありません。
コメントが表示できないだけでブックマークはでき、そのブックマークページは生成されます。
あまりにも過激なことを言うとそのブックマークページ自体をブックマークされて言及があったりもするので、注意しましょう。

書き手も読み手もお互いに敬意を持って意見を発信しよう！
