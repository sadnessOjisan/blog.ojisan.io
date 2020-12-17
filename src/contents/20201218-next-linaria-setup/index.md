---
path: /ts-cbor
created: "2020-12-16"
title: NextJS で linaria を動かすために知っておくべきこと
visual: "./visual.png"
tags: ["NextJS"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

linaria の NextJS で動かすためには、linaria の install、NextJS の webpack の設定に linaria loader を付け加える、 NextJS の babel の設定が必要です。
最近 linaria + Next を仕事で使うことがあって、それぞれのステップで初見殺しっぽいものを経験したり、手順の意味を知っておいた方がいいと思ったものがあるので、まとめようとおもいます。

## linaria とは

[linaria](https://github.com/callstack/linaria) は Zero-runtime CSS in JS library であり、多くの CSS in JS ライブラリと同様の記法で書けるも、ビルド時に CSS を生成することでランタイムでのスタイル生成を無くせるライブラリです。
ただしそのため動的なスタイリングを強要する CSS を書くことはできないという制約はあります。

ビルド時に CSS を生成するため、linaria はただクライアントサイドのコードで呼び出すだけではなく、ビルドの設定も行う必要があります。
Webpack 環境を例に挙げると、linaria では公式が linaria/loader を提供しておりこれを利用します。
この linaria/loader は linaria 本体に含まれているので、特別他の loader を install する必要はありません。

linaria には スタイリングを生成する処理以外にもこのようなエコシステム向けのコードが含まれていることを覚えておきましょう。
ソースコードもモノレポになっており、様々なエコシステム向けのコードが格納されています。

FYI: https://github.com/callstack/linaria/tree/master/packages

## linaria loader を設定する

NextJS では next.config.js で webpack のビルド設定を上書けます。
ここでは linaria loader を使う設定と CSS を読み込む設定を行います。

### webpack の設定を上書くためには

NextJS で webpack の設定をカスタマイズするためには next.config.js の webpack 関数を拡張します。

```js:title=webpack.config.js
module.exports = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Note: we provide webpack above so you should not `require` it
    // Perform customizations to webpack config
    config.plugins.push(new webpack.IgnorePlugin(/\/__tests__\//))

    // Important: return the modified config
    return config
  },
}
```

FYI: https://nextjs.org/docs/api-reference/next.config.js/custom-webpack-config

この中に linaria/loader の設定を書いていきます。

### linaria/loader

では linaria/loader の設定をしましょう。

```js:title=webpack.config.js
webpack(config, options) {
    config.module.rules.push({
      test: /\.(js|tsx)$/,
      use: [
        {
          loader: "linaria/loader",
          options: {
            sourceMap: process.env.NODE_ENV !== "production",
          },
        },
      ],
    })

    return config
  },
```

取りうる option はここで確認できます。

FYI: https://github.com/callstack/linaria/blob/master/docs/BUNDLERS_INTEGRATION.md#options

sourcemap の設定以外にもキャッシュファイルの保存先の変更などが行えます。

### next-linaria

#### @zeit/next-css の設定 でも可能

NextJS では CSS ファイルを読み込む場合に必要となる設定があります。
それが [@zeit/next-css]() です。
中を読めば分かりますが、いわゆる css-loader のような設定が必要になります。

NextJS では CSS のサポートは標準で行われるようになったので、@zeit/next-css 自体は deprecated なライブラリです。
しかし [next-linaria](https://github.com/Mistereo/next-linaria) の設定にもある通り、うまく動きません。
そのため独自に CSS を読み込む設定をする必要があります。
next-linaria を使わない場合は古典的な方法ですが @zeit/next-css を使うことで CSS ファイルを読み込めるようになります。

```js
const withCSS = require("@zeit/next-css")

module.exports = withCSS({})
```

### 完成系

```js:title=webpack.config.js
const withLinaria = require("next-linaria")
require("dotenv").config()

const repoName = "/nextjs-linaria"
module.exports = withLinaria({
  linaria: {
    /* linaria options here */
  },
  assetPrefix: process.env.GITHUB_PAGES ? repoName : "",
})
```

もしくは

```js:title=webpack.config.js
const withCSS = require("@zeit/next-css")

module.exports = withCSS({
  webpack(config, options) {
    config.module.rules.push({
      test: /\.(js|tsx)$/,
      use: [
        {
          loader: "linaria/loader",
          options: {
            sourceMap: process.env.NODE_ENV !== "production",
          },
        },
      ],
    })

    return config
  },
})
```

## babel の設定

さきほどの設定でうまくいきそうなのでビルドしてみましょう。

```
$ npx next build
info  - Creating an optimized production build
Failed to compile.

./src/pages/index.tsx
Error: Cannot find module '@babel/core'
```

どうやら @babel/core がなくて怒られるようです。

### NextJS と babel

NextJS は TypeScript を使っている場合でもトランスパイルは babel で行われます。
NextJS が生成している tsconfig の jsx は preserve に設定されており、tsx => jsx に変換しており、 jsx から js への変換が babel 側で行われます。
そのときデフォルトでは next/babel という config を読み込んで変換します。

next/babel は preset で、preset-env や preset-react の設定をします。

FYI: https://github.com/vercel/next.js/blob/9dd5ff2baa716a6b12f681ff09559a3c8dd7b5cd/packages/next/build/babel/preset.ts

このとき @babel/core は devDependencies として使われるだけで、@babel/core パッケージ自体の依存はありません。

FYI: https://github.com/vercel/next.js/blob/9dd5ff2baa716a6b12f681ff09559a3c8dd7b5cd/packages/next/package.json

そのため @babel/core が要求される処理があると 動かなくなります。

そして先ほど追加した linaria/loader の中を読んでいくと、peerDependencies に@babel/core を要求します。

FYI: https://github.com/callstack/linaria/blob/master/packages/webpack5-loader/package.json#L60

そのためあらかじめユーザー側で@babel/core を持っておく必要があります。

```sh
npm i -D @babel/core
```

この状態でビルドすると、

```sh
$ npx next build
info  - Using external babel configuration from /Users/ideyuta/Documents/100_projects/toybox/nextjs-linaria/babel.config.js
info  - Creating an optimized production build
info  - Compiled successfully
info  - Collecting page data
info  - Generating static pages (2/2)
info  - Finalizing page optimization

Page                                                           Size     First Load JS
┌ ○ /                                                          310 B          63.1 kB
├   └ css/7e683157b2b93b406540.css                             39 B
└ ○ /404                                                       3.44 kB        66.2 kB
+ First Load JS shared by all                                  62.8 kB
  ├ chunks/f6078781a05fe1bcb0902d23dbbb2662c8d200b3.740a0c.js  13 kB
  ├ chunks/framework.75d3ec.js                                 41.8 kB
  ├ chunks/main.268061.js                                      6.28 kB
  ├ chunks/pages/_app.36cebf.js                                1.01 kB
  └ chunks/webpack.e06743.js                                   751 B

λ  (Server)  server-side renders at runtime (uses getInitialProps or getServerSideProps)
○  (Static)  automatically rendered as static HTML (uses no initial props)
●  (SSG)     automatically generated as static HTML + JSON (uses getStaticProps)
   (ISR)     incremental static regeneration (uses revalidate in getStaticProps)
```

成功しました。

## ソースコード

https://github.com/ojisan-toybox/nextjs-linaria
