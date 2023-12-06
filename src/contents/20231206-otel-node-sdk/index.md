---
path: /otel-node-sdk
created: "2023-12-06"
title: OpenTelemetry の Node.js Example で SDKが何をしているのか
visual: "./visual.png"
tags: [opentelemetry]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

約2ヶ月ぶりのブログ。サボった最長記録達成してると思います。何をしていたかはそのうち書きます。今日は OpenTelemetry & JS についてです。

[公式のExample](https://opentelemetry.io/docs/instrumentation/js/getting-started/nodejs/) を使うとすぐに tracing を試せるようになっていますが、一体どういう仕組みで、express サーバーへのリクエストがトレーシングされてログになるのかって不思議じゃないですか？てなわけで調べてみました。

OGP はモンキーパッチを DALLE に書いてもらいました。モンキーパッチが解答だからです。

## 公式のExample通りにSDKを使ってみよう

Getting Start をまずはやってみましょう。

see: https://opentelemetry.io/docs/instrumentation/js/getting-started/nodejs/

```ts
/*app.ts*/
import express, { Express } from "express";

const PORT: number = parseInt(process.env.PORT || "8080");
const app: Express = express();

function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

app.get("/rolldice", (req, res) => {
  res.send(getRandomNumber(1, 6).toString());
});

app.listen(PORT, () => {
  console.log(`Listening for requests on http://localhost:${PORT}`);
});
```

これに対する計装の準備を

```ts
/*instrumentation.ts*/
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import {
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
} from "@opentelemetry/sdk-metrics";

const sdk = new NodeSDK({
  traceExporter: new ConsoleSpanExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new ConsoleMetricExporter(),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

に作って

```
$ npx ts-node --require ./instrumentation.ts app.ts
Listening for requests on http://localhost:8080
```

と起動すれば、

```json
{
  traceId: '5578675e16a25fa8409cdc0a0ca600b5',
  parentId: undefined,
  traceState: undefined,
  name: 'GET /rolldice',
  id: 'b2c371c148f3cb5c',
  kind: 1,
  timestamp: 1701867163292000,
  duration: 3916.875,
  attributes: {
    'http.url': 'http://localhost:8080/rolldice',
    'http.host': 'localhost:8080',
    'net.host.name': 'localhost',
    'http.method': 'GET',
    'http.scheme': 'http',
    'http.target': '/rolldice',
    'http.user_agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'http.flavor': '1.1',
    'net.transport': 'ip_tcp',
    'net.host.ip': '::1',
    'net.host.port': 8080,
    'net.peer.ip': '::1',
    'net.peer.port': 61503,
    'http.status_code': 200,
    'http.status_text': 'OK',
    'http.route': '/rolldice'
  },
  status: { code: 0 },
  events: [],
  links: []
}
{
  traceId: '9c49c27784cd4f747ecc04cc39782d86',
  parentId: '0504f7a7a29265b8',
  traceState: undefined,
  name: 'middleware - query',
  id: '5143f62d45bc9e5b',
  kind: 0,
  timestamp: 1701867163460000,
  duration: 102.25,
  attributes: {
    'http.route': '/',
    'express.name': 'query',
    'express.type': 'middleware'
  },
  status: { code: 0 },
  events: [],
  links: []
}
{
  traceId: '9c49c27784cd4f747ecc04cc39782d86',
  parentId: '0504f7a7a29265b8',
  traceState: undefined,
  name: 'middleware - expressInit',
  id: '5f87fa961e65ce08',
  kind: 0,
  timestamp: 1701867163460000,
  duration: 104.292,
  attributes: {
    'http.route': '/',
    'express.name': 'expressInit',
    'express.type': 'middleware'
  },
  status: { code: 0 },
  events: [],
  links: []
}
```

な感じでトレースが出ます。

さて、instrument.ts は何をしているのでしょうか？

## そもそもどうしてリクエストに対して trace をできているの？

というわけでコードを読んでいきましょう。traceExporter は console や OTLP への出力で、metrics は metrics なので、getNodeAutoInstrumentations から読んでいきましょう。

### @opentelemetry/auto-instrumentations-node

まず @opentelemetry/auto-instrumentations-node の実体は

see: https://github.com/open-telemetry/opentelemetry-js-contrib/tree/1c24cfd2e4cbb417a04ce9d6bad047fde76a823b/metapackages/auto-instrumentations-node

にあります。

そして getNodeAutoInstrumentations は

```ts
const InstrumentationMap = {
  "@opentelemetry/instrumentation-amqplib": AmqplibInstrumentation,
  "@opentelemetry/instrumentation-aws-lambda": AwsLambdaInstrumentation,
  "@opentelemetry/instrumentation-aws-sdk": AwsInstrumentation,
  "@opentelemetry/instrumentation-bunyan": BunyanInstrumentation,
  "@opentelemetry/instrumentation-cassandra-driver":
    CassandraDriverInstrumentation,
  "@opentelemetry/instrumentation-connect": ConnectInstrumentation,
  "@opentelemetry/instrumentation-cucumber": CucumberInstrumentation,
  "@opentelemetry/instrumentation-dataloader": DataloaderInstrumentation,
  "@opentelemetry/instrumentation-dns": DnsInstrumentation,
  "@opentelemetry/instrumentation-express": ExpressInstrumentation,
  "@opentelemetry/instrumentation-fastify": FastifyInstrumentation,
  "@opentelemetry/instrumentation-fs": FsInstrumentation,
  "@opentelemetry/instrumentation-generic-pool": GenericPoolInstrumentation,
  "@opentelemetry/instrumentation-graphql": GraphQLInstrumentation,
  "@opentelemetry/instrumentation-grpc": GrpcInstrumentation,
  "@opentelemetry/instrumentation-hapi": HapiInstrumentation,
  "@opentelemetry/instrumentation-http": HttpInstrumentation,
  "@opentelemetry/instrumentation-ioredis": IORedisInstrumentation,
  "@opentelemetry/instrumentation-knex": KnexInstrumentation,
  "@opentelemetry/instrumentation-koa": KoaInstrumentation,
  "@opentelemetry/instrumentation-lru-memoizer": LruMemoizerInstrumentation,
  "@opentelemetry/instrumentation-memcached": MemcachedInstrumentation,
  "@opentelemetry/instrumentation-mongodb": MongoDBInstrumentation,
  "@opentelemetry/instrumentation-mongoose": MongooseInstrumentation,
  "@opentelemetry/instrumentation-mysql2": MySQL2Instrumentation,
  "@opentelemetry/instrumentation-mysql": MySQLInstrumentation,
  "@opentelemetry/instrumentation-nestjs-core": NestInstrumentation,
  "@opentelemetry/instrumentation-net": NetInstrumentation,
  "@opentelemetry/instrumentation-pg": PgInstrumentation,
  "@opentelemetry/instrumentation-pino": PinoInstrumentation,
  "@opentelemetry/instrumentation-redis": RedisInstrumentationV2,
  "@opentelemetry/instrumentation-redis-4": RedisInstrumentationV4,
  "@opentelemetry/instrumentation-restify": RestifyInstrumentation,
  "@opentelemetry/instrumentation-router": RouterInstrumentation,
  "@opentelemetry/instrumentation-socket.io": SocketIoInstrumentation,
  "@opentelemetry/instrumentation-tedious": TediousInstrumentation,
  "@opentelemetry/instrumentation-winston": WinstonInstrumentation,
};

// Config types inferred automatically from the first argument of the constructor
type ConfigArg<T> = T extends new (...args: infer U) => unknown ? U[0] : never;
export type InstrumentationConfigMap = {
  [Name in keyof typeof InstrumentationMap]?: ConfigArg<
    (typeof InstrumentationMap)[Name]
  >;
};

export function getNodeAutoInstrumentations(
  inputConfigs: InstrumentationConfigMap = {},
): Instrumentation[] {
  for (const name of Object.keys(inputConfigs)) {
    if (!Object.prototype.hasOwnProperty.call(InstrumentationMap, name)) {
      diag.error(`Provided instrumentation name "${name}" not found`);
      continue;
    }
  }

  const instrumentations: Instrumentation[] = [];

  for (const name of Object.keys(InstrumentationMap) as Array<
    keyof typeof InstrumentationMap
  >) {
    const Instance = InstrumentationMap[name];
    // Defaults are defined by the instrumentation itself
    const userConfig: any = inputConfigs[name] ?? {};

    if (userConfig.enabled === false) {
      diag.debug(`Disabling instrumentation for ${name}`);
      continue;
    }

    try {
      diag.debug(`Loading instrumentation for ${name}`);
      instrumentations.push(new Instance(userConfig));
    } catch (e: any) {
      diag.error(e);
    }
  }

  return instrumentations;
}
```

となってなっています。

**なんとその正体はありとあらゆる instrument ライブラリを全部インストールする君でした！**。一応 引数で入れるものは絞ることはできますが、

```js
registerInstrumentations({
  instrumentations: [
    getNodeAutoInstrumentations({
      // load custom configuration for http instrumentation
      "@opentelemetry/instrumentation-http": {
        applyCustomAttributesOnSpan: (span) => {
          span.setAttribute("foo2", "bar2");
        },
      },
    }),
  ],
});
```

自動計装系を使うときはそもそも getNodeAutoInstrumentations を使わずに必要なものだけ入れるようにしましょう。(e.g. express, fastify, ...)

というわけで、いまの例では express を使っているので、@opentelemetry/instrumentation-express を読んでいきましょう。

### @opentelemetry/instrumentation-express

see: https://github.com/open-telemetry/opentelemetry-js-contrib/tree/1c24cfd2e4cbb417a04ce9d6bad047fde76a823b/plugins/node/opentelemetry-instrumentation-express

まず初期化処理から見ていきます。

```ts
export class ExpressInstrumentation extends InstrumentationBase<
  typeof express
> {

  ...

  init() {
    return [
      new InstrumentationNodeModuleDefinition<typeof express>(
        "express",
        ["^4.0.0"],
        (moduleExports, moduleVersion) => {
          diag.debug(`Applying patch for express@${moduleVersion}`);
          const routerProto = moduleExports.Router as unknown as express.Router;
          // patch express.Router.route
          if (isWrapped(routerProto.route)) {
            this._unwrap(routerProto, "route");
          }
          this._wrap(routerProto, "route", this._getRoutePatch());
          // patch express.Router.use
          if (isWrapped(routerProto.use)) {
            this._unwrap(routerProto, "use");
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this._wrap(routerProto, "use", this._getRouterUsePatch() as any);
          // patch express.Application.use
          if (isWrapped(moduleExports.application.use)) {
            this._unwrap(moduleExports.application, "use");
          }
          this._wrap(
            moduleExports.application,
            "use",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this._getAppUsePatch() as any,
          );
          return moduleExports;
        },
        (moduleExports, moduleVersion) => {
          if (moduleExports === undefined) return;
          diag.debug(`Removing patch for express@${moduleVersion}`);
          const routerProto = moduleExports.Router as unknown as express.Router;
          this._unwrap(routerProto, "route");
          this._unwrap(routerProto, "use");
          this._unwrap(moduleExports.application, "use");
        },
      ),
    ];
  }
}
```

`const routerProto = moduleExports.Router as unknown as express.Router;` からして明らかに Router オブジェクトを取ってルーティングをキャプチャしています。express の plugin を入れるとルーティングごとに trace を追えるようになります。つまり、このキャプチャしたルーティングの上にtraceを積んでいく動きが予想されます。

### @opentelemetry/instrumentation

ルーティングをキャプチャしているのであれば、

```ts
this._wrap(routerProto, "route", this._getRoutePatch());
```

や

```ts
this._wrap(routerProto, "use", this._getRouterUsePatch() as any);
```

はとても怪しくなります。なぜなら、express では

```ts
Router.route("/", handler);

Router.use("/", handler);
```

のようにしてルーティングを定義するからです。ではこの `_wrap` を追っていきましょう。これは `InstrumentationBase` に定義されているスーパーメソッドなので opentelemetry-instrumentation を見ていきます。

see: https://github.com/open-telemetry/opentelemetry-js/tree/4daa2640d2e2312974f6b1cfdebb44f6d02cf046/experimental/packages/opentelemetry-instrumentation

```ts
import * as shimmer from 'shimmer';

export abstract class InstrumentationAbstract<T = any>
  implements Instrumentation
{
  ...

  /* Api to wrap instrumented method */
  protected _wrap = shimmer.wrap;
  /* Api to unwrap instrumented methods */
  protected _unwrap = shimmer.unwrap;
  /* Api to mass wrap instrumented method */
  protected _massWrap = shimmer.massWrap;
  /* Api to mass unwrap instrumented methods */
  protected _massUnwrap = shimmer.massUnwrap;
}
```

どうやら shimmer というライブラリの wrap を呼び出しているだけです。

### shimmer

shimmer は

> Safer monkeypatching for Node.js

とあり、その通りモンキーパッチングを実現するライブラリです。

see: https://github.com/othiym23/shimmer

モンキーパッチとは

> モンキーパッチ（Monkey patch）は、システムソフトウェアを補完するために、プログラムをその時その場の実行範囲内で拡張または修正するというテクニックである。モンキーパッチの影響はその時その場のプロセス（プログラムの実行インスタンス）だけに限定されて、プログラム本体には及ばない。
> モンキーパッチは動的プログラミング分野の用語であり、その定義はRubyやPythonなどの各言語コミュニティに依存している[1][2]。サードパーティ製のランタイムシステム、ソフトウェアフレームワーク、仮想マシン上で発生しがちな、好ましくない動作の違いや各種バグに対してパッチ当てすることを目的にしての、プロセス上に展開されたクラスコードやモジュールコードの動的な修正作業、という点は共通している。

らしいです。(って [wikipedia](https://ja.wikipedia.org/wiki/%E3%83%A2%E3%83%B3%E3%82%AD%E3%83%BC%E3%83%91%E3%83%83%E3%83%81) が言ってた。)

shimmer の例も

```js
var http = require("http");
var shimmer = require("shimmer");

shimmer.wrap(http, "request", function (original) {
  return function () {
    console.log("Starting request!");
    var returned = original.apply(this, arguments);
    console.log("Done setting up request -- OH YEAH!");
    return returned;
  };
});
```

とあり、http module の request を挙動を変えずにログを出すために使っています。

なので今回の

```ts
this._wrap(routerProto, "route", this._getRoutePatch());

this._wrap(routerProto, "use", this._getRouterUsePatch() as any);
```

も router, use の挙動を変えずに `_getRouterUsePatch` を挟み込んでいます。

### ExpressInstrumentation.\_getRouterUsePatch

これは末尾のレイヤーだけを取り出してそこにモンキーパッチします。一応後述の \_applyPatch でパッチ対象の重複チェックはしますが、この関数で末尾のレイヤーにだけモンキーパッチします。

express のレイヤーについては https://medium.com/analytics-vidhya/nodejs-express-source-code-explanation-c1770ac9c989 などをご覧ください。

```ts
private _getRouterUsePatch() {
    const instrumentation = this;
    return function (original: express.Router['use']) {
      return function use(
        this: express.Application,
        ...args: Parameters<typeof original>
      ) {
        const route = original.apply(this, args);
        const layer = this.stack[this.stack.length - 1] as ExpressLayer;
        instrumentation._applyPatch(
          layer,
          typeof args[0] === 'string' ? args[0] : undefined
        );
        return route;
      };
    };
  }
```

この関数は \_applyPatch を末尾レイヤーに適用しているだけと言えます。

### ExpressInstrumentation.\_applyPatch

さて、\_applyPatch が本丸です。

```ts
import {
  trace,
  context,
} from '@opentelemetry/api';

private _applyPatch(
    this: ExpressInstrumentation,
    layer: ExpressLayer,
    layerPath?: string
  ) {
    const instrumentation = this;
    // avoid patching multiple times the same layer
    if (layer[kLayerPatched] === true) return;
    layer[kLayerPatched] = true;

    this._wrap(layer, 'handle', (original: Function) => {
      // TODO: instrument error handlers
      if (original.length === 4) return original;
      return function (
        this: ExpressLayer,
        req: PatchedRequest,
        res: express.Response
      ) {
        storeLayerPath(req, layerPath);
        const route = (req[_LAYERS_STORE_PROPERTY] as string[])
          .filter(path => path !== '/' && path !== '/*')
          .join('');

        const attributes: SpanAttributes = {
          [SemanticAttributes.HTTP_ROUTE]: route.length > 0 ? route : '/',
        };
        const metadata = getLayerMetadata(layer, layerPath);
        const type = metadata.attributes[
          AttributeNames.EXPRESS_TYPE
        ] as ExpressLayerType;

        const rpcMetadata = getRPCMetadata(context.active());
        if (rpcMetadata?.type === RPCType.HTTP) {
          rpcMetadata.route = route || '/';
        }

        // verify against the config if the layer should be ignored
        if (isLayerIgnored(metadata.name, type, instrumentation._config)) {
          if (type === ExpressLayerType.MIDDLEWARE) {
            (req[_LAYERS_STORE_PROPERTY] as string[]).pop();
          }
          return original.apply(this, arguments);
        }

        if (trace.getSpan(context.active()) === undefined) {
          return original.apply(this, arguments);
        }

        const spanName = instrumentation._getSpanName(
          {
            request: req,
            layerType: type,
            route,
          },
          metadata.name
        );
        const span = instrumentation.tracer.startSpan(spanName, {
          attributes: Object.assign(attributes, metadata.attributes),
        });

        if (instrumentation.getConfig().requestHook) {
          safeExecuteInTheMiddle(
            () =>
              instrumentation.getConfig().requestHook!(span, {
                request: req,
                layerType: type,
                route,
              }),
            e => {
              if (e) {
                diag.error('express instrumentation: request hook failed', e);
              }
            },
            true
          );
        }

        let spanHasEnded = false;
        if (
          metadata.attributes[AttributeNames.EXPRESS_TYPE] !==
          ExpressLayerType.MIDDLEWARE
        ) {
          span.end();
          spanHasEnded = true;
        }
        // listener for response.on('finish')
        const onResponseFinish = () => {
          if (spanHasEnded === false) {
            spanHasEnded = true;
            span.end();
          }
        };

        // verify we have a callback
        const args = Array.from(arguments);
        const callbackIdx = args.findIndex(arg => typeof arg === 'function');
        if (callbackIdx >= 0) {
          arguments[callbackIdx] = function () {
            // express considers anything but an empty value, "route" or "router"
            // passed to its callback to be an error
            const maybeError = arguments[0];
            const isError = ![undefined, null, 'route', 'router'].includes(
              maybeError
            );
            if (isError) {
              const [error, message] = asErrorAndMessage(maybeError);
              span.recordException(error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message,
              });
            }

            if (spanHasEnded === false) {
              spanHasEnded = true;
              req.res?.removeListener('finish', onResponseFinish);
              span.end();
            }
            if (!(req.route && isError)) {
              (req[_LAYERS_STORE_PROPERTY] as string[]).pop();
            }
            const callback = args[callbackIdx] as Function;
            return callback.apply(this, arguments);
          };
        }

        try {
          return original.apply(this, arguments);
        } catch (anyError) {
          const [error, message] = asErrorAndMessage(anyError);
          span.recordException(error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message,
          });
          throw anyError;
        } finally {
          /**
           * At this point if the callback wasn't called, that means either the
           * layer is asynchronous (so it will call the callback later on) or that
           * the layer directly end the http response, so we'll hook into the "finish"
           * event to handle the later case.
           */
          if (!spanHasEnded) {
            res.once('finish', onResponseFinish);
          }
        }
      };
    });
  }
```

とても長いですが、していることは、

- ルート情報の取得とスパン属性の設定
- スパンの開始
- スパンの終了処理
- オリジナルのhandleメソッドの実行

です。

これらはいわば マニュアル計装するときの処理と言えます。マニュアル計装 についてはこちらをご覧ください。

see: https://opentelemetry.io/docs/instrumentation/js/manual/

そのドキュメントをまとめると、やることは

- tracer をセットアップ
- tracerに紐づける形でspan を作成
- 必要ならspan の中に span を作成
- span に attribute で情報を足していく

です。

先ほどの実装も

tracer は `instrumentation.tracer` から使えるように最初からなっていて、

span を作成し、

```
onst span = instrumentation.tracer.startSpan(spanName, {});
```

attribute 情報を渡していき

```
Object.assign(attributes, metadata.attributes)
```

ということをしています。つまりモンキーパッチの中でトレーシングのマニュアル計装していたことがわかりました。

## 結論

@opentelemetry/auto-instrumentations-node の getNodeAutoInstrumentations が内部的に @opentelemetry/instrumentation-express を呼び出していて、@opentelemetry/instrumentation-express は shimmer で Router.get, Router.use をモンキーパッチし、リクエストが来るたびに \_applyPatch でマニュアル計装している。
