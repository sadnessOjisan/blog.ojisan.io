---
path: /ocaml-lsp-vscode
created: "2020-08-17 09:00"
title: fish で export が使えた理由を調べた
visual: "./visual.png"
tags: [OCaml, VSCode]
userId: sadnessOjisan
isProtect: false
---

## なんか PATH が通ってるんだけど・・・

新PC を fish で設定していて、cargo の設定で何気に

```
source ~/.cargo/env
```

って書いたら cargo コマンドが通って「はて？」となりました。

このファイルを覗いてみると

```sh
export PATH="$HOME/.cargo/bin:$PATH"
```

でして、export が使えないはずの fish で export が使えていました。

## cargo 以外もいけるのかなと思って実験した

もしかして cargo 入れる時に裏で魔法のなにかをやってくれたりするのかなと思ったので、普通に手元で export が通るか実験しました。

```sh
$ export PATH="$HOME/aaaaaaaaaaa:$PATH"
```

そして PATH を出力してみます。

```sh
$ echo $PATH
. /Users/ojisan/aaaaaaaaaaa /usr/bin /bin /usr/sbin /sbin /usr/local/bin
```

export がちゃんと実行されていました。

## どうして export が使えるのか

というわけで exportコマンドが使える理由を探ってみました。
コマンドが使えるということは fish functions が怪しいので、functions をみてみました。

```sh
# 筆者はCLIが使えないのでVSCodeで調査している
$ code ~/.config/fish
```

fish配下を `export` で全文検索で漁ってみました。
ここで

```sh
function export
  # no op
end
```

があればそれが犯人です。

ということなので調べてみましたがヒットしませんでした。

## export 関数は定義されているのか関数一覧を調べる

exportがコマンドでなく関数なのであれば

```sh
which export
```

などしても場所は出てきません。

関数一覧をみたかったので、`fish_config`をみてみることにしました。

fish は嬉しいことに設定をブラウザで行えます。
そのブラウザの設定画面にfunction一覧があるので、そこで探してみることにしました。


```sh
$ fish_config
```

![fish_configのfunctionページ](./config.png)

そしてこの画面でexportを探すとありました！
このような関数として定義されていました。

```sh
# Defined in /usr/local/Cellar/fish/3.1.2/share/fish/functions/export.fish @ line 1
function export --description 'Set env variable. Alias for `set -gx` for bash compatibility.'
    if not set -q argv[1]
        set -x
        return 0
    end
    for arg in $argv
        set -l v (string split -m 1 "=" -- $arg)
        switch (count $v)
            case 1
                set -gx $v $$v
            case 2
                if contains -- $v[1] PATH CDPATH MANPATH
                    set -l colonized_path (string replace -- "$$v[1]" (string join ":" -- $$v[1]) $v[2])
                    set -gx $v[1] (string split ":" -- $colonized_path)
                else
                    # status is 1 from the contains check, and `set` does not change the status on success: reset it.
                    true
                    set -gx $v[1] $v[2]
                end
        end
    end
end
```

コードに書いてある通り、set を使って bash compatibility を持った実装にされています。

しかしどうしてこのコマンドが使えるのでしょうか、この関数を使えるようにした覚えはありません。
なのでfunctionsの仕組みを調べてみました。

## なぜ export 関数が使えるのか

functions の定義をみてみると /usr/local/Cellar/fish/3.1.2/share/fish/functions/export.fish という位置に入っているようです。
(Cellar がついているのは brew 経由で fishを入れているからです)

share/ にあるexport は自動で使えるようになっているのでしょうか？
functionの読み込みについて調べてみました。

公式Docの [autoloading-functions](https://fishshell.com/docs/current/#autoloading-functions)を読んでみると、

> When fish needs to load a function, it searches through any directories in the list variable $fish_function_path for a file with a name consisting of the name of the function plus the suffix '.fish' and loads the first it finds.

とあり、$fish_function_path配下の fish ファイルの関数は自動で読み込まれるとのことです。

なのでこの$fish_function_pathが何なのかみてみましょう。

```sh
$ echo $fish_function_path
> /Users/ojisan/.config/fish/functions /usr/local/Cellar/fish/3.1.2/etc/fish/functions /usr/local/Cellar/fish/3.1.2/share/fish/vendor_functions.d /usr/local/share/fish/vendor_functions.d /usr/local/Cellar/fish/3.1.2/share/fish/functions
```

ありました、/usr/local/Cellar/fish/3.1.2/share/fish/functions です。
さきほどの export.fish はこのフォルダ配下の関数です。
なのでこの関数がロードされていたから export コマンドが使えるということでした。

## まとめ

* なぜか fish で export コマンドが使える
* 実際には export コマンドでは無く function
* fish は $fish_function_path 配下のfunctionを自動で読み込む、export functionはこの配下にあるfunctionなのでコマンドとして使えた。

## 残っている謎

もしご存知でしたら Issues や Twitterなどで教えて欲しいです。

### Cargo の Issue はなんだったのか

Git History をみてみるとこの機能は2014年からあるようです。
export が使えることが言及されていてもいいのに言及されていないのが気になりました。
もしかしてこの設定がOffになっている環境もあるのでしょうか。
例えば brew 以外の方法で入れたら異なる結果になったり Mac以外を使った場合などはそうなのでしょうか。

### どうして公式Docで言及していないのか

公式が配布している設定なので公式に言及があると思っていました。
むしろ公式にはexport は使えないからsetを使おうとあります。