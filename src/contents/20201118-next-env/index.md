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

OGP は「環境を考慮しよう！」という画像です。

NextJS へ環境変数をセットする時、デプロイを考慮した上で.env を使いたい・ビルド時と起動時の環境変数がある・サーバーとブラウザでの環境変数があるといった風にややこしい点があり、自分はよく調べ直しています。

基本的には以下の 3 つの公式ドキュメントを見ればいいのですが、

- [Environment Variables](https://nextjs.org/docs/api-reference/next.config.js/environment-variables)
- [Environment Variables(basic-features)](https://nextjs.org/docs/basic-features/environment-variables)
- [Runtime Configuration](https://nextjs.org/docs/api-reference/next.config.js/runtime-configuration)

整備されたのが最近なので古い情報が定着していたり、ここに書いていない細かい挙動なんかもあったりするので、まとめて行こうと思います。

## .env.\* を使って読み込める

[Environment Variables](https://nextjs.org/docs/basic-features/environment-variables) にもある通り、.env.\* を使うことで環境変数を読み込めます。

設定ファイルに環境変数を書いておけば、ビルド時に process.env へと環境変数を登録してくれます。

```sh:title=.env.local
DB_HOST=localhost
DB_USER=myuser
DB_PASS=mypassword
```

.env.local は `next dev` のときに読み込まれ、.env.development は `NODE_ENV` が development のとき、 .env.production は `NODE_ENV` が production のときに読み込まれます。
なのでこの機能を使うだけで環境変数を読み込めます。（※完全に使えるとは言っていない。）

## ブラウザから環境変数を使う

さて、先ほどの環境変数が使えるのは **Data Fetching methods** と **API Routes** の中だけです。
[Data Fetching methods](https://nextjs.org/docs/basic-features/data-fetching)は`getStaticProps`, `getStaticPaths`, `getServerSideProps` などのメソッドで、SSR/SSG/ISR などで実行される NodeJS 上でのメソッドです。
API Route は NextJS に生えている API サーバーの口です。
**つまり 先ほどの.env 経由での環境変数 は NodeJS のサーバー側の処理でしか使えず、クライアントサイドでは process.env の配下にセットされません。**

これは理由が明記されてはいないのですが、おそらくビルド時にバンドルへ環境変数が紛れ込まないようにしているのだと思います。

### ブラウザから読み込むためには `NEXT_PUBLIC_` をつける

では、どのようにしてクライアントサイドでその環境変数を使えば良いのでしょうか。
一つには環境変数名を `NEXT_PUBLIC_` で始まるものにしておくというものです。
このようにしておけば、NextJS が勝手にクライアント側の `process.env`配下に入れてくれます。

```sh:title=.env.local
NEXT_PUBLIC_API_ENDOPOINT=http://localhost:3001
```

### next.config.js からブラウザに環境変数を渡せる

NEXT_PUBLIC を使わなくても環境変数を渡せる方法もあります。
それは next.config.js の中から渡すというものです。

next.config.js は NextJS の設定ファイルで、ここに環境変数を設定する env という機能があります。
その解説では、

> To add environment variables to the JavaScript bundle, open next.config.js and add the env config:

FYI: https://nextjs.org/docs/api-reference/next.config.js/environment-variables

とある通り、env を使えばクライアント側の JS へと環境変数を渡せるようになります。

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

つまりこれを使って、.env.\* から読み込んだ環境変数を流してやれば良いのです。

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

FYI: https://github.com/vercel/next.js/tree/canary/examples/with-dotenv

ただレポジトリは残っているので、上のリンクでタグを 9.3.0 とかのを見るとやり方は確認できます。

## そもそも何の機能も使わない = npm scripts から渡す

あと、環境変数の秘匿などを考えないのでいいのであれば、そもそも起動時に環境変数を渡しても良いです。
`next build`, `next start` に環境変数を渡すことで利用できます。
しかし、これは起動スクリプトをカスタマイズできる必要があり、例えば vercel や Netlify のようなマネジメントサービスを使う場合は厳しい方法です。（起動スクリプトの改変はできるが、ブランチごとにスクリプトを指定できないため。）

### build 時に渡すか start 時に渡すか

結論: 両方に同じ値を渡しましょう。

NextJS は SSR や ISR する場合は ホスティング先で `next build`, `next start` と二つのコマンドを実行しなければいけません。
next build はレンダリングのための事前ビルドフェーズで SSR や ISR するための雛形を作るので、Data Fetching methods が実行されます。
この時に環境変数を使うことができます。
next start はサーバー自体を立ち上げる機能で起動に環境変数を埋め込めます。
ただし起動した後はビルド済みのコードをホスティングするので、ユーザーがアクセスするときはビルド時の環境変数が使われます。

簡単な実験をしてみましょう。

たとえば、npm scripts には

```js
"scripts": {
  "build": "NEXT_PUBLIC_ORIGINAL_ENV=hoge next build",
  "start": "NEXT_PUBLIC_ORIGINAL_ENV=piyo next start",
},
```

とビルド時と起動時で hoge, piyo という別の環境変数を渡して、コンポーネントは

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

つまり、ビルド時・起動時・アクセス時で環境変数が異なります。
ビルド時と起動時で環境変数を揃えておかないと、ビルド時・起動時・アクセス時で挙動が異なるようになるので双方に同じ値を設定するようにしておきましょう。

### Runtime Configuration を使って値を渡す

さて、さきほどはアクセス時には起動時の環境変数ではなくビルド時の環境変数が使われました。
実はこの挙動を変えることもできます。
そのための機能が [Runtime Configuration](https://nextjs.org/docs/api-reference/next.config.js/runtime-configuration)です。

この仕組みを使うと `config()` から事前設定した値をサーバー・クライアントのランタイムに持ち込めます。

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
もし環境変数を使いたいだけならお勧めの方法ではないです。
(next.config.js の env 越しに環境変数を伝える方法もこの一種と言えるだろう。)
もっともアプリケーション共通の値を配布する方法としては使えるかもしれず、サーバー・クライアントそれぞれのランタイムの変数をスコープごとに定義できるのは便利かもしれません。

## 起動方法による環境変数の分岐

さて、NextJS は起動時に `process.env.NODE_ENV` に production や development が渡っています。
これは next start か next dev かによって切り替わります。（もちろん起動時に `NODE_ENV` を渡せば上書けますが！（それでもランタイムでは適切な値に戻される））
これを利用してクライアント側に next.config.js 経由で いま production か development かをビルド 時に判断することができます。
それができるのであれば、あらかじめクライアント側に環境変数をハードコードしておけば起動方法によって環境変数を出し分けることが可能となります。
もっとも秘匿情報などでやってはいけないですが、Firebase の API_KEY（漏れても良い！）たちはこの方法で読み込むことも可能です。

FYI: [Firebase の API キーは公開しても大丈夫だよ（2020 年夏）](https://shiodaifuku.io/articles/txEgArhm4Z2BOzrd0IKJ)

ちなみにこれをやるためには、ランタイムでは`NODE_ENV` は本来の値に戻されるので、next.config.js 越しに別の環境変数に詰めてランタイムまで引き回す必要があります。

[vercel での環境変数の扱いが便利になった(preview-用に分岐させる物自体を環境変数にセットしよう)](https://blog.ojisan.io/vercel-env#preview-%E7%94%A8%E3%81%AB%E5%88%86%E5%B2%90%E3%81%95%E3%81%9B%E3%82%8B%E7%89%A9%E8%87%AA%E4%BD%93%E3%82%92%E7%92%B0%E5%A2%83%E5%A4%89%E6%95%B0%E3%81%AB%E3%82%BB%E3%83%83%E3%83%88%E3%81%97%E3%82%88%E3%81%86)を読むとイメージが付くと思います。

## 本番環境での設定

環境変数の埋め込みではなく、そもそも NextJS にどうやって渡すかという話です。
おそらく開発時は .env を使うのが良いですが、デプロイ時・本番での起動時には他にもやり方があります。

### Vercel

昔に [vercel での環境変数の扱いが便利になった](https://blog.ojisan.io/vercel-env) に書いたので参照してみてください。
GUI をぽちぽちするだけで環境変数を設定できます。

### それ以外

インフラが自由にできるのであれば立ち上げ時に .env を作ったり、起動スクリプトに渡せば良いです。
IaaS 系サービスならそれぞれが提供する秘匿情報を管理するプラクティスから NextJS に連携すると良いです。

## 結局どうすればいいか

お勧めは、NextJS 9.4 以上を使って、.env.local を定義し、クライアントで使う環境変数には `NEXT_PUBLIC_` をつけておくことです。
このようにしておけば少なくとも開発では困ることはないはずです。
本番環境での環境変数は Vercel なら GUI でぽちぽちしてください。

## サンプルコード

環境変数を npm scripts から渡す実験をしていました。
`NODE_ENV` もオリジナルの環境変数もビルド時・起動時には設定されますが、ランタイムでは `NODE_ENV` は prodcution, development に上書かれます。
そしてランタイムで受け取れたオリジナルの環境変数もクライアントサイドでは受け取れません。
受け取るためには next.config.js を跨いだ環境変数渡しが必要です。

https://github.com/ojisan-toybox/nextjs-env-sample

## おわりに

.env も git で管理して CI/CD に載せれたら一番楽なんだけどなぁ・・・（ぼそっ
