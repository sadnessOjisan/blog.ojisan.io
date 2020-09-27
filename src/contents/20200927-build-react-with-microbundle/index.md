---
path: /build-react-with-microbundle
created: "2020-09-26"
title: microbundle で react のコードをビルドする
visual: "./visual.png"
tags: [React, microbundle]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

先日 microbundle というバンドラーを使って [reghcss](https://github.com/sadnessOjisan/reghcss) というコンポーネントライブラリを作ったのですが、ビルド体験が良かったので紹介したいです。

## microbundle とは

[microbundle](https://github.com/developit/microbundle)はゼロコンフィグなバンドラです。
preact の内部で使われており、preact を読んでいる最中で見つけたので使ってみました。
作者は preact と同じく、[developit](https://github.com/developit)です。

これは rollup のラッパーであり、もろもろの設定や最適化をコード(主に package.json)を見てよしなにしてくれます。

## 使い方

package.json の中身を見てバンドルを生成してくれます。

```json
{
  "source": "src/index.js", // input
  "main": "dist/foo.js", // CommonJS bundle
  "umd:main": "dist/foo.umd.js", // UMD bundle
  "module": "dist/foo.m.js", // ES Modules bundle
  "esmodule": "dist/foo.modern.js", // Modern bundle
  "types": "dist/foo.d.ts" // TypeScript typings directory
}
```

上記の通り様々なフォーマットで出力できますが、最小構成としては source と main さえあれば動かせます。

この状態で、

```sh
$ npx microbundle
```

とすればバンドルされたコードが main などで指定したファイルに出力されています。

## React と併用するときの落とし穴

作者のツイート曰く、

> Microbundle is actually Preact's rollup.config.js turned into a reusable tool.

とのことで、microbundle は preact を前提として作られています。

そのため、jsx の変換は h 関数で行われることが想定されており、そのまま React のコードをビルドすると

```sh
$ npx microbundle
(rpt2 plugin) Error
semantic error TS2304: Cannot find name 'h'.
```

とエラーが出ます。

これは内部で使われている rollup-plugin-typescript2 のエラーログです。
エラーの内容としては、h 関数相当の jsx から React 要素を作るものが見つけられないと言っているので、React 環境のその関数を tsc に伝えると良いです。
それは tsconfig の jsxFactory です。

なので、

```json:title=tsconfig.json
{
  "compilerOptions": {
    ...,
    "jsxFactory": "React.createElement"
  }
}
```

とすれば解決します。

jsxFactory は逆に preact の開発をするときには `h` を指定しないといけないので、preact を書いたことがあれば「ここが怪しそう」と気付けるし、そうでないならちょっと詰まっちゃうという落とし穴でした。

## おわりに

microbundle 良い！！
