---
path: /next-env
created: "2020-11-18"
title: NextJS における環境変数まわりの挙動まとめ
visual: "./visual.png"
tags: ["NextJS"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

NextJS へ環境変数をセットする時、dotenv を使いたい、ブラウザ側に持ってくるときどうしたらいいの、という情報が錯乱していたり困っている人がいたり、自分もよく調べ直すことが多く、ややこしい部分だと思います。

基本的には以下の 3 つの公式ドキュメントを見ればいいのですが、

- https://nextjs.org/docs/api-reference/next.config.js/environment-variables
- https://nextjs.org/docs/basic-features/environment-variables
- https://nextjs.org/docs/api-reference/next.config.js/runtime-configuration

整備されたのが最近なので古い情報が定着していたり、ここに書いていない細かい挙動なんかもあったりするので、まとめて行こうと思います。

## .env.\* を使って読み込める

[Environment Variables](https://nextjs.org/docs/basic-features/environment-variables) にもある通り、.env.\* を使うことで環境変数を読み込めます。

設定ファイルに環境変数を書いておけば、ビルド時に process.env へと環境変数を登録してくれます。

```sh:title=.env.local
DB_HOST=localhost
DB_USER=myuser
DB_PASS=mypassword
```

この機能を使うだけで環境変数を読み込めます。（使えるとは言ってない。）

## ブラウザから環境変数を使う

さて、先ほどの環境変数が使えるのは **Data Fetching methods** と **API Routes** の中だけです。
[Data Fetching methods](https://nextjs.org/docs/basic-features/data-fetching)は`getStaticProps`, `getStaticPaths`, `getServerSideProps` などのメソッドで、SSR/SSG/ISR などで実行される NodeJS 上でのメソッドです。
API Route は NextJS に生えている API サーバーの口です。
つまり 先ほどの.env 経由での環境変数 は NodeJS のサーバー側の処理でしか使えず、クライアントサイドでは process.env の配下にセットされません。

これは理由が明記されてはいないのですが、おそらくビルド時にバンドルへ環境変数が紛れ込まないようにしているのだと思います。

### ブラウザから読み込むためには NEXT*PUBLIC*をつける

では、どのようにしてクライアントサイドでその環境変数を使えば良いのでしょうか。
一つには環境変数名を `NEXT_PUBLIC_` で始まるものにしておくというものです。
このようにしておけば、NextJS が勝手にクライアント側の `process.env`配下に入れてくれます。

```sh:title=.env.local
NEXT_PUBLIC_API_ENDOPOINT=http://localhost:3001
```

### next.config.js からブラウザに環境変数を渡せる

NEXT_PUBLIC を使わなくても環境変数を渡せる方法もあります。
それは next.config.js の中から渡すというものです。
ここの env というフィールドを使えばクライアント側の JS へと環境変数を渡せるようになります。

```js
module.exports = {
  env: {
    TEST_VAR_FOR_BROWSER: process.env.TEST_VAR,
  },
}
```

```jsx:title=index.jsx
export default () => {
  console.log(process.env.TEST_VAR_FOR_BROWSER)
  return <div>hello</div>
}
```

## dotenv 系は不要?

ここまでを読むと dotenv 系のライブラリは不要と言えそうに見えます。
しかし、NextJS を v9.4 より前で使うなら、.env を使ったビルトインサポートがないため必要になります。
やはり .env があった方が使いやすいと思うので、.env を使いたくて 9.4 より前のバージョンを使うのであれば、dotenv 系のツールを使いましょう。

NodeJS では dotenv, dotenv-webpack を使えます。

```js
require("dotenv").config()
module.exports = {
  env: {
    // Reference a variable that was defined in the .env file and make it available at Build Time
    TEST_VAR: process.env.TEST_VAR,
  },
}
```

こうすることで、.env から環境変数を読み取って、クライアント側に引き回せます。

ちなみに dotenv を使うことは昔は公式も example を作るくらいには推奨されていましたが、Next が 9.4 出た時から公式のサンプルプロジェクトが消えました。

https://github.com/vercel/next.js/tree/canary/examples/with-dotenv

ただレポジトリは残っているので、上のリンクでタグを 9.3.0 とかのを見るとやり方は確認できます。

## そもそも何の機能も使わない = npm scripts から渡す

あと、環境変数の秘匿などを考えないのでいいのであれば、そもそも起動時に環境変数を渡しても良いです。
next build, next start に環境変数を渡すことで利用できます。
しかし、これは起動スクリプトをカスタマイズできる必要があり、例えば vercel や Netlify のようなマネジメントサービスを使う場合は厳しい方法です。（起動スクリプトの改変はできるが、ブランチごとにスクリプトを指定できないため。）

### build 時に渡すか start 時に渡すか

結論: 両方に渡しましょう。

NextJS は SSR や ISR する場合は ホスティング先で next build, next start と二つのコマンドを実行しなければいけません。
next build はレンダリングのための事前ビルドフェーズで SSR や ISR するための雛形を作るので、Data Fetching methods が実行されます。
この時に環境変数を使うことができます。
next start はサーバー自体を立ち上げる機能で起動に環境変数を埋め込めます。
ただし起動した後はビルド済みのコードをホスティングするので、ユーザーがアクセスするときはビルド時の環境変数が使われます。

簡単な実験をしてみましょう。

たとえば、

```js
"scripts": {
  "build": "NEXT_PUBLIC_ORIGINAL_ENV=hoge next build",
  "start": "NEXT_PUBLIC_ORIGINAL_ENV=piyo next start",
},
```

とビルド時と起動時で hoge, piyo という別の環境変数を渡して、

```jsx:title=index.jsx
export default () => {
  console.log(
    "<component> process.env.NEXT_PUBLIC_ORIGINAL_ENV: ",
    process.env.NEXT_PUBLIC_ORIGINAL_ENV
  )
  return <div>hello world!!</div>
}

export const getServerSideProps = () => {
  console.log(
    "<getServerSideProps> process.env.NEXT_PUBLIC_ORIGINAL_ENV: ",
    process.env.NEXT_PUBLIC_ORIGINAL_ENV
  )
  return {}
}
```

とします。

ここで、

```sh
$ npx next build
```

とすると、

```sh
$ npx next build
<getServerSideProps> process.env.NEXT_PUBLIC_ORIGINAL_ENV:  hoge
```

と表示されます。

そして、

```sh
$ npx next start
```

とすると、

```sh
$ npx next start
<getServerSideProps> process.env.NEXT_PUBLIC_ORIGINAL_ENV:  piyo
```

と表示されます。

しかしこの状態でそのページにアクセスすると、

```sh
$ npx next start
<getServerSideProps> process.env.NEXT_PUBLIC_ORIGINAL_ENV:  hoge
<component> process.env.NEXT_PUBLIC_ORIGINAL_ENV:  hoge
```

と表示されます。

そしてブラウザでは

```sh
<component> process.env.NEXT_PUBLIC_ORIGINAL_ENV:  hoge
```

としてログが出ます。

ビルド時と起動時で環境変数を揃えておかないと、ビルド時・起動時・アクセス時で挙動が異なるようになるので双方に同じ値を設定するようにしておきましょう。

### Runtime Configuration を使って値を渡す

さて、さきほどはアクセス時には起動時の環境変数ではなくビルド時の環境変数が使われました。
実はこの挙動を変えることもできます。
そのための機能が [Runtime Configuration](https://nextjs.org/docs/api-reference/next.config.js/runtime-configuration)です。

この仕組みを使うと config() から事前設定した値をクライアントサイドに持ち込めます。

```js:title=next.config.js
module.exports = {
  serverRuntimeConfig: {
    // Will only be available on the server side
    mySecret: "secret",
    secondSecret: process.env.SECOND_SECRET, // Pass through env variables
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    staticFolder: "/static",
  },
}
```

```jsx:title=index.jsx
import getConfig from "next/config"

// Only holds serverRuntimeConfig and publicRuntimeConfig
const { serverRuntimeConfig, publicRuntimeConfig } = getConfig()
// Will only be available on the server-side
console.log(serverRuntimeConfig.mySecret)
// Will be available on both server-side and client-side
console.log(publicRuntimeConfig.staticFolder)

function MyImage() {
  return (
    <div>
      <img src={`${publicRuntimeConfig.staticFolder}/logo.png`} alt="logo" />
    </div>
  )
}

export default MyImage
```

これを使えば 環境変数のようにある決まった値を NextJS に渡すことができます。

しかし公式もこのように言及している通り、

> Generally you'll want to use build-time environment variables to provide your configuration. The reason for this is that runtime configuration adds rendering / initialization overhead and is incompatible with Automatic Static Optimization.

ビルド時と違う値をランタイムで使うことによって最適化が効きにくくなります。
ただ環境変数を使いたいだけならお勧めの方法ではないです。
もっともアプリケーション共通の値を配布する方法としては使えるかもしれず、サーバー・クライアントそれぞれのランタイムの変数をスコープごとに定義できるのは便利かもしれません。
（上のコードでいう staticFolder）

## 起動方法による環境変数の分岐

さて、NextJS は起動時に process.env.NODE_ENV に production や development が渡っています。
これは next start か npx dev かによって切り替わります。（もちろん起動時に NODE_ENV を渡せば上書けますが！）
これを利用してクライアント側に next.config.js 経由で いま production か development かをビルド 時に判断することができます。
それができるのであれば、あらかじめクライアント側に環境変数をハードコードしておけば起動方法によって環境変数を出し分けることが可能となります。
もっとも秘匿情報などでやってはいけないですが、Firebase の API_KEY（漏れても良い！）たちはこの方法で読み込むことも可能です。

FYI: [Firebase の API キーは公開しても大丈夫だよ（2020 年夏）](https://shiodaifuku.io/articles/txEgArhm4Z2BOzrd0IKJ)

## 本番環境での設定

環境変数の埋め込みではなく、そもそも NextJS にどうやって渡すかという話です。

### Vercel

昔に [vercel での環境変数の扱いが便利になった](https://blog.ojisan.io/vercel-env) に書いたので参照してみてください。
GUI をぽちぽちすれば設定できます。

### それ以外

インフラが自由にできるのであれば立ち上げ時に .env を作ったり、起動スクリプトに渡せば良いです。
IaaS 系サービスならそれぞれが提供する秘匿情報を管理するプラクティスから NextJS に連携すると良いです。

## サンプルコード

環境変数を npm scripts から渡す実験をしていました。
NODE_ENV もオリジナルの環境変数もビルド時・起動時には設定されますが、ランタイムでは NODE_ENV は prodcution, development に上書かれます。
そしてランタイムで受け取れたオリジナルの環境変数もクライアントサイドでは受け取れません。
受け取るためには next.config.js を跨いだ環境変数渡しが必要です。

https://github.com/ojisan-toybox/nextjs-env-sample

## おわりに

.env も git で管理して CI/CD に載せれたら一番楽なんだけどなぁ・・・（ぼそっ
