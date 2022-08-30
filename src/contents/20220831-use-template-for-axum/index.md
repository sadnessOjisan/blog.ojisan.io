---
path: /moka-express-kills-you
created: "2022-08-29"
title: 殺人マキネッタ
visual: "./visual.png"
tags: ["雑記"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

OGP は "rust with template engine" で生成したもの。HTML が錆び付いた感じがして良い。
axum からテンプレートエンジンを返す方法は[axum/examples/templates/](https://github.com/tokio-rs/axum/tree/main/examples/templates) を見れば事例があるのだが、これに気づかずに「axum template engine」「axum tera」 とかで調べると泥沼にハマるので、検索エンジンにひっかかる形でメモしておく。

## 解決方法: askama を使う

[askama](https://github.com/djc/askama) を使えば、`#[derive(Template)]` した構造体をハンドラから返すだけでテンプレーティングできる。

```rust
use askama::Template;
use axum::{
    extract,
    http::StatusCode,
    response::{Html, IntoResponse, Response},
    routing::get,
    Router,
};

#[derive(Template)]
#[template(path = "hello.html")]
struct HelloTemplate {
    name: String,
}

struct HtmlTemplate<T>(T);

impl<T> IntoResponse for HtmlTemplate<T>
where
    T: Template,
{
    fn into_response(self) -> Response {
        match self.0.render() {
            Ok(html) => Html(html).into_response(),
            Err(err) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to render template. Error: {}", err),
            )
                .into_response(),
        }
    }
}
```

### コンパイル時の検査は注意

上記の設定を書くだけでテンプレートを返せるようになるのだが、コンパイル時のチェックについて２つ注意することがある。

#### 存在チェック

axum はルートに templates というディレクトリを作ってそこにテンプレートを入れることを要求する。

とはいえこのルールを破ると下のようなエラーが出るので気づけるとは思う。

```rust
> cargo run -p request-app
   Compiling request-app v0.1.0
error: template "helloa.html" not found in directories
  --> packages/request-app/src/main.rs:42:10
   |
42 | #[derive(Template)]
   |          ^^^^^^^^
   |
   = note: this error originates in the derive macro `Template` (in Nightly builds, run with -Z macro-backtrace for more info)
```

ただ src の下ではなくルート（Cargo.toml） があるところに置かなければいけないことに注意。

#### 型のチェック

Template 構造体にないフィールドをテンプレート側から呼ぼうとするとコンパイルエラーになる。

```
   Compiling request-app v0.1.0
error[E0609]: no field `hoge` on type `&ConfirmTemplate`
  --> packages/request-app/src/main.rs:48:10
   |
48 | #[derive(Template)]
   |          ^^^^^^^^ unknown field
   |
   = note: this error originates in the derive macro `Template` (in Nightly builds, run with -Z macro-backtrace for more info)

For more information about this error, try `rustc --explain E0609`.
error: could not compile `request-app` due to previous error

```
