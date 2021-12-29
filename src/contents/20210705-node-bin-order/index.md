---
path: /node-bin-order
created: "2021-07-05"
title: 同名の bin script を持つ package を install するとどうなるのか？
visual: "./visual.png"
tags: ["NodeJS"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

package.json には [bin フィールド](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#bin) があり、ここでは package の実行ファイルを実行するコマンドを登録できます。
ここに登録されたコマンドは package の install 時に `./node_modules/.bin/` に保存され、この領域は `npx hoge`, `yarn hoge` として実行できます。

## 同名 bin を持つ package を install する

ここで、同名 bin を持つ package の install を考えます。諸々の実験を [same-name-node-bin](https://github.com/ojisan-toybox/same-name-node-bin) でしたので、これを例に使います。

いま、same-name-node-bin-for-aaa と same-name-node-bin-for-bbb というパッケージを用意します。

これらはそれぞれ

```js
export const aaa = () => {
  console.log("aaa");
};
```

```js
export const bbb = () => {
  console.log("bbb");
};
```

という関数を index.js に持ちます。

そしてそれらを実行する関数として、bin に

```js
// aaa.js
const aaa = require("../src/index").aaa;

aaa();
```

と

```js
// bbb.js
const bbb = require("../src/index").bbb;

bbb();
```

を用意します。

このとき、それぞれの package.json に

```json
{
  "bin": {
    "same-node-bin-for": "bin/aaa.js"
  }
}
```

```json
{
  "bin": {
    "same-node-bin-for": "bin/bbb.js"
  }
}
```

と書きます。

このように書くことで、この package の install 時に `npx same-node-bin-for` や `yarn same-node-bin-for` が実行できるようになります。

ではこのとき、同名の bin を持つこれらの package を`npm i same-name-node-bin-for-aaa same-name-node-bin-for-bbb` などとして install した場合、node_modules/.bin の中はどうなるのでしょうか？

## 答え

- node_modules/.bin の中に same-node-bin-for というファイルが生まれる。
- same-node-bin-for の中身は、先に npm i したもの

つまり、`npm i same-name-node-bin-for-aaa` した後に `npm i same-name-node-bin-for-bbb`とすると、 same-name-node-bin-for-aaa の bin が same-node-bin-for となります。
なので、bbb を期待すると予想が外れることとなるので注意しましょう！

## おわりに

そもそも同名の bin を使わないように package 名を bin 名に付けるなりして工夫しましょう。
ちなみに同名の bin スクリプトが降ってくるライブラリがあります。(ex. `@storybook/*`)
