---
path: /to-fish
created: "2020-08-16"
title: fishの環境を作った
visual: "./visual.png"
tags: [fish, dotfile]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

ずっと他のシェルを使っていたのですがfishに切り替えました。
どんなシンボリックリンクを貼ってたか覚えていなかったり、設定の依存関係を何も覚えていなくて、かつてはdotfiles化していたのに持ち運べない状態になっていたので、いっそのこと全部やめて新しくしようと思ったのがきっかけです。

## fish ってどんなシェル？

## fish の 導入

Homebrewから手に入れることができます。

```sh
brew install fish
```

インストール後 `fish` と打てば fish が立ち上がります。

```sh
> fish
Welcome to fish, the friendly interactive shell
Type help for instructions on how to use fish
you@hostname ~>
```

毎回打ち直すのはめんどくさいと思うので、ログインシェルを変更するとよいでしょう。
fishはデフォルトシェルではないのでそもそもの設定対象のリストに追加する作業から発生するのでちょっとめんどうです。
ここでは fish 自体の設定について解説したいのでシェルの変更方法については解説しませんが、こちらの記事を参照してください。

FYI: https://www.task-notes.com/entry/20150117/1421482066

### 設定ファイル

fish の設定は ~/.config/fish/ 配下で行います。
zshやbashのようにHOME配下に rcファイルがあるわけではないので注意しましょう。
ファイルの拡張子は .fish で ~/.config/fish/config.fish に設定ファイルをかけば設定ができます。
ただしこのファイル以外の場所に設定を書いても設定を読み込め、その方が設定ファイルの分割をする上で有利なので下部で紹介します。

### pluginを使える

fishそれ自体にはplugin機構はありませんが、functionsやalias といった機能を使って plugin manager として使える外部ツールがあります。
ここでは plugin manager として使える fisher を使います。
plugin manager を名乗るツールは複数ありますが結局はfishの機能を呼び出しているだけなので、仮にplugin managerを移行するとなってもそこまで影響なさそうだったので、人気がありそうなfisherを選択しました。

## 設定する時に知っておいた方が良いこと

### ~/.config/fish/ を意識

### 設定ファイルは分割できる

### fisherはpluginをファイル管理できる

チュートリアルでは fisher add のようにしていますが、私は fishfile に書いて管理しています。
PC移行を考え、どんなプラグインを使っているかをdotfilesとGitで管理したいからです。


## 既存環境を移せないデメリットはある

nvm や　

profile ファイルを読んでくれない