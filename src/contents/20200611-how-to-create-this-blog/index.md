---
path: /1st-blog-stack
created: "2020-06-10"
title: Gatsby + TypeScript で技術ブログを書くための知見
visual: "./visual.png"
---

Blog を作りました！！
「プログラミングの修行する」と言って会社を辞めて 5 ヶ月経ったいま、堕落しきって何もやれていないことに対する危機感が結実してこの Blog が生まれました。

で、作ってみたものの書く内容が特にないので、このブログをどうやって作ったかについて書きます。
「こういう記法にちゃんと対応しているかな？」とかを試す目的でも書いています。

## 技術スタック

根幹になっているものは、

- TypeScript
- Gatsby

です。

元々は [amdx](https://github.com/mizchi/amdx) + [NextJS](https://nextjs.org/), もしくは完全自作 SSG を考えていたのですが、 **ブログは完璧を目指しているといつまでも完成しない** ということは知っているので、一番自分が理解しているツールを使うことにしました。

しかし、ただ使うだけなのはチャレンジ性がなかったので、TypeScript を使ってみることにしました。
知っている限りでは Gatsby には TS サポートが全然なかった(特に page に型を付けるのが型注釈を書いて信じるしか無かった)のですが、いまは頑張ればできるみたいです。キービジュアルにネタバレがあるのですが、codegen を使います。で、この記事ではその頑張りとかを書いていきます。

スタイリングは CSS Modules でやっています。styled-components も考えたのですが、静的ビルドしたときにパフォーマンスを出せるかが分からなかったので、シンプルに CSS をそのまま埋め込める CSS Modules を選択しました。
ソースコードのハイライトは prismjs でやってます。

## 作る流れ

### 機能を考える

以下の 3 つの blog を参考にしました。

- [mizchi.dev](https://mizchi.dev/)
- [blog.uhy.ooo](https://blog.uhy.ooo/)
- [blog.jxck.io](https://blog.jxck.io/)

だいたい機能としては、

- TOC で共有
- syntax hilight
- github 連携、PR で修正とか issue でコメントとかを考えました。

あたりを真似ました。

本当は [mizchi.dev](https://mizchi.dev/) にある git から履歴を作る機能はどうにかして入れたいなっていま試行錯誤してます。

デザインは,

- amp starters
- medium

を参考にしました。

### 雛形作る

`gatsby new` で blog 自体はできます。

### TS 対応する

plugin でできます。

### md 入稿できるようにする

remark を使います

```javascript:title=gatsby-config.js
module.exports = {
  ...,
  plugins: [
  ...,
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          // NOTE: title を前におく必要あり
          {
            resolve: "gatsby-remark-code-titles",
            options: {},
          },
          {
            resolve: `gatsby-remark-prismjs`,
            options: {
              classPrefix: "language-",
              inlineCodeMarker: null,
              aliases: {},
              showLineNumbers: true,
              noInlineHighlight: false,
              languageExtensions: [
                {
                  language: "superscript",
                  extend: "javascript",
                  definition: {
                    superscript_types: /(SuperType)/,
                  },
                  insertBefore: {
                    function: {
                      superscript_keywords: /(superif|superelse)/,
                    },
                  },
                },
              ],
              prompt: {
                user: "root",
                host: "localhost",
                global: false,
              },
            },
          },
        ],
      },
    },
  ],
}
```

### on blur の画像を入れます

### md 内の画像も入れられるようにしました

### toc jump

### social share

自前で作りました。
はてブのボタンは作り方がわからなかったので採用していません。
公式を使わずにブックマークボタンを設置する方法があれば誰か教えてください。

## がんばりポイント

### TS のセットアップ（でも標準スターターでもされている）

### tsconfig の設定

### graphql-codegen を使って型定義を得る

### prismjs の設定

### GA の設定

## これからすること

### 0 から作り直す？

ほら〜やっぱりこうなりました！

頑張ったものの、 やってることって結局は md を HTML に変換しているだけなので、「Gatsby 使う必要あったか？」と思っています。
もっと薄く作れるのではないかと思っています。

どうせなら世界最速・・・とは言わなくても区内最速くらいのブログにはしたいです。
最速にするためにも余計なものは削ぎ落としたく、そうなると Gatsby に頼るのはよくなさそうです。

ただ gatsby を剥がそうと勉強すればするほど、その利便性に気付き、特に gatsby-image は強力で、やらかしがちなボトルネックを取り除いてくれるので、そこまでの実力者でない自分にとってはやっぱり Gatsby が最速になるのかなと思っています。

### AMP 対応

可能な限りいろんなものに対応させたいので AMP 対応はやりたいです。
自分にとって AMP はタダで使える CDN ともみていて、PWAMP(PWA + AMP)構成 にして、お金をかけなくても初回はエッジサーバーから返して、二回目からはキャッシュから描画みたいなことをやりたいです。

AMP 対応を考えると、Gatsby が吐く HTML は amp valid ではなく、一方で Next.js は Amp Optimizer が使えるので乗り換え先としてみています。
amdx + Next.js はその辺りを解決しているので乗り換え先候補です。
もしかすると amp optimizer を埋め込んだ transform plugin を書くという手もあるのですが、なんか大変そうなので乗り気にはならないです。

## おわりに

Blog を作ったことなので、ゲームばっかりせずに頑張って修行します！！！
しばらくはこのブログをパフォーマンスチューニングしていき、就活用のアウトプット記事もたくさん書いて行きます。
Civ6 も Factorio もやりません！！！
