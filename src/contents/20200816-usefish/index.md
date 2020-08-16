---
path: /to-fish
created: "2020-08-17 15:00"
title: fishの環境を作った
visual: "./visual.png"
tags: [fish, dotfile]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

ずっと他のシェルを使っていたのですがfishに切り替えました。
せっかく設定をdotfilesとしてGitで管理していたのに、設定の依存関係を何も覚えておらず持ち運べない状態になっていたので、いっそのこと全部やめて新しくしようと思ったのがきっかけです。

## fish ってどんなシェル？

[fish](https://fishshell.com/)はFriendly interactive shellというシェルで、friendlyさ（+親切さ）を感じられるシェルです。
何も設定を足していない標準の状態でも強力な設定がされているのが魅力の一つです。

### 補完がすごい

他のシェルだとプラグインの設定や関数をたくさん書いて設定していたような補完機能が標準で手に入りました。
たとえばコマンド入力中にこれまでの実行履歴やその階層のファイル一覧を見て、予測変換を出してくれます。

![予測変換](./ctrlf.png)

このとき ctrl + f を押すことでその補完で入力でき、入力時間を大幅に短縮できます。

もちろん既存のシェルにある tab で補完候補を出したり、切り替える機能もついています。
これもfishでは標準でtab連打した時に候補にフォーカスを当てることができ、インタラクティブにファイルを選択することができます。

![tab連打で候補からファイルを選択できる](./interactive.png)

### FWっぽい振る舞いをする

設定ファイルの分割は標準機能として実現できます。
また、そして補完用の設定やコマンド用の設定の分割も標準で行え、関数をコマンドとして定義していけます。
このように設定ファイルの置き場によっていろんな設定が自動でされるので、FW的な印象も持ちました。
少し使い方を覚えるだけでたくさんの設定ができ、またピンポイントで挙動を制御したいときはscriptを書いて制御でき、FWが持つ生産性とプリミティブが仕組みが持つ制御性のバランスがよかったです。

とくにfunctionsは感動的で、fish は export や nvm が使えないみたいな問題も、function に export や nvm 関数を定義してコマンドとしてそれを使うみたいなことができたり（標準で設定済みだったり）して、よかったです。

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

FYI: https://fishshell.com/docs/current/tutorial.html#startup-where-s-bashrc

ただしこのファイル以外の場所に設定を書いても設定を読み込め、その方が設定ファイルの分割をする上で有利なので下部で紹介します。

### pluginを使える

fishそれ自体にはplugin機構はありませんが、[functions](https://fishshell.com/docs/current/tutorial.html#functions) や [completions](https://fishshell.com/docs/current/index.html#where-to-put-completions) を使って plugin manager として使える外部ツールがあります。
ここでは plugin manager として使える [fisher](https://github.com/jorgebucaran/fisher) を使います。
plugin manager を名乗るツールは複数ありますが結局はfishの機能を呼び出しているだけなので、仮にplugin managerを移行するとなってもそこまで影響なさそうだったので、特に考えがあるわけでは無く比較的後発で人気がありそうなfisherを選択しました。
[what-is-a-plugin](https://github.com/jorgebucaran/fisher#what-is-a-plugin)や実行後の ~/.config/fish/ を読む限りは、functions や conf.d 配下に *.fish を置くことで設定を足しているようです。

## 設定する時に知っておいた方が良いこと

### 設定時は~/.config/fish/ を意識

fishではいわゆる profile や rc がついたファイル名で設定のエントリポイントは読み取りません。
エントリポイントとしては [~/.config/fish/config.fish](https://fishshell.com/docs/current/index.html#initialization-files)になるとは思いますが、これを使わなくても後述するファイル分割に使うフォルダを使えばエントリポイントを作らなくても動かせます。

### 設定ファイルは分割できる

設定には alias に関するもの、環境変数に関するもの、util関数に関するものといろいろ増えたり管理したくなるものです。
そこで設定ファイルを分割したくなるわけですが、fish ではこれが簡単にできます。
**fishでは~/.config/fish/conf.d/*.fishは全部設定ファイルとして読み込まれます**(ただしver2.3.0以降)。
そのため conf.d 配下に設定を分割していれておけば設定は簡単に分割できます。

FYI: https://fishshell.com/docs/current/index.html#initialization-files

FYI: https://stackoverflow.com/questions/48749443/fish-shell-import-config-into-main-config

zsh/bash などでは 

```sh:title=.bashrc
#!/bin/bash -eu

bash_conf=~/.config/bash

. $bash_conf/base.bash
. $bash_conf/alias.bash
. $bash_conf/jump.bash
. $bash_conf/env.bash
```

や


```sh:title=.zshrc
function loadlib(){
    lib=${1:?"You have to specify a library file"}
    if [ -f "$lib" ];then #ファイルの存在を確認
      . "$lib"
    fi
}

loadlib ~/.zsh/load_prezto
loadlib ~/.zsh/zsh_alias
```

などの工夫で設定を分割したりしていたものですが、それをやらなくていいのは嬉しかったです。

### fisherはpluginをテキストファイルで管理できる

調べていると `fisher add` で設定を追加する記事をよく見ましたが、私はそれを使わずに `fishfile` に書いて管理しています。
PCの移行を考え、どんなプラグインを使っているかをdotfilesとGitで管理したいからです。

ただ dotfilesとして管理しないのであれば、`fisher add` で直接プラグインを入れてもいいとは思います。
仮にfishfileを使ってなくても、パッケージ管理用のコマンドで自分がどんなファイルを持っているか調べられるので、忘れてもリカバリは容易です。

```sh
# package一覧を取得
fisher ls

# packageを削除
fisher rm XXX
```

こういった今風（っていいのか知らないけど）なパッケージマネージメントができるのは本当に嬉しいです。

## 既存環境を移せないデメリットはある

とまあfishはとても良いのですが、もちろんデメリットもあります。
実際のところ以前fishに移行しようとしたときはこれらのデメリットを考えて採用しなかったことがありました。

### nvm が悩みどころ

bash/zsh などで nvm を使っていると、

```sh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

のような設定を読み込む必要がありますが、この $HOME/.nvm/nvm.sh は fish では動きません。
そのため fish では nvm を使うことができず、[fish-nvm](https://github.com/jorgebucaran/nvm.fish) のような別のツールを使うか、[bass](https://github.com/edc/bass) のようなツールでbashの設定をfishに読み込んでnvmコマンドを実行する必要があります。

FYI: https://medium.com/@joshuacrass/nvm-on-mac-for-fish-users-e00af124c540

不用意に依存や設定を複雑にしたくなかったので私はそもそもnvmをやめて、[volta](https://volta.sh/)というツールに移行しました。

## 自分の設定

### alias 設定

alias, env, keybind として設定を分けています。

```sh:title=.config/fish/conf.d/alias.fish
# vim -> nvim
alias vim='nvim'

# GitHubを表示
alias hb="hub browse"

###
### Git系
###
alias g='git'
alias gb='git branch'
alias gbc='git checkout -b'
alias gc='git commit --verbose'
alias gco='git checkout'
alias gia='git add'
alias gm='git merge'
alias gp='git push'
alias gfm='git pull'
```

Gitのエイリアスは昔から使っていた prezto の Gitモジュールのもののうち、よく使っていたものです。

### plugin設定

fishfileには

```sh:title=.config/fish/fishfile
rafaelrinaldi/pure
oh-my-fish/plugin-peco
```

をセットしています。

普段はVSCodeでの作業なのでシェルにそこまでの機能は求めておらず、これだけで間に合っています。

### oh-my-fish/plugin-peco

[plugin-peco](https://github.com/oh-my-fish/plugin-peco) は peco を使ってコマンド履歴をinteractive に filterをかけて辿れるツールです。

[peco](https://github.com/peco/peco) は シングルバイナリなinteractive filtering tool です。
plugin-pecoはこのpecoを使ってコマンド履歴をフィルタリングする関数を提供します。
そのため**pecoは別途自分でインストールしておく必要**があります。

```sh
brew install peco
```

fish では key bind は fish_user_key_bindings関数に書いていきます。
plugin-pecoによってpeco_select_historyが使えるようになっているので、この関数を呼び出すキーバインドを設定します。
私はctrl + r で履歴を絞り込めるようにここに peco_select_history を書いておきます。
(bash/zsh だと このバインドで履歴を検索できたはずなので。)

```sh
function fish_user_key_bindings
  bind \cr 'peco_select_history (commandline -b)'
end
```

### rafaelrinaldi/pure

[Available themes](https://github.com/oh-my-fish/oh-my-fish/blob/master/docs/Themes.md)から好きなテーマを選んで fisher で入れることができます。

* 2行表示
* フォントのインストール不要
* Gitブランチが表示されて欲しい

というのが好みなので、それで探していました。

その結果いつも通り [pure](https://github.com/rafaelrinaldi/pure) を使うことにしました。
自分が尊敬している人が使っているものなので個人的な思い入れがあったりもします。

## ソースコード

dotfiles そのものは訳があって公開できないのですが、fish周りだけ切り出してレポジトリを作ったので興味ある方はご覧ください。

FYI: https://github.com/sadnessOjisan/fishconfig