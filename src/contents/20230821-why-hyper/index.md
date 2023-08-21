---
path: /why-hyper
created: "2023-08-21"
title: Rust の hyper は何が嬉しいか
visual: "./visual.png"
tags: [rust]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

Rust でWebサーバーを書く時の技術選定をするときに調べていると hyper に必ず出会うと思う。これは黎明期から存在しているライブラリで、Webサーバーにしては珍しく version 1 まで到達している老舗だ(1に到達してたら安心って考え方が正しいかはさておき...)。このライブラリは actix-web や axum のような他のライブラリとは毛色が違い、かなり primitive だ。そのため axum のベースに使われてもいて、hyper はそのまま使わないライブラリなのかもしれない。

## サンプルコードから存在意義がわかりにくい

さて、そんな hyper だが公式の example はこのようになっている。

```rs
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));

    // We create a TcpListener and bind it to 127.0.0.1:3000
    let listener = TcpListener::bind(addr).await?;

    // We start a loop to continuously accept incoming connections
    loop {
        let (stream, _) = listener.accept().await?;

        // Use an adapter to access something implementing `tokio::io` traits as if they implement
        // `hyper::rt` IO traits.
        let io = TokioIo::new(stream);

        // Spawn a tokio task to serve multiple connections concurrently
        tokio::task::spawn(async move {
            // Finally, we bind the incoming connection to our `hello` service
            if let Err(err) = http1::Builder::new()
                // `service_fn` converts our function in a `Service`
                .serve_connection(io, service_fn(hello))
                .await
            {
                println!("Error serving connection: {:?}", err);
            }
        });
    }
}
```

TCPListener や tokio が露出しており、非常に primitive なライブラリの様だ。

一方で [TRPL](https://doc.rust-lang.org/book/) の[シングルスレッドサーバーのコード](https://doc.rust-lang.org/book/ch20-01-single-threaded.html)はこうなっている。

```rust
use std::fs::File;
use std::io::prelude::*;
use std::net::TcpListener;
use std::net::TcpStream;

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        handle_connection(stream);
    }
}

fn handle_connection(mut stream: TcpStream) {
    let mut buffer = [0; 1024];
    stream.read(&mut buffer).unwrap();
    let get = b"GET / HTTP/1.1\r\n";
    let (status_line, filename) = if buffer.starts_with(get) {
        ("HTTP/1.1 200 OK\r\n\r\n", "hello.html")
    } else {
        ("HTTP/1.1 404 NOT FOUND\r\n\r\n", "404.html")
    };

    let mut file = File::open(filename).unwrap();
    let mut contents = String::new();

    file.read_to_string(&mut contents).unwrap();

    let response = format!("{}{}", status_line, contents);

    stream.write(response.as_bytes()).unwrap();
    stream.flush().unwrap();
}
```

tokio がないだけで雰囲気は似ている。hyper の例は TRPL で std だけで自作したサーバーととても似ているのである。じゃあ hyper は何が嬉しいのだろうか。

## hyper の嬉しさ

### Routing が少しマシになる

TRPLの例だと、GETを処理するためには HTTP ヘッダーをパースしてそのメソッドを判断していた。

`GET / HTTP/1.1` という文字列が来たら、

```rs
let (status_line, filename) = if buffer.starts_with(get) {
        ("HTTP/1.1 200 OK\r\n\r\n", "hello.html")
    } else {
        ("HTTP/1.1 404 NOT FOUND\r\n\r\n", "404.html")
    };
```

としてハンドリングしていた。

パスのルーティングも正規表現などでマッチさせてゴリゴリ自分で分岐を書く必要がある。

それが hyper では

```rs
async fn echo(
    req: Request<hyper::body::Incoming>,
) -> Result<Response<BoxBody<Bytes, hyper::Error>>, hyper::Error> {
    match (req.method(), req.uri().path()) {
        (&Method::GET, "/") => Ok(Response::new(full(
            "Try POSTing data to /echo",
        ))),
        (&Method::POST, "/echo") => {
            // we'll be back
        },

        // Return 404 Not Found for other routes.
        _ => {
            let mut not_found = Response::new(empty());
            *not_found.status_mut() = StatusCode::NOT_FOUND;
            Ok(not_found)
        }
    }
}
```

となって少しマシになる。

他にもexample には query params を扱う方法があったりもする。しかし、path params には対応していなさそうで、それは正規表現なので頑張る必要があり、不便さも残る。

### 少量のコードで効率的なマルチスレッディング

[TRPL だとマルチスレッド化](https://doc.rust-lang.org/book/ch20-02-multithreaded.html)するためには、

- スレッドプールを作成
- ワーカーを作成
- チャネルを作成

と、分散のために色々なコンポーネントを自前で用意する必要があり、ちょっと大変だった。

それが hyper では

```rs
#[tokio::main]
async fn main() -> Result<(), Box<dyn Error + Send + Sync>> {
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));

    let listener = TcpListener::bind(addr).await?;

    loop {
        let (stream, _) = listener.accept().await?;

        tokio::task::spawn(async move {
            if let Err(err) = http1::Builder::new()
                .serve_connection(stream, service_fn(hello))
                .await
            {
                println!("Error serving connection: {:?}", err);
            }
        });
    }
}
```

で済む。

「それ tokio のおかげやんけ」って思うかもしれないが、hyper は tokio が前提となっているので、そういうものだ。tokio は M:N モデルのグリーンスレッドで動作し、起動時には CPU コア数上限でネイティブスレッドが立ち上がる。なのでこれだけでスレッドプールも達成できる。

ちなみに version 0.14 時代は自分で spawn を書く必要はなく、

```rs
#[tokio::main]
async fn main() {
    // We'll bind to 127.0.0.1:3000
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));

    // A `Service` is needed for every connection, so this
    // creates one from our `hello_world` function.
    let make_svc = make_service_fn(|_conn| async {
        // service_fn converts our function into a `Service`
        Ok::<_, Infallible>(service_fn(hello_world))
    });

    let server = Server::bind(&addr).serve(make_svc);

    // Run this server for... forever!
    if let Err(e) = server.await {
        eprintln!("server error: {}", e);
    }
}
```

https://hyper.rs/guides/0.14/server/hello-world/

で済んでいた。ただ main に tokio の非同期ランタイムを展開するマクロがついているので、tokio が前提のFWであることには間違いない。

### バッファ操作からの解放

std 飲みを使うと、リクエストを読み取る、レスポンスを書き込むには用意した buffer の可変参照越しに行う必要があった。

```rs
let mut buffer = [0; 1024];
stream.read(&mut buffer).unwrap();
```

これはシステムプログラミング縛りでサーバーを書くときの read(2), write(2) に非常に似ている。これはシステムコールのIFがこうなっているので仕方ないのである。見覚えがない人は [server-architecture-2023/#ストリームへの読み書き](https://blog.ojisan.io/server-architecture-2023/#%E3%82%B9%E3%83%88%E3%83%AA%E3%83%BC%E3%83%A0%E3%81%B8%E3%81%AE%E8%AA%AD%E3%81%BF%E6%9B%B8%E3%81%8D) で雰囲気を掴んで欲しい。

それが hyper では `req` としてアクセスできるし、レスポンスも `Ok(Response::new(full("Try POSTing data to /echo")))` として返せる。これはハンドラのテストも書きやすくてとてもいいIFだと思う。

### ミドルウェアを足す口がある

これは Axum の話なのだが、ロギングや認証だけでなくルーティングもミドルウェアとして扱える。Axum ではそれは tower というライブラリのサービスとして定義しており、その中で複数 middleware をレイヤーという形で継ぎ足していける設計になっている。

残念ながら hyper には tower の口はない。代わりに同様のことは高階関数で実現していく。

例えば、ルーティングを司る機能を実装し、

```rs
async fn echo(
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
```

これを連鎖的に受け取れる middleware の口を用意してあげる。

```rs
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

これは通るリクエスト全ての情報をログに出してくれるレイヤーだ。

そしてこれらを Service として登録する。

```rs
tokio::task::spawn(async move {
            if let Err(err) = http1::Builder::new()
                .serve_connection(
                    io,
                    service_fn(|req| logging_middleware(req, |req2| Box::pin(echo(req2)))),
                )
                .await
            {
                println!("Error serving connection: {:?}", err);
            }
        });
```

hyper では router も logger もサービスとして登録できる。

だが、サービスの登録を高階関数でしていくのはちょっと管理もしにくいし心理的にも何か嫌だ。
というわけでそういう抽象として tower が使える。

ただし hyper 自体は tower そのものはサポートしていないのでちょっとした glue code や trait の実装は頑張らないといけない。しかし tower 自体がそういった FW を含めての抽象っていうのと、Axum は hyper をベースに tower で繋ぎ込んでおり実例が存在しているので可能なことである。

tower がどうしてサービスというものを作れるかと言う説明はすごく長くなるので割愛するが（そのうち書く）、興味がある人は

- https://github.com/tower-rs/tower/blob/master/guides/building-a-middleware-from-scratch.md
- https://tokio.rs/blog/2021-05-14-inventing-the-service-trait

を読むといいと思う。
