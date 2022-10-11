---
path: /jwt-verify-on-cae
created: "2022-05-01"
title: Fastly Compute@Edge + Rust で JWT を decode する
visual: "./visual.png"
tags: ["rust", "fastly", "c@e"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

たかが JWT と思っていたらそれなりに苦戦したのでメモ

## 準備

encode した JWT は適当に NodeJS などで用意しておく。

```js
const jwt = require("jsonwebtoken");
const fs = require("fs");
const PRIVATE_KEY = fs.readFileSync("secret.key");
const payload = {
  name: "太郎",
  age: 3,
};
const expirationSeconds = 60 * 5;
const token = jwt.sign(payload, PRIVATE_KEY, {
  expiresIn: expirationSeconds,
  algorithm: "RS256",
});

console.log("token ->", token);
```

署名に使う鍵は

```sh
openssl genrsa -out secret.key 2048
openssl rsa -in secret.key -pubout -out public.key
```

で作っておく。

## Rust で decode

### ライブラリ選定

ここでは jwt_simple を使う。
おそらくだがこのライブラリくらいしか使えない気がする。
と言っても、jsonwebtoken という人気のあるライブラリがあるにはあるものの、この crate の依存 crate が WASI 向けのコンパイルに対応していないようである。

```sh
error[E0432]: unresolved import `super::sysrand_chunk`
   --> /Users/ojisan/.cargo/registry/src/github.com-1ecc6299db9ec823/ring-0.16.20/src/rand.rs:306:16
    |
306 |     use super::sysrand_chunk::chunk;
    |                ^^^^^^^^^^^^^ could not find `sysrand_chunk` in `super`
```

FYI: <https://github.com/briansmith/ring/issues/1043>

この ring というライブラリは NodeJS でいう crypto モジュール並のもので、様々なものがこれに依存しているため、C@E で使えるものは大きく限られてしまうのである。

ところで公式には C@E 上で JWT を処理する例やブログがある。

FYI: https://developer.fastly.com/solutions/examples/json-web-tokens

FYI: https://github.com/fastly/compute-rust-auth

FYI: https://www.fastly.com/jp/blog/simplifying-authentication-with-oauth-at-the-edge

なので、技術的にはできるはずで、それらで使われているライブラリが jwt_simple である。

### decode

公式の例を見ると decode は

```rust
pub fn validate_token_rs256<CustomClaims: Serialize + DeserializeOwned>(
    token_string: &str,
) -> Result<JWTClaims<CustomClaims>, Error> {
    let public_key = RS256PublicKey::from_pem(include_str!("public.key"))?;
    public_key.verify_token::<CustomClaims>(token_string, None)
}
```

とすれば良さそうだ。ここでは鍵の中身は `include_str!("public.key")` で取り出している。

ところどころで出てきている CustomClaims は JWT に埋め込んだ payload である。それは JWS で定められた構造と違って独自の構造を持つのでユーザーが宣言しなければいけない。それは構造体で宣言される。今回の場合だと、

```rust
#[derive(Serialize, Deserialize, Debug)]
struct CustomClaim {
    name: String,
    age: u8,
}
```

として定義される。

verify_token 関数はトレイト境界として `Serialize + DeserializeOwned` 要求するので、serde を入れて derive しておく必要がある。

公式の例だと CustomClaim の代わりに NoCustomClaims を指定したりもするが、これは空の構造体であり、その結果 decode した値から body を取れなくなるので使わないようにしよう。
