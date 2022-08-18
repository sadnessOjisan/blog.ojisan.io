---
path: /my-netrw-configure
created: "2022-08-19"
title: netrw の設定
visual: "./visual.png"
tags: ["vim", "netrw"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

OGP は適当。なんで適当かは秘密。飲み会とかで聞いて。

## netrw とは

Vim 標準のファイラ。

```vim
set nocp
filetype plugin on
```

で使えるようになる。

詳しくは https://vim-jp.org/vimdoc-ja/pi_netrw.html

## なぜ netrw を使っているのか

一言で言うと、公式や標準以外のものが嫌いだからです。とはいえ「特に Vim においてはプリセットなものをそのまま使うのは不便なのでは」という指摘はあるだろうし、事実そうです。なので今日はそれを使いやすくするための設定をしていきます。

## 使いやすい設定とは

### NERDTree が使いやすかった

自分が一番使いやすいファイラは VSCode のもので、ファイル操作、ペインの表出管理が気に入っています。
VSCode の体験を提供してくれたものが[NERDTree](https://github.com/preservim/nerdtree) でした。
ctrl + t でペイン表示を切り替えたり、ツリーの移動も直感的にしやすく、ファイル操作もできました。

### netrw 標準だと何が使いにくいか

一方で素の netrw だとそういったことが難しかったです。ディレクトリ削除はできないケースがあったり、ツリー表示されていなかったり、左ペインにツリー出しにくいし、`:Ex` とか打たないとダメだったり、なんか変なバナー 表示されるし。

というわけでそういう悩みをしなくていいように設定を書きましょう。

## 設定

はい。

```vim
" netrw
set nocp                    " 'compatible' をオフにする
filetype plugin on          " プラグインを有効にする
let g:netrw_preview=1 " preview は左右分割表示
let g:netrw_liststyle=3 " tree表示
let g:netrw_keepdir = 0 " tree開いた位置を current dir として扱う。その階層でファイル作成とかができるようになる
let g:netrw_banner = 0 " 上のバナー消す
"window サイズ
let g:netrw_winsize = 25
let g:netrw_browse_split = 4

"Netrw を toggle する関数を設定
"元処理と異なり Vex を呼び出すことで左 window に表示
let g:NetrwIsOpen=0
function! ToggleNetrw()
    if g:NetrwIsOpen
        let i = bufnr("$")
        while (i >= 1)
            if (getbufvar(i, "&filetype") == "netrw")
                silent exe "bwipeout " . i
            endif
            let i-=1
        endwhile
        let g:NetrwIsOpen=0
    else
        let g:NetrwIsOpen=1
        silent Vex
    endif
endfunction

"ショートカットの設定
"ctrl + e でtoggle
noremap <silent><C-e> :call ToggleNetrw()<CR>
```

toggle の部分は https://issueoverflow.com/2019/11/22/set-vim-netrw-like-nerdtree/ から持ってきました。
