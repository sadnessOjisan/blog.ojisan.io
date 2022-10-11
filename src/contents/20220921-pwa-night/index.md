---
path: /pwa-night
created: "2022-09-21"
title: React + Rust + Wasm でオンラインモザイクツールを作る
visual: "./visual.png"
tags: ["slide", "rust", "wasm"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

このエントリは [PWA Night vol.43 ～ Web 技術でここまで出来る〜](https://pwanight.connpass.com/event/258205/) のスライド資料です。

テキストやリンクの都合上、試験的にブログで資料共有してみようと思います。

この回では [umie](https://umie.ojisan.dev/) を作った話をしました。成果物のレポジトリは [こちら](https://github.com/sadnessOjisan/umie) です。

![slide](./01.png)

「React + Rust + Wasm でオンラインモザイクツールを作る」という題で発表します。

![slide](./02.png)

こんにちは、[sadnessOjisan](https://twitter.com/home) です。おじさん、おじさんさんなどと呼ばれることが多いです。Web 系のエンジニアで、普段は React や NodeJS を書いています。[blob.ojisan.io](https://blog.ojisan.io/) というブログも書いていて技術や料理の話をしています。よければ読んでみてください。

![slide](./03.png)

[Umie](https://umie.ojisan.dev/) というモザイクツールを作りました。これはただのモザイクツールですが、ウェブ上で動きます。実はウェブ上でモザイクをかけられるツールは意外となくて、出先でモザイクをかけたいときに欲しくなって作りました。Wasm 実装です。

![slide](./04.png)

ちなみに Umie という名前は [神戸モザイク](https://umie.jp/) から取っています。

![slide](./05.png)

さて、今日ここにきた理由ですが、以前ブログに[Rust でモザイク加工を実装し、それを WebAssembly として Web アプリから利用する](https://blog.ojisan.io/rust-mosaic-web-app/) というブログを書いたことがあって、それを読んでのお誘いでした。

![slide](06.png)

で、承諾したのですが、何を話すかはかなり悩んでいまして、というのも Wasm 使わなくてもいいような内容だし、実は CSS でも実現できてしまいます。

![slide](07.png)

そこで、おそらく普段 Wasm など触れない方や興味がある方が集まっていると思ったので、Rust や Wasm そのものの話をしつつ、作ったものの紹介ができたらいいなと思います。

![slide](08.png)

MDN からの説明をそのまま持ってきただけですが、wasm とは [MDN](https://developer.mozilla.org/ja/docs/WebAssembly) によると

- WebAssembly は現代のウェブブラウザーで実行できる新しい種類のコード
- ネイティブに近いパフォーマンスで動作
- C/C++、C# や Rust などの言語のコンパイル先
- JavaScript と並行して動作するように設計されている

ものです。

![slide](09.png)

Wasm の出力には [Rust](https://www.rust-lang.org/ja) を使います。

Rust 言語は mozilla が作ったプログラミング言語です。
各種ネイティブ環境と Wasm に対してコンパイルができます

特徴としては GC がないこと、代わりに borrow checker というものを使ってメモリの安全性を保証します。

![slide](10.png)

ただそれら特徴はフロントエンドから見るとあまり恩恵をうけないかもしれません。そこでフロントエンドエンジニアからみた嬉しさを紹介します。

![slide](11.png)

まず Rust にはプログラミング言語それ自体に Result や Option が組み込まれています。

Result や Option は失敗するかもしれない、空かもしれないという文脈を表す型です。

これは、例外を投げていた関数に対して、その例外に関する型を付けられるようになるという利点があります。
そのため例外のハンドリングが網羅的にされているかどうかという検査ができるようになります。

この機能が標準ライブラリに入ることで、いろんなライブラリを跨いで Result を扱う関数の組み合わせがしやすくなります。例えば TypeScript では [zod の safeParse](https://github.com/colinhacks/zod#safeparse) のような関数が独自の Result を返してくれてはいるのですが、合成や組み合わせは難しいです。

![slide](12.png)

次に紹介するのは式志向です。

プログラミングには式と文があると思います。式は値を返すもの、文は何か処理を行うものです。

Rust は式志向なので if や while も結果が値にできます。

これが何が嬉しいかというと JSX の中に制御構文をそのまま描けるようになります。

![slide](13.png)

次に紹介するのは型のごまかしについてです。

ここでいうごまかしは any , ts-ignore, as などです。
TypeScript は簡単に推論を潰せてしまいます。

一方で Rust では検査を強行突破するのにも手間がかかります。
書けば推論を通せる魔法がないのです。

![slide](14.png)

Rust では外部境界から Rust の世界に入る境界で型が付きます。
SQL, Reqest から Rust の世界に値が来るときに、ライブラリが Deserialize を要求することが多いです。正当な値と型を保証しないとコンパイルが通りません。

型の誤魔化しが難しいので推論結果を信用できると思います。
そのため Rust で書かれた バックエンド は、データソースからルーターまでに到達するデータ・レスポンスは型がついていると考えられます。
おかげで OpenAPI Spec や proto や gql の定義通りに値を返すことが保証されます。
どうしてこれを取り上げるかというと、言語によってはスキーマ駆動でしてもスキーマを無視した実値を返せてしまい、それを稀によく見るからです。
そういう経験があるからこそ、Rust が好きです。

![slide](15.png)

ここまで挙げたことから分かる通り、僕が Rust が好きな理由はパフォーマンスではありません。一般的に Rust は安全にパフォーマンスを発揮できるという面で注目されますが、僕はむしろパフォーマンス向上的な側面を使っておらず、Rust の良さを殺す使い方をしています。具体的にはヒープ領域に対するコピーをしまくるコードを書きまくっています。それでも Rust が好きです。

それは、JS / TS より機能が多く、制約が強いから、式指向、Result, match が欲しいといった理由です。

![slide](16.png)

Rust が好きなので、わざわざ Rust 使わなくてもいいような場面でよく使っています。

一つには [Syntax Highlight Battle](https://syntax-highlight-battle.ojisan.dev/) です。これは自分の好きなエディタテーマを２択に答え続けて探せるサービスです。Firebase の SDK に Rust がないので、firestore を gRPC で Rust から操作しています。癖がある API でしたが型がつくおかげで安全に作れました。

![slide](17.png)

次に紹介するのは [ご報告ブログ](https://gohoukoku.ojisan.dev/) です。これは婚活の結果を書いたブログです。
uhyo さんのブログを真似て黒塗りできるようにしました。
実現するために黒塗り用の言語を Rust の parser combinator で定義、Fastly C@E 上で wasm を動かして認可とキャッシュコントロールを実行し、認可ごとにキャッシュから黒塗り文書を返せるようにしています。

婚活の結果はお察ししてください。

![slide](19.png)

というわけで今回も Rust で書きました

![slide](20.png)

再掲ですが、Umie というモザイクツールを作りました。ただのモザイクツールですが、ウェブ上で動きます。実はウェブ上でモザイクをかけられるツールは意外となくて、出先でモザイクをかけたいときに欲しくなって作りました。Wasm 実装です。

![slide](21.png)

私が今回 wasm を今回使った理由は重たい処理だけを分離させられるからです。

画像編集はいわばバイト列の操作です。
画像は rgba 値が x,y に詰まったものと考えられるので配列と考えることができます。
この配列操作が画像編集そのものなので、この処理だけを wasm に切り出したいと思います。

![slide](22.png)

モザイクは画像をブロックに分割し、そのブロックの rbga 平均値でブロックを塗りつぶすことで実現できます。

ナイーブにするなら 4 重ループを回せばモザイクをかけられます。

![slide](23.png)

ちなみに配列操作を間違えると、とんでもないラーメンが出来上がります。

たしか割り算の分母を何かで間違えた結果がこれです。

![slide](24.png)

画像ファイルの正体はバイト列です。たとえば HTML でファイル取得してそれを [UInt8Array](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) などしたときに配列が入ったのをみたことがあるかもしれませんが、それがバイト列です。

このバイト列はその拡張子にあったパースをすることで rbga 情報を取り出せます。

そのパースは Rust 側でする方法と JS 側でする方法がありますが、どちらにせよ JS と Wasm の受け渡しはバイト列で行うので、言語を跨いで処理ができます。

![slide](25.png)

Rust 側で parse する場合は [image-rs](https://github.com/image-rs/image) を使うと良いでしょう。

これは画像周りの便利な処理をまとめてくれているクレートでパーサーが同梱されています。
![slide](26.png)

JS 側でパースする場合は canvas を使います。

ブラウザ には [ImageData](https://developer.mozilla.org/ja/docs/Web/API/ImageData) というものがありこれはすでに RGBA 値情報として解析されたものです。これは canvasContext.getImageData から作ることができます。

今回はこの Canvas を使います。

![slide](27.png)

さて、モザイクを作る方法はわかりました。ではこれを Wasm として読み込む方法を見てみましょう。

Wasm はブラウザに生えている WebAssembly オブジェクト経由で読み取れます。

[instaitiate()](https://developer.mozilla.org/ja/docs/WebAssembly/JavaScript_interface/Instance) というメソッドが生えているのでこれを使います。

![slide](28.png)

その Wasm は [wasm_bindgen](https://github.com/rustwasm/wasm-bindgen) から作ります。

これはマクロと CLI を提供しており、コンパイルすることで wasm とそのグルーコードの JS を生成してくれます。

![slide](29.png)

ただ、Wasm にコンパイルするためには Rust 側が JS の型を知る必要があるときもあります。その型は web_sys というクレートが提供しています。

これは [WebIDL](https://developer.mozilla.org/ja/docs/Glossary/WebIDL) から生成されています。<https://searchfox.org/mozilla-central/source/dom/webidl/> で定義されています。

![slide](30.png)

これで wasm を作れますが、実際には wasm_bindgen CLI をラップした [wasm-pack](https://rustwasm.github.io/wasm-pack/) というライブラリを使うことが多いのでこれを採用します。

MDN でも利用が前提とされているようなデファクトなツールです。

![slide](31.png)

wasm-pack にはテンプレートがあり、`wasm-pack new` したものでプロジェクトを始められますが、今回は使いません。

それは webpack を前提としたコードが作られるのですが、React を前提としたら自前で設定する必要があり、vite に寄せたかったからです。

また DOM 操作も Wasm ですることが前提のコードが生成されるのも気に食わなかったです。

![slide](32.png)

僕は Wasm から DOM を触ることは避けています。
Wasm を使うと高速化するとも言いますが、DOM 操作は DOM API を呼び出すだけなので高速化にならないと思っています。また基本的に unwrap にまみれたコードになるのも違和感が強くあまり使いたくないです。やはり UI は React で書きたいです。

![slide](33.png)

というわけで vite + react + ts で UI を作ります。

このとき Wasm は wasm_bindgen のおかげで単一の関数として import できます。

![slide](34.png)

React と Rust の共存は少しめんどくさいです。

僕はフォルダを分けました。

その上で wasm-pack で Rust 側をビルドし、その成果物を JS 側にコピーして wasm を読み込んでいます。

ただし開発フローとしてはめんどくさいです。

![slide](35.png)

そこでビルドを自動化しました。

ローカルの場合は [cargo-make](https://github.com/sagiegurari/cargo-make) でビルドしています。これは cargo-workspace を前提としたワークフローです。

本番環境の場合は GithubActions で自動化しています。artifact 経由で wasm を持ってきています。

![slide](36.png)

umie の今後の展開としては範囲モザイクをできるようにする予定です。矩形から始めますが、いつかは投げ縄を実装したいです。ただこれは良い実装方法が全く思いつかなくて困っています。助けて欲しいです。

また image-rs を剥がすことも検討しています。いまピクセルの置き換えのために使っていますが、それだけであれば配列操作としてできるからです。また canvas の ImageData も使わずに Rust 側でパースさせることも考えています。同じ処理なら Rust を使った方が早いと思います。ただこれは png などのパーサーを自作する必要があるので少し頭を悩ましています。頑張ります。

![slide](37.png)

今日の成果物は <https://github.com/sadnessOjisan/umie> です。PR などお待ちしています。
