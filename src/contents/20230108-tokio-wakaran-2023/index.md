---
path: /tokio-wakaran-2023-winter
created: "2023-01-08"
title: tokio 分からん 2023冬
visual: "./visual.png"
tags: [rust, tokio, チラシの裏]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

自作ブログはチラシの裏として使っても怒られないのでチラシの裏として使う。

今年の目標の一つに自作グリーンスレッドの上に自作アクターモデルというのがあって、4 から勉強している最中だ(去年から勉強しているので 0 ではないの意)。まずは先人を見習おうと言うことで 12 月あたりから tokio を読んでいたのだが、そのとき解消できなかった疑問がある。まとめたので詳しい人は教えて欲しい。[Twitter](https://twitter.com/sadnessOjisan) 、もしくは Discord(sadnessOjisan#5541) で教えてくれると助かる。

タイトルは tokio 分からん 2023 冬だ。つまり春もあるはず。ずっと続きそう。死ぬ間際も「なんも分からん人生だった」って言ってそうな気がする。

## 実行される poll の実体はどれか

tokio では

```rust
#[tokio::main]
async fn main() {
    println!("hello");
}
```

というコードは、

```rust
fn main() {
    let mut rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        println!("hello");
    })
}
```

と変換される。

この

```rust
async {
    println!("hello");
}
```

は誰が実行するのだろうか？

例えば

```rust
let a = async {
    3
};
```

の a は `impl Future<Ooutput = i32>` と推論される。Future は await を呼ぶと poll という関数が実行される。その poll はこの場合どこにあるのだろうか。一般的に poll は Future を作った人（たとえばライブラリ）によって実装されているはずだ。もしくは自分で poll を定義するはずだ（[例](https://async-book-ja.netlify.app/02_execution/02_future.html)）。しかしただ Future を作った場合は poll されたときの挙動をどこかで定めたわけではない。先の a を tokio runtime に渡した場合 poll は誰がしているのだろうか。

ここで Future を復習すると、Rust における非同期処理、Future は簡易的には

```rust
trait SimpleFuture {
    type Output;
    fn poll(&mut self, wake: fn()) -> Poll<Self::Output>;
}

enum Poll<T> {
    Ready(T),
    Pending,
}
```

といった trait を提供しているだけだ。

FYI: <https://async-book-ja.netlify.app/02_execution/02_future.html>

そのためこれを利用するためには開発者が非同期タスクに対して何度も poll をして完了か問い合わせて完了していたらタスクの実行結果を取り出すといったことをしなければいけない。

が、それがめんどくさいので一般的にはビジーウェイトを組んで自動で poll する仕組みを作り上げたり、ブロッキングが許されないシステム（たとえばサーバー）では executor もしくは schedular もしくは runtime と呼ばれる機構とシステムコールを組み合わせて確実に成功する poll だけを実行する。この辺りの説明は <https://blog.ojisan.io/think-rust-async-part1/> にも書いたことがある。そしてその executor を提供するのが tokio だ。つまり tokio が

```rust
rt.block_on(async {
　　println!("hello");
})
```

の中で poll しているのを期待する。
実際 tokio の中では poll している箇所がある。

```rust
pub(crate) fn block_on<F: Future>(&mut self, f: F) -> Result<F::Output, ParkError> {
use std::task::Context;
use std::task::Poll::Ready;

// `get_unpark()` should not return a Result
let waker = self.get_unpark()?.into_waker();
let mut cx = Context::from_waker(&waker);

pin!(f);

loop {
    if let Ready(v) = crate::coop::budget(|| f.as_mut().poll(&mut cx)) {
      return Ok(v);
    }

    self.park()?;
}
```

(<https://github.com/tokio-rs/tokio/blob/86ffabe2af69f2440be26d153fd692689c9947fb/tokio/src/runtime/park.rs#L272>)

だがその poll はどこで実装されているのだろうか？

Future の実装には

```rust
#[stable(feature = "futures_api", since = "1.36.0")]
impl<F: ?Sized + Future + Unpin> Future for &mut F {
    type Output = F::Output;

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        F::poll(Pin::new(&mut **self), cx)
    }
}

#[stable(feature = "futures_api", since = "1.36.0")]
impl<P> Future for Pin<P>
where
    P: ops::DerefMut<Target: Future>,
{
    type Output = <<P as ops::Deref>::Target as Future>::Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        <P::Target as Future>::poll(self.as_deref_mut(), cx)
    }
}
```

といった Pin, Unpin に対してデフォルト実装があるのだが、これが関係しているようにも思える。tokio のコードリーディングをすると future を pin する箇所が見つかる。ただこれも`<P::Target as Future>::poll` なので最終的には poll の実装が必要に思える。tokio はどの poll を呼び出しているのだろうか。

## 関数ポインタの実行は何をしているのか

上の質問にも関係するが、tokio のソースコードを読んでみる。

エントリポイントを

```rust
rt.block_on(async {
        println!("hello");
})
```

とする。block_on は

```rust
#[track_caller]
pub fn block_on<F: Future>(&self, future: F) -> F::Output {
    #[cfg(all(tokio_unstable, feature = "tracing"))]
    let future = crate::util::trace::task(future, "block_on", None, task::Id::next().as_u64());
    let _ = self.enter();
    match &self.kind {
        Kind::CurrentThread(exec) => exec.block_on(future),
        #[cfg(all(feature = "rt-multi-thread", not(tokio_wasi)))]
        Kind::MultiThread(exec) => exec.block_on(future),
    }
}
```

(<https://github.com/tokio-rs/tokio/blob/86ffabe2af69f2440be26d153fd692689c9947fb/tokio/src/runtime/runtime.rs#L270>)

となり、どうせ config で full が与えられているだろうから MultiThread が呼ばれるとして、

```rust
/// Blocks the current thread waiting for the future to complete.
///
/// The future will execute on the current thread, but all spawned tasks
/// will be executed on the thread pool.
pub(crate) fn block_on<F>(&self, future: F) -> F::Output
where
    F: Future,
{
    let mut enter = crate::runtime::enter(true);
    enter.block_on(future).expect("failed to park thread")
}
```

(<https://github.com/tokio-rs/tokio/blob/687aa2bae5d6c70bb942238d793d9d2a41e59ac9/tokio/src/runtime/scheduler/multi_thread/mod.rs#L61>)

```rust
/// Blocks the thread on the specified future, returning the value with
/// which that future completes.
pub(crate) fn block_on<F>(&mut self, f: F) -> Result<F::Output, ParkError>
where
    F: std::future::Future,
{
    use crate::park::thread::CachedParkThread;
    let mut park = CachedParkThread::new();
    park.block_on(f)
}
```

(<https://github.com/tokio-rs/tokio/blob/86ffabe2af69f2440be26d153fd692689c9947fb/tokio/src/runtime/context.rs#L288>)

```rust
pub(crate) fn block_on<F: Future>(&mut self, f: F) -> Result<F::Output, ParkError> {
use std::task::Context;
use std::task::Poll::Ready;

// `get_unpark()` should not return a Result
let waker = self.get_unpark()?.into_waker();
let mut cx = Context::from_waker(&waker);

pin!(f);

loop {
    if let Ready(v) = crate::coop::budget(|| f.as_mut().poll(&mut cx)) {
      return Ok(v);
    }

    self.park()?;
}
```

(<https://github.com/tokio-rs/tokio/blob/86ffabe2af69f2440be26d153fd692689c9947fb/tokio/src/runtime/park.rs#L272>)

と辿られる。

Rust の Future の使われ方を考えると、poll は waker の wake 関数を呼ぶはずなのでそれを探しに into_waker を追ってみる。

```rust
pub(crate) fn into_waker(self) -> Waker {
    unsafe {
        let raw = unparker_to_raw_waker(self.inner);
        Waker::from_raw(raw)
    }
}
```

(<https://github.com/tokio-rs/tokio/blob/86ffabe2af69f2440be26d153fd692689c9947fb/tokio/src/runtime/park.rs#L298>)

```rust
unsafe fn unparker_to_raw_waker(unparker: Arc<Inner>) -> RawWaker {
    RawWaker::new(
        Inner::into_raw(unparker),
        &RawWakerVTable::new(clone, wake, wake_by_ref, drop_waker),
    )
}
```

(<https://github.com/tokio-rs/tokio/blob/86ffabe2af69f2440be26d153fd692689c9947fb/tokio/src/runtime/park.rs#L317>)

そしてこの RawWakerVTable 辺りから全く何も分からなくなる。
これらは std::task から import しており

```rust
use std::task::{RawWaker, RawWakerVTable, Waker};
```

(<https://github.com/tokio-rs/tokio/blob/86ffabe2af69f2440be26d153fd692689c9947fb/tokio/src/runtime/park.rs#L227>)、

これまでの教科書的な事例だと ArcWake を実装していたのと同じことを手でやらされている感がする。
一応標準ライブラリ側のコードを追ってみると、

```rust
pub const fn new(
        clone: unsafe fn(*const ()) -> RawWaker,
        wake: unsafe fn(*const ()),
        wake_by_ref: unsafe fn(*const ()),
        drop: unsafe fn(*const ()),
) -> Self {
    Self { clone, wake, wake_by_ref, drop }
}
```

ここで new に渡された wake が

```rust
unsafe fn wake(raw: *const ()) {
    let unparker = Inner::from_raw(raw);
    unparker.unpark();
}
```

として定義されている。関数ポインタが出てきて訳がわからない。

まずここで 疑問なのが `let unparker = Inner::from_raw(raw);` だ。
unparker とあるが unpark とはどういうことだろうか。
tokio には parking_lot のようなものが出てくるが、これは一時保管場所的なニュアンスがあるのでわかるが一般的に park 概念がよくわからない。

そして Inner の役割も分からない。

```rust
struct Inner {
    state: AtomicUsize,
    mutex: Mutex<()>,
    condvar: Condvar,
}
```

マルチスレッドプログラミングだぜっていう雰囲気は伝わる。

Inner がわかったとしてもこの定義は分からない。

```rust
unsafe fn from_raw(ptr: *const ()) -> Arc<Inner> {
    Arc::from_raw(ptr as *const Inner)
}
```

まあ Inner であることが保証された pointer を渡すことが想定されているのだろう。

そして unpark は

```rust
fn unpark(&self) {
// To ensure the unparked thread will observe any writes we made before
// this call, we must perform a release operation that `park` can
// synchronize with. To do that we must write `NOTIFIED` even if `state`
// is already `NOTIFIED`. That is why this must be a swap rather than a
// compare-and-swap that returns if it reads `NOTIFIED` on failure.
match self.state.swap(NOTIFIED, SeqCst) {
    EMPTY => return,    // no one was waiting
    NOTIFIED => return, // already unparked
    PARKED => {}        // gotta go wake someone up
    _ => panic!("inconsistent state in unpark"),
}

// There is a period between when the parked thread sets `state` to
// `PARKED` (or last checked `state` in the case of a spurious wake
// up) and when it actually waits on `cvar`. If we were to notify
// during this period it would be ignored and then when the parked
// thread went to sleep it would never wake up. Fortunately, it has
// `lock` locked at this stage so we can acquire `lock` to wait until
// it is ready to receive the notification.
//
// Releasing `lock` before the call to `notify_one` means that when the
// parked thread wakes it doesn't get woken only to have to wait for us
// to release `lock`.
drop(self.mutex.lock());

self.condvar.notify_one()
    }
```

として定義されている。

並行処理の教科書の玉手箱や〜みたいな感じのコードが出てきた。全体の流れを知らないと意味を理解できないので深入りはしないが、CAS で条件に合うかチェックしてからロックを解放して、どこかでブロックされている処理に対して解放されたことを通知するものでしょう。

つまり poll に渡される wake は、Inner であると保証している引数を受け取り、その unpark を呼び出し、なんらかのロックを解放してくれる。ニュアンス的には非同期ランタイムの tick を一つ進める形であろうか。

いまわかっていることは Rust 標準ライブラリにある RawWakerVTable に対して tokio の unpark を渡し、それを標準ライブラリがコールする wake として呼ばせていることだ。wake はタスクが Ready になったときに呼ぶものではあるが、それが tokio では unpark として呼び出すのはどういう意図があってだろうか。そもそも tokio を使わない非同期処理における wake の詳細が知りたい。日本語で説明するならば poll してもいいことを外に知らせる仕組みではあるが、どうしてそこに RawWakerVTable のような難しそうなものが出てくるのだろうか。ちゃんと理解したい。

## グリーンスレッドはどう実現しているのか

疲れたのでコードリーディング的なことは書かないのだが、tokio でのグリーンスレッドの実現方法が気になっている。

グリーンスレッドは [並行プログラミング入門 ―Rust、C、アセンブリによる実装からのアプローチ](https://amzn.asia/d/6o4saEs)でも習った。ユーザーランドでのスレッドだ。しかし CPU リソースは決まっているのでコンテキストスイッチを自分で実装する必要があることも知っている。

なので自分の予想では tokio::spawn が呼ばれると task_id を作ってスケジュール関数を呼び出すといった動きをし、コンテキストスイッチがされるはずである。そしてそれは一部その通りになっている。

```rust
pub(super) fn spawn_inner<T>(future: T, name: Option<&str>) -> JoinHandle<T::Output>
    where
    T: Future + Send + 'static,
    T::Output: Send + 'static,
{
  use crate::runtime::{task, context};
  let id = task::Id::next();
  let spawn_handle = context::spawn_handle().expect(CONTEXT_MISSING_ERROR);
  let task = crate::util::trace::task(future, "task", name, id.as_u64());
  spawn_handle.spawn(task, id)
}
```

ただ Context Switch が見つからなかった。レジスタへの保存をするたびにアセンブラが呼ばれると思っていた。`extern "C"` で grep してもひっかからない。だとしたら Context Switch はどのように実現しているのだろうか。これはまだちゃんと読めていないだけなので読めばあるはずだが、さっと目で追った限りではよくわからなかった。

あと単純にマルチスレッド上でグリーンスレッドをする旨味ってなんだろうか。シングルスレッド上でやろうが結局は引き出せるハードウェアパワーには上限があるのだから同じではないのだろうか。
