---
path: /rust-ffi-cpp-wakaran
created: "2021-12-06"
title: Rust で C と C++ の FFI
visual: "./visual.png"
tags: ["Rust", "C++", "C", "FFI"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

この記事は [sadnessOjisan Advent Calendar 2021](https://adventar.org/calendars/7015) 6 日目の記事です。

セマフォが欲しくて C++20 を FFI しようとしてハマり散らした記録。
Mutex と条件変数でセマフォを実装した方がよっぽどお得だったに違いない。
OGP は FF の ファンキットです。I ではなく XIV ですが。

## ライブラリやリンクについて

https://kamino.hatenablog.com/entry/c%2B%2B-principle-of-build-library を読むと良いです。

これからすることは、静的リンクをしての FFI です。

## Rust から C を呼び出す FFI の最小構成

src/main.rs

```rust
extern "C"  {
    fn hello_world();
}

fn main(){
    unsafe{
        hello_world();
    }
}
```

src/test.c

```c
#include <stdio.h>
#include <stdlib.h>

void hello_world(){
  fprintf(stdout,"hello from C\n");
}
```

build.rs

```rust
use std::env;

fn main(){
    let project_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    println!("cargo:rustc-link-search={}/target/", project_dir);
    println!("cargo:rustc-link-lib=test");
}
```

ただし、C のファイルは静的ライブラリとして targets 配下にコンパイルしておく。

```sh
gcc -fPIC -c ./src/test.c -o ./target/libtest.a
```

## 最小構成スクリプトは何をしていたのか

### extern (rust 側)

extern は

> Link to or import external code. Link to or import external code.The extern keyword is used in two places in Rust. One is in conjunction with the crate keyword to make your Rust code aware of other Rust crates in your project, i.e., extern crate lazy_static;. The other use is in foreign function interfaces (FFI).extern is used in two different contexts within FFI. The first is in the form of external blocks, for declaring function interfaces that Rust code can call foreign code by.

と説明されています。

FYI: https://doc.rust-lang.org/std/keyword.extern.html

つまり FFI 文脈においては、外部のコードとの接続を可能にしてくれる機能です。

```rust
#[link(name = "my_c_library")]
extern "C" {
    fn my_c_function(x: i32) -> bool;
}
```

上記コードは libmy_c_library とリンクしようとします。
タイトルに rust 側と書いたのは、あとで C++ 側でも extern が出てくるからです。

### extern "C"

ソースコードを検索していると、extern の後に "C" がついているものと付いていないものに出会います。
この意味については ABI の仕様を見ると良いでしょう。

FYI: https://doc.rust-lang.org/reference/items/external-blocks.html#abi

> By default external blocks assume that the library they are calling uses the standard C ABI on the specific platform.

とあるので、C を FFI するなら "C" は書かなくても良さそうです。
だが個人的にはこういうのは書いておきたいので書きます。

### extern に link は必要なのか

link には rust compiler がリンクすべきネイティブライブラリの名前を指定できます。

https://doc.rust-lang.org/reference/items/external-blocks.html#the-link-attribute

> The kind of library can be specified in a #[link] attribute. If the kind is not specified in the link attribute or on the command-line, it will link a dynamic library if available, otherwise it will use a static library. If the kind is specified on the command-line, it will override the kind specified in a link attribute.

FYI: https://doc.rust-lang.org/rustc/command-line-arguments.html#-l-link-the-generated-crate-to-a-native-library

が、これはなくても動いてしまっていて、なんでと思っています？（詳しい人に聞いている最中なので後で補足するかも）

## build.rs

Rust はビルド前に任意のコードをビルドできる仕組みを持っています。
それが build.rs であり、cargo がビルド前に自動で実行します。

FFI とは結局は外部モジュールとのリンクであり、リンク作業を行ってくれる役割を担います。
実行ログを見ていると ld が走っています。（大抵はエラーログとして現れるんだけどな！）

### 使い方

> The script may communicate with Cargo by printing specially formatted commands prefixed with cargo: to stdout.

とあるとおり、`cargo: ` から始まる命令を標準出力に出力して実行します。

FYI: https://doc.rust-lang.org/cargo/reference/build-scripts.html

### リンクの方法

#### cargo:rustc-link-lib=[KIND=]NAME

rustc の -l オプションを付けてリンク。

KIND には dylib, static が入ります。

```rust
println!("cargo:rustc-link-lib=test");
```

は test というライブラリをリンクして使うことを指定。
なので実は、ライブラリとして使えるように事前にコンパイルしておく必要があります。
最小構成の例で gcc したのはそういうことです。

では次にそのライブラリの探し方の指定方法を見ましょう。

```
println!("cargo:rustc-link-search={}/target/", project_dir);
```

は rustc の -L オプションで、使いたいクレートやライブラリの検索パスを探します。
リンカがライブラリを探すのに似ています。
ここでは gcc に出力させたアーカイブファイルの位置を指定してください。

ちなみにアーカイブファイルは -fPIC フラグを付けて作っておかないと、relocation がどうのこうので怒られます。

```
gcc -fPIC -c ./src/test.c -o ./target/libtest.a
```

## 自前で ビルドするのはめんどくさいのでどうにかする

毎回 gcc 叩いてから実行するのはめんどくさいので、この辺を rust 側で自動化したいです。
それには CMake を使う方法、cc を使う方法などがあります。

FYI: https://doc.rust-lang.org/cargo/reference/build-script-examples.html

CMake を使う方法は、pkg-config を駆使しユーザーが持ってるネイティブライブラリを巻き込んで大きな C++資産と接続するのに便利そうだが、自分が C++を FFI したい目的はそれではないのと、その説明のためには、pkg-config とは、zlib とはみたいな説明から必要になったり、こっそり説明を省いている動的リンクの話をしないといけなく、うまく説明できる気がしないので他の方に説明を譲ります。（cmake crate の最新版が cargo に上がってなかったり C++20 との接続でいろいろハマり散らかして１敗。というか詳しい人助けて・・・）

とはいえこの記事を読んでいるとリベンジしたくなる。

FYI: https://zenn.dev/kurun/articles/2fcd77cc5322f05d87a1

### cc crate

cc cratre は、Rust のビルドスクリプト中で実行でき、任意の C のソースをアーカイブファイルにコンパイルし、静的リンクまで行ってくれる便利ツール。つまり今まで手でやっていたことをやってくれます。

```rust
extern crate cc;

fn main() {
    cc::Build::new()
        .file("./src/foo.c")
        .include("src")
        .compile("foo");
}
```

このようなビルドスクリプトを書くだけで良いです。
自分で rustc のオプションを書かなくてもよくなります。

## C++ の FFI

https://stackoverflow.com/questions/52923460/how-to-call-a-c-dynamic-library-from-rust/52940455?stw=2#52940455 には、

> In Rust, it's easy to call C, but hard to call C++.

とあり、はげしくうなずきました。（５敗）

とはいえやることは静的ライブラリを作ってリンクするだけなので、 gcc を g++ に変えたら万事がうまくいく気がするので試してみよう。

### C の成功コードを C++に置き換える

適当な C++ファイルを用意。

```cpp
#include <iostream>
#include"test.h"

using namespace std;

int hello_world() {
    cout << "Hello worldddd." << endl;
    return 0;
}
```

マングルを回避するための extern をヘッダファイルにつけておきます。

```h
extern "C" int hello_world();
```

これを静的ライブラリとしてコンパイルします。
ただし今回は C++なので g++コマンドを使います。

```sh
g++ -fPIC -c test.cpp -static-libgcc -static-libstdc++

# 念のためアーカイブファイルでも試した
g++ -fPIC -c test.cpp -static-libgcc -static-libstdc++ -o libtest.a
```

test.o がつくられたはずなので、コンパイルオプションでリンクするようビルドスクリプトに書きます。

```rust
use std::env;
fn main(){
    let project_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    println!("cargo:rustc-link-search={}/src/", project_dir); // the "-L" flag
    println!("cargo:rustc-link-lib=test"); // the "-l" flag
}
```

しかし、うまくいかないです。
実行すると関数名が見つからないというので FFI に失敗しています。

```
note: /usr/bin/ld: cannot find -ltest
```

ちなみにアーカイブファイルに対して FFI を試みたときはこのようなエラーでした。

```
= help: some `extern` functions couldn't be found; some native libraries may need to be installed or have their path specified
= note: use the `-l` flag to specify native libraries to link
= note: use the `cargo:rustc-link-lib` directive to specify the native libraries to link with Cargo (see https://doc.rust-lang.org/cargo/reference/build-scripts.html#cargorustc-link-libkindname)
```

というわけでオブジェクトファイルを調べてみましょう。
nm を使ってシンボルを調べてみます。

```
U _GLOBAL_OFFSET_TABLE_
0000000000000088 t _GLOBAL__sub_I_test.cpp
0000000000000000 T _Z11hello_worldv
0000000000000036 t _Z41__static_initialization_and_destruction_0ii
                 U _ZNSolsEPFRSoS_E
                 U _ZNSt8ios_base4InitC1Ev
                 U _ZNSt8ios_base4InitD1Ev
                 U _ZSt4cout
                 U _ZSt4endlIcSt11char_traitsIcEERSt13basic_ostreamIT_T0_ES6_
0000000000000000 b _ZStL8__ioinit
                 U _ZStlsISt11char_traitsIcEERSt13basic_ostreamIcT_ES5_PKc
                 U __cxa_atexit
                 U __dso_handle
```

明らかに外部から呼び出せなさそうな関数名が未定義なシンボルとして登録されています。
何も分からない・・・ギブアップ。

## rust-cc にぶん投げる

こうすれば動く。

```rust
fn main() {
    cc::Build::new()
        .cpp(true)
        .flag("-std=c++20")
        .warnings(true)
        .flag("-Wall")
        .flag("-Wextra")
        .flag("-v")
        .flag("-g")
        .file("./src/test.cpp")
        .compile("libtest.a");
}
```

FYI: https://github.com/sadnessOjisan/rust-ffi-cpp-simple

まあなんか僕がやろうとしていたことは rust-cc が中でやってくれていたのでしょう。
やる気があれば rust-cc を読んでみたいと思います。

## 完走できなかった感想

初心者が手を出すべきやつではなかった。
