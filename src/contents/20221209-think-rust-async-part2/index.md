---
path: /think-rust-async-part2
created: "2022-12-09"
title: ライブラリを使わない非同期処理（後編）
visual: "./visual.png"
tags: ["rust"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

# ライブラリを使わない非同期処理(後編)

先日、[前編](https://blog.ojisan.io/think-rust-async-part1/) を書きました。今日はその後編です。Executor や Schedular の実装を見ていきます。

Executor があると、非同期処理を完了させるために開発者が poll を何度も呼び出さなくても良くなります。

## 詳解に入る前に概念的な説明

非同期処理とは本質的に何でしょうか。非同期処理がない世界では、タスクの到着に対してその場で実行し、それが完了するまで後続のタスクは実行できません。もしタスクの中に長い時間がかかる IO が含まれていたら、その IO 待ちの間は後続のタスクが実行できません。そこで生まれたアイデアが、IO の待ち時間は別のタスクをするという考えです。

### IO の完了を通知する仕組み

IO の待ち時間は別のタスクをするためにはどうすればよいでしょうか。
よくあるのは、IO 完了時に完了後の処理を行うように登録だけしてしまうことです。
これは OS にそのような仕組みが備わっているので実現可能です。
代表的なものだと epoll や kqueue といったシステムコールです。
Rust からだも mio や nix という crate で抽象化されていて使えます。
（もちろん直接 FFI してしまっても良い）

これらは waker を渡しておき、OS 側から wake を呼び出してもらえば executor にその非同期 IO を含むタスクの実行を scheduling してもらえる算段です。
ただ再スケジューリング時に自分が登録した IO 依頼の結果を受け取らないといけないので、その IO プロセスに対応した file descripter は Future を実装した構造体で管理させないといけないという追加実装は発生します。（これまでの例でいう `self.state` で管理していたように。ここで fd を管理すると良いです）

何はともあれ、今回の例は実際に IO はしないのでこの辺の話は忘れてしまっても良いです。ただ非同期 IO を考える場合も OS 側に通知の仕組みがあるから、これから説明する IO 無しのモデルと同じような実装で実務が回るということを伝えたかっただけです。

### IO が完了したタスクを実行できるタスクを実行する仕組み

IO が完了したらそのタスクは IO の待ち時間なしで実行できます。そういったタスクだけを集められる仕組みとして queue を用意します。この queue を使った仕組みは executor などと呼ばれることも多いです。queue からタスクを取り出して実行し続けてくれる仕組みです。

### 非同期 IO を実行するために必要なもの

つまり待ち時間がないタスクを executor の queue に突っ込む仕組みを作れば非同期処理は実装できます。

## 具体例を見ていこう

例はまた並行プログラミング入門から拝借し、今日は <https://github.com/oreilly-japan/conc_ytakano/blob/main/chap5/5.2/ch5_2_2_sched/src/main.rs> です。

```rust
use futures::future::{BoxFuture, FutureExt};
use futures::task::{waker_ref, ArcWake};
use std::future::Future;
use std::pin::Pin;
use std::sync::mpsc::{sync_channel, Receiver, SyncSender}; // <1>
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

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<()> {
        match (*self).state {
            StateHello::HELLO => {
                print!("Hello, ");
                (*self).state = StateHello::WORLD;
                cx.waker().wake_by_ref(); // 自身を実行キューにエンキュー
                return Poll::Pending;
            }
            StateHello::WORLD => {
                println!("World!");
                (*self).state = StateHello::END;
                cx.waker().wake_by_ref(); // 自身を実行キューにエンキュー
                return Poll::Pending;
            }
            StateHello::END => {
                return Poll::Ready(());
            }
        }
    }
}

struct Task {
    // 実行するコルーチン
    future: Mutex<BoxFuture<'static, ()>>, // <1>
    // Executorへスケジューリングするためのチャネル
    sender: SyncSender<Arc<Task>>, // <2>
}

impl ArcWake for Task {
    fn wake_by_ref(arc_self: &Arc<Self>) { // <3>
        // 自身をスケジューリング
        let self0 = arc_self.clone();
        arc_self.sender.send(self0).unwrap();
    }
}

struct Executor { // <1>
    // 実行キュー
    sender: SyncSender<Arc<Task>>,
    receiver: Receiver<Arc<Task>>,
}

impl Executor {
    fn new() -> Self {
        // チャネルを生成。キューのサイズは最大1024個
        let (sender, receiver) = sync_channel(1024);
        Executor {
            sender: sender.clone(),
            receiver,
        }
    }

    // 新たにTaskを生成するためのSpawnerを作成 <2>
    fn get_spawner(&self) -> Spawner {
        Spawner {
            sender: self.sender.clone(),
        }
    }

    fn run(&self) { // <3>
        // チャネルからTaskを受信して順に実行
        while let Ok(task) = self.receiver.recv() {
            // コンテキストを生成
            let mut future = task.future.lock().unwrap();
            let waker = waker_ref(&task);
            let mut ctx = Context::from_waker(&waker);
            // pollを呼び出し実行
            let _ = future.as_mut().poll(&mut ctx);
        }
    }
}

struct Spawner { // <1>
    sender: SyncSender<Arc<Task>>,
}

impl Spawner {
    fn spawn(&self, future: impl Future<Output = ()> + 'static + Send) { // <2>
        let future = future.boxed();    // FutureをBox化
        let task = Arc::new(Task {      // Task生成
            future: Mutex::new(future),
            sender: self.sender.clone(),
        });

        // 実行キューにエンキュー
        self.sender.send(task).unwrap();
    }
}

fn main() {
    let executor = Executor::new();
    executor.get_spawner().spawn(Hello::new());
    executor.run();
}
```

### 前編との違い

ずばり queue の存在です。

poll には

```rust
cx.waker().wake_by_ref(); // 自身を実行キューにエンキュー
```

task には

```rust
// Executorへスケジューリングするためのチャネル
sender: SyncSender<Arc<Task>>, // <2>
```

そして executor が誕生し、

```rust
struct Executor { // <1>
    // 実行キュー
    sender: SyncSender<Arc<Task>>,
    receiver: Receiver<Arc<Task>>,
}
```

これまで main でやっていた poll 呼び出しが移譲されています。

```rust
impl Executor {
    fn new() -> Self {
        // チャネルを生成。キューのサイズは最大1024個
        let (sender, receiver) = sync_channel(1024);
        Executor {
            sender: sender.clone(),
            receiver,
        }
    }

    // 新たにTaskを生成するためのSpawnerを作成 <2>
    fn get_spawner(&self) -> Spawner {
        Spawner {
            sender: self.sender.clone(),
        }
    }

    fn run(&self) { // <3>
        // チャネルからTaskを受信して順に実行
        while let Ok(task) = self.receiver.recv() {
            // コンテキストを生成
            let mut future = task.future.lock().unwrap();
            let waker = waker_ref(&task);
            let mut ctx = Context::from_waker(&waker);
            // pollを呼び出し実行
            let _ = future.as_mut().poll(&mut ctx);
        }
    }
}
```

つまり、main は executor を実行するだけで良くなっています。

```rust
fn main() {
    let executor = Executor::new();
    executor.get_spawner().spawn(Hello::new());
    executor.run();
}
```

これらが正しく、完了できるタスクだけを queue に入れる仕組みなのですが詳しくみていきましょう。

### channel について

Rust に限らずですが、channel という機能があります。

Rust では mpsc が代表的で、Multi Producer Single Consumer な仕組みを提供します。つまり、queue と 複数の sender と一つの receiver を提供します。

<https://doc.rust-lang.org/std/sync/mpsc/>

```rust
use std::thread;
use std::sync::mpsc::channel;

// Create a shared channel that can be sent along from many threads
// where tx is the sending half (tx for transmission), and rx is the receiving
// half (rx for receiving).
let (tx, rx) = channel();
for i in 0..10 {
    let tx = tx.clone();
    thread::spawn(move|| {
        tx.send(i).unwrap();
    });
}

for _ in 0..10 {
    let j = rx.recv().unwrap();
    assert!(0 <= j && j < 10);
}
```

上記は代表的な使い方で、10 回別スレッドから送られてくるので、それを 10 回 receive しています。このように別スレッドから送られてくる処理を集めることもできるので、タスク分散の機能を作るにあたっては必須の機能です。そして今は 10 回 receive するようなコードを書いていますが、一般的にはタスクの到着を無限ループで待ち受けることが一般的です。そして receiver には値が届くまで待つ（実行スレッドを block する）`recv` と、実行スレッドをブロックしない代わりに届いていなかったら Err を返す `try_recv` があります。そこはアーキテクチャによって使い分けましょう。

今回だと mpsc は IO が完了したタスク（=進行できるタスク）を sender で poll から送るためにこの mpsc を使います。

### poll

```rust
fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<()> {
        match (*self).state {
            StateHello::HELLO => {
                print!("Hello, ");
                (*self).state = StateHello::WORLD;
                cx.waker().wake_by_ref(); // 自身を実行キューにエンキュー
                return Poll::Pending;
            }
            StateHello::WORLD => {
                println!("World!");
                (*self).state = StateHello::END;
                cx.waker().wake_by_ref(); // 自身を実行キューにエンキュー
                return Poll::Pending;
            }
            StateHello::END => {
                return Poll::Ready(());
            }
        }
    }
```

`cx.waker().wake_by_ref(); // 自身を実行キューにエンキュー` が新しい点です。`waker` を追ってみましょう。

### waker

```rust
struct Task {
    // 実行するコルーチン
    future: Mutex<BoxFuture<'static, ()>>, // <1>
    // Executorへスケジューリングするためのチャネル
    sender: SyncSender<Arc<Task>>, // <2>
}

impl ArcWake for Task {
    fn wake_by_ref(arc_self: &Arc<Self>) { // <3>
        // 自身をスケジューリング
        let self0 = arc_self.clone();
        arc_self.sender.send(self0).unwrap();
    }
}
```

wake は wake_by_ref がデフォルト実装されるので、wake の処理内容は waker_by_ref に書かれているものです。

これは poll の中で呼ばれるもので、進行可能なタスクを送る役割を期待します。なので wake_by_ref はタスク自分自身を sender に送る処理を実装し、これをタスクが進行可能な時に poll に呼び出してもらう様に期待します。

### spawner

新しく登場する概念です。

```rust
struct Spawner { // <1>
    sender: SyncSender<Arc<Task>>,
}

impl Spawner {
    fn spawn(&self, future: impl Future<Output = ()> + 'static + Send) { // <2>
        let future = future.boxed();    // FutureをBox化
        let task = Arc::new(Task {      // Task生成
            future: Mutex::new(future),
            sender: self.sender.clone(),
        });

        // 実行キューにエンキュー
        self.sender.send(task).unwrap();
    }
}
```

とはいえこれは開発者が poll を呼ばなくていい様にする仕組みでしかないです。非同期処理を一つ作るための factory 的なものです。

ただこれが Sender を持つことから、この spawner を通して作った Task は必ず共通の queue に task を送れるようになるので、非同期処理を実装する上では必須のパーツです。しれっと sender.clone としていますが、mpsc は multi producer なので正しい使い方です。

そして `self.sender.send(task).unwrap();` をすることで最初の poll を executor に移譲しており、開発者が自分で poll しなくてよくなっています。

### Executor

```rust
struct Executor { // <1>
    // 実行キュー
    sender: SyncSender<Arc<Task>>,
    receiver: Receiver<Arc<Task>>,
}

impl Executor {
    fn new() -> Self {
        // チャネルを生成。キューのサイズは最大1024個
        let (sender, receiver) = sync_channel(1024);
        Executor {
            sender: sender.clone(),
            receiver,
        }
    }

    // 新たにTaskを生成するためのSpawnerを作成 <2>
    fn get_spawner(&self) -> Spawner {
        Spawner {
            sender: self.sender.clone(),
        }
    }

    fn run(&self) { // <3>
        // チャネルからTaskを受信して順に実行
        while let Ok(task) = self.receiver.recv() {
            // コンテキストを生成
            let mut future = task.future.lock().unwrap();
            let waker = waker_ref(&task);
            let mut ctx = Context::from_waker(&waker);
            // pollを呼び出し実行
            let _ = future.as_mut().poll(&mut ctx);
        }
    }
}
```

Executor は mpsc のモデル通り、1 本の queue に sender, receiver が繋がっているものです。なので run では receiver を無限ループで sender からの値の到着を待ち受けます。注意点としてはブロッキングありの recv を使っているので実行スレッドはブロックされています。

## mpsc を使った時の thread blocking について

上記の例は `while let Ok(task) = self.receiver.recv() {` をしているので、IO 待ちを非同期処理で解消しているものの、current thread の blocking があるので、実行するタスクそのものが時間がかかるものだと queue は詰まるかもしれません。

それを解消するのは executor 自体を多重にするしかないです。それをしてくれているのが tokio です。multi thread mode があって、executor を多重化できます。なので tokio を使いましょう。ただ tokio はコードを読んだり、自分で mpsc で非同期処理を書いた経験があると実はそのまま使うだけだと非効率に思える場面もときどきあります。それについてはまたブログに書こうと思っているので、今日はこの辺で失礼します〜
