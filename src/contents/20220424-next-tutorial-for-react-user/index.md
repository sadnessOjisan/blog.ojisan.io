---
path: /next-tutorial-for-react-user
created: "2022-04-24"
title: React ユーザー向けの NextJS チュートリアル
visual: "./visual.png"
tags: ["React", "NextJS"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

最近会社で NextJS のチュートリアルを担当することがあったり、これからもあるので資料として記事をしたためておこうと思う。
対象は、React は知っているけどこれから Next を学ぼうとする人が想定。
つまり React 単体と Next の差分をまとめる。

React そのものから学びたい人は別の資料にアクセスした方が良いだろう。

## Next の学習教材

とりあえず公式だけ読めば良い。(これでいまブラウザバックされたら面白いな・・・)

主に二つあり、

- ドキュメントや API: https://nextjs.org/docs/getting-started
- チュートリアル: https://nextjs.org/learn/foundations/about-nextjs

を読むと良い。

## Next は何を解決しているか、何が嬉しいか

元々は SSR のための煩雑な手続きをしなくていいというところにあったと思うが、今はいろんな嬉しさを引き連れてきているのでそれらを紹介すると

- SSR におけるベストプラクティスの提供
- zero config でのビルド
- routing や styling 面での tooling の内包

がある。

## SSR とは何か

NextJS は React での SSR が前提となる FW である。
そのためまずは SSR について解説する。

歴史的な側面を無視して実務における話をするのであれば、SSR とは JSX を HTML に変換してクライアントに返すことである。
ただしその HTML の上で React を動かせるように、初期状態を埋め込んだり React のランタイムも一緒に返す。
こうすることでランディング時に HTML が返ってくるけど次の遷移からは SPA/CSR として遷移できたり、差分更新が可能になる。

SSR を採用するメリットは主に 2 つある。
1 つは、HTML として返すことで SEO や OGP への対応ができることだ。
もう一つはパフォーマンス面にある。
SPA に比べると TTFB は遅くなるが、SSR 時にデータを埋め込むことで SPA と比較してデータ取得の往復を一つ減らせることと、HTML を CDN にキャッシュできることでパフォーマンスの向上を見込める。
クライアントでの DOM 操作を減らせることによってもパフォーマンス向上を見込めるだろう。

しかしこれを実装しようとすればとても大変だった。
サーバーで React を実行して HTML を生成し、それをクライアントで React アプリとして動かせるように戻す必要があるからだ。
そのための手続きを頑張る必要があった。

そこで NextJS である。
NextJS であれば HTML を作る処理などは全部 FW が担ってくれるので考えなくてよくなった。
Next は SSR のコストを劇的に下げたツールといえよう。

## File System Routing

NextJS は標準でルーティング機能が備わっている。
react-router のようにパスとコンポーネントのマッピングを作らなくても良く、`pages/` もしくは `src/pages` の配下のファイル名がそのままルーティングとなる。
`/` は `index.jsx` が対応し、`/about` は `about.tsx` が対応するという形だ。ネストも対応しており `/users/setting` は user フォルダの `setting.tsx` が対応する。

そこで思うかもしれないのが、`/users/1` や `/users/2` のような動的なルーティングにはどう対応するのかということだ。
まさか全 user id 分のファイルを作るのだろうか。
そんなことは当然しなくてよく、それは `/users/[uid]` のように `[]` を使ったルーティングで対応できる。
このように定義しておけば、NextJS のアプリケーションから uid を抽出する方法が提供されていることもあって、各ページごとの処理を書くことができる。
その方法についてはサーバーとクライアントで異なるので次のセクションから見ていこう。

## Client での Routing

NextJS には next/router というモジュールが`useRouter` という hooks を提供している。
これによって routing オブジェクトが提供される。
react-router にも似たものがあるので、知っている人はそれを想像してもらえると良い。

こいつはクライアントサイドにおける routing のための便利メソッドをたくさんもった便利オブジェクトである。
例えば別のページに遷移したり、ブラウザバックしたりするためのメソッドが生えている。

そしてこのオブジェクトからはパスパラメータやクエリを URL から取る機能があるので、それを使えば前述の`[]` を取り出せる。
たとえば `[uid]` であれば uid をキーとしたオブジェクトが提供されることとなる。
つまり `/users/[uid].tsx` というファイルに対して `/users/1` としてアクセスされれば、`{uid: 1}`として格納されているわけである。

## NodeJS プロセスでの実行

SSR は NodeJS 上で実行されるわけだが、そのときの挙動はどのようにしてプログラミングすればいいだろうか。
NextJS には CSR 以外の方法で呼ばれたときに制御できる口がある。
それは pages コンポーネントで getXXXProps という関数を export することで実現できる。
それらは SSG をするための `getStaticProps`, SSG で dynamic routing するためのパスを作る `getStaticPaths`, そして SSR で使われる `getServerSideProps` である。

今日扱うのは SSR で使われる getServerSideProps である。
ただ、これは名前からして SSR 時に呼ばれるものと捉えられそうだが、実体は Server Side で実行される処理でしかないことに注意。

ドキュメントの When does getServerSideProps run というセクションには、

`getServerSideProps` only runs on server-side and never runs on the browser. If a page uses getServerSideProps, then:

- When you request this page directly, `getServerSideProps` runs at request time, and this page will be pre-rendered with the returned props
- When you request this page on client-side page transitions through next/link or next/router, Next.js sends an API request to the server, which runs `getServerSideProps`

とある。つまり、該当のページに遷移したときもしくは、CSR 上でも遷移されたときである。
必ずしも SSR 専用というわけではない。

この関数が返す値も注目すべきで、JSON を返すのである。
SSR 専用なら HTML を返すはずなので、JSON を返す点からも SSR 専用というわけではないのである。

きっと具体例を見るのが一番理解し易くて、ドキュメントにある例をみよう。
これは `/pages` にあるファイルから export したものだ。

```jsx
function Page({ data }) {
  // Render data...
}

// This gets called on every request
export async function getServerSideProps() {
  // Fetch data from external API
  const res = await fetch(`https://.../data`);
  const data = await res.json();

  // Pass data to the page via props
  return { props: { data } };
}

export default Page;
```

getServerSideProps で返した props は、Pages で使えるのである。
つまり getServerSideProps は pages に props を埋め込むのである。

この理解は上のコンポーネントに型をつけることでもっと明確になる。

```tsx
import type { VoidFunctionComponent } from "react";
import type { GetServerSideProps } from "next";

type Props = {
  hoge: string;
};

const TestPage: VoidFunctionComponent<Props> = (props) => {
  return <p>{props.hoge}</p>;
};

export default TestPage;

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  return {
    props: { hoge: "hogeeeeeee" },
  };
};
```

さて、getServerSideProps に現れた context にも触れておこう。
ここにはその名の通り Context 情報が含まれる。
そのなかには routing 情報も含まれており、`[]` で囲まれたキーに該当する値も含まれる。
router の時と同じようにオブジェクトのキーとして取得できる。
つまり、context は SSR における動的ルーティングから値を取り出すために使えるのである。

## 環境変数

NextJS では、.env を作るだけで環境変数を定義できる。
さらに `.env.local`, `.env.development`, `.env.production` といったファイルにも対応しており、環境変数の値を NODE_ENV の値に応じて切り分けられる。
ただし `.env.local` を作るとそれが優先的に使われるから注意しよう。

ところで Next は Server / Client が同居している FW であるが、server だけで使いたい環境変数はどう管理すれば良いだろうか。
その答えとして `NEXT_PUBLIC_` である。
前提として NextJS の環境変数は全てサーバー専用である。
つまりクライアントに漏れ出さないので、AWS や GCP の秘密鍵などを入れてもクライアントから見られることはないのである。
ただし環境変数名に`NEXT_PUBLIC_` をつけることでクライアントにも環境変数を見せることができる。
これまでは next.config.js に webpack の上書き設定を書き、DefinePlugin を使って環境変数を移し替えることでクライアントで使えるようにしていたが、今はそんなことはしなくていいのである。
ただしうっかりの表出事故には注意しよう。

## API エンドポイントの作成

NextJS は SSR の口だけでなく、API エンドポイントも作れる。
それは pages 配下に `/api/` というフォルダにファイルを作れば良い。
そうすればクライアントから `/api/**` にアクセスすることでその API を叩くことができる。

これは秘匿情報を隠蔽するメリットがあり、たとえばクライアントに表出できない secret などを使った処理を閉じ込めるために役立てられる。
なぜなら `/api` の向こうにある処理の実体は NodeJS のサーバーなのだから。

もちろん `/api` でつくったエンドポイントは NextJS クライアントにとっての専用ではなく、その URL にはどこからでもアクセスできる。

## ビルド

NextJS はいまや crate-react-app や vite のような使われ方をする。
煩雑な手続きを書かなくてもほぼ 0config でアプリを始められるというものである。

(手で設定を書きたい人は [拙著](https://www.amazon.co.jp/dp/B08FWMYFTL) を買ってね ⭐︎)

中にはトランスパイラとして babel が内包されており、bundler として webpack が内包されている。
中に入っているビルド用のライブラリは Next のバージョンが上がるにつれて入れ替わったり、入れ替えられるオプションが生えているが、ユーザーは意識せずに使えるようになっている（※
設定を上書いていなければの話）

ならどうしてセクションを設けて説明しているのかというと TypeScript には幾ばくか注意が必要なためである。
Next では typescript ライブラリを入れておけば、0 config で tsx の設定がされる。
設定を書かずとも初回ビルドの時に tsconfig.json が生成されるであろう。
ただし注意と注目をした方が良い点がある。

一つには標準では `strict: false` になっていることだ。
ここは true に変えておこう。

もう一つにはこの設定ファイルは無闇に書き換えない方が良いということである。
ビルドが通らなくなるオプションが存在している。
たとえば `jsx: preserve` である。
ここを `react` に帰ることで tsx -> js という変換ができるようになるものの、Next は babel を経由させるため、react 系プラグインの都合上 tsx -> jsx にしておかないといけないのである。
他にも触ると壊れるオプションがあるので、慣れるまでは無闇に触るのはやめておこう。
ただし strict は変えてもビルドは壊れないし、false にしておくと後が大変なので先手で true にしてこう。
