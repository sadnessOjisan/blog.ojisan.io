---
path: /why-javy
created: "2022-04-22"
title: JS を wasm 化とは何か、あるいは不正確な情報
visual: "./visual.png"
tags: ["rust", "webassembly"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

この記事はもしかしたら誤りを含むかもしれません。

今週ツイッター眺めてたら色んな人が javy のリンクを共有していて、なんじゃこれ？と思ったのでそのまとめ。

FYI: <https://github.com/Shopify/javy>

javy は Run your JavaScript on WebAssembly. と説明されていて、要するに JS を wasm で実行するものである。ただこのモチベーションなどがよく分からなかったので、wasm とは何かということから周辺知識をおさらいしつつ javy を理解しようとしてみる。

## wasm とは

こういうのは MDN を見る

> WebAssembly は最近のウェブブラウザーで動作し、新たな機能と大幅なパフォーマンス向上を提供する新しい種類のコードです。基本的に直接記述ではなく、C、C++、Rust 等の低水準の言語にとって効果的なコンパイル対象となるように設計されています。

> この機能はウェブプラットフォームにとって大きな意味を持ちます。 — ウェブ上で動作するクライアントアプリで従来は実現できなかった、ネイティブ水準の速度で複数の言語で記述されたコードをウェブ上で動作させる方法を提供します。

FYI: <https://developer.mozilla.org/ja/docs/WebAssembly/Concepts>

"パフォーマンス向上" と "ネイティブ水準の速度で複数の言語で記述されたコードをウェブ上で動作させる方法を提供" というところに嬉しさがある。

wasm の表現には

```
(func (param $p i32)
  (result i32)
  local.get $p
  local.get $p
  i32.add)
```

のような テキスト表現と、

```
0000000: 0061 736d                                 ; WASM_BINARY_MAGIC
0000004: 0100 0000                                 ; WASM_BINARY_VERSION
; section "Type" (1)
0000008: 01                                        ; section code
0000009: 00                                        ; section size (guess)
000000a: 01                                        ; num types
; func type 0
000000b: 60                                        ; func
000000c: 02                                        ; num params
000000d: 7f                                        ; i32
000000e: 7f                                        ; i32
000000f: 01                                        ; num results
0000010: 7f                                        ; i32
0000009: 07                                        ; FIXUP section size
; section "Function" (3)
0000011: 03                                        ; section code
0000012: 00                                        ; section size (guess)
0000013: 01                                        ; num functions
0000014: 00                                        ; function 0 signature index
0000012: 02                                        ; FIXUP section size
; section "Code" (10)
0000015: 0a                                        ; section code
0000016: 00                                        ; section size (guess)
0000017: 01                                        ; num functions
; function body 0
0000018: 00                                        ; func body size (guess)
0000019: 00                                        ; local decl count
000001a: 20                                        ; local.get
000001b: 00                                        ; local index
000001c: 20                                        ; local.get
000001d: 01                                        ; local index
000001e: 6a                                        ; i32.add
000001f: 0b                                        ; end
0000018: 07                                        ; FIXUP func body size
0000016: 09                                        ; FIXUP section size
; section "name"
0000020: 00                                        ; section code
0000021: 00                                        ; section size (guess)
0000022: 04                                        ; string length
0000023: 6e61 6d65                                name  ; custom section name
0000027: 02                                        ; local name type
0000028: 00                                        ; subsection size (guess)
0000029: 01                                        ; num functions
000002a: 00                                        ; function index
000002b: 02                                        ; num locals
000002c: 00                                        ; local index
000002d: 03                                        ; string length
000002e: 6c68 73                                  lhs  ; local name 0
0000031: 01                                        ; local index
0000032: 03                                        ; string length
0000033: 7268 73                                  rhs  ; local name 1
0000028: 0d                                        ; FIXUP subsection size
0000021: 14                                        ; FIXUP section size
```

のような バイナリ表現がある。ただの足し算なのにすごいことになってる。

wasm を実行するためには、この wasm 表現を作るとよく、コンパイルのターゲットとなる。
これらはブラウザから読み込むことで実行ができる。

## wasm の実行形式

javy の前に wasm の実行方法について復習する。wasm を実行する場所はブラウザである。なぜならブラウザがその形式をサポートするように作られているからである。
とはいえ実際にはブラウザ以外でも実行は可能であり、それは WASI という規格が策定されている。
これは WASM で OS のリソースにアクセスするための規格である。

その上で wasm の実行方法を考えてみると、ブラウザ以外の場所では直接実行できないはずなので、wasm を各 PC で動くネイティブコードに変換するか、パソコンになんらかのランタイムを入れると良い。

ランタイムとしては bytecodealliance 謹製の wasmtime が広く普及していて使われていることが多い。他には wasmer もあるが、こっちに触れると javy の説明がややこしくなるので今は触れない。

要するに .wasm を実行するためには、ブラウザで実行するか、WASI 向けにコンパイルして wasm ランタイム上で動かせば良い。

## javy を支える技術

javy のコードを読んでみる。

ソースコードは <https://github.com/Shopify/javy>

### フォルダ構成

crates 配下をみてみると、

- cli
- core
- quickjs-wasm-rs
- quickjs-wasm-sys

がある。

cli が起点であり、core をビルドしてそれを CLI が呼び出す。cli を実行させるために `cargo install --path crates/cli` が要求されるが、ビルド済みバイナリを targets 配下から探せば実行できるので、このモジュールは必須というわけでなくコードリーディングの上では読まなくても良い。コードは core <- quickjs-wasm-rs <- quickjs-wasm-sys と依存しており、コードの芯は quickjs-wasm-rs や quickjs-wasm-sys にある。 quickjs という名前からお察しの通り、JS Engine として QuickJS を持っている。quickjs-wasm-rs と quickjs-wasm-js は QuickJS に対するラッパーとなっている。quickjs-wasm-js は直接 QuickJS を FFI する役割を持っており、quickjs-wasm-rs はその上でメソッドを実装し直したりしているという作りである。何にせよ、JS の実行エンジンを持っているわけである。

### 起動

とりあえず手元で動かしてみよう。設定をみるとわかるがビルドターゲットは WASI になっているので `wasm32-wasi` はあらかじめ入れておこう。wasi-sdk が必要になるので、 `make download-wasi-sdk` も実行しておく。この状態で `make` すると javy バイナリができるはずだ。

では実行してみる。

```js
console.log("hello");
```

を作って、 `./target/release/javy index.js -o destination/index.wasm`

```
hello
thread '<unnamed>' panicked at 'called `Result::unwrap()` on an `Err` value: Uncaught TypeError: cannot read property 'main' of undefined
', crates/core/src/main.rs:36:49
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
Error: the `wizer.initialize` function trapped

Caused by:
    wasm trap: wasm `unreachable` instruction executed
    wasm backtrace:
        0: 0x2bdf8 - <unknown>!rust_panic
        1: 0x198a9 - <unknown>!std::panicking::rust_panic_with_hook::ha0a1a0d8f19313e8
        2: 0x2c419 - <unknown>!std::panicking::begin_panic_handler::{{closure}}::hed4c2e4df05b6fb6
        3: 0x2c36e - <unknown>!std::sys_common::backtrace::__rust_end_short_backtrace::he1e905ceb832eba6
        4: 0xb33e - <unknown>!rust_begin_unwind
        5: 0x2c0a - <unknown>!core::panicking::panic_fmt::ha996ed314527d3dd
        6: 0x34fb - <unknown>!core::result::unwrap_failed::haf29d5a1cd8ed1a0
        7: 0xecc9 - <unknown>!wizer.initialize
        8: 0xe5d3a - <unknown>!wizer.initialize.command_export
    note: using the `WASMTIME_BACKTRACE_DETAILS=1` environment variable to may show more debugging information

Error: Couldn't create wasm from input
```

😇

エラーとはいえ、hello は表示されているので実行はできているようだ。

さて、上のログにも出ているが、wizer とはなんだろうか。これはコードリーディングしているときも度々出てくる crate であり、`w**` から始まっていることから wasm 系の何かなのだろう。

### wasm をどのように出力するか

その前に実装をもう少し理解しようと試みる。
wizer を深ぼる前に、どうして JS から wasm を吐き出せたのかを見ていこう。

結果から言うと、この辺りは正直あまり理解に自信がない。

make した時点で気づくと思うが、wasm になる立役者は `wasi-sdk` であろう。
これは

> WASI-enabled WebAssembly C/C++ toolchain

と表されており、 C/C++ -> wasm の変換ができる。

```
export WASI_SDK_PATH=`pwd`/wasi-sdk-${WASI_VERSION_FULL}
CC="${WASI_SDK_PATH}/bin/clang --sysroot=${WASI_SDK_PATH}/share/wasi-sysroot"
$CC foo.c -o foo.wasm
```

FYI: <https://github.com/WebAssembly/wasi-sdk>

QuickJS 自体は C 実装なので、それごと wasm 化できるわけだ。
でもそれだと最初から QuickJS を バイトコードにして配布すればいいし、QuickJS で JS を実行するのであれば手元で NodeJS を実行すればいいだけなので嬉しさはないと思うかもしれない。そこで登場するのが wizer だ。

結果から言うと、この辺りは正直あまり理解に自信がない。（大事なことだから２回言った）

### wizer

さて、wasm を吐いて JS を実行するところを見たが、これは一体何が嬉しいのだろうか？JS を直接実行すればいいのではないだろうか？ wasm を経由する嬉しさはんだろうか。

<https://www.youtube.com/watch?v=IGH0zIgJ6rg> で shopify のエンジニアが星取表のようなものを出している。これは 2021 年の CNCF でのトークだがこのときにすでに javy が出ている。wasm をそのまま書くと開発体験が悪いことをあげている。そして JS であればパフォーマンスが悪いが、それを wasm にすることでパフォーマンスが上がることを挙げている。

そしてこの人は wasm + js の組み合わせでは 2 つのツールが必須と言っており、それは QuickJS と wizer ということだ。wizer は wasm module の instance 化を事前に行えるようにするツールである。

wizer の公式には

> The WebAssembly Pre-Initializer

とある。

<https://github.com/bytecodealliance/wizer>

How Does it Work? を読む限りでは、初期化を行った後に値を記録しておき、instance と メモリの状態管理をするコードを差し込んでくれて何かがよしなに動くといったツールなのだろう。状態の記録されるので実質メモ化にも使え、前述の動画ではフィボナッチ数列の計算を例に再計算を防ぐデモがされていた。

javy だと、

```rust
#[export_name = "wizer.initialize"]
pub extern "C" fn init() {
    unsafe {
        let mut context = Context::default(); // quickjs_wasm_rs を呼び出す
        context
            .register_globals(io::stderr(), io::stderr())
            .unwrap();

        let mut contents = String::new();
        io::stdin().read_to_string(&mut contents).unwrap();

        let _ = context.eval_global(SCRIPT_NAME, &contents).unwrap();
        let global = context.global_object().unwrap();
        let shopify = global.get_property("Shopify").unwrap();
        let main = shopify.get_property("main").unwrap();

        JS_CONTEXT.set(context).unwrap();
        ENTRYPOINT.0.set(shopify).unwrap();
        ENTRYPOINT.1.set(main).unwrap();
    }
}
```

のように JS Engine を wizer で初期化している。

つまり JS を実行する主体を事前に wasm 化している。

### で、何がうれしいのか

JS で開発する開発体験をそのままに、wasm を生成できるのは十分に嬉しいことであろう。様々な環境で動くツールを配布したいとき、わざわざ Rust などを持ち出して開発するのは億劫であったが、これがあればそういったツールの配布に使えそうと思った。といっても夢物語なのだろうけど、WASI が普及しきればアリな選択肢ではなかろうか。懸念点としては wasm module の肥大化であるが、ネットワーク越しに使うとかしなければいいだろう（そもそもブラウザ相手ならブラウザ向けに Wasm をコンパイルすればいい）

## おわりに

なにか曲解してそうな気がするので please help me.
