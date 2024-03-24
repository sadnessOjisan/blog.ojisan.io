---
path: /cf-axum-muriyari
created: "2024-03-24"
title: 頑張って Axum を Cloudflare Workers で動かす
visual: "./visual.png"
tags: ["cloudflare workers", "axum", "rust"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## tl;dr

[kflansburgさんの http-fetch ブランチ](https://github.com/cloudflare/workers-rs/tree/kflansburg/http-fetch)からライブラリを読み込んで、 router を呼び出すコードを [https://github.com/cloudflare/workers-rs/pull/481 にあるもの](https://github.com/cloudflare/workers-rs/blob/4e5ad18f0312d2c136952da8c9d70d72e8c636a4/worker-sandbox/src/router.rs) に差し替える。

```
worker = { git = "https://github.com/cloudflare/workers-rs", branch="kflansburg/http-fetch", features = ["http"] }
```

マージがマジ楽しみ！

## Axumがサポートされたぞ！！！！！！！！！！

Cloudflare Workers では少し前から Rust が動いていた。
(正確には動いているのは WebAssembly だが。)
Cloudflare Workers は V8 ベースの技術に立っているので、WebAssembly がそのまま動くし、つまり WebAssembly に変換できたらコンパイル前の言語は何であっても良い。
つまり Rust が動く。
ちなみに V8 で動くものに変換できたらいいので hoge to JS なトランスパイラがある言語は全部動く。

その中でも Rust は [worker-rs](https://github.com/cloudflare/workers-rs) という crate があって、さまざまな API にアクセスできる SDK が揃っている。

### worker-rs のよくあるパターン

worker-rs には Router があるので、エッジをリバースプロキシー目的で使うときは使い勝手が良い。
この Router はすでに Axum のようなIFをしている。

```rust
use worker::*;

#[event(fetch)]
pub async fn main(req: Request, env: Env, _ctx: worker::Context) -> Result<Response> {
    let router = Router::new();

    ...

    router
        .get_async("/account/:id", |_req, ctx| async move {
            if let Some(id) = ctx.param("id") {
                let accounts = ctx.kv("ACCOUNTS")?;
                return match accounts.get(id).json::<Account>().await? {
                    Some(account) => Response::from_json(&account),
                    None => Response::error("Not found", 404),
                };
            }

            Response::error("Bad Request", 400)
        })
        // handle files and fields from multipart/form-data requests
        .post_async("/upload", |mut req, _ctx| async move {
            ...

            Response::error("Bad Request", 400)
        })
        ...
        .run(req, env).await
}
```

see: https://github.com/cloudflare/workers-rs#or-use-the-router

### うっかり Axum が動くようになってしまった

さて、worker-rs は先週 0.0.21 になった。
リリースノートには、

> New http feature flag
> A feature flag (http) was introduced to begin migrating from custom request and response types to widely used types in the http crate. See the README for more information.

とある。

see: https://github.com/cloudflare/workers-rs/releases/tag/v0.0.21

このとき、http というクレートと互換性を持ってしまい、その結果 Cloudflare Workers 上で Axum が動くようになってしまった。

一応、Cloudflare Workersの上で Axum を動かす方法は前々からあった。
だがそれは [axum-cloudflare-adapter](https://github.com/logankeenan/axum-cloudflare-adapter) というのを使って強引に動かしていた。

それが今回そのようなライブラリがいらなくなったのである。
そしてついに公式にも axum の example が追加された。
つまり想定された使い方であることが公式によって示された。

see: https://github.com/cloudflare/workers-rs/tree/b2aabc1be118c26e8c2b5c45cd38d92927bf22a3/examples/axum

本当に動くのだろうか？確かめてる。

## 本当に動くのか確かめてみる

まず、Axum は tokio ベースだ。
そして Wasm 上では tokio そのままは動かない。
なのでまず Axum を `deafult-feature=false` にして入れる。
そして Router の呼び出しは tower のインターフェースの call を使って行うので、tower-service も入れる。
なので Cargo.toml はこうなる。

```toml
[package]
name = "worker-rust"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
axum = { version = "0.7.4", default-features = false }
reqwest = "0.12.1"
tower-service = "0.3.2"
worker = { version = "0.0.21", features = ["http"] }

[profile.release]
opt-level = "s" # optimize for size in release builds
lto = true
codegen-units = 1
```

この結果、次のコードが動く。

```rust
use axum::{routing::get, Router};
use tower_service::Service;
use worker::*;

fn router() -> Router {
    Router::new().route("/", get(root))
}

#[event(fetch)]
async fn fetch(
    req: HttpRequest,
    _env: Env,
    _ctx: Context,
) -> Result<axum::http::Response<axum::body::Body>> {
    console_error_panic_hook::set_once();

    Ok(router().call(req).await?)
}

pub async fn root() -> &'static str {
    "Hello Axum!"
}
```

動いた！！！！！！！！！！！！！！！！！！！！！

Axum や tower については rust.tokyo2023 でトークしたことがあるので、興味がある人は見て欲しい。

<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.1972%;"><iframe class="speakerdeck-iframe" frameborder="0" src="https://speakerdeck.com/player/35c527ff800f44c4a4603e72579f1959" title="かにさんタワーバトル" allowfullscreen="true" style="border: 0px; background: padding-box padding-box rgba(0, 0, 0, 0.1); margin: 0px; padding: 0px; border-radius: 6px; box-shadow: rgba(0, 0, 0, 0.2) 0px 5px 40px; width: 100%; height: auto; aspect-ratio: 560 / 315;" data-ratio="1.7777777777777777"></iframe></div>

## それではバグらせていきます

さて、うまく行ったらこんなブログを書くわけがないので、壊れていく例を見せる。
エッジサービスを使う目的の大多数はリバースプロキシ目的だと思う。
つまりオリジンサーバーへの通信は必ずするだろう。

というわけで root の中でオリジンサーバーにアクセスしてみる。
なお、原因の切り分けをしやすいようにアクセスするだけでレスポンスを使った何かしらの処理やレスポンスはしない。

```rust
pub async fn root() -> &'static str {
    let _ = reqwest::get("https://example.com").await;
    "Hello Axum!"
}
```

何らおかしいことはない。
文法的にも正しい。
これをコンパイルしてみる。

```
error[E0277]: the trait bound `fn() -> impl Future<Output = &'static str> {root}: Handler<_, _>` is not satisfied
   --> src/lib.rs:6:34
    |
6   |     Router::new().route("/", get(root))
    |                              --- ^^^^ the trait `Handler<_, _>` is not implemented for fn item `fn() -> impl Future<Output = &'static str> {root}`
    |                              |
    |                              required by a bound introduced by this call
    |
    = help: the following other types implement trait `Handler<T, S>`:
              <Layered<L, H, T, S> as Handler<T, S>>
              <MethodRouter<S> as Handler<(), S>>
note: required by a bound in `axum::routing::get`
   --> /Users/sadnessOjisan/.cargo/registry/src/index.crates.io-6f17d22bba15001f/axum-0.7.4/src/routing/method_routing.rs:385:1
    |
385 | top_level_handler_fn!(get, GET);
    | ^^^^^^^^^^^^^^^^^^^^^^---^^^^^^
    | |                     |
    | |                     required by a bound in this function
    | required by this bound in `get`
    = note: this error originates in the macro `top_level_handler_fn` (in Nightly builds, run with -Z macro-backtrace for more info)

For more information about this error, try `rustc --explain E0277`.
error: could not compile `worker-rust` (lib) due to 1 previous error
Error: Compiling your crate to WebAssembly failed
✘ [ERROR] Custom build failed: UserError: Running custom build `cargo install -q worker-build && worker-build --release` failed. There are likely more logs from your build command above.

      at runCustomBuild
  (/Users/sadnessOjisan/hoge/node_modules/wrangler/wrangler-dist/cli.js:126897:13)
      at process.processTicksAndRejections (node:internal/process/task_queues:95:5) {
    [cause]: Error: Command failed with exit code 1: cargo install -q worker-build && worker-build
  --release
        at makeError
  (/Users/sadnessOjisan/hoge/node_modules/wrangler/wrangler-dist/cli.js:126436:14)
        at handlePromise
  (/Users/sadnessOjisan/hoge/node_modules/wrangler/wrangler-dist/cli.js:126778:29)
        at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
        at async runCustomBuild
  (/Users/sadnessOjisan/hoge/node_modules/wrangler/wrangler-dist/cli.js:126888:7) {
      shortMessage: 'Command failed with exit code 1: cargo install -q worker-build && worker-build
  --release',
      command: 'cargo install -q worker-build && worker-build --release',
      escapedCommand: 'cargo install -q worker-build "&&" worker-build --release',
      exitCode: 1,
      signal: undefined,
      signalDescription: undefined,
      stdout: undefined,
      stderr: undefined,
      failed: true,
      timedOut: false,
      isCanceled: false,
      killed: false
    }
  }
```

なんかすごい壊れ方をした。
エラーを素直に読むと、ルーティングのハンドラーがAxumの期待する Handler トレイトを満たしていないようである。
関数の型を変えていないのに、コンパイルに失敗したのである。
ここで面白いのは、`.await` を外してみる。

```rust
pub async fn root() -> &'static str {
    let _ = reqwest::get("https://example.com");
    "Hello Axum!"
}
```

これは成功するのである。
一般的に async は Future のシンタックスシュガーであるが、await は非同期タスクを pollする役割のはずであり、関数の型には何も影響を及ぼさないはずである。
(Future や poll については [ライブラリを使わない非同期処理（前編）](https://blog.ojisan.io/think-rust-async-part1/) を参照。)

つまり、await があるかどうかで挙動が変わってくる。
いや、そんなわけないとは思うのだが...

## 公式は何か動きがあるのだろうか

まず 0.0.21 が実装された後のテストを見てみた。
現在進行形でテストを書いているようだ。
そして一応、テストには通っているようだ。
だが、謎のマクロを定義して頑張ってテストを書いていそうだった。

```rust
/// Rewrites a handler with legacy http types to use axum extractors / response type.
#[cfg(feature = "http")]
macro_rules! handler (
    ($name:path) => {
        |Extension(env): Extension<Env>, Extension(data): Extension<SomeSharedData>, req: axum::extract::Request| async {
            let resp = $name(req.try_into().expect("convert request"), env, data).await.expect("handler result");
            Into::<http::Response<axum::body::Body>>::into(resp)
        }
    }
);

############

.route("/fetch", get(handler!(fetch::handle_fetch)))

###########

#[worker::send]
pub async fn handle_fetch(_req: Request, _env: Env, _data: SomeSharedData) -> Result<Response> {
    let req = Request::new("https://example.com", Method::Post)?;
    let resp = Fetch::Request(req).send().await?;
    let resp2 = Fetch::Url("https://example.com".parse()?).send().await?;
    Response::ok(format!(
        "received responses with codes {} and {}",
        resp.status_code(),
        resp2.status_code()
    ))
}
```

see: https://github.com/cloudflare/workers-rs/pull/481

つまり、普通の Axum の使い方だと動かないことがわかった。

`worker::send` といったマクロなどよくわからないので検索していると、[[BUG] Rc<RefCell<wasm_bindgen_futures::Inner>> cannot be sent between threads safely ](https://github.com/cloudflare/workers-rs/issues/485) という Issue を知った。

実行環境の都合で、どうやらFutureにSendを実装したものが必要になっているようで、それを実装したものだ。
https://github.com/cloudflare/workers-rs/pull/481 にも怪しそうなファイルが生えていた。

````rust
#[pin_project]
/// Wrap any future to make it `Send`.
///
/// ```rust
/// let fut = SendFuture::new(JsFuture::from(promise));
/// fut.await
/// ```
pub struct SendFuture<F> {
    #[pin]
    inner: F,
}

impl<F> SendFuture<F> {
    pub fn new(inner: F) -> Self {
        Self { inner }
    }
}

unsafe impl<F> Send for SendFuture<F> {}
````

see: https://github.com/cloudflare/workers-rs/blob/4e5ad18f0312d2c136952da8c9d70d72e8c636a4/worker/src/send.rs

tokio などはすでにこういう実装がされているようだった。
Axumを普通に使っていてこのようなエラーに出会ったことがないのは、そういう恩恵を受けていたからだろう。
今回は tokio を使わずに axum を使っているので、非同期ランタイムそのものを自分達で用意（JSのを持ってきている）ので、axum との繋ぎ込みで追加の対応が必要だったのだろう。
`worker::send` は Send を実装するために必要なマクロというわけだ。

なにはともあれ、https://github.com/cloudflare/workers-rs/pull/481 で追加されるコードを取り込めば動くことが分かった。
Rustは create.io でなくても GitHubからコードを読み込める。
今回は [kflansburgさんの http-fetch ブランチ](https://github.com/cloudflare/workers-rs/tree/kflansburg/http-fetch)を持って来れば良い。
なので次のような設定になる。

```
worker = { git = "https://github.com/cloudflare/workers-rs", branch="kflansburg/http-fetch", features = ["http"] }
```

テストコードを見ると謎のマクロでハンドラも囲っている。

```rust
.route("/fetch", get(handler!(fetch::handle_fetch)))
```

このマクロの中身はこうだ。

```rust
#[cfg(feature = "http")]
macro_rules! handler (
    ($name:path) => {
        |Extension(env): Extension<Env>, Extension(data): Extension<SomeSharedData>, req: axum::extract::Request| async {
            let resp = $name(req.try_into().expect("convert request"), env, data).await.expect("handler result");
            Into::<http::Response<axum::body::Body>>::into(resp)
        }
    }
);
```

シンプルなのでマクロを展開して移植してあげよう。

```rust
use axum::{http::Response, response::IntoResponse, routing::get, Extension, Router};
use tower_service::Service;
use worker::*;

fn router() -> Router {
    Router::new().route(
        "/",
        get(|req: axum::extract::Request| async {
            let resp = handle_fetch(req.try_into().expect("convert request"))
                .await
                .expect("handler result");
            Into::<Response<axum::body::Body>>::into(resp)
        }),
    )
}
```

今回は環境変数や共有データはいらないので、それらは関数の引数から消した。
マクロがしていたことを読み解くと、

- axum のリクエストを worker-rs のリクエストに変換
- worker のレスポンスを axum のレスポンスに変換

である。ただ、`req.try_into` は 0.0.21 段階では axum に対する try_into が不十分で追加実装が必要なので、kflansburgさんの http-fetch ブランチ を持ってくる必要はある。

see: https://github.com/cloudflare/workers-rs/pull/481/files#diff-2a2fc06c8258f052907389269585a09728229c80d4c567db6cc3a4ceb26e4f95

これでコンパイルし直して、`npx wrangler dev` すると、無事オリジンサーバーにレスポンスして、その結果を表示させることができた。

![](./ok.png)

## おわりに

Wasmでの非同期処理のことはあまり理解していないのでこれを機に勉強したい。
とはいえ勉強しなくても、そのうち使いやすい感じで worker-rs が改善されていって使えるようになるとは思うので静観する。
