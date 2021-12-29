---
path: /gatsby-dsg-fastly
created: "2021-12-07"
title: Gatsby の DSG を Fastly で実現する
visual: "./visual.png"
tags: ["Gatsby", "Fastly"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

Gatsby の DSG を Gatsby Cloud 以外で使う方法の紹介です。
この記事は [sadnessOjisan Advent Calendar 2021](https://adventar.org/calendars/7015) 7 日目の記事です。

## DSG とは

Gatsby などの SSG の弱点の一つに、コンテンツがあまりにも増えすぎるとビルド時間がとてつもなく伸びて使いものにならなくなるというものがあります。

これを解決するために、Gatsby には Incremental Builds という逃げ道は用意されていますが、本質的な解決法ではなく結局は従来の DB ドリブンなアプローチを採用し、SSR をするのが解決策となります。

しかし SSR も SSR で問題があり、TTFB が犠牲になりやすいです。それに対する NextJS の回答が ISR な訳ですが、そのような機能が Gatsby も v4 で登場しました。

これはビルド時に静的ビルドするパスを指定できて、指定しなかったパスは SSR して提供するという仕組みです。この DSG には特筆すべき点があり、gatsby cloud にデプロイすれば、SSR したページはキャッシュし、次のアクセスからはそのキャッシュを使ってレスポンスします。しかし、Gatsby Cloud を使わない場合はただの SSR になってしまうので、Gatsby Cloud 専用の機能です。そこで自力で SSR 時に Cache-Control Header を設定して CDN 上でこの DSG を実現してみましょう。

余談ですが、SSG や Gatsby には一家言があるので JSConfJP に申し込みました。これがその時のスライドです。

<iframe class="speakerdeck-iframe" frameborder="0" src="https://speakerdeck.com/player/a098fcd04ea94eaca743cd1779b60087" title="SSG is a compiler" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true" style="border: 0px; background: padding-box padding-box rgba(0, 0, 0, 0.1); margin: 0px; padding: 0px; border-radius: 6px; box-shadow: rgba(0, 0, 0, 0.2) 0px 5px 40px; width: 560px; height: 314px;" data-ratio="1.78343949044586"></iframe>

宣伝おわり

## Gatsby の SSR 時における HTTP Response Header の設定

Gatsby は Page Component で

```js
export async function getServerData(context) {
  return {
    status: 200, // The HTTP status code that should be returned
    props: {}, // Will be passed to the page component as "serverData" prop
    headers: {}, // HTTP response headers for this page
  };
}
```

とすれば、そのページの SSR のレスポンスヘッダや初期 state を埋め込めます。
まるで NextJS の getServerSideProps のようですね。

ここではキャッシュが効いていることを明確に示すために現在時刻を SSR 時に埋め込みます。そして 10 秒の max-age を設定し、CDN で 10 秒キャッシュされているかを確認します。

```js
export async function getServerData(context) {
  const timestr = new Date().toISOString();
  return {
    status: 200, // The HTTP status code that should be returned
    props: { timestr }, // Will be passed to the page component as "serverData" prop
    headers: {
      "Cache-Control": "public, max-age=10",
    }, // HTTP response headers for this page
  };
}
```

そして DSG モードを有効にします。

```js
import React from "react";
import { graphql } from "gatsby";
export default function Template({
  data, // this prop will be injected by the GraphQL query below.,
  serverData,
}) {
  const { markdownRemark } = data; // data.markdownRemark holds your post data
  const { html } = markdownRemark;
  const { timestr } = serverData;
  return <div className="blog-post-container">build time: {timestr}</div>;
}

export async function config() {
  return (props) => {
    return {
      defer: true,
    };
  };
}
```

`defer: true` で有効になります。Gastby Cloud を使わないため DSG ではなく SSR になってしまうのですが、この指定があることで他のページに関しては SSG させることができます。

## SSR サーバーと CDN の接続

SSR サーバーには CloudRun を選択しました。
そのため Docker ファイルと、Cloud Build の設定ファイルを用意します。

```
FROM node:16

WORKDIR /home/node/app

COPY . /home/node/app

RUN npm install

RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "serve"]
```

```yaml
steps:
  - name: "gcr.io/cloud-builders/docker"
    args:
      [
        "build",
        "-t",
        "gcr.io/$PROJECT_ID/dsg:$COMMIT_SHA",
        "--cache-from",
        "gcr.io/PROJECT_ID/dsg:latest",
        ".",
      ]
    timeout: 1200s
  - name: "gcr.io/cloud-builders/docker"
    args: ["push", "gcr.io/$PROJECT_ID/dsg:$COMMIT_SHA"]
    timeout: 1200s
  - name: "gcr.io/google.com/cloudsdktool/cloud-sdk"
    entrypoint: gcloud
    args:
      - "run"
      - "deploy"
      - "dsg"
      - "--image"
      - "gcr.io/$PROJECT_ID/dsg:$COMMIT_SHA"
      - "--region"
      - "asia-northeast1"
      - "--platform"
      - "managed"
      - "--port"
      - "8080"
    timeout: 1200s
images:
  - "gcr.io/$PROJECT_ID/dsg:$COMMIT_SHA"
timeout: 2400s
```

ビルド時間は長めにとっています。

これをレポジトリに含めて CloudRun からレポジトリを連携すると、CloudRun 側でデプロイが走ります。

その結果、SSR サーバーが起動します。

FYI: https://dsg-5vaznax7ka-an.a.run.app/

では次にこのサーバーへの Middlebox として Fastly を設置しましょう。
ここでは Fastly の無料アカウントを使って検証します。
クレジットカードの認証をしないと独自ドメインや SSL 終端に対してルーティングできなさそうだったので、共有 TLS と共有ドメインを使って接続します。

これは簡単で、Fastly のドメイン選択画面で `${name}.global.ssl.fastly.net` と入力するだけです。自分のドメインレジストリと Fastly を接続する必要はありません。今回は dsg の検証なので、`dsg.global.ssl.fastly.net` という名前にしました。あとはオリジンサーバーの URL を Fastly に設定すれば https://dsg.global.ssl.fastly.net/hoge として接続できます。

この URL をアクセスして更新連打したりして遊んでみてください、一定時間キャッシュが効いて DSG のような挙動になっていることが確認できるはずです。いまは `max-age=10` にしていますが、これを `immutable` などにすると完全に DSG を再現できます。ただし再ビルド時はキャッシュのパージは必要となります。

レポジトリはこちらです:https://github.com/sadnessOjisan/gatsby-dsg-cache-incremental-build
