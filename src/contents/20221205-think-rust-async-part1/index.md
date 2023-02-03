---
path: /think-rust-async-part1
created: "2022-12-05"
title: ライブラリを使わない非同期処理（前編）
visual: "./visual.png"
tags: ["rust", "multi thread", "async runtime"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

この記事は [Rust アドベントカレンダー](https://qiita.com/advent-calendar/2022/rust) 5 日目の記事です。OGP 画像は間に合わなさそうな画像です。

Rust そのものには非同期処理の仕組み自体はありますが、非同期のタスク群をスケジューリングして実行する仕組みがありません。これはユーザーもしくはライブラリに任されています。例えば代表的なライブラリである tokio は schadular や executor を提供します。

非同期処理は関係してくる分野が多くさまざまなレイヤーが重なるのでとても難しいと思っています。そこで非同期処理を深く理解するために tokio を使わなければレイヤーをひとつ剥がせて理解が深まると思いました。そこで tokio を使わずに Rust の公式　 crate だけで非同期処理を実現してみましょう。

ちなみに前編とついているのはアドベントカレンダーに間に合わせるために志半ばで切り上げたからです。というかアドベントカレンダーは元々 「Wasm と Off the main thread」 を書くとしてエントリーしていました。全然違うものを書いてます。ゴールポストをずらせるのは良いですね。

## ライブラリを使わない非同期処理の例

このような試みはすでにされており、

- [Asynchronous Programming in Rust](https://rust-lang.github.io/async-book/)
- [並行プログラミング入門 ―Rust、C、アセンブリによる実装からのアプローチ](https://amzn.asia/d/6o4saEs)

などといった素晴らしい書籍があります。

特に「並行プログラミング入門」は私の大好きな本で、非同期処理の例も簡潔でわかりやすいです。ただそれでも非同期処理それ自体がなかなかに奥が深かったり、最適化などの文脈を合わせて考えたりすると何が最小構成か分かりづらいです。そこで 並行プログラミング入門 に出てくる例をさらに噛み砕き、自分なりに解説を試みます。

## 非同期処理それ自体

まずは schedular や executor を考えない例です。記事タイトルに前編とある通り、これらは後編で扱います。

例としては [並行プログラミング入門 の 5.1](https://github.com/oreilly-japan/conc_ytakano/blob/main/chap5/5.2/ch5_2_1_hello/src/main.rs) にあるこのようなコードを使います。

```rust
use futures::future::{BoxFuture, FutureExt};
use futures::task::{waker_ref, ArcWake};
use std::future::Future;
use std::pin::Pin;
use std::sync::{Arc, Mutex};
use std::task::{Context, Poll};

struct Hello { // <1>
    state: StateHello,
}

// 状態 <2>
enum StateHello {
    HELLO,
    WORLD,
    END,
}

impl Hello {
    fn new() -> Self {
        Hello {
            state: StateHello::HELLO, // 初期状態
        }
    }
}

impl Future for Hello {
    type Output = ();

    // 実行関数 <3>
    fn poll(mut self: Pin<&mut Self>,
            _cx: &mut Context<'_>) -> Poll<()> {
        match (*self).state {
            StateHello::HELLO => {
                print!("Hello, ");
                // WORLD状態に遷移
                (*self).state = StateHello::WORLD;
                Poll::Pending // 再度呼び出し可能
            }
            StateHello::WORLD => {
                println!("World!");
                // END状態に遷移
                (*self).state = StateHello::END;
                Poll::Pending // 再度呼び出し可能
            }
            StateHello::END => {
                Poll::Ready(()) // 終了
            }
        }
    }
}

// 実行単位 <1>
struct Task {
    hello: Mutex<BoxFuture<'static, ()>>,
}

impl Task {
    fn new() -> Self {
        let hello = Hello::new();
        Task {
            hello: Mutex::new(hello.boxed()),
        }
    }
}

// 何もしない
impl ArcWake for Task {
    fn wake_by_ref(_arc_self: &Arc<Self>) {}
}

fn main() {
    // 初期化
    let task = Arc::new(Task::new());
    let waker = waker_ref(&task);
    let mut ctx = Context::from_waker(&waker); // <2>
    let mut hello = task.hello.lock().unwrap();

    // 停止と再開の繰り返し <3>
    hello.as_mut().poll(&mut ctx);
    hello.as_mut().poll(&mut ctx);
    hello.as_mut().poll(&mut ctx);
}
```

### Future とは何か

別の言語であれば Promise や IO などと呼ばれているかもしれません。非同期の処理であるという文脈を付与してくれるものとして私は捉えています。

Future は Rust では <https://async-book-ja.netlify.app/02_execution/02_future.html> の例を借りると

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

として表現できます。

`Output` は非同期処理が完了した時に得られる値の型、`poll` は非同期処理が完了したか問い合わせる関数、`Poll` は非同期処理完了を表す `Ready` と非同期処理中を表す `Pending` から成り立つ enum です。

なんらかの Future が作られたら、それを呼び出す側は poll を呼び出して「タスク完了した？」と聞いて、完了していなければ完了するまで呼び出し続けることでいつかは Ready を得られるという算段です。

しかし何回も poll を呼んだり、ましてやそれを loop の中でしているとその実行スレッドを占有することになるので wake という仕組みで防ぐのが現実です。例えば OS 側からタスクの完了を通知してもらい wake を呼んでもらうことでそこにあらかじめ登録しておいた処理を呼び出させるといった使い方（よくあるのは実行キューに Task を入れてもらう）があるので、一般的には非同期処理は wake のような仕組みを使うと便利になります。

さて、そのような簡単な例ですが、`Context`、`BoxFuture`、`ArcWake`、`wake_by_ref`、`Task`、`waker_ref` といった非同期処理くらいでしかみかけない単語がたくさん出てきます。これらを見ていきましょう。

### Waker とはなにか

まず poll の引数の Context から見ていきます。
poll は非同期処理が完了したかどうかを問い合わせられる、Future に備わるインターフェースです。
その Context は

```rust
/// The `Context` of an asynchronous task.
///
/// Currently, `Context` only serves to provide access to a `&Waker`
/// which can be used to wake the current task.
#[stable(feature = "futures_api", since = "1.36.0")]
pub struct Context<'a> {
    waker: &'a Waker,
    // Ensure we future-proof against variance changes by forcing
    // the lifetime to be invariant (argument-position lifetimes
    // are contravariant while return-position lifetimes are
    // covariant).
    _marker: PhantomData<fn(&'a ()) -> &'a ()>,
}

impl<'a> Context<'a> {
    /// Create a new `Context` from a `&Waker`.
    #[stable(feature = "futures_api", since = "1.36.0")]
    #[must_use]
    #[inline]
    pub fn from_waker(waker: &'a Waker) -> Self {
        Context { waker, _marker: PhantomData }
    }

    /// Returns a reference to the `Waker` for the current task.
    #[stable(feature = "futures_api", since = "1.36.0")]
    #[must_use]
    #[inline]
    pub fn waker(&self) -> &'a Waker {
        &self.waker
    }
}
```

と定義されています。どうやら Waker のラッパーです。
では Waker とは何でしょうか。Waker は 該当の Future が進行可能、PENDING でなく READY であることを通知するための仕組みと書かれています。

```rust
/// A `Waker` is a handle for waking up a task by notifying its executor that it
/// is ready to be run.
///
/// This handle encapsulates a [`RawWaker`] instance, which defines the
/// executor-specific wakeup behavior.
///
/// Implements [`Clone`], [`Send`], and [`Sync`].
#[repr(transparent)]
#[stable(feature = "futures_api", since = "1.36.0")]
pub struct Waker {
    waker: RawWaker,
}
```

その通知用の関数である wake 関数は Waker に impl されています。

```rust
impl Waker {
    /// Wake up the task associated with this `Waker`.
    ///
    /// As long as the executor keeps running and the task is not finished, it is
    /// guaranteed that each invocation of [`wake()`](Self::wake) (or
    /// [`wake_by_ref()`](Self::wake_by_ref)) will be followed by at least one
    /// [`poll()`] of the task to which this `Waker` belongs. This makes
    /// it possible to temporarily yield to other tasks while running potentially
    /// unbounded processing loops.
    ///
    /// Note that the above implies that multiple wake-ups may be coalesced into a
    /// single [`poll()`] invocation by the runtime.
    ///
    /// Also note that yielding to competing tasks is not guaranteed: it is the
    /// executor’s choice which task to run and the executor may choose to run the
    /// current task again.
    ///
    /// [`poll()`]: crate::future::Future::poll
    #[inline]
    #[stable(feature = "futures_api", since = "1.36.0")]
    pub fn wake(self) {
        // The actual wakeup call is delegated through a virtual function call
        // to the implementation which is defined by the executor.
        let wake = self.waker.vtable.wake;
        let data = self.waker.data;

        // Don't call `drop` -- the waker will be consumed by `wake`.
        crate::mem::forget(self);

        // SAFETY: This is safe because `Waker::from_raw` is the only way
        // to initialize `wake` and `data` requiring the user to acknowledge
        // that the contract of `RawWaker` is upheld.
        unsafe { (wake)(data) };
    }

    /// Wake up the task associated with this `Waker` without consuming the `Waker`.
    ///
    /// This is similar to [`wake()`](Self::wake), but may be slightly less efficient in
    /// the case where an owned `Waker` is available. This method should be preferred to
    /// calling `waker.clone().wake()`.
    #[inline]
    #[stable(feature = "futures_api", since = "1.36.0")]
    pub fn wake_by_ref(&self) {
        // The actual wakeup call is delegated through a virtual function call
        // to the implementation which is defined by the executor.

        // SAFETY: see `wake`
        unsafe { (self.waker.vtable.wake_by_ref)(self.waker.data) }
    }

    /// Returns `true` if this `Waker` and another `Waker` would awake the same task.
    ///
    /// This function works on a best-effort basis, and may return false even
    /// when the `Waker`s would awaken the same task. However, if this function
    /// returns `true`, it is guaranteed that the `Waker`s will awaken the same task.
    ///
    /// This function is primarily used for optimization purposes.
    #[inline]
    #[must_use]
    #[stable(feature = "futures_api", since = "1.36.0")]
    pub fn will_wake(&self, other: &Waker) -> bool {
        self.waker == other.waker
    }

    /// Creates a new `Waker` from [`RawWaker`].
    ///
    /// The behavior of the returned `Waker` is undefined if the contract defined
    /// in [`RawWaker`]'s and [`RawWakerVTable`]'s documentation is not upheld.
    /// Therefore this method is unsafe.
    #[inline]
    #[must_use]
    #[stable(feature = "futures_api", since = "1.36.0")]
    #[rustc_const_unstable(feature = "const_waker", issue = "102012")]
    pub const unsafe fn from_raw(waker: RawWaker) -> Waker {
        Waker { waker }
    }

    /// Get a reference to the underlying [`RawWaker`].
    #[inline]
    #[must_use]
    #[unstable(feature = "waker_getters", issue = "87021")]
    pub fn as_raw(&self) -> &RawWaker {
        &self.waker
    }
}
```

Waker のラッパーである Context が poll に渡していることから、poll 関数は Waker や wake が使えることとなります。
これは poll されたときにあらかじめ登録しておいた wake を呼び出せる仕組みが備わっていると解釈できます。
この Waker を作る方法は、一般的には Task の ArcWake に対して waker_ref を取ることで作り出します。
なので次の登場人物ととして Task を見ていきましょう。Task は非同期処理の処理の単位であり、Future のラッパーです。

```rust
struct Task {
    hello: Mutex<BoxFuture<'static, ()>>,
}

impl Task {
    fn new() -> Self {
        let hello = Hello::new();
        Task {
            hello: Mutex::new(hello.boxed()),
        }
    }
}
```

これは Future を Mutex で包むためのようなものです。
Future の進行状態は Future 自体で管理できるようにするので、それが外部から書き換えられないように lock を取るというわけです。

そしてその Task に ArcWake を実装します。これは wake と wake_by_ref を持ちます。wake の役割は Future が完了して状態を進行させて欲しいことを Future の外側に通知することです。こうすることで無駄な poll をなくせます。その通知は開発者に任せられており、wake は wake_by_ref がデフォルト実装されているので wake_by_ref にその通知処理を実装する必要があります。

```rust
/// A way of waking up a specific task.
///
/// By implementing this trait, types that are expected to be wrapped in an `Arc`
/// can be converted into [`Waker`] objects.
/// Those Wakers can be used to signal executors that a task it owns
/// is ready to be `poll`ed again.
///
/// Currently, there are two ways to convert `ArcWake` into [`Waker`]:
///
/// * [`waker`](super::waker()) converts `Arc<impl ArcWake>` into [`Waker`].
/// * [`waker_ref`](super::waker_ref()) converts `&Arc<impl ArcWake>` into [`WakerRef`] that
///   provides access to a [`&Waker`][`Waker`].
///
/// [`Waker`]: std::task::Waker
/// [`WakerRef`]: super::WakerRef
// Note: Send + Sync required because `Arc<T>` doesn't automatically imply
// those bounds, but `Waker` implements them.
pub trait ArcWake: Send + Sync {
    /// Indicates that the associated task is ready to make progress and should
    /// be `poll`ed.
    ///
    /// This function can be called from an arbitrary thread, including threads which
    /// did not create the `ArcWake` based [`Waker`].
    ///
    /// Executors generally maintain a queue of "ready" tasks; `wake` should place
    /// the associated task onto this queue.
    ///
    /// [`Waker`]: std::task::Waker
    fn wake(self: Arc<Self>) {
        Self::wake_by_ref(&self)
    }

    /// Indicates that the associated task is ready to make progress and should
    /// be `poll`ed.
    ///
    /// This function can be called from an arbitrary thread, including threads which
    /// did not create the `ArcWake` based [`Waker`].
    ///
    /// Executors generally maintain a queue of "ready" tasks; `wake_by_ref` should place
    /// the associated task onto this queue.
    ///
    /// This function is similar to [`wake`](ArcWake::wake), but must not consume the provided data
    /// pointer.
    ///
    /// [`Waker`]: std::task::Waker
    fn wake_by_ref(arc_self: &Arc<Self>);
}
```

今回の例だと外部(後編ではタスクランナーやスケジューラーといったものが登場する)に Future の進行を任せずに、開発者が

```rust
hello.as_mut().poll(&mut ctx);
hello.as_mut().poll(&mut ctx);
hello.as_mut().poll(&mut ctx);
```

として呼び出しており、肝心の非同期処理も OS からの通知を待つような待ち時間が発生しないので wake_by_ref でタスクの進行を指示する必要はありません。

```rust
fn poll(mut self: Pin<&mut Self>,
            _cx: &mut Context<'_>) -> Poll<()> {
        match (*self).state {
            StateHello::HELLO => {
                print!("Hello, ");
                // WORLD状態に遷移
                (*self).state = StateHello::WORLD;
                Poll::Pending // 再度呼び出し可能
            }
            StateHello::WORLD => {
                println!("World!");
                // END状態に遷移
                (*self).state = StateHello::END;
                Poll::Pending // 再度呼び出し可能
            }
            StateHello::END => {
                Poll::Ready(()) // 終了
            }
        }
    }
```

(普通は `(*self).state=` のところで epoll なりで OS 側からの通知を待ち受ける)

なので

```rust
// 何もしない
impl ArcWake for Task {
    fn wake_by_ref(_arc_self: &Arc<Self>) {}
}
```

といった何もしない実装で大丈夫です。

またしれっとスルーしましたが、task は Mutex だけでなく Arc でも囲みます。これは ArcWake や 後述の waker_ref が要求するためです。もしくは `Arc<Mutex<>>` はマルチスレッドプログラミングにおける [一つのパターン](https://rustforbeginners.hatenablog.com/entry/arc-mutex-design-pattern) とも見れます。

続いて waker_ref は task からその中の Future に対応する waker を取り出すものです。

```rust
/// Creates a reference to a [`Waker`] from a reference to `Arc<impl ArcWake>`.
///
/// The resulting [`Waker`] will call
/// [`ArcWake.wake()`](ArcWake::wake) if awoken.
#[inline]
pub fn waker_ref<W>(wake: &Arc<W>) -> WakerRef<'_>
where
    W: ArcWake,
{
    // simply copy the pointer instead of using Arc::into_raw,
    // as we don't actually keep a refcount by using ManuallyDrop.<
    let ptr = Arc::as_ptr(wake).cast::<()>();

    let waker =
        ManuallyDrop::new(unsafe { Waker::from_raw(RawWaker::new(ptr, waker_vtable::<W>())) });
    WakerRef::new_unowned(waker)
}
```

waker は poll を呼び出すために必要な Context を作るために必要なのでこのようにして waker を作る必要があります。
そして Context は waker を Context::from_waker に渡して作ります。

その結果が、

```rust
fn main() {
    // 初期化
    let task = Arc::new(Task::new());
    let waker = waker_ref(&task);
    let mut ctx = Context::from_waker(&waker); // <2>
    let mut hello = task.hello.lock().unwrap();

    // 停止と再開の繰り返し <3>
    hello.as_mut().poll(&mut ctx);
    hello.as_mut().poll(&mut ctx);
    hello.as_mut().poll(&mut ctx);
}
```

として Future を進行させます。

## まとめ

- 一つの非同期処理の単位を Task として定義
- Future の進行やその問合せは poll が行う
- poll には Context が必要であり、poll 実行時には wake を呼び出す
- Context は Waker のラッパー
- Task に ArcWake トレイトを実装して wake 処理の内容を登録
- poll するときは、Task から waker_by_ref で Waker を取り出し、それを Context でラップし、poll 関数に渡す

この辺の概念の図みたいなのは TBD

## 実装していないものや現実との差異

まず現実では開発者が poll を何度も呼び出すことはないと思います。一度 poll を呼べばタスクの完了まで自動的に poll が呼ばれ続けるか、必ずタスクが完了する poll しか呼ばれないです。自動的に poll が呼ばれ続ける仕組みは後半で説明する executor で、必ずタスクが完了する poll は OS のイベント通知システムやコールバックを使った仕組みが使われます。

なので実は上の例では API や DB にアクセスしておらず、本来であれば非同期処理する必要がないものです。そう言った例は OS 側からの通知機能を poll で使うことで実現できます。

ちなみに "一度 poll を呼べば" とかいたが、開発者が poll を書いたことなどないと思うかもしれないですが、実は poll は現実では await が対応しています。

後半ではこういったタスクのスケジューリングについてみていきます。実 API にアクセスする例を作れるかはまだわからないです。システムプログラミングめんどくさいし FFI とかもめんどくさいので…なんか良い例あったら教えてください…
