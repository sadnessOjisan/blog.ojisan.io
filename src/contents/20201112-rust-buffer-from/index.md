---
path: /rust-buffer-from
created: "2020-11-12 20:00"
title: Rust でも require("crypto").createHash("sha1").update(key).digest("base64") したい
visual: "./visual.png"
tags: [Rust]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

websocket サーバーを作る時に sha1 の base64 ダイジェスト値が欲しくなったのでそのときのメモです。
`Buffer.from(str, 'hex')` 同等のコードの作り方を教えてくださった [@\_likr](https://twitter.com/_likr)さんありがとうございます。

Node.js でいう

```javascript
require("crypto").createHash("sha1").update(key).digest("base64")
```

に相当する関数が Rust に無くて少し困りました。
なので、同じ処理を作っていきましょう。

## Node.js の crypto の挙動

まず、

```javascript
require("crypto").createHash("sha1").update(key).digest("base64")
```

は

```javascript
Buffer.from(
  require("crypto").createHash("sha1").update(key).digest("base64"),
  "hex"
).toString("base64")
```

と同値です。

`digest()` は `'base64'` 以外にも `'hex'` を指定できます。
`'hex'`を指定すると sha1 を 16 進数で返します。

```javascript
const key = 'this_is_key'
console.log(require("crypto").createHash("sha1").update(key).digest("hex");)
// 558c6e2f93212d10f8b4ab1ac77031e2ba157471
```

そしてこれを Buffer.from でバイト列にします。
このとき、hex を指定するのを忘れないでください。

```javascript
Buffer.from(
  require("crypto").createHash("sha1").update(key).digest("hex"),
  "hex"
)
```

digest 値は 16 進数に変換されていて、Buffer.from はデフォルトでは utf-8 を想定しているためです。
つまり`"hex"`を渡しておかなければ本来の文字列と異なる文字でバイト列を作ろうとしてしまいます。
（ここが Rust 化するときの落とし穴になる）

```shellscript
558c6e2f93212d10f8b4ab1ac77031e2ba157471
<Buffer 55 8c 6e 2f 93 21 2d 10 f8 b4 ab 1a c7 70 31 e2 ba 15 74 71>
```

そうするとあとはこれを base64 にします。

```javascript
.toString("base64")
```

これで、

```javascript
console.log(
  Buffer.from(
    require("crypto").createHash("sha1").update(key).digest("base64"),
    "hex"
  ).toString("base64")
)
// 'VYxuL5MhLRD4tKsax3Ax4roVdHE='
```

を取得できます。

## Rust で同じことをする

sha1 をとるために rust-crypto というクレートを使います。

```shellscript
cargo add rust-crypto
```

まずは普通に sha1 をとります。

```shellscript
let key = "this_is_key".as_bytes();
let mut hasher = Sha1::new();
hasher.input(key);
let sha1_string = hasher.result_str();
```

このとき、`sha1_string` は 16 進数表記です。
`result_str` の挙動は `String in hexadecimal format.`を返します。

ということはここで

```javascript
Buffer.from(
  require("crypto").createHash("sha1").update(key).digest("hex"),
  "hex"
)
```

のようなことをする必要が生まれます。

つまりここで愚直に sha1 取った後に base64 化するということで、

```shellscript
// String に as_bytes はできないけど疑似コードということで。
let sha1_bytes = hasher.result_str().as_bytes();
let sha1_base64 = base64::encode(sha1_bytes);
println!("{:?}", sha1_base64);
```

とすると値はおかしくなります。
Buffer.from() で hex を指定しなかった時と同じ挙動になります。

というわけで 16 進数を前提としたバイト列を作りましょう。

幸いにも 16 進数文字列からバイト列を作るクレートがあるのでそれを使います。

```shellscript
cargo add hex
```

```shellscript
extern crate hex;

hex::decode(sha1_string)
```

そうしたらあとはこのバイト列を base64 すれば完了です。

```shellscript
let sha1_base64 = base64::encode(bytes);
println!("{:?}", sha1_base64);
```

## サンプルコード

というわけでこういう実装になります。

```shellscript
extern crate base64;
extern crate hex;

use crypto::digest::Digest;
use crypto::sha1::Sha1;

fn main() {
    let key = "this_is_key".as_bytes();
    let mut hasher = Sha1::new();
    hasher.input(key);
    let sha1_string = hasher.result_str();
    // sha1_string: 558c6e2f93212d10f8b4ab1ac77031e2ba157471
    let bytes = hex::decode(sha1_string).unwrap();
    let sha1_base64 = base64::encode(bytes);
    println!("{:?}", sha1_base64);
}
```

FYI: https://github.com/ojisan-toybox/sha-base64
