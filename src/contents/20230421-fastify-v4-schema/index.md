---
path: /fastify-v4-schema
created: "2023-04-21"
title: fastify v4 で schema 周りが強化されたので試す
visual: "./visual.png"
tags: [fastify, ajv, json-schema]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

最近 fastify v4 移行してる知人の話を聞いて、JSON SChema の推論めちゃくちゃ便利になってそうだなと思って試してみた。
V4 GA が 2022-06 なので何を今更と思われるかもしれないが、正直最近 fastify 周りを追っていなかったので何も知らなかった。
[Encraft #2 サーバーとクライアントを結ぶ技術](https://knowledgework.connpass.com/event/279962/) の自己紹介が "本当に何をしてるか分からない" になるくらいには何もしていない。

OGP は YAPC で関西戻った時に見かけたマムアンちゃんだ。LUCUA で見かけた。昔めちゃくちゃハマっていてたくさんグッズ持っていた。

## なにが嬉しくなるのか

[公式の GA Announcement](https://medium.com/@fastifyjs/fastify-v4-ga-59f2103b5f0e)を見てみた。

一言で言うと、JSON Schema 通りの型推論が効くようになる。

これまでは

```tsx
interface IQuerystring {
  username: string;
  password: string;
}

interface IHeaders {
  "h-Custom": string;
}

server.get<{
  Querystring: IQuerystring;
  Headers: IHeaders;
}>(
  "/auth",
  {
    preValidation: (request, reply, done) => {
      const { username, password } = request.query;
      done(username !== "admin" ? new Error("Must be admin") : undefined); // only validate `admin` account
    },
  },
  async (request, reply) => {
    const { foo, bar } = request.query; // type safe!
  }
);
```

という風にジェネリクスを渡さないと型が効いてくれなかった。このとき JSON Schema を渡していても型推論が聞いてくれなかった。ただランタイムでバリデーションしてくれるようになるだけだ。

```tsx
server.get(
  "/auth",
  {
    schema: {
      querystring: {
        title: "Querystring Schema",
        type: "object",
        properties: {
          username: { type: "string" },
          password: { type: "string" },
        },
        additionalProperties: false,
        required: ["username", "password"],
      },
    },
  },
  async (request, reply) => {
    // unsafe!
    const { username } = request.query;
  }
);
```

FYI: [https://www.fastify.io/docs/latest/Reference/TypeScript/](https://www.fastify.io/docs/latest/Reference/TypeScript/)

(TS のページを久々に見たらめちゃくちゃドキュメント充実してた・・・)

そこでその型とスキーマを揃えるために TS First は JSON Schema 生成ライブラリである Typebox を使うことが推奨されていた。

```tsx
export const CommentRequest = Type.Object({
  url: Type.String({ description: "コメントしたいURL" }),
  content: Type.String({ description: "コメント内容" }),
});
export type CommentRequestType = Static<typeof CommentRequest>;

export const postComment: FastifyPluginCallback = (f, _, done) => {
  f.post<{ Body: CommentRequestType }>(
    "/comments",
    {
      schema: {
        body: CommentRequest,
      },
    },
    (req, res) => {}
  );
  done();
};
```

しかしこれで安心かと思いきや、JSON Schema と全く関係ない型を渡すことが可能だった。

```tsx
export const postComment: FastifyPluginCallback = (f, _, done) => {
  // デタラメな型を渡せる
  f.post<{ Body: { dummy: string } }>(
    "/comments",
    {
      schema: {
        body: CommentRequest,
      },
    },
    (req, res) => {}
  );
  done();
};
```

しかしそれが v4 では型推論が効くようになり、そもそものジェネリクスが不要になるのである。

```tsx
import Fastify from "fastify";
import { TypeBoxTypeProvider, Type } from "fastify-type-provider-typebox";

const fastify = Fastify({
  ajv: {
    customOptions: {
      strict: "log",
      keywords: ["kind", "modifier"],
    },
  },
}).withTypeProvider<TypeBoxTypeProvider>();

fastify.route({
  method: "GET",
  path: "/route",
  schema: {
    querystring: Type.Object({
      foo: Type.Number(),
      bar: Type.String(),
    }),
  },
  handler: (request, reply) => {
    // type Query = { foo: number, bar: string }
    const { foo, bar } = request.query; // type safe!
  },
});
```

だがよくみると TypeBox 的な記法を要求されているような気もする。

## TypeBox は必須なのか

いいえ、必須ではない。v4 で入ったのは [Type Provider](https://www.fastify.io/docs/latest/Reference/Type-Providers/) という仕組みだ。

これは、

> Type Providers are a TypeScript only feature that enables Fastify to statically infer type information directly from inline JSON Schema. They are an alternative to specifying generic arguments on routes; and can greatly reduce the need to keep associated types for each schema defined in your project.

> Type Providers are offered as additional packages you will need to install into your project. Each provider uses a different inference library under the hood; allowing you to select the library most appropriate for your needs. Type Provider packages follow a `@fastify/type-provider-{provider-name}`
>  naming convention.

とある。つまり、JSON Schema から型を導出してくれて、それを fastify に型付けしてくれる仕組みで、別パッケージとしてそのロジックを実装できる。そしていま json-schema-ts と typebox が対応しているようだ。

- [https://github.com/sinclairzx81/typebox](https://github.com/sinclairzx81/typebox)
- [https://github.com/ThomasAribart/json-schema-to-ts](https://github.com/ThomasAribart/json-schema-to-ts)

なので TypeBox は強制されず生の JSON Schema から型付ける道もあるようだ。

```tsx
import { JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts";

import fastify from "fastify";

const server = fastify().withTypeProvider<JsonSchemaToTsProvider>();

server.get(
  "/route",
  {
    schema: {
      querystring: {
        type: "object",
        properties: {
          foo: { type: "number" },
          bar: { type: "string" },
        },
        required: ["foo", "bar"],
      },
    } as const, // don't forget to use const !
  },
  (request, reply) => {
    // type Query = { foo: number, bar: string }

    const { foo, bar } = request.query; // type safe!
  }
);
```

## 落とし穴

だが、よくよくみると落とし穴がある。

### 別パッケージへの依存は必要

fastify 本体で型推論ができるわけではない。公式も

> Type Providers are offered as additional packages you will need to install into your project.

と言っている。

### その別パッケージの場所はドキュメント通りではない

そしてそのパッケージは [公式の GA Announcemen](https://medium.com/@fastifyjs/fastify-v4-ga-59f2103b5f0e) を見ると `import { TypeBoxTypeProvider, Type } from 'fastify-type-provider-typebox'` のようにしてあるが、2023 年 4 月現在では **`import** { TypeBoxTypeProvider } **from** '@fastify/type-provider-typebox'`となっている。つまり公式の family に入ったわけだ。

### シリアライザ部分はサポートされない

実は fastify の scham 指定部分は Request に関するものだけでなく Response に関する指定もできる。

```tsx
import Fastify from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
// ...

const fastify = Fastify().withTypeProvider<TypeBoxTypeProvider>();

app.post<{ Body: UserType; Reply: UserType }>(
  "/",
  {
    schema: {
      body: User,
      response: {
        200: User,
      },
    },
  },
  (request, reply) => {
    // The `name` and `mail` types are automatically inferred
    const { name, mail } = request.body;
    reply.status(200).send({ name, mail });
  }
);
```

このとき `reply.status(200).send({ name, mail });` に status: 200, body: {name, mail} 以外を渡すとエラーが出るのであれば嬉しいが、そんなことはなく好き放題渡せてしまう。response は validation でなく [serialization が fastify の機能](https://www.fastify.io/docs/latest/Reference/Validation-and-Serialization/#serialization)だからしないという理由もわかるが、型推論が効いてくれた方がユーザーとしては嬉しい。
