---
path: /next-astro
created: "2022-10-03"
title: Next.js にあるアレ、Astro でどうするか
visual: "./visual.png"
tags: ["astro"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

明日、トロ w

最近 Astro を触ったのでそのときに調べたこと。

## Dynamic Routing

Routing 自体は Next.js と同じようにできる。つまり `pages/` に `[id].astro` のようなものを作れば良い。それが URL になる。
この id は `const { id } = Astro.params;` のようにして取れる。Next と違って context は無いが、Astro という名前空間から取ってこれる。

## getStaticPaths

Next にある getStaticPaths も Astro には getStaticPaths としてある。

```ts
export function getStaticPaths() {
  return [
    // Generates: /dogs/clifford
    { params: { dog: "clifford" } },
    // Generates: /dogs/rover
    { params: { dog: "rover" } },
    // Generates: /dogs/spot
    { params: { dog: "spot" } },
  ];
}
```

のようにして使う。これは `/dogs/[dog].astro` のような URL のときだ。

FYI: https://docs.astro.build/en/core-concepts/routing/

つまり `/[id].astro` ならば、

```ts
export function getStaticPaths() {
  return [
    // Generates: /dogs/clifford
    { params: { id: "1" } },
    // Generates: /dogs/rover
    { params: { id: "2" } },
    // Generates: /dogs/spot
    { params: { id: "3" } },
  ];
}
```

とする必要がある。

FYI: https://docs.astro.build/en/reference/api-reference/#params

## getStaticProps

Next の getStaticProps 相応のものは Astro だと getStaticPaths にまとめられる。params 以外にも props を返すことができて、

```ts
export async function getStaticPaths() {
  const data = await fetch("...").then((response) => response.json());

  return data.map((post) => {
    return {
      params: { id: post.id },
      props: { post },
    };
  });
}

const { id } = Astro.params;
const { post } = Astro.props;
```

のようにして返すことができる。

FYI: https://docs.astro.build/en/reference/api-reference/#data-passing-with-props

この機能は実はとてもうれしくて、例えば NextJS であれば `/posts/:id` のページを作るためには id 一覧を [getStaticPaths](https://nextjs.org/docs/basic-features/data-fetching/get-static-paths) で取った後は、その posts の数だけ [getStaticProps](https://nextjs.org/docs/basic-features/data-fetching/get-static-props)で data を取る必要がある。

例えば、

```ts
export async function getStaticPaths() {
  return {
    paths: [{ params: { id: "1", hoge: 2 } }, { params: { id: "2", hoge: 3 } }],
    fallback: false, // can also be true or 'blocking'
  };
}

// `getStaticPaths` requires using `getStaticProps`
export async function getStaticProps(context) {
  return {
    // Passed to the page component as props
    props: {
      post: {
        data: JSON.stringify(context),
      },
    },
  };
}

export default function Post({ post }) {
  return <div>{JSON.stringify(post)}</div>;
}
```

のようにして paths と一緒にデータを渡すことができないのである。
（ちなみに先のコードは `{"data":"{\"params\":{\"id\":\"1\"}}"}` と表示される。）
つまり毎回 IO へのアクセスが発生するのだが、Astro だともし id と一緒にデータの一覧も返せば 1 回の IO で全ページを作れるのである。

```ts
export async function getStaticPaths() {
  const data = await fetch("...").then((response) => response.json());

  return data.map((post) => {
    return {
      params: { id: post.id },
      props: { post },
    };
  });
}

const { id } = Astro.params;
const { post } = Astro.props;
```

これはかなり嬉しい。

## \_app.tsx

Next の \_app.tsx, もしくは Gatsby の gatsby-browser.js のようなクライアントサイドで必ず呼ばれるコードはどう実現したらいいか。例えば reset.css の読み込みだったり firebase の初期化に使う。このやり方はもしかしたらいくつかあるかもしれないが、自分はそれ用の template を作った。

```html
<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "hoge",
    authDomain: "hoge-hoge.firebaseapp.com",
    projectId: "hoge-hoge",
    storageBucket: "hoge-hoge.appspot.com",
    messagingSenderId: "hoge",
    appId: "1:hoge:web:hoge",
    measurementId: "G-hoge",
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
<slot />
```

`<slot />` がミソで、これがあることで入れ子レイアウトとして定義できるようになる。あとはこれを全ページで囲んであげると良い。

```html
---
import Firebase from "../../layouts/Firebase.astro";
import Layout from "../../layouts/Layout.astro";
---

<Layout title="hello">
  <Firebase>
    <h1>hello</h1>
    <style>
      h1 {
        width: 100%;
      }
    </style>
  </Firebase>
</Layout>
```
