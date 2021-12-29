---
path: /neovim-config
created: "2021-08-09"
title: Neovim の設定を lspconfig + treesitter ベースにした
visual: "./visual.png"
tags: ["Vim"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

最近例のアレをバシーンしたのですが、接種後のダウン期間があまりにもベッドから起き上がれなかったため、布団にくるまって Vim 系 Youtuber や dotfiles 系 Youtuber を見て時間を潰していました。
記憶が曖昧なのですが、確かこういうのを見ていた気がします。

- <https://www.youtube.com/watch?v=NXysez2vS4Q>
- <https://www.youtube.com/watch?v=FW2X1CXrU1w>
- <https://www.youtube.com/watch?v=P9jB7mz2Ax4>

これらを見ているとどうもイマドキの設定には新しいプラグインがあると分かりました。
ところで僕は来月に就職するため社用 PC のセットアップを見据えており、Vim の設定をこれを気に新しくしようと思いちょっといじってみました。

## 注意

僕は VSC が動かなくなった時にのみ Vim を使っているので、そういう人が書いたものであることを差し引いた上で読んで欲しいです。設定において一番重視しているのはファイルの薄さなので、きっと設定は真似しない方が良いです。

## これまでの設定

エディタは VSCode をメインで使っているので補完は LSP に頼っており様々な Language Server をインストールしています。
なので LSP Client を Vim にも求めていました。
LSP Client は Vim にもたくさんあったのですが、いろいろな人から勧められていたこともあって [coc.neovim](https://github.com/neoclide/coc.nvim) を使っています。
設定は <https://github.com/neoclide/coc.nvim#example-vim-configuration> にあるものをそのまま使っていました。
実際のところは gd と K くらいしか使っていなかった気がしますが。

また syntax highlignt には [yajs](https://github.com/othree/yajs.vim) を使っていました。これは特にこだわりがなく、なんかググった時に出てきたから入れたくらいの温度感です。

## 新しい設定

### LSP の設定

どうやら最新の Neovim(0.5~) には本体に LSP Client が備わったようなので、それを使います。

その LSP Client を使うためには、各言語の設定が必要となります。
その設定を読み込むための Plugin が公式から出ているのでそれを使います。

<https://github.com/neovim/nvim-lspconfig>

```
Plug 'neovim/nvim-lspconfig'
```

ビルトイン LSP Client が使える Neovim のバージョンなら Lua が使えるらしいので、Lua で設定を書いていきます。

```
"""""""""""""""""""
" nvim-lspconfig
"""""""""""""""""""
lua << EOF
lspconfig = require'lspconfig'

local completion_callback = function (client, bufnr)
        vim.api.nvim_buf_set_keymap(bufnr, 'n', 'K', '<cmd>lua vim.lsp.buf.hover()<CR>', {noremap = true, silent = true})
        vim.api.nvim_buf_set_keymap(bufnr, 'n', 'gd', '<cmd>lua vim.lsp.buf.definition()<CR>', {noremap = true, silent = true})
        vim.api.nvim_buf_set_keymap(bufnr, 'n', 'gi', '<cmd>lua vim.lsp.buf.implementation()<CR>', {noremap = true, silent = true})
        require('completion').on_attach(client)
end

EOF
```

これで定義ジャンプとインスペクトへのキーマップを設定 + 補完自体の設定をする関数を定義しました。
また coc と同じく ctrl + o で定義ジャンプから戻れます。

そしてこれを各言語の Language Server と紐づけます。

```
lspconfig.tsserver.setup{on_attach=completion_callback}
lspconfig.rust_analyzer.setup{on_attach=completion_callback}
lspconfig.ocamllsp.setup{on_attach=completion_callback}
```

各言語の Language Server はその言語の環境を作った時に手に入るか、各言語のパッケージマネージャから入手できることが多いです。

これで Vim で LSP の機能を呼び出す設定は完了しました。

### 補完の設定

Neovim の builtin LSP Client で使われることを前提とした補完エンジンに [completion-nvim](https://github.com/nvim-lua/completion-nvim) というのがあるのでこれを使います。正直なところこれを入れなくてもオムニ補完で LSP 経由の補完を呼び出せるのですが、自動で候補が出た方が VSCode の体験は出るよなと思って入れました。

```
Plug 'nvim-lua/completion-nvim'

""""""""""""""""""""
" completion-nvim
"""""""""""""""""""
" Set completeopt to have a better completion experience
set completeopt=menuone,noinsert,noselect

" Avoid showing message extra message when using completion
set shortmess+=c

let g:completion_enable_auto_popup = 1
imap <tab> <Plug>(completion_smart_tab)
imap <s-tab> <Plug>(completion_smart_s_tab)
```

### LSP のキーバインドと補完設定の両立

もしかすると lspconfig と completion-nvim の設定を別々で調べると、キーバインドの設定と補完の設定方法の両立に悩むかもしれません。
それは両方の設定を LSP Server に渡すコールバックの中に書いてしまえばうまく設定できます。

```
local completion_callback = function (client, bufnr)
        vim.api.nvim_buf_set_keymap(bufnr, 'n', 'K', '<cmd>lua vim.lsp.buf.hover()<CR>', {noremap = true, silent = true})
        vim.api.nvim_buf_set_keymap(bufnr, 'n', 'gd', '<cmd>lua vim.lsp.buf.definition()<CR>', {noremap = true, silent = true})
        vim.api.nvim_buf_set_keymap(bufnr, 'n', 'gi', '<cmd>lua vim.lsp.buf.implementation()<CR>', {noremap = true, silent = true})
        require('completion').on_attach(client)
end
```

### syntax highlight の設定

[nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter) を使います。

treesitter 自体は各言語に対応した parser generator で、nvim-treesitter はそれを nvim から呼び出せるようにしてくれるツールです。
そのため nvim-treesitter 自体は syntax highlight をすることを目的としたライブラリではありませんが、基本機能の一つとして提供してくれています。
treesitter 自体が他の汎用的なパーサーライブラリと比較して優れていることや、nvim-treesitter を入れると単体で各言語の syntax highlight が済むというのが、このプラグインの強みな気がしたので、使うことにしました。

```
Plug 'nvim-treesitter/nvim-treesitter', {'do': ':TSUpdate'}" We recommend updating the parsers on update

""""""""""""""""""""
" treesitter
"""""""""""""""""""
lua <<EOF
require'nvim-treesitter.configs'.setup {
  ensure_installed = "maintained", -- one of "all", "maintained" (parsers with maintainers), or a list of languages
  highlight = {
    enable = true,              -- false will disable the whole extension
  },
}
EOF
```
