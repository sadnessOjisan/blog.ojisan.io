---
path: /next-linaria-setup
created: "2020-12-18"
title: NextJS で linaria を動かすために知っておくと良いこと
visual: "./visual.png"
tags: ["NextJS"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

linaria を NextJS で動かすためには、linaria の install、linaria/loader の設定、 babel の設定が必要です。
最近 linaria + Next を仕事で使うことがあり、それぞれのステップで初見殺しっぽいものを経験したり、手順の意味を知っておいた方がいいものがあったので、まとめようと思います。

## linaria とは

[linaria](https://github.com/callstack/linaria) は Zero-runtime CSS in JS library で、多くの CSS in JS ライブラリと同様の記法で書けるも、ビルド時に CSS を生成することでランタイムでのスタイル生成を無くせるライブラリです。

ビルド時に CSS を生成するため、linaria はただクライアントサイドのコードで呼び出すだけではなく、ビルドの設定も行う必要があります。
Webpack 環境を例に挙げると、linaria では公式が linaria/loader を提供しておりこれを利用します。
この linaria/loader は linaria 本体に含まれているので、特別他の loader を install する必要はありません。

linaria には スタイリングを生成する処理以外にもこのようなエコシステム向けのコードが含まれています。
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

linaria/loader が吐き出した CSS を NextJS の中で読み込むための設定が必要です。
それが [next-linaria](https://github.com/Mistereo/next-linaria) です。

```js
const withLinaria = require("next-linaria")
module.exports = withLinaria({
  linaria: {
    /* linaria options here */
  },
})
```

やっていることは単純で css-loader を使って CSS を解決できるようにしてくれます。

FYI: https://github.com/Mistereo/next-linaria/blob/master/index.js#L5

#### @zeit/next-css の設定 でも可能

ところで linaria がうまく NextJS で動かない理由を調べていると、[@zeit/next-css](https://github.com/vercel/next-plugins/tree/master/packages/next-css) を使って解決する例を見かけます。
しかし @zeit/next-css は deprecated なライブラリです。
このライブラリが担っていた責務は NextJS の標準でサポートされるようになっています。

FYI: https://nextjs.org/blog/next-9-2#built-in-css-support-for-global-stylesheets

しかし [next-linaria](https://github.com/Mistereo/next-linaria) の説明にもある通り、どうやらこの機能がうまく働いていないようです。
そのため独自に CSS を読み込む設定をする必要があり、@zeit/next-css の利用はその解決策となっています。
そのため next-linaria を使わない場合は古典的な方法ですが @zeit/next-css を使うことで CSS ファイルを読み込めるようになります。

```js
const withCSS = require("@zeit/next-css")

module.exports = withCSS({})
```

が、@zeit/next-css は deprecated されているライブラリなので、どうせライブラリを入れるなら next-linaria を使った方が良いのではないだろうかと個人的には思っています。

### 完成系

```js:title=webpack.config.js
const withLinaria = require("next-linaria")
require("dotenv").config()

const repoName = "/nextjs-linaria"
module.exports = withLinaria({
  linaria: {
    /* linaria options here */
  },
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

### babel.config.js の設定

クライアント側のコードで linaria を呼び出します。

```tsx
import { css } from "linaria"

const styles = {
  title: css`
    color: red;
  `,
}

export default () => {
  return <div className={styles.title}>hello world!!</div>
}
```

そしてビルドします。

```sh
$ npx next build

Error: Using the "css" tag in runtime is not supported. Make sure you have set up the Babel plugin correctly.
```

失敗しました。

Make sure you have set up the Babel plugin correctly. とのことなので、babel の設定を足せばうまく動きそうです。

ちなみに NextJS 単体では babel の設定はデフォルトで行われるので不要なので、このエラーが出たということは linaria が何かしら babel の設定を要求しています。
そして NextJS のデフォルトの babel の設定を書き換えるためには next/babel の設定に他の設定を足していきます。
ちなみに next/babel は preset で、preset-env や preset-react の設定をしています。

FYI: https://github.com/vercel/next.js/blob/9dd5ff2baa716a6b12f681ff09559a3c8dd7b5cd/packages/next/build/babel/preset.ts

ここでは linaria/babel を足す必要があります。
これは linaria が提供している babel preset です。

```js:title=babel.config.js
module.exports = {
  presets: ["next/babel", "linaria/babel"],
}
```

linaria/babel の実体は [@linaria/babel-preset](https://github.com/callstack/linaria/tree/master/packages/babel)です。
ここにある transform 関数がキモで、 linaria/loader の内部でそれを呼び出すため、あらかじめ babel の設定としてこの関数を入手する必要があります。

FYI: https://github.com/callstack/linaria/blob/master/packages/webpack4-loader/src/index.ts#L16

この transform は babel における traverser として働くので、linaria を適用するためには必要なものです。(traverser が何かについては [Babel の変換処理と向き合う](https://blog.ojisan.io/babel-parse-traverse-generate)をご覧ください。)

### NextJS 組み込みの babel の設定

さて、これで動きそうなのでビルドしてみましょう。

```sh
$ npx next build
info  - Creating an optimized production build
Failed to compile.

./src/pages/index.tsx
Error: Cannot find module '@babel/core'
```

どうやら @babel/core がなくて怒られるようです。

実は NextJS 標準の next/babel は @babel/core を依存として含んでいません。

FYI: https://github.com/vercel/next.js/blob/9dd5ff2baa716a6b12f681ff09559a3c8dd7b5cd/packages/next/package.json

そのため ユーザー側で@babel/core が要求する処理を行うとエラーとなります。
実際のところ、先ほど追加した linaria/loader の中を読んでいくと peerDependencies に@babel/core を要求しています。

FYI: https://github.com/callstack/linaria/blob/master/packages/webpack5-loader/package.json#L60

そのためあらかじめユーザー側で@babel/core を持っておく必要があります。

```sh
npm i -D @babel/core
```

この状態でビルドすると、

```sh
$ npx next build
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

## やるべきことをまとめると

必要なライブラリの install

```sh
npm i react react-dom next linaria

npm i -D next-linaria @babel/core
```

next.config.js の設定

```js:title=webpack.config.js
const withLinaria = require("next-linaria")
require("dotenv").config()

const repoName = "/nextjs-linaria"
module.exports = withLinaria({
  linaria: {
    /* linaria options here */
  },
})
```

babel.config.js の設定

```js:title=babel.config.js
module.exports = {
  presets: ["next/babel", "linaria/babel"],
}
```

(linaria/babel は linaria に含まれるので install は不要です)

## ソースコード

https://github.com/ojisan-toybox/nextjs-linaria
