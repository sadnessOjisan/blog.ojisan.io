---
path: /min-caml-for-mac
created: "2020-11-13 18:00"
title: min-caml を Mac で動かす
visual: "./visual.png"
tags: ["OCaml"]
userId: sadnessOjisan
isFavorite: false
isProtect: true
---

[min-caml](https://github.com/esumii/min-caml) という教育用のコンパイラがあります。
これは大学の講義などでも使われており、[速攻 MinCaml コンパイラ概説](http://esumii.github.io/min-caml/)という解説では、字句解析、構文解析、型推論、最適化、コード生成のステップを通して静的型付け言語のコンパイラを作る方法を学べます。

「これで僕もコンピュータの勉強するぞ！」と息込んで挑戦してみたのですが、新しいマシン(おそらく Mojave 以降の OS)ではビルドできないようなので、これを手元で動かす方法を紹介します。
筆者の環境は macOS Catalina Version 10.15.7 です。

## 公式の README 通りにやってみる

このような手順書があるので辿ってみます。

```sh
Install OCaml (http://caml.inria.fr/) if you haven't

Download (and expand) MinCaml, e.g. git clone https://github.com/esumii/min-caml.git

cd min-caml/

Execute ./to_x86 for x86 (or ./to_sparc for SPARC, ./to_ppc for PowerPC)

make
```

が、おそらく make で失敗します。

## make のエラーログ

```sh
make

File "parser.cmo", line 1:
File "lexer.cmo", line 1:
./min-caml test/print
free variable print_int assumed as external
iteration 1000
eliminating variable Ti7.13
eliminating variable Ti6.12
eliminating variable Ti4.15
iteration 999
register allocation: may take some time
(up to a few minutes, depending on the size of functions)
generating assembly...
gcc -g -O2 -Wall -m32 test/print.s libmincaml.S stub.c -lm -o test/print
ld: warning: The i386 architecture is deprecated for macOS
 (remove from the Xcode build setting: ARCHS)
Undefined symbols for architecture i386:
  "___stack_chk_fail", referenced from:
      _main in stub-890dc1.o
  "___stack_chk_guard", referenced from:
      _main in stub-890dc1.o
  "___stderrp", referenced from:
      _main in stub-890dc1.o
  "_atan", referenced from:
      min_caml_atan in libmincaml-19fba4.o
     (maybe you meant: min_caml_atan)
  "_cos", referenced from:
      min_caml_cos in libmincaml-19fba4.o
     (maybe you meant: min_caml_cos)
  "_fabs", referenced from:
      min_caml_abs_float in libmincaml-19fba4.o
  "_floor", referenced from:
      min_caml_floor in libmincaml-19fba4.o
     (maybe you meant: min_caml_floor)
  "_fprintf", referenced from:
      min_caml_prerr_int in libmincaml-19fba4.o
      min_caml_prerr_float in libmincaml-19fba4.o
      _main in stub-890dc1.o
  "_fputc", referenced from:
      min_caml_prerr_byte in libmincaml-19fba4.o
  "_fwrite$UNIX2003", referenced from:
      _main in stub-890dc1.o
  "_malloc", referenced from:
      _main in stub-890dc1.o
  "_printf", referenced from:
      min_caml_print_int in libmincaml-19fba4.o
  "_putchar", referenced from:
      min_caml_print_newline in libmincaml-19fba4.o
      min_caml_print_byte in libmincaml-19fba4.o
  "_scanf", referenced from:
      min_caml_read_int in libmincaml-19fba4.o
      min_caml_read_float in libmincaml-19fba4.o
  "_sin", referenced from:
      min_caml_sin in libmincaml-19fba4.o
     (maybe you meant: min_caml_sin)
ld: symbol(s) not found for architecture i386
clang: error: linker command failed with exit code 1 (use -v to see invocation)
make: *** [test/print] Error 1
```

`ld: symbol(s) not found for architecture i386` とある通り、i386(32 ビットを扱える CPU)用のシンボルを見つけられずリンクで失敗します。
どうも MacOS では Catallina 以降は 32bit 用の命令が使えないようです。

FYI: https://news.mynavi.jp/article/osxhack-247/

min-caml の x_86 用の makefile を読む限り、実行されている gcc は -m32 オプションが渡っておりこれにより 32bit のバイナリにコンパイルされるので、ここで生成されたバイナリは手元では実行できないようです。

## Docker 使えばできるかな？

32bit 対応している OS を使えば解決できると思ったので試してみました。
CentOS6 は 32bit 対応なので、このイメージを使ってみます。

```sh
docker pull i386/centos:6
docker run -it --rm i386/centos:6 /bin/bash
```

Docker 環境に入ったら min-caml を実行するための OCaml と min-caml 自体を DL するための git をインストールします。
ただこのままだと 64bit 版が入る(?)ので、yum のレポジトリを i386 向けに設定します。

```sh
sed -i 's/$basearch/i386/g' /etc/yum.repos.d/CentOS-*.repo
```

そしてインストールします。

```sh
yum install git ocaml
```

そして min-caml 自体を DL します。

```sh
git clone https://github.com/sadnessOjisan/min-caml.git
```

これで実行してみましょう。

```sh
cd min-caml/

./to_x86

make
```

これで min-caml コンパイラを作れました。

本当に動くか試してみましょう。

```sh
./min-caml test/adder
```

adder はこのようなコードです。

```sh
let rec make_adder x =
  let rec adder y = x + y in
  adder in
print_int ((make_adder 3) 7)
```

これをコンパイルすると、

```sh
adder      adder.ans  adder.cmp  adder.ml   adder.res  adder.s
```

といったファイルが生成されているはずです。
そして結果を見てみましょう。

```sh
less test/adder.res
10
```

はい、上手く行きましたね。

## 手元でビルドできるようにする

毎回 Docker 環境に入るのもめんどくさいので手元でもビルドできるようにしましょう。
さいわい Docker はローカルのファイルをホストにできるので、Docker 環境があればビルドできます。

先ほどコンテナ内でやったことを Dockerfile に書いておきます。

```sh
FROM i386/centos:6

RUN sed -i 's/\$basearch/i386/g' /etc/yum.repos.d/CentOS-\*.repo \
 && yum install -y git ocaml \
 && git clone https://github.com/sadnessOjisan/min-caml.git
```

yum install の -y を付けないとインストールが中断されて止まるので付け忘れないように注意しましょう。

そしてこのファイルを次のコマンドで実行します。

```sh
docker run --rm -v \$PWD:/min-caml -w /min-caml mincaml-builder make
```

-v を使うことで ホストの任意のパスをコンテナの任意のパスにマウントでき、ここではホストの現在位置(Dockerfile がある位置)をコンテナ内の min-caml にマウントしています。
これは Dockerfile で git clone したことで作られているフォルダです。
そして -w で コンテナ内の作業用ディレクトリを指定できるので、/min-caml 内にある makefile を使うために/min-caml を指定します。
-rm は コンテナ終了時にコンテナを自動的に削除するオプションです。
