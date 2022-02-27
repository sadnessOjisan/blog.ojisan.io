---
path: /jq-get-dep
created: "2022-02-28"
title: package.json から依存部分の key だけを抜き出す jq ワンライナー
visual: "./visual.png"
tags: ["jq", "package.json"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## 何をしたいか

別プロジェクトで作った package.json の依存部分を使いまわしたいけど、それの最新バージョン版が欲しいことがあると思います。具体的には、package.json から `npm i hoge` と `npm i -D hoge` を生成してくれるものが欲しいです。以前に OCaml で json parse して最新用の `npm i` コマンドを出力するコマンドラインツールを作ったことがあったのですが、それを他の環境に入れるのがめんどくさくなってきたので別の方法を考えたいです。OCaml で作ったのは「クロスコンパイルできて Mac には brew tap 経由で入れられるから」という理由なのですが、Mac の環境を作るたびに自作コマンドをいちいち入れるのがめんどくさくて別の方法を探していました。そこで私は jq は必ず入れるコマンドにしているので jq 経由で該当のコマンドを出力できるように考えてみます。

## 結論

```
$  cat package.json | jq -r ".dependencies | keys[]" | tr '\n' ' '

> gatsby gatsby-image gatsby-plugin-canonical-urls gatsby-plugin-feed gatsby-plugin-google-analytics gatsby-plugin-image gatsby-plugin-manifest gatsby-plugin-react-helmet gatsby-plugin-sass gatsby-plugin-sharp gatsby-plugin-sitemap gatsby-plugin-typegen gatsby-remark-autolink-headers gatsby-remark-copy-linked-files gatsby-remark-images gatsby-remark-prismjs gatsby-remark-table-of-contents gatsby-source-filesystem gatsby-transformer-remark gatsby-transformer-sharp prismjs react react-dom react-helmet sass

$ cat package.json | jq -r ".devDependencies | keys[]" | tr '\n' ' '

> @types/react @types/react-dom @types/react-helmet @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-plugin-react eslint-plugin-simple-import-sort firebase-tools gatsby-plugin-robots-txt prettier ts-node typed-css-modules typescript
```

## 説明

### -r

`--raw-output` の略で、ダブルクオーテーションを取り除きます。

### keys[]

key の一覧を出力します。
keys は key を配列として取り出しますが、`[]` をつけることでそれを展開することができます。

### tr '\n' ' '

keys[] で出力すると、

```
@types/react
@types/react-dom
@types/react-helmet
@typescript-eslint/eslint-plugin
@typescript-eslint/parser
eslint
eslint-plugin-react
eslint-plugin-simple-import-sort
firebase-tools
gatsby-plugin-robots-txt
prettier
ts-node
typed-css-modules
typescript
```

という風に出力されてしまうので、`npm i` をつけるためにはすべての改行を消す必要があります。
それをするのが `tr '\n' ' '` です。 `tr` は `jq` と関係なく、文字列を置換する Unix のコマンドです。
