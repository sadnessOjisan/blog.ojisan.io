---
path: /path-del-daijobu
created: "2020-08-21 15:00"
title: 環境変数PATHを消すだけなら復活するから大丈夫
visual: "./visual.png"
tags: [zsh, bash]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

PATH のことちゃんと理解していなかったのでちょっと勉強したって話です。

## PATH を消すとどうなるか

PATH を消します。

```sh
# bash/zsh
unset PATH

# fish
set -e PATH
```

消えたことを確認しましょう。

```sh
$ echo $PATH
>
```

そしてコマンドを叩いてみると、これまで使えていたコマンドが使えなくなっていることも確認できます。

```sh
% ls
zsh: command not found: ls

% bash
zsh: command not found: bash
```

それもそのはず、これらのコマンドは /bin に含まれており、そのコマンドへの PATH を消してしまったからです。

なので、

```sh
export PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin"
```

などとして PATH を通せば動くようになります。

## shell を切り替えると元に戻る

ところで PATH を消した後、実行ファイルを直接指定して他のシェルを開くと元に戻ります。

```sh
% unset PATH

% bash
zsh: command not found: bash

% /bin/bash

The default interactive shell is now zsh.
To update your account to use zsh, please run `chsh -s /bin/zsh`.
For more details, please visit https://support.apple.com/kb/HT208050.

bash-3.2$ ls
LICENSE  gatsby-browser.js gatsby-node.js  netlify.toml...
```

この理由を僕はよく分かっていませんでした。
なぜなら PATH などの設定は .bashrc や .zshrc やら .eshenv から読まれるはずで、そこで環境変数をセットしていたはずだからです。
そしてそれらのファイルに bin への PATH は通してなかったからです。
「勝手に PATH が作られるならこれまで 設定ファイルに書いていた設定はなんだったんだ」という気持ちになりました。

ただこれも冷静に考えるとそもそも bash コマンドとかが使えているので、ユーザーが設定している PATH 以外にもデフォルトで使う PATH を設定している場所があるはずです。
そこでこの初期 PATH はどこで作られるか調べました。

### etc の設定

「PATH 消す 復活」やら「PATH 読み込み 仕組み 初期」とかでググっていたら、 /etc 配下にある設定が使われていることがわかりました。

[Pocketstudio.jp Linux Wiki](<http://pocketstudio.jp/linux/?%A5%D1%A5%B9(PATH)%A4%CE%B3%CE%C7%A7%A4%C8%C0%DF%C4%EA%CA%FD%CB%A1%A4%CF%A1%A9>)をみていると

> 各ユーザの .bash_profile の中には、ログイン後に /etc/profile ファイルを読み込むような記述があるからです。

とあり、etc 配下に設定があるようです。

etc, なんか UNIX が云々みたいな話で出てくるやつだったなと思いながら[電算用語の基礎知識](https://www.wdic.org/w/TECH//etc)などで調べていると、

> UNIX や POSIX 準拠 OS(Linux 等)で、もっぱら、そのコンピューター用のシステム設定ファイルなどを格納するために使われるディレクトリ。

とあり、どうやらここにシェルの標準が入ってそうなことがわかりました。
ここを漁ると `/etc/profile`と`/etc/bashrc` といういかにも怪しいファイルがありました。

これらはログインシェル・インタラクティブシェルの初期読み込みファイルです。
shell を立ち上げるとまずは/etc/profile が読まれるとのことで、このコードを見てみましょう。
こういった設定の読み込み順序については [A Memorandum](https://blog1.mammb.com/entry/2019/12/01/090000) がわかりやすかったです。

```sh:title=profile
# System-wide .profile for sh(1)

if [ -x /usr/libexec/path_helper ]; then
        eval `/usr/libexec/path_helper -s`
fi

if [ "${BASH-no}" != "no" ]; then
        [ -r /etc/bashrc ] && . /etc/bashrc
fi
```

これをみる限り、私の環境では `/usr/libexec/path_helper -s` が実行されているようです。

このファイルを見てみると

```sh
$ less /usr/libexec/path_helper
@^@^@^@^@^@^@^@^@^@^@^@^@^A^@^@^
@^@^P^@^@^@^@^@^@^@^@^@^@^@^@^@^
@^@^P^@^@^@^@^@^@^E^@^@^@^E^@^@^
@^F^@^@^@^@^@^@^@__text^@^@^@^@^
@^@^@^@^@^@__TEXT^@^@^@^@^@^@^@^
@^@^@^@^A^@^@^@<B2>^D^@^@^@^@^@^
@^@^@^@^@^@^@^@^@^@^@^@^@^@^@^@^
```

と、バイナリだったのでとりあえず実行してみると、

```sh
bash-3.2$ /usr/libexec/path_helper
PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"; export PATH;
```

として出ました。

profile ではこの文字列を `eval` として実行するので、PATH に `/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin` が入るという仕掛けでした。

## というわけで PATH を消しても大丈夫

PATH を消しても shell を開き直すと復活するので大丈夫であることがわかりました。

ただし当たり前のことですが注意は必要で、~/.bashrc などのファイルは /etc/.profile が読み込まれた後に読まれるので、その中で PATH を上書くとデフォルトの PATH が読まれなくなります。
`export PATH="<追加したいパス名>:$PATH"` など:をつけてお尻に追加していきましょう。
また PATH を修正する時に /etc を直接触る行為も危険な行為です。
ここが壊れると復旧が難しくなります。

## まとめ

- PATH は デフォルトで通っているものがある。("/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin")
- /etc/profile に大元の PATH 変数の定義があり、シェルのログイン時にこれが読み込まれる。
- shell を起動するたびに環境変数が読み込まれるので、環境変数 PATH を消しても、別タブで shell を開くなどすれば簡単に復活させられる。
