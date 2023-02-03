---
path: /multi-green-thread
created: "2023-02-03"
title: グリーンスレッドの自作に必要なものは何か
visual: "./visual.png"
tags: ["rust", "multi thread", "async runtime"]
userId: sadnessOjisan
isFavorite: false
isProtect: true
---

定期的に[並行プログラミング入門](https://www.oreilly.co.jp/books/9784873119595/) を丸パクリするようなブログを書いているが、1 年以上かけて最近ようやく 6 章を理解できて自分の言葉で説明できるようになったので書く。これ本当に良い本だから買ってね。6 章 マルチタスク は初めて読んだ時は何も分からなかった。いきなり FFI の準備をさせられてアセンブリを書かされるからだ。
ちょうどその章に入って１年、あらためて 6 章を読むとようやく理解できたのでその理解を書いておく。

## 普段 thread をどう使っているか

native thread を使う際、

```rust
use std::thread;
use std::time::Duration;

fn main() {
    thread::spawn(|| {
        for i in 1..10 {
            // やあ！立ち上げたスレッドから数字{}だよ！
            println!("hi number {} from the spawned thread!", i);
            thread::sleep(Duration::from_millis(1));
        }
    });

    for i in 1..5 {
        // メインスレッドから数字{}だよ！
        println!("hi number {} from the main thread!", i);
        thread::sleep(Duration::from_millis(1));
    }
}
```

のようにして使っている。そのためまず `spawn` を実装する必要がある。

## スレッドの実装に必要なモノ

### spawn

spawn は　https://doc.rust-jp.rs/rust-by-example-ja/std_misc/threads.html に依ると、

> Rust は spawn 関数を用いて OS のネイティブスレッドを開始することができます。この関数の引数は move クロージャ（訳注: 参照ではなく値を取るクロージャ。　詳しくは[クロージャを返す関数][fn_output]を参照）です。

とある。

要するに関数を渡して、その実行をタスクを実行するランタイムに引き渡す処理を作れば良い。

Rust の公式 API は　https://doc.rust-lang.org/std/thread/fn.spawn.html である。

### 複数 spawn を呼ばれた時、その処理は CPU へと割り振られる

さて、spawn の良いところはマルチスレッドプログラミングを実現できることだ。
スレッドの数だけ処理を並行して進めることができる。
そのため thread に渡した処理に IO などで待ち時間が発生したとしても他の処理を先に進めることができる。

ただしその処理を割り振れる数は CPU のコア数が上限だ。しかし世の中のアプリケーションはスレッドをたくさん立てている。これはその数だけ平行に動くように見せかけているだけで、その裏では CPU のコアに対して実行するスレッド・処理を割り振ったり切り替えている。それは OS が制御してくれている。そういったタスクの切り替えはコンテキストスイッチと呼ばれる。

### schedule

スケジューラはコンテキストスイッチをするための仕組みだ。どういうときにどういう戦略でコンテキストスイッチをするかということを決める仕組みが必要で、それは一般的にはスケジューラだとかランタイムだとか呼ばれる。ここではスケジューリングする関数を用意する。

発生したタスク（spawn で渡される関数）はだいたいキューで管理され、スケジューラによってコンテキストスイッチを繰り返しながら CPU に処理が割り当てられていく。今から見る例はシングルスレッド上でのマルチスレッドなグリーンスレッド（ややこしいかもしれないが、ユーザーランドでスレッドを作るとしても結局コンピュータを使う以上は、そのグリーンスレッドを動かすためのスレッドや CPU が必要）の話なのでキューを一つ作れば終わりだが、現実的な非同期ランタイムは CPU のコア数分だけのマルチスレッド上に大量のグリーンスレッドを展開しどのネイティブスレッドにどのグリーンスレッドを割り当てるかみたいな計算をする必要があり、こういったスケジューラという仕組みが重要となってくる。

### context switch

本来であれば OS の機能として提供されているが、ネイティブスレッドを使わないのでこの仕組みを自分で作る必要がある。コンテキストスイッチに求められる機能は、あるタスクが処理途中であったとして、そこ別のタスクが割り込んできた時にその処理途中のものを一旦退避させて、CPU に新しいタスクを実行させることだ。

CPU は単純にはアセンブリを上から実行していくものだが、一時計算した値の補完にスタックやヒープなどのメモリ領域、レジスタのような CPU の一部を使う。ヒープは溜め置けるのでいいが、スタックやレジスタはそのタスクごとに入れ替えないといけない。この入れ替えの処理がコンテキストスイッチだ。

ちなみにこのときスタックの中身ごと入れ替えるかどうかで stackless coroutine, stackful coroutine という分類があってそれぞれにメリットデメリットがある。

FYI: https://gist.github.com/yutopp/d3a184f3389df819a5b4b99f2da9b774

## どう実装するか

ここから　[6 章](https://github.com/oreilly-japan/conc_ytakano/tree/main/chap6/ch6_mult-x86_64-linux) のコードを見ていこう。

### キュー

まず実行するタスクのキューを用意する。

```rust
static mut CONTEXTS: LinkedList<Box<Context>> = LinkedList::new();
```

### Context

そのキューに流すタスクは Context という構造体で表す。

```rust
struct Context {
    regs: Registers,      // レジスタ
    stack: *mut u8,       // スタック
    stack_layout: Layout, // スタックレイアウト
    entry: Entry,         // エントリポイント
    id: u64,              // スレッドID
}
```

ここでどこにもタスク(function)がないと思うかもしれないが、それはレジスタに処理実態のアドレスを入れることで解決する。そのあたりのコードはのちに見よう。

### Spawn

スレッドの軌道は spawn で行う。spawn すると実行したいタスクをキューに積む。そして schedule をしてそのタスクを割り込ませようと努力する。

```rust
pub fn spawn(func: Entry, stack_size: usize) -> u64 {
    // <1>
    unsafe {
        let id = get_id(); // <2>
        CONTEXTS.push_back(Box::new(Context::new(func, stack_size, id))); // <3>
        schedule(); // <4>
        id // <5>
    }
}
```

### schedule

複数のタスクをどう裁くかという処理が schedule だ。

ここでは簡易な例として Context のキューを一つ前に進める形でタスクを処理して行っている。
Context にはスタックやレジスタなどの一時データごと保存されているので、該当のタスクをさせるためにその一時デーの復元、または退避されたタスクの一時データの保管などの手続きを行なっている。

それが set_context と switch_context だ。

```rust
pub fn schedule() {
    unsafe {
        // 実行可能なプロセスが自身のみであるため即座にリターン <1>
        if CONTEXTS.len() == 1 {
            return;
        }

        // 自身のコンテキストを実行キューの最後に移動
        let mut ctx = CONTEXTS.pop_front().unwrap(); // <2>
                                                     // レジスタ保存領域へのポインタを取得 <3>
        let regs = ctx.get_regs_mut();
        CONTEXTS.push_back(ctx);

        // レジスタを保存 <4>
        if set_context(regs) == 0 {
            // 次のスレッドにコンテキストスイッチ
            let next = CONTEXTS.front().unwrap();
            switch_context((**next).get_regs());
        }

        // 不要なスタック領域を削除
        rm_unused_stack(); // <5>
    }
}
```

### set_context と switch_context

これらの関数は FFI されたアセンブリだ。

```rust
extern "C" {
    fn set_context(ctx: *mut Registers) -> u64;
    fn switch_context(ctx: *const Registers) -> !;
}
```

```asm
#define SET_CONTEXT set_context
#define SWITCH_CONTEXT switch_context
```

ではそれぞれの処理を見ていこう。

### SET_CONTEXT

```
SET_CONTEXT:
        pop     %rbp
        xor     %eax, %eax      /* Direct invocation returns 0 */

        movq    %rbx, (%rdi)
        movq    %rbp, 8(%rdi)
        movq    %r12, 16(%rdi)
        movq    %r13, 24(%rdi)
        movq    %r14, 32(%rdi)
        movq    %r15, 40(%rdi)
        lea     8(%rsp), %rdx
        movq    %rdx, 48(%rdi)
        push    %rbp
        movq    (%rsp), %rdx
        movq    %rdx, 56(%rdi)
        ret
```

まず `movq    %rbx, (%rdi)` などの処理によって rdi にレジスタの値が保存されていく。ここで rdi はこの SET_CONTEXT を読んだ関数の第一引数（のアドレス）だ。そのためこの関数を実行することで `fn set_context(ctx: *mut Registers)` で渡されたレジスタ構造体に値が保存されていく。つまり CPU の世界にあるものをメモリに移すことができる。

### SWITCH_CONTEXT

今度は反対の処理だ。渡された構造体をレジスタに渡していく。こうすることでタスクを実行していた時の CPU の状態を復元できる。

```
SWITCH_CONTEXT:
        xor     %eax, %eax
        inc     %eax            /* Return 1 instead */

        pop     %rsi
        movq    (%rdi), %rbx
        movq    8(%rdi), %rbp
        movq    16(%rdi), %r12
        movq    24(%rdi), %r13
        movq    32(%rdi), %r14
        movq    40(%rdi), %r15
        movq    48(%rdi), %rdx
        movq    %rdx, %rsp
        addq    $0x8, %rsp
        push    %rbp
        push    %rsi
        movq    56(%rdi), %rdx
        jmpq    *%rdx
```

### jpmq

さて、コンテキストスイッチを見たが、実は肝心の spawn で渡された関数を実行しているところを見ていない。どのようにしてタスクを実行していくのか見ていこう。

まず spawn の処理から追っていくと

```rust
CONTEXTS.push_back(Box::new(Context::new(func, stack_size, id)));
```

とあるので渡された関数は Context につめられていることがわかる。new は

```rust
fn new(func: Entry, stack_size: usize, id: u64) -> Self {
        // <4>
        // スタック領域の確保 <5>
        let layout = Layout::from_size_align(stack_size, PAGE_SIZE).unwrap();
        let stack = unsafe { alloc(layout) };

        // ガードページの設定 <6>
        unsafe { mprotect(stack as *mut c_void, PAGE_SIZE, ProtFlags::PROT_NONE).unwrap() };

        // レジスタの初期化 <7>
        let regs = Registers::new(stack as u64 + stack_size as u64);

        // コンテキストの初期化
        Context {
            regs: regs,
            stack: stack,
            stack_layout: layout,
            entry: func,
            id: id,
        }
    }
```

となっているので、entry というフィールドに関数がつめられている。

そして Registers::new に着目してみると、

```rust
#[repr(C)] // <1>
struct Registers {
    rbx: u64,
    rbp: u64,
    r12: u64,
    r13: u64,
    r14: u64,
    r15: u64,
    rsp: u64,
    rdx: u64,
}

impl Registers {
    // <3>
    fn new(rsp: u64) -> Self {
        Registers {
            rbx: 0,
            rbp: 0,
            r12: 0,
            r13: 0,
            r14: 0,
            r15: 0,
            rsp,
            rdx: entry_point as u64, // <4>
        }
    }
}
```

と、rdx に entry_point というものが詰められていることがわかる。

これは

```rust
#[no_mangle]
pub extern "C" fn entry_point() {
    unsafe {
        // 指定されたエントリ関数を実行 <1>
        let ctx = CONTEXTS.front().unwrap();
        ((**ctx).entry)();

        // 以降がスレッド終了時の後処理

        // 自身のコンテキストを取り除く
        let ctx = CONTEXTS.pop_front().unwrap();

        // スレッドIDを削除
        (*ID).remove(&ctx.id);

        // 不要なスタック領域として保存
        // この段階で解放すると、以降のコードでスタックが使えなくなる
        UNUSED_STACK = ((*ctx).stack, (*ctx).stack_layout); // <2>

        match CONTEXTS.front() {
            // <3>
            Some(c) => {
                // 次のスレッドにコンテキストスイッチ
                switch_context((**c).get_regs());
            }
            None => {
                // すべてのスレッドが終了した場合、main関数のスレッドに戻る
                if let Some(c) = &CTX_MAIN {
                    switch_context(&**c as *const Registers);
                }
            }
        };
    }
    panic!("entry_point"); // <4>
}
```

といった処理だ。

```rust
#[no_mangle]
pub extern "C"
```

とあることからこれは FFI した側で呼ばれる Rust のコードだ。つまりアセンブリ側から呼ばれるコードだ。
そしてそこには

```rust
let ctx = CONTEXTS.front().unwrap();
((**ctx).entry)();
```

とある。つまり entry, func を実行する関数で、これへの関数ポインタが rdx に格納されることとなる。

そして SET_CONTEXT で

```
movq    %rdx, 56(%rdi)
```

SWITCH_CONTEXT で

```
movq    56(%rdi), %rdx
jmpq    *%rdx
```

としていることから、SWITCH_CONTEXT が呼ばれると rdx 経由で entry_point が呼ばれて、spawn で渡された関数が実行されることとなる。

最初この仕組みは「こんなん気づくか！」と思ったが、FFI している関数の

```rust
fn switch_context(ctx: *const Registers) -> !;
```

という型シグネチャをジッと見れば `!` があることに気づき、never 型であることを知れる。never 型ということは値が戻ってこないということであり、なんらかの jump やループに入ってることを予想できる。これはタスクを jump し続けて実行し続ける処理であることを指しているので、ヒントはこういうところにあったというわけだ。

## 一歩先へ行く

本では 1 つのスレッドを対象としている。末尾にもマルチスレッド化するためには Mutex などで囲わないといけないといった話が書かれている。

では現実世界においてマルチスレッドで動くグリーンスレッドとは何だろうか。Tokio や Goroutine や cats-effect である。

### M:N モデル

これらの特徴の一つには M:N モデルがある。詳しくは rust doc に説明を譲る。

> プログラミング言語によってスレッドはいくつかの方法で実装されています。多くの OS で、新規スレッドを生成する API が提供されています。 言語が OS の API を呼び出してスレッドを生成するこのモデルを時に 1:1 と呼び、1 つの OS スレッドに対して 1 つの言語スレッドを意味します。

> 多くのプログラミング言語がスレッドの独自の特別な実装を提供しています。プログラミング言語が提供するスレッドは、 グリーンスレッドとして知られ、このグリーンスレッドを使用する言語は、それを異なる数の OS スレッドの文脈で実行します。 このため、グリーンスレッドのモデルは M:N モデルと呼ばれます: M 個のグリーンスレッドに対して、 N 個の OS スレッドがあり、M と N は必ずしも同じ数字ではありません。

FYI: https://doc.rust-jp.rs/book-ja/ch16-01-threads.html

先ほどの実装例は 1:N である。

### Work Stealing

マルチスレッドで非同期ランタイムなどを作る場合、各スレッドにタスクキューを持つことになるが、そのときタスクの消化率によって暇な CPU が現れることもある。そういうときにキュー間でタスクを融通し合う仕組みだ。tokio やら cats-effect やらいまどきのマルチスレッド環境には備わっている機能だ。

FYI: https://typelevel.org/blog/2021/02/21/fibers-fast-mkay.html

次はこういうものの理解や実装に挑戦したい。

理論的には CPU コア数分だけ thread pool 作って、チャネルで各スレッドでのタスクの積み具合やタスクそのものを融通しあえば実装できる気がする。とはいえ先駆者曰く結構大変らしい。がんばる。
