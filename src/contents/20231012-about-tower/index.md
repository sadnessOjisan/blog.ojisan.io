---
path: /about-tower
created: "2023-10-12"
title: tower は何を実現するのか
visual: "./visual.png"
tags: [rust, tower, axum]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## 宣伝

10/21 に [rust.tokyo](http://rust.tokyo) で[カニさんタワーバトル](https://rust.tokyo/2023/lineup/2)という発表をする。その事前資料として axum の内部実装の解説を書いているのだが、その解説を読むためには axum の Router は tower の Service ということを知っておく必要があるので、そもそも Service とは何かという tower の導入記事を書く。

## tl;dr

- Webサーバーはルーティング、認証、レートリミット、ロギングなどのmiddleware関数が積み重なったものと見做せる
- これらのmiddleware関数は `Fn: (req: Request) -> Future<Response>` と見做せ、そのmiddleware関数の中が別の関数を呼ぶことで積み重ねられる
- 関数の中にmiddleware関数をハードコートすると再利用性に乏しくスケーリングさせにくいので、`Fn: (req: Request) -> Future<Response>` の部分だけを抽出して trait としてモデル化する。これが tower の Service である。tower はさまざまな Service実装も提供してくれていて、再利用できる。

## tower とは

[tower](https://github.com/tower-rs/tower) は Rust におけるHTTP通信における抽象化レイヤー、ユーティリティを提供するライブラリだ。公式の description には `async fn(Request) -> Result<Response, Error>` とある。無味乾燥な説明だが、Service trait を知ればこの説明がその通りなことに気づくだろう。tower は主に middleware 関数の抽象である Service trait を提供し、この trait を各種FWなどが実装・呼び出してくれる。

## tower の使い方

一番よく使われる使い方は middleware の開発だ。ここでいうmiddlewareとは全HTTPエンドポイント共通で実行される処理のことだ。

### middleware という考え方

middleware の代表例はロギングや認証だ。例えば tower を使えば、全リクエストに対して、どういうリクエストが来てどうレスポンスしたかのログを好きなフォーマットで標準出力に出す実装を書けたり、全リクエストに対して認証を挟み込める。自分で実装する以外にも tower 公式が[いくつか用意](https://github.com/tower-rs/tower/tree/master/tower/src)してくれている。

しかしそれだけではない。router も middleware だ。

```rust
#[derive(Debug, Clone, Copy)]
struct MyStruct {}

impl Service<Request<Incoming>> for MyStruct {
    type Response = Response<String>;
    type Error = String;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn poll_ready(&mut self, _cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    fn call(&self, req: Request<Incoming>) -> Self::Future {
        Box::pin(async move {
            match (req.method(), req.uri().path()) {
                (&Method::GET, "/") => Ok(Response::new("body".to_string())),
                (&Method::GET, "/echo") => Ok(Response::new("echo".to_string())),

                _ => {
                    let mut not_found = Response::new("".to_string());
                    *not_found.status_mut() = StatusCode::NOT_FOUND;
                    Ok(not_found)
                }
            }
        })
    }
}
```

このようにどのパスに来たらどの処理をさせるかというルーティング処理も Service として表現できる。

### service trait を使う

tower では [service](https://docs.rs/tower/latest/tower/trait.Service.html) という trait が用意されている。これは

> An asynchronous function from a `Request` to a `Response`.

> The `Service` trait is a simplified interface making it easy to write network applications in a modular and reusable way, decoupled from the underlying protocol. It is one of Tower’s fundamental abstractions.

とある。一見すると変な説明 だが、"An asynchronous function from a `Request` to a `Response`." は本質だと思っており、WEBサーバーはリクエストを受け付けて非同期にレスポンスを返すものなのでそれを忠実に表したモデルと言える。

service は poll_ready と call を持つ。

```rust
pub trait Service<Request> {
    type Response;
    type Error;
    type Future: Future
    where
        <Self::Future as Future>::Output == Result<Self::Response, Self::Error>;

    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>
    ) -> Poll<Result<(), Self::Error>>;
    fn call(&mut self, req: Request) -> Self::Future;
}
```

service の使い方だが、tower に準拠した FW は service を受け取る口がついており、そこで FW が call を呼び出すことでロジックを実行する。poll_readyは call するかどうかのチェックに使う。call が主人公なのでここではcallに注目して見ていく。

### service trait を連鎖させる

service の良いところは入れ子にしてロジックを積み上げることができ、それを FW 側が呼び続けることで複数の middleware を実行させられることにある。その結果、ロジックを各サービスとして分離させて開発できるようになる。

FWはloopでrouter を呼び出し、logging を呼び出し、認証を呼び出しといった風に常にcall を呼び続けてくれる。ルーティング先の処理によってはDBに対して外部IOするということもあり、call は Future を返すように想定されているが、これはFW の外側（つまりユーザーが書いたコードのエントリポイント）にあるtokioなどの非同期ランタイムがpollを解決してくれている。なので何らかのFWと非同期ランタイムの上で開発しているのなら、開発者は middleware を積むだけで良い。

その積み方であるが、それは入れ子である。つまり service から service を call する。ただ、ここで疑問に思うのが service という形式にする必要はあるのだろうか。つまり

```rust
async fn routing_middleware(
    req: Request<hyper::body::Incoming>,
) -> Result<Response<BoxBody<Bytes, hyper::Error>>, hyper::Error> {
    match (req.method(), req.uri().path()) {
        (&Method::GET, "/") => Ok(Response::new(full("Try POSTing data to /echo"))),
        (&Method::POST, "/echo") => Ok(Response::new(full("/echo"))),

        // Return 404 Not Found for other routes.
        _ => {
            let mut not_found = Response::new(empty());
            *not_found.status_mut() = StatusCode::NOT_FOUND;
            Ok(not_found)
        }
    }
}

async fn logging_middleware<F>(
    req: Request<hyper::body::Incoming>,
    handler: F,
) -> Result<Response<BoxBody<Bytes, hyper::Error>>, hyper::Error>
where
    F: FnOnce(
        Request<hyper::body::Incoming>,
    ) -> std::pin::Pin<
        Box<
            dyn std::future::Future<
                    Output = Result<Response<BoxBody<Bytes, hyper::Error>>, hyper::Error>,
                > + Send,
        >,
    >,
{
    println!("Received request to {}", req.uri());
    handler(req).await
}
```

と定義して、logging_middleware の handler に routing_middleware を渡してもいいはずである。このやり方でもロジックを積み上げることはできている。

```rust
serve_connection(io, service_fn(|req| logging_middleware(req, |req2| Box::pin(routing_middleware(req2))))).await;
```

しかし tower では service trait というのを用意させている。その理由や嬉しさについて見ていこう。

## nventing the Service trait

service について深く理解するために公式は次の2つのドキュメントを紹介している。

- https://github.com/tower-rs/tower/blob/master/guides/building-a-middleware-from-scratch.md
- https://tokio.rs/blog/2021-05-14-inventing-the-service-trait

詳しくはこれを読んでもらえるといいのだが、自分の発表はこの２つのドキュメントの理解が前提条件にあるので簡単にまとめようと思う。どちらか片方が読めればもう片方が読めるので、あまり詳細の実装に踏み込まない [Inventing the Service trait](https://tokio.rs/blog/2021-05-14-inventing-the-service-trait) について書く。[Building a middleware from scratch](https://github.com/tower-rs/tower/blob/master/guides/building-a-middleware-from-scratch.md) は読むにあたっては Pin の知識が必要だが、それも事前知識ブログとして書いているのでそのうち公開したい（残り10日以内で！？🥲）

[Inventing the Service trait](https://tokio.rs/blog/2021-05-14-inventing-the-service-trait) は tower の Service 概念は明らかなものではないので、Service のモチベーションを知ろうというドキュメントだ。

### Rust におけるサーバーの基本的なモデル

まず Rust でサーバーを書くとなると、

```rust
impl Server {
    async fn run<F, Fut>(self, handler: F) -> Result<(), Error>
    where
        F: Fn(HttpRequest) -> Fut,
        // The response future is now allowed to fail
        Fut: Future<Output = Result<HttpResponse, Error>>,
    {
        let listener = TcpListener::bind(self.addr).await?;

        loop {
            let mut connection = listener.accept().await?;
            let request = read_http_request(&mut connection).await?;

            task::spawn(async move {
                // Pattern match on the result of the response future
                match handler(request).await {
                    Ok(response) => write_http_response(connection, response).await?,
                    Err(error) => handle_error_somehow(error, connection),
                }
            });
        }
    }
}

// Create a server that listens on port 3000
let server = Server::new("127.0.0.1:3000").await?;

// Somehow run the user's application
server.run(the_users_application).await?;
```

という設計になるであろうことが書かれている。

これは

- Rust は標準でTCPStreamしか提供しておらず、ソケットへのアクセスは開発者がする必要があること
- TCPStream が iterable である以上、socket からのデータの読み出しは loop などの無限繰り返しで行う必要があること
- HTTPサーバーのハンドラはリクエストを受け取り、レスポンスのFutureを返すものであること

から、このようなデザインに落ち着くだろうと自分は納得している。

### 関数合成でサーバーに機能を追加する

このサーバーに機能を足していこう。そのためにはリクエストを受け取ってレスポンスを返す部分である `handler(request)` を拡張していくことになる。まず handle 関数に備わって欲しい具体的な機能はルーティングだろう。

```rust
async fn handle_request(request: HttpRequest) -> HttpResponse {
    if request.path() == "/" {
        HttpResponse::ok("Hello, World!")
    } else if request.path() == "/important-data" {
        // We can now do async stuff in here
        let some_data = fetch_data_from_database().await;
        make_response(some_data)
    } else {
        HttpResponse::not_found()
    }
}
```

ここにさまざまな横断的な機能を足してみよう。まずタイムアウト機能も足したいとする。その機能は

```rust
async fn handler_with_timeout(request: HttpRequest) -> Result<HttpResponse, Error> {
    let result = tokio::time::timeout(
        Duration::from_secs(30),
        handle_request(request)
    ).await;

    match result {
        Ok(Ok(response)) => Ok(response),
        Ok(Err(error)) => Err(error),
        Err(_timeout_elapsed) => Err(Error::timeout()),
    }
}
```

のようにして実現できる。中でhandle_requestを読んでいることに注目して欲しい。次にレスポンスを `conteyt-type: application/json` で返すようにしたいとする。

```rust
async fn handler_with_timeout_and_content_type(
    request: HttpRequest,
) -> Result<HttpResponse, Error> {
    let mut response = handler_with_timeout(request).await?;
    response.set_header("Content-Type", "application/json");
    Ok(response)
}
```

中で handler_with_timeout を読んでいることに注目して欲しい。つまりサーバーに対する機能実装は `handle_with*` に処理を切り出しておいて、それを順番に呼び出すことで実現する。しかしこのやり方は関数に関数をハードコートしているので再利用性が低くスケーリングさせにくいのと、テストもしにくいといった明確な欠点がある。

### trait 実装でサーバーに機能を追加する

そこで別のアプローチとして Handler Trait というのを考える。server.run に `Fn(HttpRequest) -> ...` といった関数を渡すのではなく、同じシグネチャを持つ trait で考えて、その trait を実装したものをわたすアプローチを考える。

```rust
trait Handler {
    type Future: Future<Output = Result<HttpResponse, Error>>;

    fn call(&mut self, request: HttpRequest) -> Self::Future;
}
```

trait になったことでこの trait を実装する構造体は好きな形を選べるので、汎用性は広がる。最初の handle 関数はこのように表現できる。

```rust
struct RequestHandler;

impl Handler for RequestHandler {
    // We use `Pin<Box<...>>` here for simplicity, but could also define our
    // own `Future` type to avoid the overhead
    type Future = Pin<Box<dyn Future<Output = Result<HttpResponse, Error>>>>;

    fn call(&mut self, request: HttpRequest) -> Self::Future {
        Box::pin(async move {
            // same implementation as we had before
            if request.path() == "/" {
                Ok(HttpResponse::ok("Hello, World!"))
            } else if request.path() == "/important-data" {
                let some_data = fetch_data_from_database().await?;
                Ok(make_response(some_data))
            } else {
                Ok(HttpResponse::not_found())
            }
        })
    }
}
```

ここに Timeout も実装したい。それは

```rust
#[derive(Clone)]
struct Timeout<T> {
    // T will be some type that implements `Handler`
    inner_handler: T,
    duration: Duration,
}

impl<T> Handler for Timeout<T>
where
    T: Handler + Clone + 'static,
{
    type Future = Pin<Box<dyn Future<Output = Result<HttpResponse, Error>>>>;

    fn call(&mut self, request: HttpRequest) -> Self::Future {
        // Get an owned clone of `&mut self`
        let mut this = self.clone();

        Box::pin(async move {
            let result = tokio::time::timeout(
                this.duration,
                this.inner_handler.call(request),
            ).await;

            match result {
                Ok(Ok(response)) => Ok(response),
                Ok(Err(error)) => Err(error),
                Err(_timeout) => Err(Error::timeout()),
            }
        })
    }
}
```

のようにして表現できる。 `inner_handler` として持ち回ることでこの Timeout は RequestHandler 以外も実行できるようになって汎用性が高まっている。

この調子で JsonContentType も

```rust
#[derive(Clone)]
struct JsonContentType<T> {
    inner_handler: T,
}

impl<T> Handler for JsonContentType<T>
where
    T: Handler + Clone + 'static,
{
    type Future = Pin<Box<dyn Future<Output = Result<HttpResponse, Error>>>>;

    fn call(&mut self, request: HttpRequest) -> Self::Future {
        let mut this = self.clone();

        Box::pin(async move {
            let mut response = this.inner_handler.call(request).await?;
            response.set_header("Content-Type", "application/json");
            Ok(response)
        })
    }
}
```

として定義できる。ここでの clone や static lifetime や Box::Pin は実装上の制約でそうしている。詳しくは原文を見て欲しい。

あとは Server::run

```rust
impl Server {
    async fn run<T>(self, mut handler: T) -> Result<(), Error>
    where
        T: Handler,
    {
        let listener = TcpListener::bind(self.addr).await?;

        loop {
            let mut connection = listener.accept().await?;
            let request = read_http_request(&mut connection).await?;

            task::spawn(async move {
                // have to call `Handler::call` here
                match handler.call(request).await {
                    Ok(response) => write_http_response(connection, response).await?,
                    Err(error) => handle_error_somehow(error, connection),
                }
            });
        }
    }
}
```

に

```rust
JsonContentType {
    inner_handler: Timeout {
        inner_handler: RequestHandler,
        duration: Duration::from_secs(30),
    },
}
```

をわたすだけで良い。それぞれの Handler の call は Default 実装されているのでこれで動く。

### Handler から Service へ

ここでここまでで定義していたHandlerだが、Timeoutのような機能はサーバーに限らずクライアント側でも使える。例えば Retry や RateLimit のようなHandlerはそうだろう。なぜならクライアントはリクエストを送ってレスポンスを受け取る形であり、関数のシグネチャとしては Request を受け取って Response の Future を受け取るものとしてモデル化できるからだ。そのため Handler という名前だとサーバー専門に見えてしまうので Service という名前で呼ぶことにしよう。

そして RateLimit を考慮する設計をするなら、最終的には

```rust
pub trait Service<Request> {
    type Response;
    type Error;
    type Future: Future<Output = Result<Self::Response, Self::Error>>;

    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>>;

    fn call(&mut self, req: Request) -> Self::Future;
}
```

という定義になる。ここでpoll_readyというのが生えたがこれは backpressure と呼ばれる仕組みの実現に使う。RateLimitを設けるときに「このcallを呼び出していいか？」をチェックする関数だ。もしこのような機能が必要ないなら Ok をハードコードして返すか、inner の service の poll_ready を呼べば良い。

## 結局 Service を trait として表現する嬉しさは何なのか

元々 middleware 関数を連鎖して呼ぶには関数の入れ子にしていた。これはある関数から別の関数を直接呼ぶと密結合になることから避けたいパターンであった。そこでService trait という形で middleware 関数を分離させると、その関数はただ inner の service を呼ぶという風に定義させ絵しておけば、別の middleware 関数への依存は trait が実装される struct 側に持たせることができて trait の実装は呼ぶ inner の詳細を知らなくて済み疎結合にできる。他にも poll_ready のように middleware を実行するかどうかのチェックを挟む機構も備えられるようになるという発明もできる。これが Service Trait の嬉しさだと思う。

## そして axum へ

さて tower middleware は基本的に自作しなくていい。だが実装を見てみるとあらゆる実装はinnder があることが前提であり、poll_readyは完全にinnerに依存している。では inner が呼び出す先は誰が返しているのだろうか？無限後退するのだろうか？

そんなことはなく router は tower が提供していないからユーザーが作らないといけなく、このrouterにservice trait をユーザーが実装するときに inner に頼らない実装をするのである。

だがそれは axum では Router::new として用意してくれている。ルーティングを登録したら良い感じの service になることが最初から保障されている。

```rust
impl<B> Service<Request<B>> for Router<(), B>
where
    B: HttpBody + Send + 'static,
{
    type Response = Response;
    type Error = Infallible;
    type Future = RouteFuture<B, Infallible>;

    #[inline]
    fn poll_ready(&mut self, _: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    #[inline]
    fn call(&mut self, req: Request<B>) -> Self::Future {
        println!("Router::Service::call");
        self.call_with_state(req, ())
    }
}
```

axum も`poll_ready` を inner に頼らない形でベタ書きしている。なので結局はユーザーの手が入るので inner がないバージョンの Service を作ればいいだけであるし、axum のようなFWを使えばそのようなことも考えなくて済む。
