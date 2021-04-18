---
path: /rust-frontmatter-parse-and-get-data
created: "2021-04-19"
title: Rust で frontmatter からデータを取得する
visual: "./visual.png"
tags: ["Rust"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## frontmatter からデータを取り出す

Rust で frontmatter 文字列からデータを取り出しましょう。
frontmatter の parser としては、rust-frontmatter というものがあります。

FYI: https://github.com/azdle/rust-frontmatter

cargo-doc を見ればやり方は想像がつくとは思うのですが、個人的には README に書いておいて欲しかった内容なのでまとめます。

## parse しよう

早速 rust-frontmatter を使ってみましょう。

```sh
cargo add rust-frontmatter
```

```rust
use frontmatter::{parse, Yaml};

let fm = parse(&s);
```

これで parse できました。
中身はどうなっているでしょうか。

```rust
println!("{:?}", fm)
```

たとえばこのブログの frontmatter は

```sh
Ok(Some(Hash({String("path"): String("/rust-frontmatter"), String("created"): String("2021-04-19"), String("title"): String("Rust で frontmatter 文字列から値を取り出す"), String("visual"): String("./visual.png"), String("tags"): Array([String("Rust"), String("frontmatter")]), String("userId"): String("sadnessOjisan"), String("isFavorite"): Boolean(false), String("isProtect"): Boolean(false)})))
```

となります。（実はいまブログの SSG を Rust で実装している最中です。）

Result 型の中にオプション型があって、その中に Hash が入っているという形でしょうか。

その Hash を取り出してみましょう。

```rust
let hash = front.ok().unwrap().unwrap();
```

さてではこの中からデータを取り出してみましょう。

```rust
let path = &d["path"];
let title = &d["title"];
let tags = &d["tags"];
```

これらはそれぞれ、

```sh
String("/rust-frontmatter")

String("Rust で frontmatter 文字列から値を取り出す")

Array([String("Rust"), String("frontmatter")])
```

です。

どうやってここから値を取り出しましょうか。

## そもそも Hash は何なのか

frontmatter は `---` で覆われた yaml や json です。
そのため frontmatter の parser は yaml の parser を持っています。
この hash は yaml-rust というクレートが返していた値です。
rust-frontmatter は yaml-rust への依存を持っています。

FYI: https://github.com/chyh1990/yaml-rust

hash として見えていた値は yaml-rust の Yaml Enum が持つ Variant です。

FYI: https://docs.rs/yaml-rust/0.4.5/yaml_rust/yaml/enum.Yaml.html

それらは `as_str`, `as_vec` などの変換メソッドを持っているのでそれを使えば値を取り出せます。

```rust
#[derive(Debug)]
struct PostMeta {
    path: String,
    title: String,
    tags: Vec<String>,
}

fn parse_frontmatter(s: &str) -> PostMeta {
    let front = parse(&s);
    let d = front.ok().unwrap().unwrap();
    let path = &d["path"];
    let title = &d["title"];
    let tags = &d["tags"];
    PostMeta {
        path: path.as_str().unwrap().to_string(),
        title: title.as_str().unwrap().to_string(),
        tags: tags
            .as_vec()
            .unwrap()
            .into_iter()
            .map(|x| x.as_str().unwrap().to_string())
            .collect(),
    }
}
```
