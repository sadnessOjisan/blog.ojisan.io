---
path: /zip-j
created: "2020-09-12"
title: 特定のフォルダの特定のファイルだけを1段目の階層に収まるようにzipしたい
visual: "./visual.png"
tags: [zip, shell]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## 結論

`-j` を使う！

## やりたいこと

dist/module/script.js という階層にファイルがあるとして、この script.js だけを配布したいとします。
ここで GitHub Release などに載せたいので zip したいです。
このとき単に `zip script.zip dist/module/script.js` とすると `script.zip` が出来上がりますがこれを解凍すると `dist/module/script.js` が出てくるので、実行するのがめんどくさかったりします。

つまり、

```sh
# zip
$ zip script.zip dist/module/script.js

# 同一階層で解答したらフォルダ名がかぶるので移動
$ cd ..

# 移動した先に応じてscript.zip へのパスは変えること
# dist が解答される
$ unzip script.zip


# 表示
$ ls dist
module
```

となり、script.js は見えないのを、解凍した時点で script.js が見える形にしたいというのが要望です。

## -j でディレクトリ名や構造を無視して zip する

zip には -j というオプションがあります。

`--help` でみてみると、

```sh
-j   junk (don't record) directory names
```

とのことです。

-j は junk という意味で、junk は 記録しない っていう意味のようです。
名前が保存されないという意味に捉えていたのでこれが構造を無視して保存できるオプションとは気づけなかったのですが、このオプションがいまやりたいことへの解でした。

そこで junk オプションをつけてみましょう。

```sh
# zip
$ zip -j script.zip dist/module/script.js

# script が解答される
$ unzip script.zip

# 表示
$ ls dist
script.js
```

と、対象の zip をそのままの構造で解凍することができました。

## 調べたときに「これからも！」って思ったオプション

このオプションに気づくまで結構時間がかかってそのときに試して「なるほど！」って思ったものも紹介します。
😢oOO(コマンドのオプションってヘルプ見ても使い方とか結果がわからなくて自分で試さないと結局良くわからないってなってるのは僕だけ？）

### -b オプション

-b は `--temp-path` を指定するオプションです。
いかにもこれが使えそうな気がしますよね。
と、同じように課題をこのコマンドで片付けられると考えていた方もいらっしゃるようです。

FYI: https://unix.stackexchange.com/questions/77605/change-working-directory

この質問の回答欄にもありますが、`-b` は `Use the specified path for the temporary zip archive.`を示し、zip するときの一時作業フォルダを指定するものです。
-b から base path を想起させますが(そういう説明をどこかでみたことがある)、`--temp-path` なので注意しましょう。

### -i(include) オプション

保存対象を指定できるオプションです。

```sh
$ zip --include='*.png' hoge.zip src/contents/20200610-1st-blog-stack/*
```

などとして使えます。

同様に -x というファイルを除外するオプションもあります。

しかしそれらを使ってもファイルを指定はできるものの、フォルダの構造を指定することはできませんので、今回やりたかったことは実現できませんでした。

## 改めて結論

フォルダの階層を無視して特定のファイルを zip 化したい場合は `-j` を使おう！
