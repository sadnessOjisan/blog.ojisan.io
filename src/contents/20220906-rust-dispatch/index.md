---
path: /rust-dispatch
created: "2022-09-06"
title: Rust の 動的ディスパッチとか静的ディスパッチとか
visual: "./visual.png"
tags: ["rust", "コンパイラ"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

[Rust for Rustcean](https://nostarch.com/rust-rustaceans) を勧められて読んでいると、最初の型の話のところで動的ディスパッチ、静的ディスパッチ、といった言葉が出てくる。これが何か僕は知らなかったわけだが、どうやら JavaScript 以外のプログラミング言語をしたことある人にとってはお馴染みなものであるらしい。なのでそれをキャッチアップしたときの話。努力はしたものの合ってる確証は持てていないのでマサカリは [@sadnessOjidan](https://twitter.com/sadnessOjisan) 宛てに送っていただけると助かる。

## 動的ディスパッチ

実行時にオブジェクトの型を調べ、対応するメソッドを呼び出す。実行時の処理なので、関数のインライン化（後述）ができない。実行時に[vtable](https://ja.wikipedia.org/wiki/%E4%BB%AE%E6%83%B3%E9%96%A2%E6%95%B0%E3%83%86%E3%83%BC%E3%83%96%E3%83%AB) (メソッドのアドレスと実際の処理を保持した、クラスごとに持っているテーブル)を参照して決めるので、多少のオーバーヘッドがかかる。実行時に決めるメリットとして、メソッド名を実行時に組み立てて実行みたいなこともできて（メタプロ）、コードの重複を減らせる。

## 静的ディスパッチ

コンパイル時に呼び出すべきメソッドを決める、決まる。そのため[インライン展開](https://ja.wikipedia.org/wiki/%E3%82%A4%E3%83%B3%E3%83%A9%E3%82%A4%E3%83%B3%E5%B1%95%E9%96%8B) できるので効率良く実行できる。ただし異なる型の引数の同じ関数を、型ごとにコピーするのでビルド成果物は大きくなる。

## Rust における 動的ディスパッチ と 静的ディスパッチ

### トレイトとは

動的ディスパッチ と 静的ディスパッチの話が出てくるのは、ポリモーフィズムのためだ。この実現方法は言語によってまちまちである。Rust ではトレイトを使って実現できる。トレイトは

> トレイトは、Rust コンパイラに、特定の型に存在し、他の型と共有できる機能について知らせます。 トレイトを使用すると、共通の振る舞いを抽象的に定義できます。

と書かれている通り、振る舞いを定義できる。（そういう点ではインターフェースに似ている）

### 動的ディスパッチ

#### 使い方

<https://doc.rust-jp.rs/the-rust-programming-language-ja/1.6/book/trait-objects.html#> にあるコードを使って解説する。

```rust
trait Foo {
    fn method(&self) -> String;
}

fn do_something(x: &Foo) {
    x.method();
}

fn main() {
    let x = 5u8;
    do_something(&x as &Foo);
}
```

動的ディスパッチのためにはメソッドのアドレスが欲しい。ここでは Foo に & をつけることで実現している。ポインタはスマートポインタでも良いので Box でもよい。

この &Foo が何をしているかと言うと、トレイトオブジェクトを作っている。トレイトオブジェクトとは

> トレイトオブジェクトは &Foo か Box<Foo> の様に記述され、指定されたトレイトを実装する あらゆる 型の値を保持する通常の値です。ただし、その正確な型は実行時になって初めて判明します。

といったものであり、

> トレイトオブジェクトはトレイトを実装した具体的な型を指すポインタから キャスト する(e.g. &x as &Foo )か、 型強制 する（e.g. &Foo を取る関数の引数として &x を用いる）ことで得られます。

のようにして作る。

FYI: <https://doc.rust-jp.rs/the-rust-programming-language-ja/1.6/book/trait-objects.html#%E5%8B%95%E7%9A%84%E3%83%87%E3%82%A3%E3%82%B9%E3%83%91%E3%83%83%E3%83%81>

つまり、

> &参照や Box<T>スマートポインタなどの、 何らかのポインタを指定し、それから関係のあるトレイトを指定することでトレイトオブジェクトを作成します。

とある通り、ポインタ（スマートポインタ含む）を指定したトレイトでキャストもしくは引数に型指定することでトレイトオブジェクトを作り、動的ディスパッチをさせる。（というよりトレイトオブジェクトはコンパイル時にそのトレイトを実装している情報は分かるも、何の型か分からないので動的にするしかない。）

### 静的ディスパッチ

一方で静的ディスパッチはジェネリクスとトレイト境界で実現できる。

```rust
trait Foo { fn method(&self) -> String; }
impl Foo for u8 { fn method(&self) -> String { format!("u8: {}", *self) } }
impl Foo for String { fn method(&self) -> String { format!("string: {}", *self) } }

fn do_something<T: Foo>(x: T) {
    x.method();
}

fn main() {
    let x = 5u8;
    let y = "Hello".to_string();

    do_something(x);
    do_something(y);
}
```

これはコンパイル時に Rust が特殊化してくれる。

```rust
fn do_something_u8(x: u8) {
    x.method();
}

fn do_something_string(x: String) {
    x.method();
}

fn main() {
    let x = 5u8;
    let y = "Hello".to_string();

    do_something_u8(x);
    do_something_string(y);
}
```

(https://doc.rust-jp.rs/the-rust-programming-language-ja/1.6/book/trait-objects.html, 最新の the book じゃないけど、この辺りの説明が消えていそうだったので当時のリンクを貼る。)

静的ディスパッチするとビルド成果物が膨らむと言うのは、このように特殊化した関数が複数つくられるからだ。

## dyn trait と impl trait

Rust 固有の話にもう少し踏み込む。これまでクロージャーに型をつけるときには Box<T> を多用していた。これは Box を使っているので動的ディスパッチされていた。しかし今の Rust には impl Trait という機能が追加されていて、静的ディスパッチできるものはできるようになった。

impl trait は、

```rust
pub fn notify(item: &impl Summary) {
    println!("Breaking news! {}", item.summarize());
}
```

のようにして使うが、まるで &付きで型指定をしているのに動的ディスパッチされないのである。実は implt trait は trait 境界の糖衣構文でもあるので、型が具体化（上の例だと、具体的な item に対して impl Summary for NanntokaItem 的なのがどこがで宣言されているはずで、その情報から具体的な型を辿れるはずだから）がされて特殊化・インライン展開されると考えるとイメージもつきやすいと思う。

これはパフォーマンスもさることながら、妥協で書いていたコードの改善にも役立てられる。たとえばクロージャを返す関数がその例だ。クロージャはコンパイル時にサイズが分からなく、実行のたびにアドレスが変わるため、クロージャを返す関数の型は Box dyn で包んでポインタを返す必要があった。

```rust
fn multiplier(num: i32) -> Box<dyn Fn(i32) -> i32>  {
	let mul =move |x:i32| x * num;
	println!("{}", num);
	Box::new(mul)
}

fn main(){
    let a = multiplier(3);
    dbg!(a(4));
}
```

これで動くのでいいのだが、いちいち Box にくるまないといけないことはめんどくさい。それが impl trait では解消されるのである。

```rust
fn multiplier(num: i32) -> impl Fn(i32) -> i32 {
	let mul =move |x:i32| x * num;
	println!("{}", num);
	mul
}

fn main(){
    let a = multiplier(3);
    dbg!(a(2));
}
```

このように Box dyn を使わなくても良いのである。

この辺りの話は <https://qnighy.hatenablog.com/entry/2018/01/28/220000> が詳しかった + これ以上のことを自分がかける気はしないので興味ある人はこっちを読んで欲しい。
