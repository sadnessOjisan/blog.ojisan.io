---
path: /rescript-bind
created: "2021-01-26"
title: ReScript から JavaScript への bind を書く
visual: "./visual.png"
tags: ["ReScript"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

ReScript は BuckleScript と ReasonML をベースに作られたプログラミング言語で、OCaml にある便利な機能や強力な型推論を利用しつつ、JavaScript を出力できます。
ただ、ReScript の世界から JavaScript のモジュール・ライブラリ・オブジェクトを利用するためには型推論を通すためにも bind が必要となります。その bind の書き方を紹介します。

## decorator

decorator は

```sh
@bs.inline
let mode = "dev"
```

のような記法で、ソースコードを修飾することで何かしらの機能を持たせることができます。

ReScript では、主に変数宣言、関数宣言、フィールド宣言などの前に登場します。

詳しくはこちらをご覧ください。

FYI: https://rescript-lang.org/docs/manual/latest/attribute

## bind

binding には decorator を使います。

例えば、

```sh
@bs.val external timerOn: (unit => unit, int) => float = "setTimeout"
```

のようなコードです。

これは ReScript の世界で、

```sh
timerOn(()=>(), 1000)
```

と書くと、JavaScript の世界で

```js
setTimeout(() => {}, 1000)
```

として動くコードです。

このように JavaScript の世界にしかないもの(ライブラリ、グローバル空間、組み込み関数など)を ReScript 側から操作するために必要なものです。

この binding で特に大きな意味を持つものが `external` です。

external とは、

> external is like a let binding, but: The right side of = isn't a value; it's the name of the JS value you're referring to.The type for the binding is mandatory, since we need to know what the type of that JS value is.Can only exist at the top level of a file or module.

とある通り、 binding そのものの機能を提供してくれるキーワードです。

FYI: https://rescript-lang.org/docs/manual/latest/external

そしてこの external はそれを修飾する decorator によって挙動が異なります。

### @bs.val external

@bs.val external は Global な JS のオブジェクト、値への bind ができます。

FYI: https://rescript-lang.org/docs/manual/latest/bind-to-global-js-values

公式にある Tips & Tricks では

```sh
type timerId
@bs.val external setTimeout: (unit => unit, int) => timerId = "setTimeout"
@bs.val external clearTimeout: timerId => unit = "clearTimeout"

let id = setTimeout(() => Js.log("hello"), 100)
clearTimeout(id)
```

という例が提供されています。

ここでは、setTimeout で作った id でしか clearTimeout できないような制約を作っています。
それを実現しているのは `type timeId` です。
これは 型エイリアスを作る機能です。
setTimeout は timerId を返し、clearTimeout は timerId を受け取るように宣言することでこのような制約を作れます。
FlowType でいうところの opaque に近いものと捉えると良いかもしれません。

### @bs.scope

さて、JS への bind を作りたいメソッドがグローバルに生えていない場合はどうすればいいでしょうか。
例えば、 `window.location.href` に bind を作りたい場合です。
このときは bind する対象を掘っていくことで bind を作ります。
そのためのキーワードが scope です。

FYI: https://rescript-lang.org/docs/manual/latest/bind-to-global-js-values

```sh
@bs.val @bs.scope(("window", "location"))
external url: string = "href"
```

@bs.val と @bs.scope を駆使すると global オブジェクトが持つどんな値にも bind を書いていけます。
例えば chrome 拡張の開発などにも使えます。

```sh
@bs.val @bs.scope(("chrome", "storage", "local"))
external get: string => ((dataType)=>())  => () = "get"

@bs.val @bs.scope(("chrome", "runtime"))
external sendMessage: msg => ((string)=>())  => () = "sendMessage"
```

### @bs.module external

module は val に比べてもっと広い範囲で bind を作れるものです。
具体的には

- As a "record" or "struct" in other languages (like ReScript and C).
- As a hash map.
- As a class.
- As a module to import/export.

とあるように、HashMap, Class, module に対して bind を作れます。

FYI: https://rescript-lang.org/docs/manual/latest/bind-to-js-object

module のバインドを作れるということはライブラリそのものに対する bind を作れます。

```sh
// Import nodejs' path.dirname
@bs.module("path") external dirname: string => string = "dirname"
let root = dirname("/User/github") // returns "User"
```

FYI: https://rescript-lang.org/docs/manual/latest/import-from-export-to-js#import-a-javascript-modules-content

このように ライブラリの bind を作っていけます。
ただし毎度このように bind を書くのは骨が折れますが、genType という仕組みで TS や Flow の型定義から出力もできます。

FYI: https://github.com/reason-association/genType

### @bs.send external

send は関数に特化して bind できるものです。
これは既存の bind されたオブジェクトにメソッドを生やせます。

たとえば、

```sh
type document // abstract type for a document object
@bs.send external getElementById: (document, string) => Dom.element = "getElementById"
@bs.val external doc: document = "document"

let el = getElementById(doc, "myId")
```

は、

```js
var el = document.getElementById("myId")
```

となります。

### @bs.set external

bind されたオブジェクトに直接 bind された値を代入するには setter を利用します。

```sh
type window
@bs.val external window: window = "window"
@bs.set external setOnload: (window, (() => unit)) => unit = "onload"

setOnload(window, ()=>())
```

これは

```js
window.onload = function (param) {}
```

のように変換されます。

@bs.set で指定された型 `(window, (() => unit)) => unit` は 第一引数が set で生やしたい対象、第二引数に生やす関数の型を書きます。

@bs.set の挙動に関しては公式のドキュメントがどこにあるかわからなかったので、BuckleScript の資料を参照しました。

FYI: https://github.com/glennsl/bucklescript-ffi-cheatsheet#bsset
