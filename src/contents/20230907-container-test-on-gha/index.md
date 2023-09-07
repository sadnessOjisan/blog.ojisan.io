---
path: /container-test-on-gha
created: "2023-09-07"
title: ありのままのコンテナを使って E2E テストを GitHub Actions 上で行う
visual: "./visual.png"
tags: [docker, "github-actions"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

コンテナでサーバーを動かして、それに対するリクエストをするE2Eテストを GitHub Actions 上で動かすことに苦労したので書く。

成果物repo: https://github.com/sadnessOjisan/e2e-gha

## お題となるサーバー

コンテナに固めるから別に何言語でも良いので、まずはちょっとしたエコーサーバーを書いてみよう。

```js
import Fastify from "fastify";
const fastify = Fastify({
  logger: true,
});

fastify.get("/", async function handler(req, res) {
  const q = req.query["q"];
  res
    .status(200)
    .headers({
      "content-type": "application/json",
    })
    .send({ q });
});

try {
  await fastify.listen({ port: 3000, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
```

これはクエパラをそのまま返してくれるただのエコーサーバーだ。

```
❯ curl "http://localhost:3000?q=hogeeee"
{"q":"hogeeee"}
```

このエコーサーバーにテストを書く。

```js
import { expect, test } from "vitest";

test("echo q=1", async () => {
  const res = await fetch(`${process.env.ORIGIN}?q=1`);
  const data = await res.json();
  expect(data).toEqual({ q: "1" });
});

test("echo q=2", async () => {
  const res = await fetch(`${process.env.ORIGIN}?q=2`);
  const data = await res.json();
  expect(data).toEqual({ q: "2" });
});
```

Origin 部分を環境変数にしているのは後々嬉しいからなので今は気にしないでほしい。このテストコードを走らせると、

```
# server を起動
yarn start

# test を起動
ORIGIN=http://0.0.0.0:3000 yarn test
```

その結果は

```
yarn run v1.22.19
$ yarn workspace:test test
$ yarn workspace test test
warning package.json: "test" is also the name of a node core module
$ vitest

 DEV  v0.34.3 /Users/ideyuta/Documents/projects/toybox/e2e-gha/packages/test

stdout | unknown test
http://0.0.0.0:3000

 ✓ integrate.test.ts (2)
   ✓ echo q=1
   ✓ echo q=2

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  04:42:53
   Duration  204ms (transform 19ms, setup 0ms, collect 9ms, tests 26ms, environment 0ms, prepare 49ms)


 PASS  Waiting for file changes...
       press h to show help, press q to quit

```

となる。ではこれを GitHub Actions 上で動かそう。

## 起動とテストを一つにまとめる

E2E なのでサーバーの起動とテストの実行の２つが必要だ。先は start と test でコマンドを二つに分けていたが、CI 上でのタスク実行においてサーバーを起動しぱなしにすると test コマンドを実行できないので、これができるように一つのコマンドにまとめてみる。

```sh
yarn start & ORIGIN=http://0.0.0.0:3000 yarn test
```

`&` はバックグラウンドでプロセスを実行できる。

FYI: https://kazmax.zpp.jp/linux_beginner/process_background.html

ここでは `yarn start` をバックグラウンドで動かし、それに対してフォアグラウンドで `yarn test` を実行し、実際にサーバーにリクエストを送って E2E テストをしている。

これはそのままGitHub Actions 上でテストできる。

```yaml
name: test

on: push

jobs:
  test:
    name: run test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: yarn install
      - run: yarn start & ORIGIN=http://localhost:3000 yarn test
```

## E2E テストはコンテナに対してすべきで、yarn start した結果のテストは成果物へのテストではない

さて、僕たちが成果物をコンテナデプロイしているのであれば先ほどのテストはよくないかもしれない。

テスト時は

```yaml
name: test

on: push

jobs:
  test:
    name: run test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: yarn install
      - run: yarn start & ORIGIN=http://localhost:3000 yarn test
```

で ubuntu 環境で動くサーバーにテストしているが、もしDockerfileが

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

(初手 `COPY . .` したり yarn focus してなかったり色々ダメダメだけど今は見逃して！)

のように distroless を使っている環境であれば、環境差異によるバグがあってそれにテストに気づけないということがあるかもしれない。**私は E2E テストはコンテナに対してすべきだと思う。**

## コンテナを動かして、そこのE2Eテストする

というわけで例えば

```yaml
version: "3"

services:
  server:
    build:
      context: .
      dockerfile: ./packages/server/Dockerfile
    ports:
      - 8080:3000
```

のような docker-compose.yaml を用意して、GitHub Actions 上で

```yaml
name: test

on: push

jobs:
  test:
    name: run test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      - run: yarn install # vitest 入れるために仕方なく
      - name: Run Docker container
        run: docker compose up -d server
      - name: Run test
        run: ORIGIN=http://localhost:3000 yarn test
```

としたくなるが、実はこれは動かない。

`yarn test` の前にデーモンとして立てたサーバーに対して、同じワークフローからであっても前のstepには localhost でアクセスすることができない。

FYI: https://stackoverflow.com/questions/68691293/localhost-can-not-be-accessed-on-github-actions-workflow

そういうことをするには GitHub Actions では Service Container という機能で実現できる。

FYI: https://docs.github.com/en/actions/using-containerized-services/about-service-containers

しかしこれをするには Docker Hub やら GitHub Registry に登録する必要がある。これはテストをまわしたい度にそこに登録するのはめんどくさかったり、所属企業によっては使えなかったりするかもしれない。なので Docker Network を使った解決法を考える。

## docker-compose と docker network でテストする

まず先の方法を見て、Docker もバックグラウンド実行すればいいのではと思うかもしれない。ローカルで試してみると、

```sh
❯ docker compose up server & ORIGIN=http://localhost:8080 yarn test

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  11:59:25
   Duration  256ms (transform 18ms, setup 0ms, collect 11ms, tests 29ms, environment 0ms, prepare 52ms)

✨  Done in 1.01s.
```

といった感じだ。うまくいきそう。

が GHA 上で試すと、

```
- name: Run Docker container
  run: docker compose up server & ORIGIN=http://localhost:8080 yarn test
```

で

```
Serialized Error: { errno: -111, code: 'ECONNREFUSED', syscall: 'connect', address: '::1', port: 8080 }
```

と出力され、動かない。どうしてかはよく分かっていない。同じステップだから同じプロセスで繋がりそうなのにね。有識者に聞いたら「DockerはリモートホストとかもあるからGHAの実装次第では localhost で繋がらなくても不思議ではない」「Self Host の GHA 読んでみたら分かるかも」とのことだった。自分はわからなかったのでこの疑問には目を瞑って先に答えを書くと、こうなる。

docker-compose.yaml

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

packages/test/Dockerfile

```
FROM node:18 AS builder

ENV ORIGIN=http://localhost:8080

WORKDIR /app

COPY . .

RUN yarn install

CMD [ "yarn", "test" ]
```

つまりテストの実行を別コンテナに押し込むのである。そうすると Docker Network を経由して、アプリケーションサーバーに対して `http://${container name}:${container port}` でアクセスできるようになる。[Docker Network](https://docs.docker.com/compose/networking/) のおかげで、アプリケーションサーバーのホストが発見可能になるのである。

## まとめ

- プロセス2つ使って、サーバープロセスをバックプロセスで、テストをフォアグラウンドで実施する。これはGitHub Actions上でも動く。
- テスト対象のサーバープロセスをデプロイするコンテナ環境そのもので使いたいなら、docker-compose の network 機能を使うと良い。
