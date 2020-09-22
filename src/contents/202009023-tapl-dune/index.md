---
path: /tapl-dune
created: "2020-09-23"
title: TaPL のサンプルコードを dune でビルドして読みやすくする
visual: "./visual.png"
tags: [OCaml, TaPL]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

TaPL(型システム入門 -プログラミング言語と型の理論-) は型システムについて体系的に学べる教科書です。
友人から「型周りちゃんと勉強したいならこれ読むと良いよ〜」と勧められ読んでいるのですが、正直何もわからんという状態なのでサンプルコード（実装）から本文を読み解いています。
この本には[サポートページ](https://www.cis.upenn.edu/~bcpierce/tapl/)が存在しており、implementations というセクションからサンプルコードを DL することができます。
ただしこのサンプルコードをそのまま読んでいくのは少し辛いところがあったのでそれを読みやすくできるようにするのが本記事の趣旨です。

## TaPL のサンプルコードがやっていること

本文では構文の評価規則や型付け規則を実装していく例が乗っているのですが、配布されるサンプルコードでやっていることはコンパイラの自作です。
評価可能な形に変換したり、それをテストしたりするわけなので、字句解析・構文解析・実行形式にビルドなどしなければいけないからです。

そうなってくるとビルドもただ検査関数をビルドしたらいいとはならずに複数ファイルにまたがってコンパイルする必要が出てきます。
そのためサンプルコードでは Makefile を使ってビルドを行っています。

しかしその Makefile の中でやられていることは特に本書や README で解説されているわけではないので、OCaml やそのエコシステムを知らないと読めなかったりして中々に苦労しました。
さらにこのサンプルコードはそのままだと補完やジャンプが効かない状態でしたので、それらの設定まで面倒を見てくれる dune というビルドツールに置き換えていきます。

## dune でビルドする

[dune](https://github.com/ocaml/dune) は

> Dune is a build system designed for OCaml/Reason projects only.

とあり、OCaml/ReasonML のビルドツールです。

このツールを使うと（僕は OCaml の識者じゃないしこれが本当にメリットかわかりませんが使った感じのメリットとしては、）依存を書き並べずともビルドを宣言的に行えたり、モジュールインターフェースや静的解析ツール(merlin)の設定ファイルを自動生成してくれたり楽できます。
特に[merlin](https://github.com/ocaml/merlin)の設定ファイルの自動生成がとても嬉しく、これがあれば **TaPL のコードを LSP の力を借りながら読んでいける**ようになります。

で、基本的には dune の設定ファイルを書いて dune build すればいいのですが、字句解析・構文解析との連携や、サンプルコードのバージョンが古かったりとそのままでは上手く行かないので、そのトラブルシューティングをしていきましょう。

## dune でのビルド手順

opam が入っていることを前提に進めていきます。
無い方は brew なりで入れてください。
opam を入れると OCaml の環境も手に入ります。
また、dune は`opam install dune`で入手できるので特に解説はしません。

使うサンプルコードは arith です。
本文 4 章で使うサンプルコードで、算術の計算規則を実装・テストするシンプルなコードです。

### dune の設定ファイルを作る

dune プロジェクトは `init` で作ります。

```sh
# arithはプロジェクト名
dune init exe arith
```

exe は実行形式を作るプロジェクトであると言う意味です。
他にも lib や project などがありますが、それらは今は用途が違うので選びません。
(project でも可能だがサンプルコードの規模なので exe を選択)

`init` した後に

```sh
dune exec -- ./arith.exe
```

とすれば、作ったコードを動かせます。
これはビルドして実行しているコマンドです。

（単にビルドするだけなら `dune build` をしてください。バイナリを出力します。）

このとき .merlin というファイルができているはずです。
これが静的解析を行うために必要な設定ファイルです。

### arith をビルドする

arith のエントリポイントは main.ml です。
これをビルドするために dune の設定の name を main に変えて、

```sh
dune exec -- ./main.exe
```

としてください。

失敗します。

この失敗を解消していきます。

### ocamllex, ocamlyacc を dune から使う

ocamllex, ocamlyacc はそれぞれ字句解析器・構文解析器です。
これらは解析結果を OCaml のソースコードとして出力します。
ocamllex, ocamlyacc を dune から呼び出せるように[マニュアル](https://dune.readthedocs.io/en/stable/dune-files.html)を見ながら作業していきましょう。

dune は (key property) といった形の設定を stanza という単位で行っていきます。
ocamllex, ocamlyacc を使うためには rule スタンザを使います。

```sh
(rule
 (target[s] <filenames>)
 (action  <action>)
 <optional-fields>)
```

lexer, parser はそれぞれ、 \*.mll, \*.mly から作るので、

```sh
(rule
 (target lexer.ml)
 (deps lexer.mll)
 (action
  (chdir
   %{workspace_root}
   (run %{bin:ocamllex} -q -o %{target} %{deps}))))
```

```sh
(rule
 (targets parser.ml parser.mli)
 (deps parser.mly)
 (action
  (chdir
   %{workspace_root}
   (run %{bin:ocamlyacc} %{deps}))))
```

とすることで lexer, parser を作れます。

それぞれ lex,yacc の設定から OCaml のコードを出力させる設定です。
targets, deps はそのままの意味なのでどう言う設定かは伝わると思います。

### 警告を無視する

TaPL は歴史の長い本なのでこのサンプルコードをそのまま現在の OCaml でビルドすると警告がたくさん出るはずです。
そして dune は初期設定ではその警告を全てエラー扱いするので、それをやめるように設定しましょう。

```sh
(env
 (dev
  (flags
   (:standard -warn-error -a))))
```

こうすることで warn を warn のまま扱えます。

### lexer.mll の型エラーを直す

これで原理上はビルドが通るようにはなったのですが、おそらく今の OCaml のバージョンでビルドすると lexer.mll で string で受け取るべき箇所が bytes で受け取ることになっていてそこでエラーが発生するはずです。
これは bytes を作る時に `String.*`すべきところを`Bytes.*` しているからです。
それを全部直そうとするのは大変なので、string を使うべきところで変換しましょう。

それは 119 行目の

```sh
let getStr () = Bytes.sub (!stringBuffer) 0 (!stringEnd)
```

にあるので、ここを

```sh
let getStr () = Bytes.sub (!stringBuffer) 0 (!stringEnd) |> Bytes.to_string
```

と後ろにパイプ演算子をつけておきましょう。
パイプ便利ですね、JavaScript にも早くきて欲しいですね。

### ビルドして実行してみる

これは出来上がるものはコンパイラなのでテストファイルも一緒に渡して実行します。
それは test.f としてサンプルコードに含まれています。

```sh
$ dune exec -- ./main.exe test.f
true
false
0
1
false
```

はい、できました！

### LSP 周りを整える

きっとビルドの過程で .merlin と言うファイルができているはずです。

```sh
EXCLUDE_QUERY_DIR
B _build/default/.main.eobjs/byte
S .
FLG -open Dune__exe -w @1..3@5..28@30..39@43@46..47@49..57@61..62-40
-strict-sequence -strict-formats -short-paths -keep-locs -warn-error -a
```

これがあると merlin というツールでコードの解析ができます。

そしてそれをラップした ocaml-lsp を使うと コードジャンプや補完を VSCode 上でできるようになります。

これはこれでまた別の落とし穴があるので、[OCaml の補完とフォーマットを VSCode 上で実現するための試行錯誤](https://blog.ojisan.io/ocaml-lsp-vscode) を参考にしてみてください。

## サンプルコード

https://github.com/sadnessOjisan/arith-dune

## おわりに

TaPL 本当になんもわからんという状態ですのでどなたか手解き頂きたいです・・・
