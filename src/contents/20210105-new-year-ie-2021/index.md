---
path: /new-year-ie-2021
created: "2021-01-05"
title: ☆謹賀新年☆IE対応2021
visual: "./visual.png"
tags: ["IE対応"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

明けましておめでとうございます。
私はつい昨日に早速 "IE 始め" を行いました。
久々の IE 対応でいろいろなところでハマったので備忘録としてやったことを残しておきます。

## なにを IE 対応したか

TypeScript + preact 製のアプリケーションで、何らかのデータを取ってきて、それに対してユーザーの何らかの入力を保存する、よくみる現代的なアプリケーションです。
サードパーティスクリプトとしても埋め込めるように、バンドルサイズ削減を目的に preact, goober にしか依存を持たず、諸々のライブラリは自作しています。

ビルドは webpack + ts-loader で行われており、ES5 を target に吐き出しています。

では、このようなコードの IE 対応をしていきましょう。

## webpack5 の出力は必ず arrow function を含む

つい最近作り始めたものなので Webpack のバージョンは v5.9.0 です。
さて、webpack5 はそのまま使うと IE 対応できません。

webpack4 でビルドした際、そのバンドルは

```js
/ ******/ (function(modules){
/ ******/ // module cache
/ ******/ var installeddModules = {};
/ ******/
...
})
```

と出力されるのに対して、webpack5 では、

```js
/ ******/(() => {
/ ******/ "use strict";
/ *!******************!*\
...
})
```

として出力されます。

つまり、必ず arrow function が含まれます。

ts-loader や babel-loader を通した後のコードを出力する webpack の出力そのものなので、loader で tsc や babel でコントロールできるものではありません。

このコードを IE に読み込むと syntax error として扱われます。
そのため function に戻したいです。

そこで、webpack の target オプションを指定します。

FYI: https://webpack.js.org/configuration/target/

ここに

```js:title=webpack.config.js
{
    ...
    target: ["web", "es5"]
}
```

を指定します。

そうすれば、arrow ではなく function で出力できます。

### IE 対応されていないライブラリに対処する

多くのライブラリはすでに ES5 向けにビルド済みなので、webpack でビルドする際に tsc や babel を通さないやり方があります。
そうすればビルド時間を短縮できるからです。

そのオプションが exclude で、

```js:title=webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
}
```

として、node_modules を loader の対象外にします。

このようにすれば自分が書いたアプリケーションコードのみを ts-loader の対象にできます。

しかし IE 対応が必要な場合は話が変わってきます。
たとえばライブラリにある ES5 のコードが IE 対応されていない（たとえば arrow が含まれている）場合は loader に含めて IE 向けのコードに変換しなければいけません。

たとえば goober のビルド済みファイルには `=>` が 13 箇所含まれています。

```js
let e={data:""},t=t=>{try{let e=t?t.querySelector("#_goober"):self._goober;return e||(e=(t||document.head).appendChild(document.createElement("style")),e.innerHTML=" ",e.id="_goober"),e.firstChild}catch(e){}return t||e},r=e=>{let r=t(e),a=r.data;return r.data="",a},a=/(?:([A-Z0-9-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(})/gi,l=/\/\*[\s\S]*?\*\/|\s{2,}|\n/gm,o=(e,t)=>{let r,a="",l...
```

このコードを IE 対応するにはライブラリのコードも loader に読み込ませます。
tsc でも babel で target を指定していれば (polyfill の都合が抜け落ちているので不完全ではあるものの)IE 向けのコードを出力できるためです。
しかし先ほど exclude してるため、それはできないわけです。
じゃあ exclude を剥がしなよとなるのでそうしましょう。
ただそれはやりすぎなので必要なライブラリだけ include します。

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
        include: [
          path.resolve(__dirname, "src"),
          path.resolve(__dirname, "node_modules/goober"),
        ],
      },
    ],
  },
}
```

いま IE 対応が必要なので goober だけなので、ライブラリからは goober だけを loader に読ませます。

これでいいじゃんとなりますが、これだけでは動きません。

### ビルドにライブラリを含めるとビルドが落ちる

さきほどのコードをビルドすると、goober から import したモジュールが `undefined` となります。
そのためそのコードを関数として呼び出すと、「関数でないものを関数として呼び出そうとするな」と怒られてランタイムでエラーが起きます。
この時 tsc の型検査はちゃんと通っています。

## おわりに

2021 年こそは IE 対応を卒業したいです・・・
