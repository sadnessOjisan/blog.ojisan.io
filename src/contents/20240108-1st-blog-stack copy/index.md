---
path: /integration-test-bunnri
created: "2024-01-08"
title: 結合テストを書くときはコードベースを分離している
visual: "./visual.png"
tags: [test]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

新規開発の設計支援や古いコードベースを甦らせて欲しいという相談をもらったときに、最初にちょろっとコードだけお手本的なコードを書いてから引き渡しているのだが、そのときに必ず結合テストを書くようにしている。

3, 4年前から僕と付き合いがある人からすると、

「「「あの sadnessOjisan がテストを書くだと！！！」」」

という感じだと思うのだが、最近はテストに思うところもあってちゃんと書いている。

そしてそのテストコードだが、基本的にはアプリケーションから分離して書いている。その話をしたい。

## OGP

OGP は野方ホープで海苔が分離されて出てきた時の画像だ。

## アプリケーションから分離したテストとはどういうことか

最終的にはテスト対象のサーバーを Docker コンテナで固めて、そのコンテナに対して HTTP リクエストを投げてその結果や DB の中身を検証するコンテナを docker compose で実行している。つまり、そもそもテスト対象とテストコードに依存がないようにしている。その目的を達成できるのなら別にコンテナを持ち出す必要はないのだけど、大抵はコンテナでデプロイするわけだし、だったらなるべく本番同等の条件でテストしたいということでコンテナとして起動してコンテナに対して実行している。ただ開発中の手元であればDockerは使わなくても良い。CIはなるべくDockerで回して欲しい。（というか分離するならDocker使わないとGHAで回すのが困難）

そのテストを実行する側のコンテナの中身は、jest + ただの fetch で書かれたテストだけだ。つまり

```js
describe("GET /users/:id", () => {
  describe("with valid userId", () => {
    it("should fail when the user is not exisit.", async () => {
      const res = await fetch(`${process.env.API_HOST}/users/1000000`);
      expect(res.status).toBe(404);
    });
  });
});
```

といったテストコードをコンテナ起動時に `npx jest` している。

コンテナで分離しておけば、サーバーへはfetch でリクエストするしかないので、対象のサーバーの言語は関係なくテストができる。GoであろうがPHPであろうが、テストとしてHTTPを投げる側のコードをJSで書いている。昔は JS ですらなくシェルスクリプトで cURL と気合を出した assert でテストを作っていたが、DBの操作で辛くなってやめた。

テストをなるべくシンプルなHTTPでできるようにすると、サーバー本体とテストプロセスのコードベースを分離できる。分離できるとテスト側のコードがサーバー本体の実装に依存しなくて済む。テストとアプリを分離しようとすると基本的にはレポジトリやフォルダごと分けることになるが、JS のプロジェクトであればモノレポという形での分離もできる。レポジトリは同一だけど、パッケージの単位が違うという状態だ。これは TS や Linter, Formatter の設定が使いまわせたりする。

## 意図的にサーバーとテストを分離して何が嬉しいのか

さて、APIのインテグレーションテストについてだが、これは

- 実装とテストを近いところにおいた方が見やすい
- サーバーFWにテストツールが付随しているからそれを使うべし

という理由で、分離をしないこともあると思う。おそらくサーバーFWは分離してHTTPでテストするような使われ方は推奨していないと思う。例えばサーバーFWには、専用のテストツールが付随していることが多い。

- https://fastify.dev/docs/v1.14.x/Documentation/Testing/
- https://docs.nestjs.com/fundamentals/testing
- https://laravel.com/docs/10.x/http-tests

分離せずにサーバーが用意しているテストツールを使うと、サーバーとテストが同一プロセスで動くのでテスト実行環境の構築は楽だろう。それにHTTPリクエストのテストケース(クエパラの組み合わせ)を考えなくてもよい。DBに関してもアプリケーション側にDBの接続情報があるだろうから、それを使うだけで truncate もできるし、テストデータの作成なども容易だろう。特にアプリケーションのORMをそのまま使えると型がついた状態でテストケースも作りやすくテストケースのメンテナビリティは高いように思える。しかし自分はそうはしない。

### テストのポータビリティ

なぜならアプリケーションに依存したテストを書くと、そのアプリケーションからの移行のときにそのテストが使えなくなるからだ。サーバーが用意している機能で書くアプリケーションに依存したテストは、いわばサーバーFWのコントローラーに対するテストだ。テストはそのアプリケーションのSPECであり、ドキュメントだと自分は思っている。アプリケーションを現行仕様を保ったまま移行するという選択肢は常に持っておきたく、その移行を安全にすべく持ち運べるテストが欲しい。コントローラに依存したテストは、言語やFWを入れ替えると使えなくなる。そのため実装に依存したテストを書きたくない。

### アプリケーション全体のメンテナビリティ

テストツールをアプリケーションの依存に含めると、アプリケーションの言語バージョンアップやライブラリアップデートでトラブルを起こすかもしれないという問題もある。大体は手を動かせば対応できる問題ではあるが、その作業が発生すること自体が気に食わない。テストとは違うが、storybook や react-testing-library 起因でそういう経験をしたことがあると思う。テストはアプリケーションの動作を保証するモノなのに、そのテストがアプリケーションを妨害しているという風に自分は感じる。そもそもとしてアプリケーションが持つべき依存は可能な限り少なくあるべきだと思っている。なのでアプリケーション側に余計なものは入れたくない。

## どうやって分離しているのか

### テストだけを独立させる

レポジトリを分離するか、モノレポで別パッケージを作る。そこで `npm init` して `jest` を入れている。vitest ではなく jest を使っている理由は [runInBand](https://jestjs.io/docs/cli#--runinband) が欲しいからだ。 vitest でも同様なシーケンシャルな機能があるのだが、たまに妙なレースコンディションを引き起こすことがあって安定している jest を使っている。今回は fetch くらいしか使わないので ESM のことを気にしなくていいので jest で問題ない。

### fetch でテストする

サーバーが経っていると仮定してそこに fetch するだけのテストコードを書く。

```js
describe("GET /users", () => {
  it("contains users.", async () => {
    const res = await fetch(`${process.env.API_HOST}/users`);
    const data = await res.json();
    expect(data).toEqual([{ id: 1, name: "oji" }]);
  });
});
```

### DB は簡単なドライバで操作する

サーバーによってはDBにアクセスしているし、そこにポストなどもしているだろう。テストは冪等であって欲しいので、毎回リセットしたい。なのでDBを操作するツールとして mysql2などを使っている。ポスグレの場合もあると思うの mysql2 でなくてもいいのだが、ここでは ORM やクエリビルダーをアプリケーション側が使っていたとしてもそれに依存しなければ良い。テストコードはアプリケーションの実装を知っていてはいけないという世界で開発している。

テストの beforeEach で truncate をするのも素のSQLで行なっている。

```js
import mysql from "mysql2/promise";

export const databaseConfig = {
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
};

export const createConnection = async () => {
  return await mysql.createConnection(databaseConfig);
};

export const clearTables = async () => {
  const connection = await mysql.createConnection(databaseConfig);
  const [tables] = await connection.query(
    // 注意: table_schema の値は '' が必要
    `SELECT table_name FROM information_schema.tables WHERE table_schema = '${process.env.MYSQL_DATABASE}'`,
  );

  if (!Array.isArray(tables)) {
    return;
  }

  for (const table of tables) {
    // @ts-ignore table_name は OkPacket にはない。テストファイルなので一旦適当に型を誤魔化しておく
    await connection.query(`TRUNCATE TABLE \`${table.table_name}\``);
  }

  await connection.end();
};

beforeEach(async () => {
  await clearTables();
});
```

テストの前提条件を作る given なフェーズでのデータの用意も、普通の INSERT で行なっている。

```ts
const connection = await createConnection();
const row = baseData;
const row2 = {
  ...baseData,
  id: "2",
};
const insertQuery = "INSERT INTO users SET ?";
await connection.query(insertQuery, row);
await connection.query(insertQuery, row2);
const res = await fetch(`${API_ORIGIN}/users`);
expect(res.status).toBe(401);
```

### CIで動かす

さて、サーバーFW組み込みのテストツールを使うメリットの一つには、テストサーバーとテストコードが同一プロセスで動くので実行が楽というのがあった。つまり分離した私たちはそれを構築する必要がある。そのためにDockerを使う。

[ありのままのコンテナを使って E2E テストを GitHub Actions 上で行う](https://blog.ojisan.io/container-test-on-gha/) にも書いたが、

```
FROM node:18 AS builder

WORKDIR /app

COPY . .

RUN yarn install

FROM gcr.io/distroless/nodejs18-debian11

WORKDIR /app

COPY --from=builder app/packages/server/src /app/src
COPY --from=builder app/node_modules/ /app/node_modules/
COPY --from=builder app/packages/server/package.json /app/package.json

EXPOSE 3000
CMD [ "src/index.js" ]
```

で固めて起動するサーバーに対して、テストコードを実行するコンテナ

```
FROM node:18 AS builder

ENV ORIGIN=http://localhost:8080

WORKDIR /app

COPY . .

RUN yarn install

CMD [ "yarn", "test" ]
```

を docker compose と docker network 越しに実行する。

```yaml
version: "3"

services:
  server:
    build:
      context: .
      dockerfile: ./packages/server/Dockerfile
    networks:
      - networkForTest
    ports:
      - 8080:3000
  test:
    build:
      context: .
      dockerfile: ./packages/test/Dockerfile
    depends_on:
      - server
    networks:
      - networkForTest
    environment:
      - ORIGIN=http://server:3000
networks:
  networkForTest:
    driver: bridge
```

これは http://localhost がどのマシンの上で使える保証はなく、特に GitHub Actions ではステップを跨いでサーバーにアクセスできないからだ。詳しくは先に紹介したブログを見て欲しい。

## まとめ

- サーバーに対するインテグレーションテストはアプリケーションと分離している。
- テストコードがサーバーの実装を知っているのはおかしいという前提で、分離のためにHTTP と素のSQLに頼っている。
- 分離することで、テストコードはアプリの実装を言語・FWレベルで差し替えた時のお守りになるし、テストコードがアプリ側の依存更新に影響を与えることもないという利点がある
