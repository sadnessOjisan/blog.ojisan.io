---
path: /pyenv-install-battle
created: "2022-10-24"
title: pyenv install battle
visual: "./visual.png"
tags: ["python", "pyenv"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

Python 入れたけど切り替わらなくて困ったという話。

私はフロントエンドエンジニアロールであり普段は Python を書かないのだが、たまにローカルで API サーバーを動かす必要が生まれる時がある。そのため Python 環境を作りたい時がある。

## Mac と Python

### Python のバージョン

普段 Mac OS を使っている。長らく Mac には python コマンドが標準で付いていて、Python2.7 を使うことができていた。それがどこかのタイミングで Python3 も同梱されるようになった。こちらは python3 で起動する。

そのため個人的には Python は環境構築が不要な言語だと思っていた。しかし現実には Python の古いバージョンでしか動かないコードが生き残っていたりする。そしてそれはよくあることに思える。また Python はメジャーアップデートしなくても下位互換性を壊す破壊的な変更が入ったり、型注釈の導入のような大きなアップデートが入ることがあり、アプリによってはそれがサポートされるバージョンを使いたいということもある。そのため Python の開発環境としてはバージョンを切り替えられた方が嬉しい。「常に Python3 系の最新を使っとけばいいんでしょ〜」では済まないのである。

### python の alias

いまの Mac OS では Python3 は python3 コマンドで起動する。これがやっかいで、たとえばアプリケーションによっては pyenv のようなツールを使っていることを前提としていて python で python3 が起動するようにしている前提でコードが書かれていたりする。その点からも python のバージョン管理ツールが必要となる。

## pyenv の install

というわけで Mac 標準の Python ではなく自分で入れたいわけではあるが、どのようにして入れたらいいだろうか。[公式](https://github.com/pyenv/pyenv)を見ると brew で入るようである。

```
brew install pyenv
```

### PATH の設定

さて、これがやっかいである。PATH を通したり初期化するために .bashrc などにおまじないが必要となる。

おそらくググると

```
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init --path)"
eval "$(pyenv init -)"
```

(<https://zenn.dev/kenghaya/articles/9f07914156fab5>)

や、

```
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bash_profile
echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bash_profile
echo 'eval "$(pyenv init -)"' >> ~/.bash_profile
```

(<https://www.karakaram.com/mac-pyenv-install/>)

や

```
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(pyenv init -)"' >> ~/.zshrc
```

(<https://original-game.com/python_course/install/mac-homebrew-pyenv/>)

などとして設定する必要があるようだ。

おそらく情報が錯綜しているのは当時の pyenv のバージョンによるものだろう。

ちなみに 2022 年 10 月の公式は

```
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(pyenv init -)"' >> ~/.zshrc
```

となっている。これらを .zshrc にたせば良さそうだ。

とはいえ皆さんの手元の環境は zsh の設定ファイルは `.zsh/*` に分割されていたりするだろう。
なので結局は環境変数の設定とかするファイルで

```
export PYENV_ROOT="$HOME/.pyenv"
command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
```

を付け足すこととなる。

### 起動

実際のバージョンを install するには、`pyenv install --list` などして最新のバージョンを調べて `pyenv install 3.10.7` などとして入れるといい。

```
source ~/.zshrc
```

とすると python で 3.10.7 が起動する。

### 再起動

しかしここでターミナルを消して再度ターミナルを立ち上げて python とやると 2 系が立ち上がることがある。
これは PATH が原因だ。

```
$ echo $PATH
/Users/ojisan/.pyenv/shims:/bin:/Users/ojisan/.nvm/versions/node/v18.8.0/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/opt/openjdk@17/bin:/Users/ojisan/.nvm/versions/node/v18.8.0/bin:/opt/homebrew/sbin:/Users/ojisan/.cargo/bin
```

このように pyenv の PATH が先頭に来ればいいのだが、もし `/usr/local/bin:/usr/bin:/bin:/usr/sbin` などが先頭に来ていればそれは system 側の Python が呼ばれる。

仮に `pyenv global` で指定していてもである。

```
pyenv versions
  system
* 3.10.7 (set by /Users/ideyuta/.pyenv/version)
```

これの解決方法としては先の

```
export PYENV_ROOT="$HOME/.pyenv"
command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
```

の設定を .zshrc に書くことだ。これを .zshenv に書くと

```
/etc/zshenv
~/.zshenv
/etc/zprofile
~/.zprofile
/etc/zshrc
~/.zshrc
/etc/zlogin
~/.zlogin
```

といった読み込み順からして後から上書かれてしまいやすい。
公式も .zshrc に書いているので私たちも .zshrc に書いておけばこのようなトラブルは起きないだろう。
