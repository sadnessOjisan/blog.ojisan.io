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

これの対処法を教えてくださった、[@about_hiroppy]()さん、ありがとうございました。

## IE 対応されていないライブラリに対処する

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

## ビルドにライブラリを含めるとビルドが落ちる

さきほどのコードをビルドすると、goober から import したモジュールが `undefined` となります。
そのためそのコードを関数として呼び出すと、「関数でないものを関数として呼び出そうとするな」と怒られてランタイムでエラーが起きます。
この時 tsc の型検査はちゃんと通っています。

もしかすると皆さんの環境では落ちないのかもしれません。
しかし、私は落ちていて、落ちていた理由は tsconfig.json の `allowJS` です。
ライブラリ側のコードを tsc のビルド対象に含めるので `allowJS: true` にする必要がありました。
こうすることでビルドが通るようになります。

ちなみに今まで `allowJS: false` にしてビルドを通せていたのは webpack.config.js で `exclude: /node_modules/` していたからで、そもそもライブラリにある JS をビルド対象に含めていなかったためです。
それが IE 対応するためにビルド対象に node_modules を含める必要が出てきて顕在化した問題だったという訳です。

これの原因を教えてくださった、[@sinaygeek]()さん、ありがとうございました。

##　 Object.assign の polyfill

自分のコードは状態管理部分を ContextAPI + useReducer で行っており、state を作るための計算で spread 演算子を使用します。

```js
export const reducer = (state: State, action: ActionType): State => {
  switch (action.type) {
    case START_FETCH_DATA:
      return {
        ...state,
        isLoading: true,
        data: undefined,
        error: undefined,
      }
    case SUCCESS_FETCH_DATA:
      return {
        ...state,
        isLoading: false,
        data: action.payload,
        error: undefined,
      }
    case FAIL_FETCH_DATA:
      return {
        ...state,
        isLoading: false,
        data: undefined,
        error: action.payload,
      }
    default:
      return state
  }
}
```

さて、この spread 演算子は ES6 の機能の一つですが、ES5 へと出力するとこのようになります。

before

```js
const old = { k: "v" }

const newObj = { ...old, k: "v2" }
```

after

```js
"use strict"
const old = { k: "v" }
const newObj = Object.assign(Object.assign({}, old), { k: "v2" })
```

spread 演算子は ES5 では `Object.assign` になります。
さて、この `Object.assign` は IE11 では動作しません。

FYI: https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Object/assign

なので、これを解消するために polyfill を入れましょう。
polyfill の入れ方は CDN 経由でヘッダに差し込んだり、node_moudles として import したり色々ありますが、私は自前で src 配下に polyfill コードを入れました。

1 ファイルで完結する有名なコードがあるので依存をわざわざ増やさなくて良い、手元にあるコードはバンドラにまとめさせられるので最適化を効かせられるようになるためです。（最適化のくだりは loader に node_modules を含めることができる今の構成ならば、node_modules 経由でも同じ効果が得られる。）

私はこのようなコードを配置し、

```js
// @ts-nocheck
/* eslint-disable */

if (!Object.assign) {
  Object.defineProperty(Object, "assign", {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function (target) {
      "use strict"
      if (target === undefined || target === null) {
        throw new TypeError("Cannot convert first argument to object")
      }

      var to = Object(target)
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i]
        if (nextSource === undefined || nextSource === null) {
          continue
        }
        nextSource = Object(nextSource)

        var keysArray = Object.keys(Object(nextSource))
        for (
          var nextIndex = 0, len = keysArray.length;
          nextIndex < len;
          nextIndex++
        ) {
          var nextKey = keysArray[nextIndex]
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey)
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey]
          }
        }
      }
      return to
    },
  })
}
```

[副作用として root で import](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/import#Import_a_module_for_its_side_effects_only) しました。

```js
import "./lib/object-assign-polyfil"
```

参考にした（丸パクリした）コードはこれです。

FYI: https://gist.github.com/spiralx/68cf40d7010d829340cb#file-object-assign-js

このコードを使わなくても MDN のページにも似た Polyfill があります。

## fetch polyfill

さてアプリケーションでは fetch メソッドを使っています。
その fetch メソッドは IE サポートされていませんので、これも何かしらの手を考える必要があります。

一番楽なのは最初から axios などの IE サポートがある fetch ライブラリを使っていることです。
axios は「fetch を標準で使えるのだからバンドルサイズ的にも採用する理由ないじゃん w」などと言われたりしていますが、IE サポートができたり、isomorphic に fetch できたり、バンドルサイズ相応のメリットはあります。
というより fetch を使っていても結局その fetch を IE や NodeJS で動かすためのあれやこれやをすれば結局バンドルサイズが膨らんでしまうので同じ話になります。

ただ後から IE サポートすることになったという場合だと axios に置き換えるなんてことはすこし手間がかかるので別の方法を考えたくなるでしょう。
というわけで polyfill を入れましょう。

### fetch の代用、whatwg-fetch

まず fetch そのものの代用手段として whatwg-fetch というものがあります。
（ソースコード自体は Github 本家の直下にありますが、誰がどういう経緯で作ったものなのかやなぜ whatwg の名を冠しているかは知りません。）

FYI: https://github.github.io/fetch/

これは fetch というメソッド名ではあるものの、内部では XMLHttpRequest を使うコードです。

```js
export function fetch(input, init) {
  return new Promise(function (resolve, reject) {
    var request = new Request(input, init)

    if (request.signal && request.signal.aborted) {
      return reject(new DOMException("Aborted", "AbortError"))
    }

    var xhr = new XMLHttpRequest()

    ...
  })
}
```

FYI: https://github.com/github/fetch/blob/master/fetch.js#L508

つまりこの fetch メソッドは IE11 でも動くコードです。

### whatwg-fetch を使うために

さて、これを IE 環境で使うようにしたい、つまり Chrome などの環境と IE 環境で出し分ける仕組みを設けたいです。

それを実現するスニペットとして[How to polyfill JavaScript fetch function for Internet Explorer](https://dev.to/adrianbdesigns/how-to-polyfill-javascript-fetch-function-for-internet-explorer-g46)にはこういうものがあります。

```js
var isIE = !!window.MSInputMethodContext && !!document.documentMode

if (isIE) {
  // Create Promise polyfill script tag
  var promiseScript = document.createElement("script")
  promiseScript.type = "text/javascript"
  promiseScript.src =
    "https://cdn.jsdelivr.net/npm/promise-polyfill@8.1.3/dist/polyfill.min.js"

  // Create Fetch polyfill script tag
  var fetchScript = document.createElement("script")
  fetchScript.type = "text/javascript"
  fetchScript.src =
    "https://cdn.jsdelivr.net/npm/whatwg-fetch@3.4.0/dist/fetch.umd.min.js"

  // Add polyfills to head element
  document.head.appendChild(promiseScript)
  document.head.appendChild(fetchScript)

  // Wait for the polyfills to load and run the function.
  // We could have done this differently,
  // but I've found it to work well for my use-cases
  setTimeout(function () {
    window
      .fetch("https://path/to/api.endpoint")
      .then(handleResponse)
      .catch(handleErrors)
  }, 1000)
} else {
  // If fetch is supported, just run the fetch function
  fetch("https://path/to/api.endpoint").then(handleResponse).catch(handleErrors)
}
```

上記のコードでは IE のときだけ whatwg-http を CDN 経由で取得して、そこで得た fetch メソッドを window.fetch から呼び出しています。
どうして window から呼べるのかというと、whatwg-http が global に 中身が XMLHttpRequest の fetch メソッドを登録しているからです。

CDN で読み込んでいる whatwg-http を確認してみると、(解説のため minify 前のライブラリを利用)

```js
if (!global.fetch) {
  global.fetch = fetch
  global.Headers = Headers
  global.Request = Request
  global.Response = Response
}
```

と、しています。

そのため先ほどのコ e ドを fetch メソッドとしてユーザーが呼び出せば、IE のときでもうまく動くようになります。

### その他 polyfill

これで動くかと思いきや「error: TypeError: このオブジェクトではサポートされていない操作です」とだけ表示され、トレースに現れないエラーが現れました。
まあ何かしらのメソッドが足りてないのだろうなと思い、とりあえず babel-polyfill を入れて動かしました。
そうすると動きました。
何が足りていないのかは把握できていないので見つけ次第入れ替える予定です。

この手の polyfill は core-js を入れるべきかと思ったのですが、いまは tsc でビルドしており、tsc も lib を入れてくれるので、そこである程度カバーできると思い、core-js より古くてバンドルサイズが小さい babel-polyfill を入れました。

polyfill 周りがガバガバなのは正直 tsc だけを使っている時に polyfill をどうしたらいいかわかっていないというのがあるので、誰か教えてくれると助かります。
個人的には必要な polyfill を差し込む仕組みは@babel/preset-env 経由の方がやりやすいなと感じました。
@babel/preset-env を噛ませるために多段ビルドする話も聞いたことがあり、そういうのも面白そうだなぁと思っています。

ちなみに polyfill を入れていくとバンドルサイズは 200kb を超えました。
なんのために preact を採用したのやら :angel:

## flex-box 周りの修正

案の定 flex-box 周りも色々崩れました。
flex-box のバグだけを集めたレポジトリがあるので、これを見ながら適宜直しました。

FYI: https://github.com/philipwalton/flexbugs

## おわりに

2021 年こそは IE 対応を卒業したいです・・・
