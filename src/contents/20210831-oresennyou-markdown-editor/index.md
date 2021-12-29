---
path: /oresennyou-markdown-editor
created: "2021-08-31"
title: 俺のための Markdown Editor をデプロイする
visual: "./visual.png"
tags: ["Markdown", "Rust", "yew"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

オンラインで使える Markdown Editor が欲しいです。
使い捨てのメモを書いたり、会議の時に何話すかを考えたりするのに使いたいです。
そしてそれは、ブラウザで開けるものであって欲しいです。
ブラウザは常に開いているアプリケーションだし、アプリケーションの更新やインストールも不要で手軽だからです。

てなことを言うと、「VSCode もずっと開いてるじゃん、そこにメモを書けばよくね」と言われそうなのですが、VSCode に対してはどうも手癖で cmd + s で保存する癖があり、新規作成のファイルに対してそれをやるとフォルダを選ばせる finder が出てきて作業が止まるので無しです。なのでブラウザで開ける Markdown Editor が欲しいです。

もちろんオンラインの Markdown Editor はすでに存在していて、特に [mdbuf](https://mdbuf.netlify.app/) はずっと使い続けています。
開発者のためにちょうどいい機能だけで成り立っていて、パフォーマンスもよくて文句のつけどころがないので、ずっと使い続けてます。
とはいえ無理やり文句をつけると、会社の中で話したメモとかを書き込んでいいのかって思っています。
mdbuf は コードは公開されているし、作者も悪い人ではないので裏で何か情報を盗んでるといったことはしていないのですが、

- Analysis 系のものが入って悪さをしないか？
- デプロイ先が何か監視 script を挟まないか？
- ある日突然、作者が闇落ちしないと言い切れるか？

ということが心配になってきました。なので、オンラインで使う Markdown Editor は自分で作ってホスティングしておくことにしました。

<https://freemarkdown.web.app>

「え、スタイリングも機能も適当すぎないか？」だって？自分専用なので許して欲しいです。

## 技術的な話

やってることは md -> html をしているだけなので書くことは特にないのですが、無理やり書きます。

### Rust のみで実装

WebAssembly を使った MD エディタはすでに何個か出ていましたが、変換のみ wasm でそれを JS から呼び出して使うみたいな使われ方がほとんどでした。なので全部 Rust だけで完結させました。といっても yew + pulldown_cmark を入れただけですし、パフォーマンスは落ちている様な気がする（VDOM を経由していますし・・・）ので、嬉しかったことは特に思いつかないです。

### trunk を使った

yew は少し前のバージョンでは、wasm-pack が推奨されていたのですが、今見ると trunk というツールが推奨されていました。

trunk 自体が serve も build も行ってくれ、HMR もあるので開発体験はよかったです。でもデプロイは少しめんどくさかったです。trunk のコマンドが CLI なためです。(wasm-pack も同じでしたがあれはバイナリ落とすだけでよかったのでハマるところはなかったはずです。)

なので次の様な workflow を書いてお茶を濁しました。

```yaml
name: Deploy to Firebase Hosting on merge
"on":
  push:
    branches:
      - main
jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          target: wasm32-unknown-unknown
      - name: Install
        run:
          wget -qO- https://github.com/thedodd/trunk/releases/download/v0.13.1/trunk-x86_64-unknown-linux-gnu.tar.gz | tar -xzf- &&
          sudo mv trunk /usr/bin/
      - run: trunk build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: "${{ secrets.GITHUB_TOKEN }}"
          firebaseServiceAccount: "${{ secrets.FIREBASE_SERVICE_ACCOUNT_FREEMARKDOWN }}"
          channelId: live
          projectId: freemarkdown
```

wasm32-unknown-unknown の install と、`sudo mv trunk /usr/bin/` でコマンドにパスを通せば CD 環境でも動くはずです。

## yew で dangerouslySetInnerHTML を実現する

そんなものはない。

FYI: <https://github.com/yewstack/yew/issues/182>

とはいえ、書いた Markdown の preview 機能 は必要でした。
なので、web-sys の set_inner_html 経由で無理やり埋め込みました。

```rust
let parser = Parser::new_ext(markdown_input, options);

let mut html_output: String = String::with_capacity(markdown_input.len() * 3 / 2);
md_html::push_html(&mut html_output, parser);

let div = web_sys::window()
    .unwrap()
    .document()
    .unwrap()
    .create_element("div")
    .unwrap();
div.set_inner_html(&html_output);
let node = Node::from(div);
let vnode = VNode::VRef(node);
```

## まとめ

てなわけで出来上がった エディタはこれです。

<https://freemarkdown.web.app/>

裏で通信とかしておらずソースコードも公開されている安全な Markdown エディタですが、皆様は使わない方が良いと思います。
僕が闇落ちしない保証はないので・・・

ソースコードはこちらです。

<https://github.com/sadnessOjisan/free-markdown>
