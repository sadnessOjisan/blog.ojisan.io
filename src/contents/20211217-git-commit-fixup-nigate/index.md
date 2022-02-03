---
path: /git-commit-fixup-nigate
created: "2021-12-17"
title: git commit --fixup 苦手
visual: "./visual.png"
tags: ["git"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

この記事は [sadnessOjisan Advent Calendar 2021](https://adventar.org/calendars/7015) 17 日目の記事です。書かれた日付は 1/4 です。

僕の commit log があまりにも汚すぎて、「fixup!!!!!!!!!!!!!!!!!!!!!!」と教わったのが 2021 年のハイライトでした。
今では手放せくらい使い込むような手癖になっているのですが、何かうまく動かせない時があってちゃんと調べた時のメモです。

## commit log の手直しをしたいときに便利

例えば何らかの変更（ここでは import に type をつける）をしたとして、その変更 commit に add type to import statement のようなメッセージを付けたとしよう。

ここでおっちょこちょいな私は修正漏れをしていたことに気づきます。そして修正漏れを修正した後にどのように commit したらいいでしょうか。

もう一度 add type to import statement を作っても良いのですが、何か気持ち悪いですよね。
そういうときに他の commit に今の修正をまとめたくなります。
それを実現するのが fixup や autosquash で、

```
git commit --fixup HEAD

git rebase -i --autosquash HEAD~2
```

のようなコマンドでそれが実現できます。

このコマンドの一つ一つについてみていきましょう。

## 各要素技術について

### git commit --fixup HEAD とはなんだったか

これは HEAD の commit message に fixup! を付けた commit を付けてくれるコマンドです。

HEAD じゃなくても任意の commit hash を指定できます。

ただ fixup! をつけるだけなのですが、これが後の rebase での fixup 用の目印となります。

### git rebase とはなんだったか

git rebase は Git の commit log を改変できるコマンドです。

### -i とはなんだったか

そして -i は対象となる commit log を全て表示して、その中でどのように改変するかをエディタで修正できるモードを起動できます。

```
pick bfe0aa2 xxxxxxxxxxxxxxxxxxxx
pick 653ddf8 xxxxxxxxxxxxxxxxxxxx
pick 15512c6 xxxxxxxxxxxxxxxxxxxx
pick 54609f9 xxxxxxxxxxxxxxxxxxxx
```

などとして表示されます。

pick は rebase の command でそれ以外にも次の command があります。

```
# Rebase 326fc9f..0d4a808 onto d286baa
#
# Commands:
#  p, pick = use commit
#  r, reword = use commit, but edit the commit message
#  e, edit = use commit, but stop for amending
#  s, squash = use commit, but meld into previous commit
#  f, fixup = like "squash", but discard this commit's log message
#  x, exec = run command (the rest of the line) using shell
#
# If you remove a line here THAT COMMIT WILL BE LOST.
# However, if you remove everything, the rebase will be aborted.
#
```

この fixup が今回の主役で、一つ前の pick と commit を合流できます。

### --autosquash とはなんだったか

--autosquash は fixup! で始まる commit に対して、fixup コマンドをセットしてくれるオプションです。

なのでこれを付け忘れると、fixup! とついた commit が pick として扱われてしまうということです。

### HEAD~2 とはなんだったか

どの範囲を rebase するかの指定です。
このコマンドを一番使う時は直前の commit に対してなので、HEAD~2 を手癖にしています。
なお commit hash を指定した場合は、HEAD からその commit までの全てが対象になるようです。

## 結論

というわけで今回のようなおっちょこちょいユースケースでは、

```
git commit --fixup HEAD

git rebase -i --autosquash HEAD~2
```

を手癖にしておくと良いと思います。
