---
path: /stack-push
created: "2022-05-19"
title: stackにpushする試行錯誤
visual: "./visual.png"
tags: ["Rust", "アセンブリ"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

いろいろ教えてもらったので修正中

昔、基本情報処理試験の教科書や 「[プログラムはなぜ動くのか](https://www.amazon.co.jp/dp/B094J3CK1C)」 で、「プログラムは、CPU がスタックとヒープに書き込み・読み込みながら動く」みたいなことを習った記憶があります。
先週末これが本当なのか気になって[Compiler Explorer](https://godbolt.org/)という面白いサイトを教えてもらったこともありアセンブリの解読をしていたのですが、なぜかうまく stack が使われないケースばかり出会いました。
そこで stack に積ませるための試行錯誤します。
言語は Rust を選択し、アセンブリは [Compiler Explorer](https://godbolt.org/) で確認します。

## スタックを使う

### スタックはなぜプログラムの実行に必要なのか

これは関数呼び出しのときに、引数を呼び出し先から取り出せるようにするため、処理を呼び出し元に戻すために必要となります。スタックに積んでおけばスタックから取り出すだけで（※実際にはスタックポインタから位置を逆算したりするので少しめんどくさいが）関数は引数を受け取れるし、呼び出し元の次の命令のアドレスを入れておけば、関数終了時に続きの処理を再開できます。このようにスタックに積む・取り出すだけで、関数呼び出しを実現できるのはスタックのいいところです。文字だけの説明だとわかりづらいかもしれないですが、<https://vanya.jp.net/os/x86call/>がとても良かったので気になる方は読んでみてください。

### 関数を呼び出してみる

と言うわけで呼び出し元や引数がスタックに積まれるのかアセンブリを読んで確かめてみましょう。

次のコードを Compiler Explorer に食わせてみます。

```rust
pub fn caller() -> u8 {
    st(1, 2)
}

pub fn st(a: u8, b: u8) -> u8 {
    a + b
}
```

その結果は、

```s
example::caller:
        mov     al, 3
        ret

example::st:
        lea     eax, [rsi + rdi]
        ret
```

として出力されます。

すでに計算されてしまっていますね。
これは 出力結果がシンプルなことから分かる通り、これは rustc の opt level を 2 に設定しています。
では、次に 0 、つまりデバッグ用の開発ビルドの結果を見てみます。

```s
example::caller:
        push    rax
        mov     edi, 1
        mov     esi, 2
        call    qword ptr [rip + example::st@GOTPCREL]
        mov     byte ptr [rsp + 7], al
        mov     al, byte ptr [rsp + 7]
        pop     rcx
        ret

example::st:
        push    rax
        mov     cl, sil
        mov     al, dil
        add     al, cl
        mov     byte ptr [rsp + 7], al
        setb    al
        test    al, 1
        jne     .LBB1_2
        mov     al, byte ptr [rsp + 7]
        pop     rcx
        ret
.LBB1_2:
        lea     rdi, [rip + str.0]
        lea     rdx, [rip + .L__unnamed_1]
        mov     rax, qword ptr [rip + core::panicking::panic@GOTPCREL]
        mov     esi, 28
        call    rax
        ud2

.L__unnamed_2:
        .ascii  "/app/example.rs"

.L__unnamed_1:
        .quad   .L__unnamed_2
        .asciz  "\017\000\000\000\000\000\000\000\006\000\000\000\005\000\000"

str.0:
        .ascii  "attempt to add with overflow"

__rustc_debug_gdb_scripts_section__:
        .asciz  "\001gdb_load_rust_pretty_printers.py"
```

呼び出し元や引数の push が現れていないように見えますが、call は push と jump を兼ねているので、呼び出し元を push することはできています。
しかし、この段階では引数をスタックに積めてはいません。教科書的な動きをしていないようです。

## 汎用レジスタの数以上の stack を積んでみる

```s
example::caller:
        push    rax
        mov     edi, 1
        mov     esi, 2
        call    qword ptr [rip + example::st@GOTPCREL]
        mov     byte ptr [rsp + 7], al
        mov     al, byte ptr [rsp + 7]
        pop     rcx
        ret
```

をみていると、引数の引き渡しにスタックではなくレジスタを使ってそうなので、汎用レジスタの数以上の引数を渡してみましょう。

```rust
pub fn many_args(
    a: u8,
    aa: u8,
    aaa: u8,
    aaaa: u8,
    aaaaa: u8,
    aaaaaa: u8,
    aaaaaaa: u8,
    aaaaaaaa: u8,
    aaaaaaaaaa: u8,
    aaaaaaaaaaa: u8,
    aaaaaaaaaaaa: u8,
    aaaaaaaaaaaaa: u8,
    aaaaaaaaaaaaaa: u8,
    aaaaaaaaaaaaaaa: u8,
    aaaaaaaaaaaaaaaa: u8,
    aaaaaaaaaaaaaaaaa: u8,
    aaaaaaaaaaaaaaaaaa: u8,
    aaaaaaaaaaaaaaaaaaa: u8,
) -> u8 {
    a + aa
        + aaa
        + aaaa
        + aaaaa
        + aaaaaa
        + aaaaaaa
        + aaaaaaaa
        + aaaaaaaaaa
        + aaaaaaaaaaa
        + aaaaaaaaaaaa
        + aaaaaaaaaaaaa
        + aaaaaaaaaaaaaa
        + aaaaaaaaaaaaaaa
        + aaaaaaaaaaaaaaaa
        + aaaaaaaaaaaaaaaaa
        + aaaaaaaaaaaaaaaaaa
        + aaaaaaaaaaaaaaaaaaa
}
```

これはレジスタに入りきらないだろうと言うことで、結果をみてみると、

```s
example::many_args:
        lea     eax, [rsi + rdi]
        add     al, dl
        add     al, cl
        add     al, r8b
        add     al, r9b
        add     al, byte ptr [rsp + 8]
        add     al, byte ptr [rsp + 16]
        add     al, byte ptr [rsp + 24]
        add     al, byte ptr [rsp + 32]
        add     al, byte ptr [rsp + 40]
        add     al, byte ptr [rsp + 48]
        add     al, byte ptr [rsp + 56]
        add     al, byte ptr [rsp + 64]
        add     al, byte ptr [rsp + 72]
        add     al, byte ptr [rsp + 80]
        add     al, byte ptr [rsp + 88]
        add     al, byte ptr [rsp + 96]
        ret
```

ダメでした。

スタックポインタを読み出してはいるのですが、スタックに積んでいるところは見えません。
ただ、これは Rust の呼び出し規約の問題ではと言う指摘を頂いたのでいま調べています。

## Rust を使っているからダメなのか？

C でならいけると思って試してみましたが、これも引数を積んでいるところは見えませんでした。

<http://asp.mi.hama-med.ac.jp/comp-basic/memory/> という 2005 年のサイトでは、

```c
main()
{
  int x = 10;

  x = foo(x);

}

int foo(int x)
{
  return x * 10;
}

```

が

```s
main:
C10  sub  sp,  1
C11  mov  *sp, 10
C12  push *sp
C13  call foo
C14  add  sp,  1
C15  mov  *sp, ax
C16  add  sp,  1
C17  ret

foo:
C20  mov  ax,  *(sp + 1)
C21  mul  ax,  10;
C22  ret
```

となり、こちらは明示的にスタックに積んでくれてそうです。

が、これを Compiler Explorer に食わせると

```s
main:                                   # @main
        push    RBP
        mov     RBP, RSP
        sub     RSP, 16
        mov     DWORD PTR [RBP - 4], 0
        mov     DWORD PTR [RBP - 8], 10
        mov     EDI, DWORD PTR [RBP - 8]
        mov     AL, 0
        call    foo
        mov     DWORD PTR [RBP - 8], EAX
        mov     EAX, DWORD PTR [RBP - 4]
        add     RSP, 16
        pop     RBP
        ret

foo:                                    # @foo
        mov     DWORD PTR [RSP - 4], EDI
        imul    EAX, DWORD PTR [RSP - 4], 10
        ret
```

となり、明示的にスタックに積んでくれはしなくなりました。新しめのコンパイラだと見えないようですね。

ただこれもベースポインタをスタックに積んでいること、スタックポインタを直接引き算していること、そして関数から抜ける時には足した分だけスタックポインタを足し戻していることから、push が使われていないだけで、スタックを使った処理はしていそうではあります。

## ポインタを経由させる

これまでの例では呼び出し元はスタックに現れましたが引数には現れていません。
しかし教科書的には引数もスタックに積まれるはずなのです。
そのことを識者に聞いてみると「ポインタを経由させればいいんじゃない？」とのことでした。
たしかになんか上手くいきそうな雰囲気を感じました。
Rust ですぐに使えるポインタはと考えると、スマートポインタである Box が使えそうです。
というわけで引数を Box で包んで計算してみましょう。

```rust
pub fn dynamic(a: Box<u8>, b: Box<u8>) -> u8 {
    *a + *b
}
```

```s
example::dynamic:
        push    r15
        push    r14
        push    rbx
        mov     rax, rsi
        mov     r14, rdi
        mov     bl, byte ptr [rsi]
        add     bl, byte ptr [rdi]
        mov     r15, qword ptr [rip + __rust_dealloc@GOTPCREL]
        mov     esi, 1
        mov     edx, 1
        mov     rdi, rax
        call    r15
        mov     esi, 1
        mov     edx, 1
        mov     rdi, r14
        call    r15
        mov     eax, ebx
        pop     rbx
        pop     r14
        pop     r15
        ret
```

と言う風に出力されました。汎用レジスタ r15, r14 の値をスタックに積んでいます。これは呼び出し元が r15, r14 に事前に引数を入れておいてくれると教科書通りの動きをしそうではあります。
（けどそれだとレジスタの値そのまま使えば良くない？とも思わなくもない）

めでたしめでたし？

## まとめると

よくわからん。現実のコンパイラ、教科書と全然違う。

## 番外編

割り算を挟むとスタックに積ませられる

```rust
pub fn many_args(
    a: u8,
    aa: u8,
    aaa: u8,
    aaaa: u8,
    aaaaa: u8,
    aaaaaa: u8,
    aaaaaaa: u8,
    aaaaaaaa: u8,
    aaaaaaaaaa: u8,
    aaaaaaaaaaa: u8,
    aaaaaaaaaaaa: u8,
    aaaaaaaaaaaaa: u8,
    aaaaaaaaaaaaaa: u8,
    aaaaaaaaaaaaaaa: u8,
    aaaaaaaaaaaaaaaa: u8,
    aaaaaaaaaaaaaaaaa: u8,
    aaaaaaaaaaaaaaaaaa: u8,
    aaaaaaaaaaaaaaaaaaa: u8,
    aaaaaaaaaaaaaaaaaaaa: u8,
    aaaaaaaaaaaaaaaaaaaaa: u8,
    aaaaaaaaaaaaaaaaaaaaaa: u8,
    aaaaaaaaaaaaaaaaaaaaaaa: u8,
    aaaaaaaaaaaaaaaaaaaaaaaa: u8,
    aaaaaaaaaaaaaaaaaaaaaaaaa: u8,
    aaaaaaaaaaaaaaaaaaaaaaaaaa: u8,
) -> u8 {
    a + aa
        + aaa
        + aaaa
        + aaaaa
        + aaaaaa
        + aaaaaaa
        + aaaaaaaa
        + aaaaaaaaaa
        + aaaaaaaaaaa
        + aaaaaaaaaaaa
        + aaaaaaaaaaaaa
        / aaaaaaaaaaaaaa
        + aaaaaaaaaaaaaaa
        + aaaaaaaaaaaaaaaa
        + aaaaaaaaaaaaaaaaa
        + aaaaaaaaaaaaaaaaaa
        + aaaaaaaaaaaaaaaaaaa
        + aaaaaaaaaaaaaaaaaaaa
        + aaaaaaaaaaaaaaaaaaaaa
        + aaaaaaaaaaaaaaaaaaaaaa
        + aaaaaaaaaaaaaaaaaaaaaaa
        + aaaaaaaaaaaaaaaaaaaaaaaa
        + aaaaaaaaaaaaaaaaaaaaaaaaa
        + aaaaaaaaaaaaaaaaaaaaaaaaaa
}
```

```s
example::many_args:
        push    rbp
        push    r15
        push    r14
        push    r13
        push    r12
        push    rbx
        push    rax
        mov     bl, byte ptr [rsp + 112]
        test    bl, bl
        je      .LBB0_2
        mov     r15b, byte ptr [rsp + 176]
        mov     r12b, byte ptr [rsp + 168]
        mov     r13b, byte ptr [rsp + 160]
        mov     r14b, byte ptr [rsp + 152]
        mov     bpl, byte ptr [rsp + 144]
        mov     r11b, byte ptr [rsp + 136]
        mov     r10b, byte ptr [rsp + 128]
        add     dil, sil
        add     dil, dl
        add     dil, cl
        add     dil, r8b
        add     dil, r9b
        add     dil, byte ptr [rsp + 64]
        add     dil, byte ptr [rsp + 72]
        add     dil, byte ptr [rsp + 80]
        add     dil, byte ptr [rsp + 88]
        add     dil, byte ptr [rsp + 96]
        mov     cl, byte ptr [rsp + 120]
        movzx   eax, byte ptr [rsp + 104]
        div     bl
        add     dil, cl
        add     dil, r10b
        add     dil, r11b
        add     dil, bpl
        add     dil, r14b
        add     dil, r13b
        add     dil, r12b
        add     dil, r15b
        add     dil, byte ptr [rsp + 184]
        add     dil, byte ptr [rsp + 192]
        add     dil, byte ptr [rsp + 200]
        add     dil, byte ptr [rsp + 208]
        add     al, dil
        add     rsp, 8
        pop     rbx
        pop     r12
        pop     r13
        pop     r14
        pop     r15
        pop     rbp
        ret
.LBB0_2:
        lea     rdi, [rip + str.0]
        lea     rdx, [rip + .L__unnamed_1]
        mov     esi, 25
        call    qword ptr [rip + core::panicking::panic@GOTPCREL]
        ud2

.L__unnamed_2:
        .ascii  "/app/example.rs"

.L__unnamed_1:
        .quad   .L__unnamed_2
        .asciz  "\017\000\000\000\000\000\000\000&\000\000\000\013\000\000"

str.0:
        .ascii  "attempt to divide by zero"
```

理由は知らない
