---
path: /fish-node
created: "2021-04-18"
title: fish で Node.js を使う
visual: "./visual.png"
tags: ["fish", "Node.js"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

Node.js で複数プロジェクトを掛け持ちすると、いろいろなバーションに切り替えたいというニーズがあると思います。
そのとき nvm のような version manager の出番となりますが、 fish 環境ではうまく動かないケースもあります。
そこで nvm を動かすためには何個か方法があるので、方法を整理します。

## なぜ fish で nvm が動かないか

fish が POSIX 非準拠だからです。

nvm の公式には、

> nvm is a version manager for node.js, designed to be installed per-user, and invoked per-shell. nvm works on any POSIX-compliant shell (sh, dash, ksh, zsh, bash), in particular on these platforms: unix, macOS, and windows WSL.

と書かれていることから nvm は fish 上では not works です。

そこで、それらを解決するプラグインを導入します。

## 方法の比較

ざっと調べた限り、3 つの方法があるようなので試してみます。

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

fish-nvm は、

> NVM wrapper for fish-shell.

とある通り nvm のラッパーで、 bass + nvm の構成を隠蔽するようなものです。

FYI: https://github.com/jorgebucaran/nvm.fish

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
nvm 本体や bass のような依存が不要なためです。
fisher などの plugin manager を使うだけで install できるので管理も楽です。

## nvm.fish を使う上での注意点

nvm には `nvm alias` というサブコマンドがあり、nvm コマンドを明示的に呼ばなくてもデフォルトで使う Node.js のバージョンを決められます。
しかし fish.nvm には同様のコマンドは存在しません。

そこで fish.nvm ではその代わりにデフォルトのバージョンは`nvm_default_version` という環境変数で設定します。

```sh
set --universal nvm_default_version v12
```

これで毎回 nmv use コマンドを叩かなくても Node.js v12 が使えます。

## 余談

Node.js のバージョンを管理したいだけなら何も nvm にこだわる必要はないです。

- volta
  - Rust 製の version manger です。 Rust 製ということは single binary で動作するため bash だろうが fish 上だろうが動きます。
  - ただし .nvmrc のようなファイルで設定せず package.json で version 管理するため、チーム開発しているときに package.json に余計な設定を足す可能性はあります。
  - https://volta.sh/
- asdf
  - いろいろな言語やツールのバージョンをまとめて管理できるツールです。
  - 公式が fish もサポートしています。
  - https://github.com/asdf-vm/asdf/blob/master/asdf.fish

これらを使うと何も nvm like なツールを使う必要はありません。
ただ私は Node.js しか書かないというのと、nvm に慣れているので nvm like なツールを使うようにしています。
