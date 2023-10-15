---
path: /dbg-dungling-pointer
created: "2023-10-16"
title: 無効なポインタへのdbg!でクラッシュした
visual: "./visual.png"
tags: [rust]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

最近Pin を完全に理解したくて、色々なコードを実験して遊ぶのが日課になっている。これまでのRust人生では綺麗な世界しか知らず、raw pointerを使ったこともないしダングリングポインタと縁がなく、Pinに対するイメージがちゃんと持てなかった。ということで最近はraw pointerを持った自己参照構造体を眺めている。

## tl;dr

- ダングリングポインタ作って遊んでいたら、dbg! の個数、位置、中身によってクラッシュしたりしなかったりした場面に遭遇
- dbg! の個数でクラッシュしなくなるのは意味がわからないが、そもそもダングリングポインタ使っている時点でunsafeなので何が起きてもおかしくない
- 該当の事象はPinを使うと解消できた

## ダングリングポインタ作ってみた

自己参照構造体を作ってムーブさせてみよう！

結論から言うと

```rust
struct Hoge {
    hoge: String,
    ptr: *const String,
}

impl Hoge {
    pub fn new(hoge: String) -> Hoge {
        let mut this = Hoge {
            hoge,
            ptr: std::ptr::null(),
        };
        this.ptr = &this.hoge;

        dbg!(this.ptr);
        dbg!(&this.hoge as *const String);

        this
    }
}

fn main() {
    let v = Hoge::new(String::from(
        "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    ));

    let Hoge { ptr, hoge: x } = v;

    unsafe {
        dbg!(&x);
        dbg!(&*ptr);
        dbg!(&x as *const String);
    }
}
```

と言うコードは

```
[src/main.rs:14] this.ptr = 0x000000016f1ce360
[src/main.rs:15] &this.hoge as *const String = 0x000000016f1ce360
[src/main.rs:29] &x = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
[src/main.rs:30] &*ptr = "��\u{1c}o\u{1}\0\0\0�<�\0\u{1}\0\0\0thread 'main' panicked at 'index out of bounds: the len is 33 but the index is 33', library/core/src/unicode/unicode_data.rs:80:40
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

としてクラッシュするが、

```rust
struct Hoge {
    hoge: String,
    ptr: *const String,
}

impl Hoge {
    pub fn new(hoge: String) -> Hoge {
        let mut this = Hoge {
            hoge,
            ptr: std::ptr::null(),
        };
        this.ptr = &this.hoge;

        dbg!(this.ptr);
        dbg!(&this.hoge as *const String);

        this
    }
}

fn main() {
    let v = Hoge::new(String::from(
        "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    ));

    let Hoge { ptr, hoge: x } = v;

    unsafe {
        dbg!(&*ptr);
        dbg!(&x as *const String);
    }
}
```

だと

```rust
[src/main.rs:14] this.ptr = 0x000000016bbb64b0
[src/main.rs:15] &this.hoge as *const String = 0x000000016bbb64b0
[src/main.rs:29] &*ptr = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
[src/main.rs:30] &x as *const String = 0x000000016bbb6830
```

としてクラッシュしない。この違いは 29行目で `dbg!(&x);` を消しただけだ。謎！

だがその状態で今度は 13行目の `dbg!(this.ptr);` を消すと

```rust
struct Hoge {
    hoge: String,
    ptr: *const String,
}

impl Hoge {
    pub fn new(hoge: String) -> Hoge {
        let mut this = Hoge {
            hoge,
            ptr: std::ptr::null(),
        };
        this.ptr = &this.hoge;

        dbg!(&this.hoge as *const String);

        this
    }
}

fn main() {
    let v = Hoge::new(String::from(
        "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    ));

    let Hoge { ptr, hoge: x } = v;

    unsafe {
        dbg!(&*ptr);
        dbg!(&x as *const String);
    }
}
```

```
[src/main.rs:14] &this.hoge as *const String = 0x000000016d0ca5f0
[src/main.rs:28] &*ptr = "�
                           m\u{1}\0\0\0p\u{97}\u{2}\u{1}\0\0\0\u{2}\0\0\0\0\0\0\0thread 'main' panicked at 'byte index 24 is not a char boundary; it is inside '\0' (bytes 23..24) of `�
                              mp����
                                    m��
                                       m��
                                          m4��H�
                                                m �
                                                   m �
                                                      m�E/��J���`[...]', library/core/src/fmt/mod.rs:2324:30
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

となる。

ちなみにこの状態で

```rust
struct Hoge {
    hoge: u8,
    ptr: *const u8,
}

impl Hoge {
    pub fn new(hoge: u8) -> Hoge {
        let mut this = Hoge {
            hoge,
            ptr: std::ptr::null(),
        };
        this.ptr = &this.hoge;

        dbg!(&this.hoge as *const u8);

        this
    }
}

fn main() {
    let v = Hoge::new(1);

    let Hoge { ptr, hoge: x } = v;

    unsafe {
        dbg!(&*ptr);
        dbg!(&x as *const u8);
    }
}
```

と言う風に文字列をu8に書き換えると

```rust
[src/main.rs:14] &this.hoge as *const u8 = 0x000000016f74e640
[src/main.rs:26] &*ptr = 0
[src/main.rs:27] &x as *const u8 = 0x000000016f74e847
```

として動く。

これはコンパイラが何か気を効かせてくれていそう。
だがこの例も 0 ではなく 100 が出て欲しかった。

ちなみに xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx という文字列を使っているのはコンパイラの最適化を妨害するためだ。clang や llvm では短い文字列やプリミティブなものは最適化されてうまく動いてしまうようなコードになることがあるらしい。知らんけど。

## どういうことか

dbg! の回数次第で動いたり動かなかったりする理由はわからん。ただそもそもunsafe な世界で無効な領域を使ってあれやこれやしているので何も信用できないことをしている。未定義動作だ。何が起こっても不思議じゃない。たまたま動くこともあるのでしょう。ついに初めて未定義動作というものを見れて嬉しい！（完）（嬉）

## というわけで Pin

無効な領域を指すraw pointerを作らないようにPinを使おう。Pinはそういう技術だ。

FYI: https://doc.rust-lang.org/std/pin/

```rust
struct Hoge {
    hoge: String,
    ptr: *const String,
}

impl Hoge {
    pub fn new(hoge: String) -> Hoge {
        let mut this = Hoge {
            hoge,
            ptr: std::ptr::null(),
        };
        this.ptr = &this.hoge;

        dbg!(&this.hoge as *const String);

        this
    }
}

fn main() {
    let v = Hoge::new(String::from(
        "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    ));

    let Hoge { ptr, hoge: x } = v;

    unsafe {
        dbg!(&*ptr);
        dbg!(&x as *const String);
    }
}
```

でクラッシュしないようにする。move後に無効な生ポインタを見ているのがクラッシュの原因なので Pin が有効そうだ。だがPinのやり方は少し注意が必要だ。例えば、

```rust
fn main() {
    let v = Hoge::new(String::from(
        "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    ));
    pin_mut!(v);
    let Hoge { ptr, hoge: x } = v;

    unsafe {
        dbg!(&*ptr);
        dbg!(&x as *const String);
    }
}
```

だと意味がない。なぜなら move が起きるのは `Hoge::new` だからだ。と言うわけで関数の中で `pin_mut` する。ちなみに `pin_mut` を使ったのは Pin を作るのに現実的でとても楽な方法だからだ。例えば Pin::new で作ろうとすると Pin で包む対象の deref の target が Unpin を要求するなど「意味なくない！？」っていう定義だったりする。（この辺りについての解説はそのうち・・・）

というわけで

```rust
impl Hoge {
    pub fn new(hoge: String) -> Pin<&'a mut Hoge> {
        let mut this = Hoge {
            hoge,
            ptr: std::ptr::null(),
            __pinded: PhantomPinned,
        };
        this.ptr = &this.hoge;

        dbg!(this.ptr);
        dbg!(&this.hoge as *const String);
        pin_mut!(this);
        this
    }
}
```

などとしたいが、これも問題がある。ローカル変数を定義してそのローカル変数を返すのはライフタイムの都合上できない。しかも pin_mut はスタック上にピン止めする技術なので、関数内で呼び出すとその呼び出し時のスタックフレームは呼び出し後に消し飛ぶので使えない。

というわけでヒープにピン留めしよう。そのためには `Box::pin` を使う。

```rust
impl Hoge {
    pub fn new(hoge: String) -> Pin<Box<Hoge>> {
        let mut this = Box::pin(Hoge {
            hoge,
            ptr: std::ptr::null(),
            __pinded: PhantomPinned,
        });
        unsafe {
            Pin::get_unchecked_mut(this.as_mut()).ptr = &this.hoge as *const String;
        }

        dbg!(this.ptr);
        dbg!(&this.hoge as *const String);
        this
    }
}
```

`Box::pin` を呼ぶタイミングも注意が必要で ptr に hoge の raw pointer を入れる前にする必要がある。また `Box::pin` で包むと `this.ptr = &this.hoge;` で raw pointer を入れられなくなる。`get_unchecked_mut` で可変参照を取り出してチクチク代入していこう。

その結果は

```
[src/main.rs:22] this.ptr = 0x0000000121606a70
[src/main.rs:23] &this.hoge as *const String = 0x0000000121606a70
[src/main.rs:39] hoge = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
[src/main.rs:40] &**ptr = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
[src/main.rs:41] hoge as *const String = 0x0000000121606a70
```

となる。0x0000000121606a70 というアドレスが一致していることからも、このようにPinを使えばRust用語でいうところのムーブが起きてもptrは常にhogeを指してくれ、ダングリングポインタが起きない。
