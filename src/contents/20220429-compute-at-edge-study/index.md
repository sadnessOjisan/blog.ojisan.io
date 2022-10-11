---
path: /compute-at-edge-study
created: "2022-04-29"
title: Fastly Compute@Edge の勉強 (JS)
visual: "./visual.png"
tags: ["javascript", "fastly", "c@e"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

GW に C@E で ちょっとしたアプリケーションを作ろうとしているのでお勉強。
C@E そのものの勉強のために一番自分が得意な言語である JS を使う。
まだ勉強したばかりで中身は薄いがそこは許してください。
GW 明けには濃いのを書きたい。

## C@E とは

Fastly は CDN を提供している会社で、同名の CDN サービスを展開している。
高速なキャッシュパージや VCL による拡張が容易（※作業は難しい）で、広く使われている。
その中でも C@E は Fastly 社の製品でエッジコンピューティングを実現するものである。

FYI: <https://www.fastly.com/jp/products/edge-compute/serverless>

これが何かという説明は正直苦手で、C@E 上で で ML したり GraphQL サーバーを建てる人がいるせいで、CDN とサーバーレスとエッジコンピューティングの違いが正直分からなくなっているのだが、要はエッジで何か実行してくれるものである。

FYI: <https://hack.nikkei.com/blog/advent20211206/>

C@E の特徴としては公式には

> WebAssembly: 再利用可能なコンテナなど、サーバーレスコンピューティング向けの既存のテクノロジーを利用することも可能でしたが、そのようなアプローチではパフォーマンスやスケーラビリティが制限されてしまいます。そこで、WebAssembly ベースのサーバーレスコンピューティングプラットフォームを構築することにしました。WebAssembly は、Fastly が Bytecode Alliance と共に取り組んでいるテクノロジーです。WebAssembly を使用することで、好みの言語でコードを作成し、そのコードをネイティブに近い速度でどの環境でも実行できるようになります。

> Lucet: 通常 WebAssembly 上でコードをコンパイルして実行するのに Chromium V8 エンジンが使用されますが、レイテンシが大幅に増加するという欠点があります。そこで、コールドスタートの時間を排除するため、Lucet と呼ばれるコンパイラとランタイムで構成される独自のエンジンを構築しました。起動時間がわずか 35.4 マイクロ秒の Lucet は、コールドスタートや往復の遅延を排除し、超高速なコードの実行を実現します。これにより、高速かつ常時オンのコンピューティングが可能になります。

> 隔離されたサンドボックス: 分散化されたエッジコンピューティングでは、ロジックを複数のアプリケーションで同時に実行する必要があるため、脆弱性やリソースの競合が発生する可能性があります。この問題に対応するため、Fastly のプラットフォームを通過する各リクエストを作成し、破棄する安全なサンドボックス環境を構築しました。数マイクロ秒で処理を行うこの最先端のテクノロジーにより、攻撃可能な領域を縮小し、サイドチャンネル攻撃を排除しながら、開発者が安心してイノベーションに取り組める、より安全な環境を提供します。

とある。

FYI: <https://www.fastly.com/jp/edge-cloud-network/serverless>

ただ、repository や blog を見ていると、lucet は開発が終了していて、wasm runtime としていまは wasmtime が使われるらしい。

FYI: <https://github.com/bytecodealliance/lucet#lucet-has-reached-end-of-life>

FYI: <https://www.fastly.com/jp/blog/meet-the-next-iteration-of-javascript-on-compute-edge>

（昔、Inside Frontend っていうイベントに登壇して、そのときに Fastly の人が Lucet の話をしていたのだが当時は wasm なんてものは 1mm も知らなかったので何も理解できず、「かっこいいな〜いつかこういうこと理解したいな〜」みたいな漠然な憧れを抱いたのに、いざ勉強しようとしたら開発終了していたのである。悲しい。）

FYI: <https://www.dropbox.com/s/dc728ozpa3vpjiy/Introduction%20to%20Lucet%20-%20Inside%20Frontend%202019%20%28Shared%20Version%29.pdf?dl=0>

ようするにエッジで wasm が動くのである。これが他のエッジコンピューティング競合と比べて大事だと思っていて、言語選択の幅やテスト容易性やセキュリティの面で強みになっていると思う。

## C@E の仕組み / C@E の周辺エコシステム

本当は別の章に分けて書きたかったが仕組みについて調べれば調べるほど泥沼にはまっていったのでやめる。
C@E は wasm が動くので手元に

- JS -> wasm のコンパイラ
- デプロイ成果物に対するテストツール
- Fastly CLI

を置く。

### js-compute-runtime

C@E は wasm をデプロイするので、JS を使っている場合は JS -> wasm の変換をする必要がある。少し前の[ブログで javy について紹介した](https://blog.ojisan.io/why-javy/) がそういうものが必要になるのである。Fastly の場合は js-compute-runtime が使われる。

FYI: <https://github.com/fastly/js-compute-runtime>

javy は wasi-sdk + wizer + QuickJS であったが、js-compute-runtime は wasi-sdk + wizer + SpiderMonkey だ。
SpiderMonkey をそのまま入れるとサイズや起動のコストでもろもろ不利な気もするのだが、事前に wizer を通すから問題ないのだろうか（実用されているので問題ないと思う）。深く読んでいこうとしたが、SpiderMonkey がそのまま出てきたり Rust 側のバインドを見つけられず途中からコードを読めなくなったので断念した。(C++ と Makefile なんもわからん)(さも Rust なら読めるみたいな書き振りだが、Rust も読めない)

### viceroy

viceroy は `C@E` をローカルで動かせるツールだ。

FYI: <https://github.com/fastly/Viceroy>

fastly の CLI には serve コマンドがあり、localhost で C@E を検証できるツールが同梱されているのだが、そのときに呼ばれるものだ。

手元で検証できるという点でも嬉しいが、これがあることで書いたロジックの結合テストが可能になる。エッジなどの middlebox は 入力と出力を持つので、これに対する一気通貫のテストがあれば整合性を担保できる。人はエッジ上でリクエストヘッダをいじくり回して破壊し続けるのでテストは欲しいのである。

使った感想だが、wasm って本当に良いなと気持ちにさせられた。
何言語が入力であろうが wasm 化すれば viceroy で検証できるし、エッジと同じ wasm runtime を使っていれば本番環境と同じ環境で検証やテストができるのである。
正直これまでの人生で wasm に対してメリットを理解はしているものの嬉さの実感はなかったが、「なかなか良いな」という感情になった。

とはいえ fastly.toml やコンパネでの設定に影響される部分も多く、ローカルと開発環境と本番環境はなかなか一致しなかったりもするので、これがあるから全環境同じように検証できるとまでは思わない方が良いだろう。

### Fastly CLI

プロジェクトの scaffold や 検証環境の立ち上げ、デプロイをしてくれる。
中で wasm-js-runtime や viceroy が動いているのである。
brew で install できる。

FYI: <https://github.com/fastly/cli>

初期セットアップ時(`fastly compute init`)に JS を指定して install すれば wasm-js-runtime も viceroy も勝手に降ってくる。

## 試してみる

早速試してみる。init コマンドで生成されるコードはこちら。

```js
//! Default Compute@Edge template program.

import welcomePage from "./welcome-to-compute@edge.html";

// The entry point for your application.
//
// Use this fetch event listener to define your main request handling logic. It could be
// used to route based on the request properties (such as method or path), send
// the request to a backend, make completely new requests, and/or generate
// synthetic responses.

addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));

async function handleRequest(event) {
  // Get the client request.
  let req = event.request;

  // Filter requests that have unexpected methods.
  if (!["HEAD", "GET"].includes(req.method)) {
    return new Response("This method is not allowed", {
      status: 405,
    });
  }

  let url = new URL(req.url);

  // If request is to the `/` path...
  if (url.pathname == "/") {
    // Below are some common patterns for Compute@Edge services using JavaScript.
    // Head to https://developer.fastly.com/learning/compute/javascript/ to discover more.

    // Create a new request.
    // let bereq = new Request("http://example.com");

    // Add request headers.
    // req.headers.set("X-Custom-Header", "Welcome to Compute@Edge!");
    // req.headers.set(
    //   "X-Another-Custom-Header",
    //   "Recommended reading: https://developer.fastly.com/learning/compute"
    // );

    // Create a cache override.
    // let cacheOverride = new CacheOverride("override", { ttl: 60 });

    // Forward the request to a backend.
    // let beresp = await fetch(req, {
    //   backend: "backend_name",
    //   cacheOverride,
    // });

    // Remove response headers.
    // beresp.headers.delete("X-Another-Custom-Header");

    // Log to a Fastly endpoint.
    // const logger = fastly.getLogger("my_endpoint");
    // logger.log("Hello from the edge!");

    // Send a default synthetic response.
    return new Response(welcomePage, {
      status: 200,
      headers: new Headers({ "Content-Type": "text/html; charset=utf-8" }),
    });
  }

  // Catch all other requests and return a 404.
  return new Response("The page you requested could not be found", {
    status: 404,
  });
}
```

正直なところ、解説も書かれていてそれをみたらいいので解説は不要に思われる。

リクエストに対してヘッダを書き換えてオリジンに送ったり、オリジンからのレスポンスを加工してクライアントに返している。

welcomePage は HTML ファイルだが、もちろんここを JSON 文字列にして Content-Type を application/json にすると JSON も返せる。

backend_name は GUI で Host を指定して、その host name にしなければいけない。またローカルで動かすときはそのホスト名を fastly.toml で指定しなければいけない。そのためにはこのような設定を書く。

```
[local_server]
  [local_server.backends]
    [local_server.backends.cloudrun]
      url = "https://example.com"
```

こうすることでアプリケーションからはローカルでも cloudrun という名前の backend_name を使えるようになる。

あとログの出し方はよくわからなかった。GUI でぽちぽち選んでログの送り先を決めて連携したりしたがちゃんと吐かれなかった。
Fastly は VCL を書く以外のフェーズはすでに歴代の先輩や同僚がやっているので経験値がない。

## まとめ

簡単にセットアップできるかと思ったらいろいろなところでハマった。苦戦したブログなども上がってなくて参考にできなかったので、まずは自分が苦戦したブログをたくさん書いていきたい。
