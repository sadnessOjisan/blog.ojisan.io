---
path: /next-otel
created: "2023-12-11"
title: Next.js の OpenTelemetry サポートを使う方法
visual: "./visual.png"
tags: [opentelemetry, nextjs]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

なんか今日、[megumish が CNDT 2023 で Next.js と otel の話をする](https://event.cloudnativedays.jp/cndt2023/talks/2043) らしい。そこで話されてしまうと、下書きに入れてあった Next.js と otel の記事が二番煎じになって出しにくくなりそうだったので大急ぎで書いている。

OGPは小樽のnextの駅です。

## Next.js が OpenTelemetry をサポートした

Next.js v13 でサポートされている。

see: https://nextjs.org/docs/pages/building-your-application/optimizing/open-telemetry

instrumentation.ts というファイルを置いて、ここで sdk-node を起動すれば計装されるという仕組みだ。計装には [@vercel/otel](https://github.com/vercel/otel/tree/main) というライブラリを使う。

ドキュメントは

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node.ts");
  }
}
```

となっているが、これは edge ランタイムを意識しての切り分けだ。多くの人はオリジンサーバーでの挙動を期待するのでいまは触れない。（まあそもそもまだサポートされていないんですけどね）

```ts
export const registerOTel = (serviceName: string) => {
  // We don't support OTel on edge yet
  void serviceName;
};
```

see: https://github.com/vercel/otel/blob/v0.3.0/src/index.edge.ts

またVercel(ホスティングサービス)事態の公式ドキュメントに Observability というタブが誕生していて、こちらでも解説がある。

see: https://vercel.com/docs/observability

see: https://vercel.com/docs/observability/otel-overview/quickstart

Vercel 商用利用している身として Vercel のログ周りのアレコレや、otel サポートが神って話はどこかでしたいのでそれはまた今度。

## どのようにして使うのか

### @vercel/otel は多くの場合使えない

公式ドキュメントでは next.config.js で

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
};
```

を有効にし、

```
npm install @vercel/otel
```

として、instrumentation.ts に

```ts
import { registerOTel } from "@vercel/otel";

export function register() {
  registerOTel("next-app");
}
```

とするようにありますが、これは多くの場合うまくいかないだろう。

registerOTel の実装を見ると

```ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";

export const registerOTel = (serviceName: string) => {
  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
    spanProcessor: new SimpleSpanProcessor(new OTLPTraceExporter()),
  });
  sdk.start();
};
```

とあり、OTLPExporter の設定が `new OTLPTraceExporter()` で固定されているためだ。

これは [exporter-trace-otlp-http](https://github.com/open-telemetry/opentelemetry-js/tree/main/experimental/packages/exporter-trace-otlp-http) の実装を追うと良いのだが、

```ts
const DEFAULT_COLLECTOR_RESOURCE_PATH = "v1/traces";
const DEFAULT_COLLECTOR_URL = `http://localhost:4318/${DEFAULT_COLLECTOR_RESOURCE_PATH}`;
```

と、http://localhost:4318 に OTLP Collector が立っていることを前提とする。

see: https://github.com/open-telemetry/opentelemetry-js/blob/main/experimental/packages/exporter-trace-otlp-http/src/platform/node/OTLPTraceExporter.ts

そういうサイドカー環境でデプロイできていればいいのだが、多くの場合はそうではないだろう。仮に Vercel にデプロイしている場合でも Otel Collector が用意されているのは Pro プラン以上のみだ。

> Vercel's OpenTelemetry collector is available in Beta on Pro and Enterprise plans

see: https://vercel.com/docs/observability/otel-overview/quickstart

### マニュアル計装

ということでマニュアル計装しよう。（といっても計装の準備自体がマニュアルであって、Span切るのとかは auto でされる）

[Manual OpenTelemetry configuration](https://nextjs.org/docs/pages/building-your-application/optimizing/open-telemetry#manual-opentelemetry-configuration) というセクションがあるのでここを参考にする。

```
npm install @opentelemetry/sdk-node @opentelemetry/resources @opentelemetry/semantic-conventions @opentelemetry/sdk-trace-node @opentelemetry/exporter-trace-otlp-http
```

といつものものを入れる。@opentelemetry/sdk-node については先日紹介したので興味のある方はこちらから。

see: https://blog.ojisan.io/otel-node-sdk/

instrumentation.ts に、

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node.ts");
  }
}
```

を、instrumentation.node.tsに

```ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "next-app",
  }),
  spanProcessor: new SimpleSpanProcessor(new OTLPTraceExporter()),
});
sdk.start();
```

と書きます。

`new OTLPTraceExporter` の中は自由に書けるのでここで自分が用意した Otel Backend を書く。ここでは NewRelic を使う。

```ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "ojisan-frontend",
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.INFRA_ENV,
  }),
  spanProcessor: new SimpleSpanProcessor(
    new OTLPTraceExporter({
      url: "https://otlp.nr-data.net:4318/v1/traces",
      headers: {
        "api-key": process.env.NEW_RELIC_KEY,
      },
    }),
  ),
});
sdk.start();
```

api-key は New Relic で払い出したキーだ。公式に加え、`SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT` というメタデータも入れた。こうすることで APM サービス側で環境ごとに検索できます。SERVICE_NAME に環境名を入れるよりかはメタデータに入れる方が好みだ。

こうすると APM サービス側で各パスごとにどれくらいの時間がかかったかが分かる。

## Next.js で otel 挑戦したけど動かなかったときに見ると解決するかもしれない FAQ

### Next のどのバージョンから使えますか？

多分 13系。どの commit で入ったかは見つけられなかった。instrumentation.ts を使わずに計装するならどのバージョンからでもできる。カスタムサーバー作るなりして気合いがいるけど。

### app router のみの対応ですか？

pages router でも動く。ドキュメントも切り替えられるようになっていて、両方サポートされている。手元でも動作確認済み。

### APM サービスは何が良いですか？

ローカルなら jaeger の all in one コンテナ。

see: https://www.jaegertracing.io/docs/1.6/getting-started/

本番環境でお試しで動かすなら [New Relic](https://newrelic.com/jp) 一択。Otel Backend の OTLP エンドポイントだけを使う方法が提供されている。URLを設定で渡すだけでいい。競合のAPMサービスってこういう雑い使い方できない気がした。Vercelの公式もNew Relicを名指ししている。

> Vercel has an OpenTelemetry (OTEL) collector that allows you to send OTEL traces from your Serverless Functions to application performance monitoring (APM) vendors such as New Relic.

see: https://vercel.com/docs/observability/otel-overview/quickstart

ただし本当に使い込むなら Otel Collector もあった方が良いので、そういう本番利用なら New Relic 以外の選択肢が入る。ぶっちゃけ商用のAPMサービスならなんでもいいと思う。

ちなみにセルフホスティング系も何個か試したが、Jaegerは マルチポート対応したデプロイ先に困ったり、ストレージに困った。ES や Casandra 前提なのも厳しかった。ストレージで困ったならと言うことで GCS を使えるGrafana Tempoも気になったが、Grafana力が足りなくて断念。来年はクラウドネイティブ力を高めてこの辺の基盤を作れるようになりたい。
