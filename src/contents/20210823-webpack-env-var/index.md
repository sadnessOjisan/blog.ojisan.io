---
path: /webpack-env-var
created: "2021-08-23"
title: webpack でビルドするときの環境変数を読み込む方法の整理と、読み込み方法の切り替え
visual: "./visual.png"
tags: ["NodeJS", "webpack"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

みなさんご存知の通り webpack での環境変数の設定は plugin に書けばおしまいな話ですが、いろいろやり方がありそれぞれメリット・デメリットがあります。そのため、「ローカルでは .env から読み込みたいけどデプロイ時は CD 環境の環境変数を使いたいのだが、どの方法が良いだろうか」「Git で管理するファイルへのハードコードはしたくない」などとケーススタディに即答できるかと言われると怪しいです。このように状況や要件によってはその読み込み方法の選定に悩むこともあったので、関連する技術の整理をしました。

## よく見るやり方

「webpack 環境変数」などでググると下記のようなやり方があるようです。

### .env に書き出す

.env ファイルに書き出し、なんらかの手段でビルド実行時の Node.js 環境から引っ張ってきます。dotenv や dotenv-webpack といったライブラリが使われます。

### 環境変数として渡される

webpack のビルドは Node.js の環境で行われるので、設定ファイルを実行しているときは環境変数を `process.env.HOGE` から取得できます。なので、webpack 実行時に `HOGE=hogeeee npx webpack` などとして渡した値を使えます。その取得した値をバンドル時にアプリケーションに埋め込むことで、クライアントアプリケーションから環境変数を利用できます。埋め込みには DefinePlugin などが使われます。

### resolve される前提で import 文で読み込む

<https://qiita.com/syoimin/items/3dac2626f0a4e240ee55> などで紹介されているやり方です。本質的には .env や DefinePlugin を使うやり方と同じですが、plugin 設定が不要などの利点はあります。ただし module でないものを import し、それが解決されることが前提のコードになるので保守の観点からは不都合が生まれるかもしれません。

## 代表的な機能やライブラリ

上記のやり方を支える機能やライブラリがあるので、それぞれの使い方を考えてみます。

### webpack.DefinePlugin

[DefinePlugin](https://webpack.js.org/plugins/define-plugin/) は、

> The DefinePlugin replaces variables in your code with other values or expressions at compile time.

とある通り、ビルド時にソースコード変数を他の値で置き換えられる機能です。これによって `process.env.HOGE` といった環境変数を読み込もうとしている箇所を、何か別の値で上書くことができます。その結果アプリケーションは定数を参照することとなりますが、その定数をビルド時に環境変数になるようにしておけば、ユーザーにとってはさも環境変数を呼び出したかのように見せられます。

注意としては文字列を環境変数として渡したいときはその文字列を `JSON.stringify` しなければいけません。webpack.DefinePlugin が行うことは指定した Value の置き換えなので、クオートが外れた状態で置き換えられてしまいます。なので stringify を使うか、'"hogeee"' のような値を渡す必要があります。

### webpack.EnvironmentPlugin

[EnvironmentPlugin](https://webpack.js.org/plugins/environment-plugin/) は、

> The EnvironmentPlugin is shorthand for using the DefinePlugin on process.env keys.

とある通り、DefinePlugin を環境変数に特化させたようなモノです。

DefinePlugin は環境変数以外の値も定数で置き換えられるので、環境変数を置き換えるためには process.env をわざわざ key に含めて、さらには key と value で同じ値を使う必要がありましたが、EnvironmentPlugin はそういった手間を自動的に解消してくれるものです。

公式の例を挙げれば、

```js
new webpack.EnvironmentPlugin(["NODE_ENV", "DEBUG"]);
```

は

```js
new webpack.DefinePlugin({
  "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  "process.env.DEBUG": JSON.stringify(process.env.DEBUG),
});
```

と同等です。

### dotenv

[dotenv](https://www.npmjs.com/package/dotenv) は

> Loads environment variables from .env for nodejs projects.

とある通り、.env を NodeJS 環境で読み取れるライブラリです。

```js
const result = dotenv.config();

if (result.error) {
  throw result.error;
}

console.log(result.parsed);
```

このように error と parsed を key に持ったオブジェクトができますが、環境変数は parsed の中にオブジェクトとして格納されます。

あくまでも .env から値を取得できるだけなので、webpack で使う場合には、webpack.DefinePlugin と組み合わせる必要があります。

### dotenv-webpack

[dotenv-webpack](https://www.npmjs.com/package/dotenv-webpack) は

> A secure webpack plugin that supports dotenv and other environment variables and only exposes what you choose and use.

とある通り、.env をサポートしている webpack plugin です。

```js
const Dotenv = require('dotenv-webpack');

module.exports = {
  ...
  plugins: [
    new Dotenv()
  ]
  ...
};
```

のようにして使います。`Dotenv` という変数に代入するのが通例にもなっていそうに思えます。

先ほどの dotenv との違いは、こちらは環境変数の展開も自動でやってくれています。

FYI: <https://github.com/mrsteele/dotenv-webpack/blob/master/src/index.js#L129>

## ローカルでは .env から読み込みたいけど、デプロイ環境では .env から読みたくないとき

.env は便利なので使いたいです。ただし、.env ファイルを GitHub 上で管理したくない + ハードコーディングしたくない場合があると思います。webpack を使うプロジェクトは多くの場合がフロントエンド開発でありソースコードは public になっても問題がない場合がほとんどだとは思いますが、開発環境のエンドポイントは見せたくなかったり SSR するようにもなって後任者がうっかり.env に見えちゃいけないものを書いてしまったりというケースです。

そのため .env を ignore しているプロジェクトが多いと思います。一方でそうすると CD 環境でのビルドが手間です。なので CD 上で動的に .env を作り出しビルドすることもあります。しかしそのような処理を書くのは思いの外めんどくさいし、壊れることもあるし、CD パイプライン上でのデバッグも大変です。それを横着して、別の config フォルダから .env としてコピーしてくるコードもみたこともありますが、別のところにハードコードするのは本末転倒です。そこで、開発時は .env から読み込み、デプロイ時は .env 以外の方法で環境変数を読み込む方法を考えてみましょう。

### dotenv-webpack と dotenv のどちらを使うべきか

開発時は .env から読み込み、デプロイ時は別の方法で環境変数を読み込むのであれば、webpack.config.js 上で .env がいま存在しているかによって環境変数を読み込む方法を分ける必要があります。

dotenv-webpack は .env を読み取った上で webpack への設定をするため、環境変数そのものを扱うのがすこし苦手です。なのでここでは dotenv を使います。そして webpack での環境変数の展開は手動で行います。

### というわけで実装

```js
const webpack = require("webpack");
const dotenv = require("dotenv");

const env = dotenv.config().parsed;
const config = {
  ...,
  plugins: [
    env !== undefined
      ? new webpack.DefinePlugin({
          "process.env": JSON.stringify(env),
        })
      : new webpack.DefinePlugin({
          "process.env.HOGEHOGE": JSON.stringify(
            process.env.HOGEHOGE
          ),
          "process.env.FUGAFUGA": JSON.stringify(
            process.env.FUGAFUGA
          ),
        }),
  ],
};

module.exports = config;
```

.env がないと `dotenv.config().parsed` は `undefined` になるのでそれを利用しています。
ない場合は、起動時の変数やパラメータストアから引っ張って来れる値を使って、DefinePlugin で埋め込みます。

### 懸念点

さて、.env がない場合は webpack.DefinePlugin などから直接環境変数を埋め込んでいくわけですが、もしここに書いた内容と.env で齟齬があると、デプロイ先でのみでバグが発生します。いわば、.env と DefinePlugin で二重管理になっています。

なので環境変数を使う時は直接 `process.env.HOGE` とするのではなく、`getHoge()`関数でラップして、なければ例外や Result 型を返して呼び出し側でハンドリングさせたり、アプリケーションのエントリポイントで必要な環境変数がなければ例外を投げて起動できなくするなどの工夫をしています。

```ts
const HOGE = process.env.HOGE;
const FUGA = process.env.FUGA;

if (HOGE === undefined || FUGA === undefined) {
  throw new Error("環境変数をセットしろ〜〜〜〜〜");
}

// 環境変数は絶対にここからしか呼ばない
export const getHOGE = (): string => {
  return HOGE;
};

export const getFUGA = (): string => {
  return FUGA;
};
```

sample code: <https://github.com/ojisan-toybox/webpack-dot-env>

もっと良いやり方があれば [@sadnessOjisan](https://twitter.com/sadnessOjisan) まで教えてください。
