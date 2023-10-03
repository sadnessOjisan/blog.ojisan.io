---
path: /hyper-reading
created: "2023-09-20"
title: hyper の仕組み
visual: "./visual.png"
tags: [rust, hyper]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## 宣伝

[rust.tokyo](https://rust.tokyo/) で [かにさんタワーバトル](https://rust.tokyo/2023/lineup/2) という題で発表する。そのときの補助資料として [hyper](https://hyper.rs/) の簡単なコードリーディングについて書きたい。本当に書きたかった補助資料は axum のコードリーディングなのだが、先に hyper の腹を開いておく必要があったので書く。axum については後日また書く。

## tl;dr

- axum は エントリポイントの `serve(service).await` が hyper そのものなので、axum を理解するには hyper を知る必要がある。
- tower にある [Serviceは汎用的なパターン](https://tokio.rs/blog/2021-05-14-inventing-the-service-trait)であり、ルーティングやユーザーが書いたハンドラはservice として処理される。hyper 自体は HTTP の IO と Service の実行を行う。
- IO の結果も、Service の実行結果も Poll 型であり、非同期に扱われる。その Task は tokio で実行される。見方を変えると tokio がいるせいで全てが Poll 型のものとして扱われる。
- IO は poll_read, poll_write, poll_flush が行っており、それらの中から poll_msg, recv_msg を実行して service に書いた call を呼び出している。recv_msgで service を call して future を作り出し、その future を poll_msg から poll することで service の実行とその結果の受け渡しを実現している。

## お題となる標準的なサーバー

公式の README には

```rust
async fn hello(_: Request<hyper::body::Incoming>) -> Result<Response<Full<Bytes>>, Infallible> {
    Ok(Response::new(Full::new(Bytes::from("Hello, World!"))))
}

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

とあるので、これを最小構成として考えてみる。

なおバージョンは

```toml
[dependencies]
hyper = { version = "1.0.0-rc.4", features = ["full"] }
tokio = { version = "1", features = ["full"] }
http-body-util = "0.1.0-rc.3"
hyper-util = { git = "https://github.com/hyperium/hyper-util.git" }
```

を使ってコードリーディングしていく。

## poll をするまでの準備

### エントリポイントとTCPListner のひき回し

`let (stream, _) = listener.accept().await?;` を loop で回していることから、いつも通り TCPStream　から buffer を取り出してリクエストを受け付けている。TCPStream は [TRPL の例](https://doc.rust-lang.org/book/ch20-01-single-threaded.html)だと

```rust
let mut buffer = [0; 1024];
stream.read(&mut buffer).unwrap();
```

としてストリームからデータを取り出していくIOをしているが、先の hyper の例ではIO の抽象として ` let io = TokioIo::new(stream);` を作り出し、それを `.serve_connection(io, service_fn(hello))` に渡しているだけである。つまり自分で buffer 列に stream からデータを詰め替えるようなことはしない。この段階で、なんとなくだが Tokioio が担っているように見える。

`serve_connection` を追うと

```rust
pub fn serve_connection<I, S>(&self, io: I, service: S) -> Connection<I, S>
  where
    S: HttpService<IncomingBody>,
    S::Error: Into<Box<dyn StdError + Send + Sync>>,
    S::ResBody: 'static,
    <S::ResBody as Body>::Error: Into<Box<dyn StdError + Send + Sync>>,
    I: Read + Write + Unpin,
{
    let mut conn = proto::Conn::new(io);
    ...
    conn.set_flush_pipeline(self.pipeline_flush);
    if let Some(max) = self.max_buf_size {
      conn.set_max_buf_size(max);
    }
    let sd = proto::h1::dispatch::Server::new(service);
    let proto = proto::h1::Dispatcher::new(sd, conn);
    Connection { conn: proto }
}
```

と言うコードが出てくる。

先に渡した io (ここで渡されるのは TokioIo ) の trait 境界を見てみると `I: Read + Write + Unpin` なので、別に Tokioio である必要はない。ただ hyper は tokio runtime で動かす前提なので tokio のものを使う方が良い。なので TokioIo が渡ってくると考える。

その io は `proto::Conn::new(io);` に渡され、conn として使われていく。そして conn と service は proto として `Connection { conn: proto }` とラップされて await に渡される。

```rust
if let Err(err) = http1::Builder::new()
// `service_fn` converts our function in a `Service`
  .serve_connection(io, service_fn(hello))
  .await
{
  println!("Error serving connection: {:?}", err);
}
```

await ということは Connection に Future が実装されていて poll が呼ばれているはずである。ここから poll hell を読んでいくのだが、先に作った `Connection { conn: proto }` が self として呼ばれていくのでその構造だけ書いておこう。

### Connection は IO と Service を持つ

まず Connection は

```rust
pin_project_lite::pin_project! {
    /// A future binding an http1 connection with a Service.
    ///
    /// Polling this future will drive HTTP forward.
    #[must_use = "futures do nothing unless polled"]
    pub struct Connection<T, S>
    where
        S: HttpService<IncomingBody>,
    {
        conn: Http1Dispatcher<T, S::ResBody, S>,
    }
}
```

という構造になっている。（pin_project は今度 Pin だけの解説ブログ書くので今はスルーします！）そして conn の Http1Dispatcher は型定義を追っていくと

```rust
pub(crate) struct Dispatcher<D, Bs: Body, I, T> {
    conn: Conn<I, Bs::Data, T>,
    dispatch: D,
    body_tx: Option<crate::body::Sender>,
    body_rx: Pin<Box<Option<Bs>>>,
    is_closing: bool,
}
```

として定義されている。さっき作った

```rust
let proto = proto::h1::Dispatcher::new(sd, conn);
```

は conn フィールドに入れられたが、その new は

```rust
pub(crate) fn new(dispatch: D, conn: Conn<I, Bs::Data, T>) -> Self {
  Dispatcher {
      conn,
      dispatch,
      body_tx: None,
      body_rx: Box::pin(None),
      is_closing: false,
  }
}
```

となっていた。`sd` は `proto::h1::dispatch::Server::new(service)` で作られた service であり(serve_connection で渡された tower の service)、疑似コードで構造を書くと

```
Connection {
    conn: Dispatcher {
        conn: Conn::new(io),
        dispatch: Server::new(service)
    }
}
```

である。そしてこの一番外側のConnectionがFutureを実装してpollを呼び出せるわけである。

## 連鎖する poll を追う

エントリポイントとなるコードは

```rust
if let Err(err) = http1::Builder::new()
  // `service_fn` converts our function in a `Service`
  .serve_connection(io, service_fn(hello))
  .await
{
  println!("Error serving connection: {:?}", err);
}
```

だ。この await の poll は以下のコードだ。

```rust
impl<I, B, S> Future for Connection<I, S>
where
    S: HttpService<IncomingBody, ResBody = B>,
    S::Error: Into<Box<dyn StdError + Send + Sync>>,
    I: Read + Write + Unpin + 'static,
    B: Body + 'static,
    B::Error: Into<Box<dyn StdError + Send + Sync>>,
{
    type Output = crate::Result<()>;

    fn poll(mut self: Pin<&mut Self>, cx: &mut task::Context<'_>) -> Poll<Self::Output> {
        match ready!(Pin::new(&mut self.conn).poll(cx)) {
            Ok(done) => {
                match done {
                    proto::Dispatched::Shutdown => {}
                    proto::Dispatched::Upgrade(pending) => {
                        // With no `Send` bound on `I`, we can't try to do
                        // upgrades here. In case a user was trying to use
                        // `Body::on_upgrade` with this API, send a special
                        // error letting them know about that.
                        pending.manual();
                    }
                };
                return Poll::Ready(Ok(()));
            }
            Err(e) => Poll::Ready(Err(e)),
        }
    }
}
```

つまり poll の引数の `mut self: Pin<&mut Self>` には先の Connection が使われる。それを念頭に置いてコードを読んでいこう。

### pollとは

Rust では async await は Poll が Ready か Pending かの進行管理用の状態を持った state machine へと書き換えられる。epoll などを使わずにナイーブに実装する場合のよくあるパターンは Ready になるまで poll を呼び出す方式で、poll の中から poll を再帰的に呼び出すなどする。これは採用する非同期ランタイムによって挙動はいくらでもカスタマイズできるが、基本的なアイデアは poll を呼んだ後にそれが Ready か Pending かの判定をして、タスクを実行するかどうかを決めるところにある。詳しくは [ライブラリを使わない非同期処理（前編）](/think-rust-async-part1/) を読んで欲しい。

### Dispatcher の poll

先ほどの `Pin::new(&mut self.conn).poll(cx)` の self は

```
Connection {
    conn: Dispatcher {
        conn: Conn::new(io),
        dispatch: Server::new(service)
    }
}
```

なので呼ばれる conn は Dispatcher で、その poll は

```rust
impl<D, Bs, I, T> Future for Dispatcher<D, Bs, I, T>
where
    D: Dispatch<
            PollItem = MessageHead<T::Outgoing>,
            PollBody = Bs,
            RecvItem = MessageHead<T::Incoming>,
        > + Unpin,
    D::PollError: Into<Box<dyn StdError + Send + Sync>>,
    I: Read + Write + Unpin,
    T: Http1Transaction + Unpin,
    Bs: Body + 'static,
    Bs::Error: Into<Box<dyn StdError + Send + Sync>>,
{
    type Output = crate::Result<Dispatched>;

    #[inline]
    fn poll(mut self: Pin<&mut Self>, cx: &mut task::Context<'_>) -> Poll<Self::Output> {
        self.poll_catch(cx, true)
    }
}
```

だ。poll_catch が連鎖的に呼ばれ、これは

```rust
fn poll_catch(
        &mut self,
        cx: &mut task::Context<'_>,
        should_shutdown: bool,
    ) -> Poll<crate::Result<Dispatched>> {
        Poll::Ready(ready!(self.poll_inner(cx, should_shutdown)).or_else(|e| {
            // Be sure to alert a streaming body of the failure.
            if let Some(mut body) = self.body_tx.take() {
                body.send_error(crate::Error::new_body("connection error"));
            }
            // An error means we're shutting down either way.
            // We just try to give the error to the user,
            // and close the connection with an Ok. If we
            // cannot give it to the user, then return the Err.
            self.dispatch.recv_msg(Err(e))?;
            Ok(Dispatched::Shutdown)
        }))
    }
```

とくる。さらに `poll_inner` を読むと、

```rust
fn poll_inner(
  &mut self,
  cx: &mut task::Context<'_>,
  should_shutdown: bool,
) -> Poll<crate::Result<Dispatched>> {
  T::update_date();

  ready!(self.poll_loop(cx))?;

  if self.is_done() {
    if let Some(pending) = self.conn.pending_upgrade() {
        self.conn.take_error()?;
        return Poll::Ready(Ok(Dispatched::Upgrade(pending)));
    } else if should_shutdown {
        ready!(self.conn.poll_shutdown(cx)).map_err(crate::Error::new_shutdown)?;
    }
    self.conn.take_error()?;
    Poll::Ready(Ok(Dispatched::Shutdown))
  } else { Poll::Pending }
}
```

とくる。自分でprint debugしているわけではないので確証はないが、正常系としては `ready!(self.poll_loop(cx))?;` が呼ばれるだろう。UPGRADEが呼ばれるのは websocket くらいだからだ。

FYI: https://blog.ojisan.io/rust-websocket/

poll_loopを追うと

```rust
fn poll_loop(&mut self, cx: &mut task::Context<'_>) -> Poll<crate::Result<()>> {
    // Limit the looping on this connection, in case it is ready far too
    // often, so that other futures don't starve.
    //
    // 16 was chosen arbitrarily, as that is number of pipelined requests
    // benchmarks often use. Perhaps it should be a config option instead.
    for _ in 0..16 {
        let _ = self.poll_read(cx)?;
        let _ = self.poll_write(cx)?;
        let _ = self.poll_flush(cx)?;

        // This could happen if reading paused before blocking on IO,
        // such as getting to the end of a framed message, but then
        // writing/flushing set the state back to Init. In that case,
        // if the read buffer still had bytes, we'd want to try poll_read
        // again, or else we wouldn't ever be woken up again.
        //
        // Using this instead of task::current() and notify() inside
        // the Conn is noticeably faster in pipelined benchmarks.
        if !self.conn.wants_read_again() {
            //break;
            return Poll::Ready(Ok(()));
        }
    }
    trace!("poll_loop yielding (self = {:p})", self);
    task::yield_now(cx).map(|never| match never {})
}
```

と言うふうに poll_read, poll_write が呼ばれているが、これこそ Read, Write の処理になっている。

### IO の挙動を追う

#### poll_read

```rust
fn poll_read(&mut self, cx: &mut task::Context<'_>) -> Poll<crate::Result<()>> {
    loop {
        if self.is_closing {
           return Poll::Ready(Ok(()));
        } else if self.conn.can_read_head() {
           ready!(self.poll_read_head(cx))?;
        } else if let Some(mut body) = self.body_tx.take() {
        if self.conn.can_read_body() {
           match body.poll_ready(cx) {
               ...
           }
           match self.conn.poll_read_body(cx) {
               ...
           }
        } else {
           // just drop, the body will close automatically
        }
        ...
    }
}
```

ここから先は詳しくは読んでいかないが、`poll_read_head` と `poll_read_body` とある通り HTTP をパースする（それ以外にもしていることは後で見るんだけど）。

```rust
pub(crate) fn poll_read_body(&mut self, cx: &mut task::Context<'_>,) -> Poll<Option<io::Result<Bytes>>> {
    debug_assert!(self.can_read_body());
    let (reading, ret) = match self.state.reading {
        Reading::Body(ref mut decoder) => {
            match ready!(decoder.decode(cx, &mut self.io)) {
                ...
            }
        }
        ...
    };
    self.state.reading = reading;
    self.try_keep_alive(cx);
    ret
}
```

さて、ここで pollXXX の戻り値の型が Poll である理由を考えたい。実装を読んでいると結局 `Poll::Ready(Ok(()))` のように自分で Poll をラップして返しているケースが多いのだが、どうして Poll 型である必要があるのだろうか。それはきっとどこかで tokio に依存しているようなところが出るからに違いない。そしてそれは間違いなく IO 関連のものだろう。というわけで本当に Poll が必要になる場面がどこになるのか探していこう。

そう言う視点でコードを読むと怪しいのは `decoder.decode` だろう。

#### decode

```rust
pub(crate) fn decode<R: MemRead>(
        &mut self,
        cx: &mut task::Context<'_>,
        body: &mut R,
    ) -> Poll<Result<Bytes, io::Error>> {
        trace!("decode; state={:?}", self.kind);
        match self.kind {
            Length(ref mut remaining) => {
                if *remaining == 0 {
                    Poll::Ready(Ok(Bytes::new()))
                } else {
                    let to_read = *remaining as usize;
                    let buf = ready!(body.read_mem(cx, to_read))?;
                    let num = buf.as_ref().len() as u64;
                    if num > *remaining {
                        *remaining = 0;
                    } else if num == 0 {
                        return Poll::Ready(Err(io::Error::new(
                            io::ErrorKind::UnexpectedEof,
                            IncompleteBody,
                        )));
                    } else {
                        *remaining -= num;
                    }
                    Poll::Ready(Ok(buf))
                }
            }
            Chunked(ref mut state, ref mut size) => {
                ...
            }
            Eof(ref mut is_eof) => {
                ...
            }
        }
    }
```

ここではHTTP Headerに合わせてdecodeの戦略を切り替えられる。たとえば decode するときに Content-Length 分だけ文字数を消費することでデータを取り込んだりしている。poll_read の戻り値が Poll になっている理由は poll_read は一部の分岐で再起的にpoll_readを呼んでおり、その中の decode の一部のパスが read_mem を使っているからだ。

#### MemRead

decode には `decoder.decode(cx, &mut self.io)` としてself.io が`body: &mut R` として渡されており、これは `decode<R: MemRead>` を満たしているIFになっている。その結果 `impl<T, B> MemRead for Buffered<T, B>` の `read_mem` を呼び出しており、そこから `poll_read_from_io` が呼ばれる。

```rust
impl<T, B> MemRead for Buffered<T, B>
where
    T: Read + Write + Unpin,
    B: Buf,
{
    fn read_mem(&mut self, cx: &mut task::Context<'_>, len: usize) -> Poll<io::Result<Bytes>> {
        if !self.read_buf.is_empty() {
            let n = std::cmp::min(len, self.read_buf.len());
            Poll::Ready(Ok(self.read_buf.split_to(n).freeze()))
        } else {
            let n = ready!(self.poll_read_from_io(cx))?;
            Poll::Ready(Ok(self.read_buf.split_to(::std::cmp::min(len, n)).freeze()))
        }
    }
}
```

#### poll_read_from_io

poll_read_from_io はいかにもな名前で怪しく、

```rust
pub(crate) fn poll_read_from_io(
        &mut self,
        cx: &mut task::Context<'_>,
    ) -> Poll<io::Result<usize>> {
        self.read_blocked = false;
        let next = self.read_buf_strategy.next();
        if self.read_buf_remaining_mut() < next {
            self.read_buf.reserve(next);
        }

        let dst = self.read_buf.chunk_mut();
        let dst = unsafe { &mut *(dst as *mut _ as *mut [MaybeUninit<u8>]) };
        let mut buf = ReadBuf::uninit(dst);
        match Pin::new(&mut self.io).poll_read(cx, buf.unfilled()) {
            Poll::Ready(Ok(_)) => {
                let n = buf.filled().len();
                trace!("received {} bytes", n);
                unsafe {
                    // Safety: we just read that many bytes into the
                    // uninitialized part of the buffer, so this is okay.
                    // @tokio pls give me back `poll_read_buf` thanks
                    self.read_buf.advance_mut(n);
                }
                self.read_buf_strategy.record(n);
                Poll::Ready(Ok(n))
            }
            Poll::Pending => {
                self.read_blocked = true;
                Poll::Pending
            }
            Poll::Ready(Err(e)) => Poll::Ready(Err(e)),
        }
    }
```

buffer 列を見るようなコードが出てきた。

#### Dispatcher の実体を探しにエントリポイントを見つめ直す

この中で `Pin::new(&mut self.io).poll_read(cx, buf.unfilled())` が呼ばれるが、この `self` は元々 はDispatcher の conn であり、`Conn::new(io)` だ。つまり TokioIo である。ここで Poll が帰っている謎が解ける。基本的に `Poll::Ready()` といったラップを自分たちがしていて、本当にOSレベルで非同期な処理というのは見つからなかったが poll 呼び出しの深淵で tokio を使っているのである。そのためここで生まれてしまった Poll に合わせるために Poll のラッパーを返したり関数が async になったりしていたということである。なので使われているのは TokioIo の Read で

```rust
impl<T> hyper::rt::Read for TokioIo<T>
where
    T: tokio::io::AsyncRead,
{
    fn poll_read(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        mut buf: hyper::rt::ReadBufCursor<'_>,
    ) -> Poll<Result<(), std::io::Error>> {
        let n = unsafe {
            let mut tbuf = tokio::io::ReadBuf::uninit(buf.as_mut());
            match tokio::io::AsyncRead::poll_read(self.project().inner, cx, &mut tbuf) {
                Poll::Ready(Ok(())) => tbuf.filled().len(),
                other => return other,
            }
        };

        unsafe {
            buf.advance(n);
        }
        Poll::Ready(Ok(()))
    }
}
```

だ。なので Poll や async が伝播していたのはこのメソッドのためとも言える。

詳しくは見ないが反対にpoll_write と poll_flush はレスポンスを返すためのIOとして使われている。この事実は

```rust
let _ = self.poll_read(cx)?;
// let _ = self.poll_write(cx)?;
// let _ = self.poll_flush(cx)?;
```

としてコメントアウトしてコンパイルしてみるとわかるだろう。何も表示されなくなる。

### Service の挙動を追う

先に見たように大元のpollが実装されている Connection は

```
Connection {
    conn: Dispatcher {
        conn: Conn::new(io),
        dispatch: Server::new(service)
    }
}
```

と言う構造だった。なので service の実装は dispatch にあると言える。なのでこの dispatch を呼び出しているところを探せば良い。結論から述べると、それは `poll_write` だ。

```rust
fn poll_write(&mut self, cx: &mut task::Context<'_>) -> Poll<crate::Result<()>> {
        loop {
            if self.is_closing {
                return Poll::Ready(Ok(()));
            } else if self.body_rx.is_none()
                && self.conn.can_write_head()
                && self.dispatch.should_poll()
            {
                if let Some(msg) = ready!(Pin::new(&mut self.dispatch).poll_msg(cx)) {
                    ...
                } else {
                    self.close();
                    return Poll::Ready(Ok(()));
                }
            } else if !self.conn.can_buffer_body() {
                ready!(self.poll_flush(cx))?;
            } else {
                ...
            }
        }
    }
```

本来 poll_writeは IO での buffer への書き込みを担当しているが、Service にまつわる準備もこの段階で行われている。`Pin::new(&mut self.dispatch).poll_msg(cx)` を呼び出しているが、この poll_msg は Service に実装されたメソッドだ。それを追うと、

```rust
fn poll_msg(
  mut self: Pin<&mut Self>,
  cx: &mut task::Context<'_>,
) -> Poll<Option<Result<(Self::PollItem, Self::PollBody), Self::PollError>>> {
  let mut this = self.as_mut();
  let ret = if let Some(ref mut fut) = this.in_flight.as_mut().as_pin_mut() {
      let resp = ready!(fut.as_mut().poll(cx)?);
      let (parts, body) = resp.into_parts();
      let head = MessageHead {
          version: parts.version,
          subject: parts.status,
          headers: parts.headers,
          extensions: parts.extensions,
      };
      Poll::Ready(Some(Ok((head, body))))
  } else {
      unreachable!("poll_msg shouldn't be called if no inflight");
  };

  this.in_flight.set(None);
  ret
}
```

であり、

```rust
let ret = if let Some(ref mut fut) = this.in_flight.as_mut().as_pin_mut() {
let resp = ready!(fut.as_mut().poll(cx)?);
```

の fut.poll で service のメソッドを実行している。

#### tower と Service

tower を知らない人に補足をすると、[tower](https://github.com/tower-rs/tower) は Service という単位で HTTP Server における middleware を抽象化する。Descriptionには `async fn(Request) -> Result<Response, Error>` とあるが、まさしくこの構造を layer として積み上げることができる。tower の上では router も tower の service であり、

```rust
impl Service<Request<Incoming>> for MyStruct {
    type Response = Response<String>;
    type Error = String;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn call(&self, req: Request<Incoming>) -> Self::Future {
        Box::pin(async move {
            match (req.method(), req.uri().path()) {
                (&Method::GET, "/") => Ok(Response::new("body".to_string())),
                (&Method::GET, "/echo") => Ok(Response::new("echo".to_string())),
                // Return 404 Not Found for other routes.
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

ここの MyStruct を

```rust
#[derive(Debug, Clone, Copy)]
struct MyStruct<S> {
    inner: S,
}
```

と定義しておき、call の中でその inner を呼ぶことで service を layer と連ねていくのがパターンだ。

詳しくは https://tokio.rs/blog/2021-05-14-inventing-the-service-trait を読んで欲しい。

これは汎用的なものでRustにおける非同期なHTTPサーバーを作るための一種のパターンなので覚えておこう。tower でなくても hyper自体や actix-web もこのデザインだ。

#### Service の呼ばれ方

ここでの service は

```rust
service_fn(hello)
```

だ。そして hello は

```rust
async fn hello(_: Request<hyper::body::Incoming>) -> Result<Response<Full<Bytes>>, Infallible> {
    Ok(Response::new(Full::new(Bytes::from("Hello, World!"))))
}
```

となっている。

`service_fn` は、

```rust
pub fn service_fn<F, R, S>(f: F) -> ServiceFn<F, R>
where
    F: Fn(Request<R>) -> S,
    S: Future,
{
    ServiceFn {
        f,
        _req: PhantomData,
    }
}

/// Service returned by [`service_fn`]
pub struct ServiceFn<F, R> {
    f: F,
    _req: PhantomData<fn(R)>,
}

impl<F, ReqBody, Ret, ResBody, E> Service<Request<ReqBody>> for ServiceFn<F, ReqBody>
where
    F: Fn(Request<ReqBody>) -> Ret,
    ReqBody: Body,
    Ret: Future<Output = Result<Response<ResBody>, E>>,
    E: Into<Box<dyn StdError + Send + Sync>>,
    ResBody: Body,
{
    type Response = crate::Response<ResBody>;
    type Error = E;
    type Future = Ret;

    fn call(&self, req: Request<ReqBody>) -> Self::Future {
        (self.f)(req)
    }
}
```

という定義で、call を使ってハンドラを呼べるようにする。つまりあるハンドラを tower の Service として使えるようにしてくれるものだ。

#### this.in_flight が呼ばれるまで

さて、さきの poll は、service の call が呼ばれて返る `Self::Future` の poll を呼び出したものだ。

だが `this.in_flight` の中身がどこからきたかには触れていない。最後にこの中身について見てみよう。`in_flight` は

```rust
let mut this = self.as_mut();
let ret = if let Some(ref mut fut) = this.in_flight.as_mut().as_pin_mut() {
let resp = ready!(fut.as_mut().poll(cx)?);
```

として service の call 結果の実行のために使われるが、self は

```rust
pub(crate) struct Server<S: HttpService<B>, B> {
  in_flight: Pin<Box<Option<S::Future>>>,
  pub(crate) service: S,
}
```

である。今回はこの Server の実体は

```rust
let sd = proto::h1::dispatch::Server::new(service);
```

で作られる Server にある。そして new は

```rust
pub(crate) fn new(service: S) -> Server<S, B> {
    Server {
        in_flight: Box::pin(None),
        service,
    }
}
```

なので None であり、

```rust
let ret = if let Some(ref mut fut) = this.in_flight.as_mut().as_pin_mut() {
```

が service の実行結果を得られる保証がないのである。

なのでこの in_flight をセットしている箇所を探してみると、その起点がpoll_readにあることがわかる。

```rust
fn poll_read(&mut self, cx: &mut task::Context<'_>) -> Poll<crate::Result<()>> {
    loop {
        if self.is_closing {
            return Poll::Ready(Ok(()));
        } else if self.conn.can_read_head() {
    ready!(self.poll_read_head(cx))?;
```

この `poll_read_head` の中にある

```rust
match ready!(self.conn.poll_read_head(cx)) {
    Some(Ok((mut head, body_len, wants))) => {
        ...
        self.dispatch.recv_msg(Ok((head, body)))?;
        Poll::Ready(Ok(()))
    }
    ...
}
```

`recv_msg` は、

```rust
fn recv_msg(&mut self, msg: crate::Result<(Self::RecvItem, IncomingBody)>) -> crate::Result<()> {
    let (msg, body) = msg?;
    let mut req = Request::new(body);
    *req.method_mut() = msg.subject.0;
    *req.uri_mut() = msg.subject.1;
    *req.headers_mut() = msg.headers;
    *req.version_mut() = msg.version;
    *req.extensions_mut() = msg.extensions;
    let fut = self.service.call(req);
    self.in_flight.set(Some(fut));
    Ok(())
}
```

であり、ここで`let fut = self.service.call(req);` が tower 経由でサービスを呼び出して、call で作り出した future を in_flight にセットしている。その結果、至る所にあるloopを起点に定期的に poll_msg 経由で future を解決していると言うデザインだ。

と言うわけで

```rust
let ret = if let Some(ref mut fut) = this.in_flight.as_mut().as_pin_mut() {
let resp = ready!(fut.as_mut().poll(cx)?);
```

の呼び出しがサービスを実行できていることが分かったと思う。

### 本当にそんな空中給油みたいなことをしているのか

どうしてそんなことを知っているかと言うと、手で print デバッグしたからだ💢

とりあえず関数名に print debug をしかけてみて実行して見たら以下のように表示された。

```

poll_inner
poll_inner
poll_loop
poll_read
poll_loop
poll_read
poll_read_head
poll_read_head
poll_write
poll_flush
poll_flush done
recv_msg call before
recv_msg
HttpService call
poll_write
poll_msg
Received request to /
echo service <- これが service の呼び出し
write_head
a poll_write loop end
a poll_write loop end
poll_flush
poll_flush done
...
```

`poll_msg` の後に呼ばれていることと、 `poll_msg` が `recv_msg` の後に呼ばれていることから呼び出し順が見えてくる。
print デバッグして初めて見えたこともあるのでそれも気が向いたらブログに書く。

とりあえずはここで、リクエストの読み込み、レスポンスの書き込み、middleware の実行が読み取れた

## 次書くもの

ここまでで hyper の実装は読み取れた。axum は HTTP Serving に関してはその実装のほとんどが hyper そのものである。なので axum の Serving 部分はコードが読めたと言える。ただ、実はいま読んだ hyper は 1系であり axum が依存している hyper は 0.14 系で、`poll_next_` や `poll_watch` がないといった差異があったりする。それでも TCPStream をハンドリングしてサービスを実行してレスポンスを返すという流れに違いはないので次のステップに進める。

本来は axum のコードを読みたかったが、hyper を読んだことで Serving ではないところをこれから読めるようになったので、次は axum の core を読んでいく。
