---
path: /fish-node
created: "2021-04-18"
title: fish で node.js を使う
visual: "./visual.png"
tags: ["fish", "nodejs"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

Node.js で複数プロジェクトを掛け持ちすると、いろいろなバーションに切り替えたいというニーズがあると思います。
そのとき nvm のような versioning tool の出番となりますが、 fish 環境ではうまく動かないということもあります。
そこで fish 環境でも nvm のようなものを動かす方法を取るわけですが、いろいろなやり方があって迷った思い出があるので整理してみようと思います。

## なぜ動かないか

それは fish は POSIX 非準拠だからです。

nvm の公式には、

> nvm is a version manager for node.js, designed to be installed per-user, and invoked per-shell. nvm works on any POSIX-compliant shell (sh, dash, ksh, zsh, bash), in particular on these platforms: unix, macOS, and windows WSL.

と書かれていることから nvm を fish でそのまま使うことはできません。

そこで nvm とは別のツールを使っていきます。

## 方法の比較

### nvm + bass

fish には bass というプラグインがあります。

FYI: https://github.com/edc/bass

これは、

> Bass makes it easy to use utilities written for Bash in fish shell.

とあり、fish の中から bash のスクリプトを使えるようにしてくれるラッパーです。

bass を使うことで、fish という function をこのように定義すれば、

```sh
function nvm
    bass source ~/.nvm/nvm.sh --no-use ';' nvm $argv
end
```

nvm というコマンドで nvm を実行できます。

この方法を取る場合は事前に nvm 本体を入れておきましょう。

### fish-nvm

> NVM wrapper for fish-shell.

とある通り nvm のラッパーで、 bass + nvm の構成を隠蔽するようなものです。

事実、

> fish-nvm depends on bass

とも説明されています。

nvm 本体を install する必要はありますが、

```sh
fisher install FabioAntunes/fish-nvm edc/bass
```

とすれば nvm コマンドが使えるようになります。

### nvm.fish

**ほぼ** nvm 互換の API を持つプラグインです。

FYI: https://github.com/jorgebucaran/nvm.fish

```sh
fisher install jorgebucaran/nvm.fish
```

とするだけで、

```sh
nvm install v14
```

という風に使えます。

nvm.fish が他 2 つ大きく違うところは Node.js のバージョンマネージャーそのものも fish で実装しているため、nvm 自体のインストールが不要なところです。

## おすすめのやり方は nvm.fish

ここまで 3 つのやり方を紹介しましたが、オススメは nvm.fish です。
nvm 本体や bass のような依存を不要とするためです。
fisher などの plugin manager を使うだけで install できるので管理も楽です。

## nvm.fish を使う上での注意点

nvm には `nvm alias` というサブコマンドがあり、nvm コマンドを明示的に呼ばなくてもデフォルトで使う Node.js のバージョンを決められます。
しかし fish.nvm には同様のコマンドは存在しません。

そこで fish.nvm ではその代わりにデフォルトのバージョンは`nvm_default_version` という環境変数で設定します。

```sh
set --universal nvm_default_version v12
```

## 余談

Node.js のバージョンを管理したいだけなら何も nvm にこだわる必要はないです。

- volta
  - Rust 製の version manger. Rust 製ということは single binary で動作するため bash だろうが fish 上だろうが動く
  - ただし .nvmrc のようなファイルで設定せず package.json で version 管理するため、チーム開発しているときに package.json に余計な設定を足す可能性はある。
  - https://volta.sh/
- asdf
  - いろいろな言語やツールのバージョンをまとめて管理できるツール
  - 公式が fish もサポートしている
  - https://github.com/asdf-vm/asdf/blob/master/asdf.fish

これらを使うと何も nvm を使う必要はありません。
ただ私は Node.js しか書かないというのと、nvm に慣れているので nvm に近いツールを使うようにしています。
