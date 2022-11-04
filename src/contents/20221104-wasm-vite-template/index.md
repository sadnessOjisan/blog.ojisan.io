---
path: /wasm-vite-template
created: "2022-11-04"
title: お気軽に Wasm の動作確認する用のテンプレート作った
visual: "./visual.png"
tags: ["rust", "wasm", "vite"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

OGP は 「顔パックに噛み付く人」で AI 生成した。標準の webpack を vite で置き換えるものということでそうしたのだが、なんかすごいのが出来上がった。バンドラの箱を開けたってコト！？

「Rust のこの機能やこの Crate って Wasm としてブラウザで使えるんだっけ？」と思うことはままあると思う。
そこでタイトルにある通りお気軽に Wasm の動作確認する用のテンプレート作った。

<https://github.com/sadnessOjisan/wasm-vite-template>

## 使い方

clone してきて、

```
gh repo clone sadnessOjisan/wasm-vite-template
```

run するだけ。

```
wasm-pack build --target web --out-dir web/pkg && cd web && npm install && npm run dev
```

wasm-pack がなければ各自公式から DL しておこう。

## 解説

ベースは [React + Rust + Wasm でオンラインモザイクツールを作る](https://blog.ojisan.io/pwa-night) の時の実装だ。

### Webpack ではなく Vite を使う

一応 [wasm-pack](https://rustwasm.github.io/wasm-pack/) の公式にも [テンプレート](https://github.com/rustwasm/rust-webpack-template) は存在しているのだが、webpack.config.js が

```js
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

const dist = path.resolve(__dirname, "dist");

module.exports = {
  mode: "production",
  entry: {
    index: "./js/index.js",
  },
  output: {
    path: dist,
    filename: "[name].js",
  },
  devServer: {
    contentBase: dist,
  },
  plugins: [
    new CopyPlugin([path.resolve(__dirname, "static")]),

    new WasmPackPlugin({
      crateDirectory: __dirname,
    }),
  ],
};
```

といった感じで、あまり最小構成感がない。設定をシンプルに保ちたいと思い、今回 vite を選択した。

そん結果、レポジトリを見たら分かる通り、vite の設定ファイルすら存在しない状態で動く。これは vanilla JS で動かしているからではあるが、もし React を入れて動かしたいと言う場合は

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
});
```

といった簡単な設定ファイルを足せば良い。ただどちらかというと、vite 部分だけ `npm init vite` で作り直すことを推奨する。

### wasm-pack は npm 管理下に吐き出す

`wasm-pcak build` で生成するファイルは vite でビルドするファイルから読み込むので、pakckage.json の隣か、その子 dir に置きたい。wasm-pack に --out-dir option があるので、そこで指定しよう。

### wasm-pack のビルドターゲットは web

[book](https://rustwasm.github.io/wasm-pack/book/commands/build.html#target) にある通り、target に色々指定できる。何も指定しない場合は bundler が選択される。[doc](https://rustwasm.github.io/docs/wasm-bindgen/reference/deployment.html#bundlers) にある通り、このモードは bundler が wasm-bindgen に対応していないといけないが、現時点ではこの対応があるのは webpack だけのようである。今回は vite を使うため、この target が使えずそこで今回は代わりに web を指定する。

その制約とはいっては何だが、wasm モジュールを呼び出す前に init しないといけない。

```js
import init, { greet } from "./pkg";

init();

document.querySelector("#app").innerHTML = `
      <button id="greet">greet</button>
`;

document.getElementById("greet").addEventListener("click", () => {
  greet();
});
```

これに関しては公式のテンプレートに解説があり、

```js
// Use ES module import syntax to import functionality from the module
// that we have compiled.
//
// Note that the `default` import is an initialization function which
// will "boot" the module and make it ready to use. Currently browsers
// don't support natively imported WebAssembly as an ES module, but
// eventually the manual initialization won't be required!
import init, { add } from "./pkg/without_a_bundler.js";

async function run() {
  // First up we need to actually load the wasm file, so we use the
  // default export to inform it where the wasm file is located on the
  // server, and then we wait on the returned promise to wait for the
  // wasm to be loaded.
  //
  // It may look like this: `await init('./pkg/without_a_bundler_bg.wasm');`,
  // but there is also a handy default inside `init` function, which uses
  // `import.meta` to locate the wasm file relatively to js file.
  //
  // Note that instead of a string you can also pass in any of the
  // following things:
  //
  // * `WebAssembly.Module`
  //
  // * `ArrayBuffer`
  //
  // * `Response`
  //
  // * `Promise` which returns any of the above, e.g. `fetch("./path/to/wasm")`
  //
  // This gives you complete control over how the module is loaded
  // and compiled.
  //
  // Also note that the promise, when resolved, yields the wasm module's
  // exports which is the same as importing the `*_bg` module in other
  // modes
  await init();

  // And afterwards we can use all the functionality defined in wasm.
  const result = add(1, 2);
  console.log(`1 + 2 = ${result}`);
  if (result !== 3) throw new Error("wasm addition doesn't work!");
}

run();
```

とのこと。

FYI: <https://github.com/rustwasm/wasm-bindgen/blob/ca742a84c432d404b1202271de5c06233c890143/examples/without-a-bundler/index.html>

> But eventually the manual initialization won't be required!

とあるので将来的には不要になるようだ。

## お気持ち

### ビルド方法めんどくさい

`wasm-pack build --target web --out-dir web/pkg && cd web && npm install && npm run dev` は長いし気持ち悪いですよね。
そういうときは [cargo-make](https://github.com/sagiegurari/cargo-make) がオススメです。

結局は力技ですが、こういう風にタスクを定義できます。

FYI: https://github.com/sadnessOjisan/umie/blob/main/Makefile.toml

### init したくない

webpack だと明示的に init しなくていいからこちらの方が良い気がしますよね。
おそらく vite より webpack の方が bundler として機能が豊富なのでしょう。
調べていませんが vite に wasm_bindgen 対応すれば解決されるのでしょう。
情報提供求。
