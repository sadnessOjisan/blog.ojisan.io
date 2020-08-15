---
path: /applecare-is-saikou
created: "2020-08-15 09:00"
title: OCaml の補完とフォーマットをVSCode上で実現するための試行錯誤
visual: "./visual.png"
tags: [雑記]
userId: sadnessOjisan
isProtect: false
---

私はOCamlの開発者ではないのですが[プログラミングの基礎](https://www.amazon.co.jp/%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0%E3%81%AE%E5%9F%BA%E7%A4%8E-Computer-Science-Library-%E6%B5%85%E4%BA%95/dp/4781911609)や大学の講義資料で勉強中でそのサンプルコードとして OCaml が出てくるので触っています。
コードリーディングが目的なので補完やフォーマットといった読みやすさを手に入れるための環境構築についてメモします。

筆者の環境は MacOS です。

## とりあえず OCaml の環境を作る

OCamlのpackage managerである[opam](https://opam.ocaml.org/)を使って環境構築を進めていきます。
必要なパッケージだけで無くOCaml本体も入れることができるのでこのコマンドを使えるようにします。

[How to install opam](https://opam.ocaml.org/doc/Install.html)

```sh
$ brew install gpatch
$ brew install opam
```

公式曰く、[GNU patch](https://savannah.gnu.org/projects/patch/) は 依存として必要とのことです。
（なんで必要かは知らないです。）


ともあれopamを実行できるようになりました。

```sh
> opam
usage: opam [--version]
            [--help]
            <command> [<args>]

The most commonly used opam commands are:
    init         Initialize opam state, or set init options.
    list         Display the list of available packages.
    show         Display information about specific packages.
    install      Install a list of packages.
    remove       Remove a list of packages.
    update       Update the list of available packages.
    upgrade      Upgrade the installed package to latest version.
    config       Display configuration options for packages.
    repository   Manage opam repositories.
    switch       Manage multiple installation prefixes.
    pin          Pin a given package to a specific version or source.
    admin        Tools for repository administrators

See 'opam help <command>' for more information on a specific command.
```

では次に OCaml の環境を作っていきます。

```sh
opam init

eval $(opam env)
```

これで環境がOCamlの環境が使えるようになりました。

試しに`ocaml`と打つと REPL が起動するはずです。

```sh
> ocaml
        OCaml version 4.09.1

# 
```
## LSP 環境を作る

VSCodeのプラグインが利用するLaunguage Server をインストールする。
[ocaml-lsp](https://github.com/ocaml/ocaml-lsp)に含まれているので opam 経由でインストールする。

```sh
$ opam pin add ocaml-lsp-server https://github.com/ocaml/ocaml-lsp.git
$ opam install ocaml-lsp-server
```

こののちに ocamllsp とターミナルに打ってエラーがでなければ成功です。

もし反映されなければ opamの環境変数が読み込めていない可能性があります。
opam init したときのログを確かめましょう。

## VSCode の設定

[vscode-ocaml-platform](https://github.com/ocamllabs/vscode-ocaml-platform)というエクステンションを使います。
これがあれば LSP なので補完もフォーマットもサポートされています。
これは ocamllsp が使えれば VSCode は　LSP Client としてやりとりしてくれて補完が効きます。
ただし format に関しては別途 ocamlformat が必要らしいです。
VSCode上で format on save をかけると `Unable to find ocamlformat binary. You need to install ocamlformat manually to use the formatting feature.` と表示されます。
ソースコードを見る限り、formatterは別途入れておく必要があるようです。

https://github.com/ocaml/ocaml-lsp/blob/549ee9e21dda93a152657e138f8e43c8a26e3577/ocaml-lsp-server/src/fmt.ml#L73

また、ocamlformat それ自体は format 時に .ocamlformat という設定ファイルが必要です。
中身は無くても動きますが、このファイルがないとフォーマットされないのでprojectのルートに置いておきましょう。

## 多分うまくいかないと思うのでデバッグするときに役立ちそうな情報を

僕はこの環境を手に入れるのに相当苦労しました。
多分これ通りにやってもうまくいかないと思うのでデバッグに役立つ知識ををつらつらと書いておきます。

### VSCodeのリロード

Extensionのdisaple や設定の修正を行った後はVSCodeの再起動が必要となります。
これは cmd + shift + p でコマンド入力欄を開いて、reload window と打てばできます。
実際にはreloadと打つだけで表示されたり、最新の実行順で表示されるので、高速にリロードすることができます。
動かなかったときの試行錯誤をするときに知っておくと便利です。
 
### VSCodeの設定

VSCodeの設定はJSONでも可能ですが、このJSONを開くボタンが気がついたら変わっていました。
今までは　preference のヘッダに `{}`というのがありここをクリックすれば出ていましたが今はこの導線がありません。
これも cmd + shift + p でコマンド入力欄を開いて、`setting` や `json` などで調べて見つけ出しましょう。
opam の設定をしたシェルに切り替える試行錯誤でこの作業が出たりするかもしれません。

### opamを入れたときのシェルとVSCodeのシェルを揃える

`opam init` するとこのような表示がされます。

```
> opam init
[NOTE] Will configure from built-in defaults.
Checking for available remotes: rsync and local, git.
  - you won't be able to use mercurial repositories unless you install the hg command on your
    system.
  - you won't be able to use darcs repositories unless you install the darcs command on your
    system.


<><> Fetching repository information ><><><><><><><><><><><><><><><><><><><>  🐫 
Processing  1/1: [default: http]
[default] Initialised

<><> Required setup - please read <><><><><><><><><><><><><><><><><><><><><>  🐫 

  In normal operation, opam only alters files within ~/.opam.

  However, to best integrate with your system, some environment variables
  should be set. If you allow it to, this initialisation step will update
  your fish configuration by adding the following line to ~/.config/fish/config.fish:

    source /Users/ojisan/.opam/opam-init/init.fish > /dev/null 2> /dev/null; or true

  Otherwise, every time you want to access your opam installation, you will
  need to run:

    eval $(opam env)

  You can always re-run this setup with 'opam init' later.

Do you want opam to modify ~/.config/fish/config.fish? [N/y/f]
(default is 'no', use 'f' to choose a different file) A hook can be added to opam's init scripts to ensure that the shell remains in sync with the opam
environment when they are loaded. Set that up? [y/N] y

<><> Creating initial switch (ocaml-base-compiler) ><><><><><><><><><><><><>  🐫 

<><> Gathering sources ><><><><><><><><><><><><><><><><><><><><><><><><><><>  🐫 
[ocaml-base-compiler.4.10.0] downloaded from cache at https://opam.ocaml.org/cache

<><> Processing actions <><><><><><><><><><><><><><><><><><><><><><><><><><>  🐫 
∗ installed base-bigarray.base
∗ installed base-threads.base
∗ installed base-unix.base
```

で、ここで 

```
your fish configuration by adding the following line to ~/.config/fish/config.fish:

source /Users/ojisan/.opam/opam-init/init.fish > /dev/null 2> /dev/null; or true
```

とある通り環境変数を読み込む処理が fish の設定に書かれています。
（ちなみに僕の fish 環境では ~/.config/fish/config.fish は設定ファイルではないので、このファイルができたところで環境変数は読まれないし、そもそもこのファイルができていなくて opam 自体も何か不具合がありそう。それはそれはそれで関係話なのですが fish 使っているとこのようなところでもハマるかもなので覚えておこう）

これは bashやzshで実行したらそれはまた別の設定ファイルになっています。
つまり、opamを実行したときのシェルの種類に依存します。
他のシェルを使う場合は自分で環境変数を読み込まない限りはopamは叩けません。

その結果、VSCodeが標準で異なるシェルを立ち上げるとopamの資材にアクセスできません。
特にfishだとVSCodeで標準サポートされていないので設定で切り替える必要があります。

#### Bash/Zshなど

VSCodeのターミナル機能のGUIから変えることができます。

![VSCの下部ターミナルから切り替えられる](./vscsh.png)

#### Fishなど

setting.json から切り替えます。

```json
{
    "terminal.integrated.shell.osx": "/usr/local/bin/fish"
}
```

などとして切り替えられます。

shellの絶対パスを書く必要があるので、 `which fish` などして出てきたものをここに書いてください。

### ocamllsp が VSCode 上からだけ見えない

これ初見で見事にハマったのですが、VSCode の設定次第では VSCodeのエクステンション([vscode-ocaml-platform](https://github.com/ocamllabs/vscode-ocaml-platform)) から ocamllsp を使えないといったことがありそうです。
ちなみにこのとき VSCode内のシェルからは ocamllsp を実行できます。
これは `ocaml.select-sandbox` というコマンドで設定を書き換えることで修正できました。

vscode-ocaml-platformは[command](https://github.com/ocamllabs/vscode-ocaml-platform#commands)を提供しており、VSCode上の cmd + shift + p で実行できます。
このとき `ocaml.select-sandbox` は 利用する opam のバージョンを指定できます。
これで ocamllsp や ocamlformat が入っているバージョンを選択すれば ocamllsp に VSCからアクセスできるようになり補完が聞くようになります。

![OCamlのバージョンをVSC上で選択する](./wchichversion.png)

これは特に `opam switch`で複数バージョンのOCamlを切り替えたりしているとハマる点だと思います。
僕は本や資料のバージョンに合わせて複数バージョン持っていたためこの設定をしていないと動かないという状況になっていました。

## あとがき

OCamlをVSCodeでやるとすれば、[OCaml and Reason IDE](https://marketplace.visualstudio.com/items?itemName=freebroccolo.reasonml)の方が主流になってそうなのでこちらを使ってもいいとは思います。
私はocaml-lspが動かない時はこちらを使っていたのですが、 merlin という補完に使える開発支援ツール(このツールはocaml-lspにも使われている)や ocamlformat/ocp-indent といったフォーマッターを別途入れて、そのパスを通さないと動かない場合があると言った試行錯誤はこちらでも必要なので、注意してください。
