---
path: /next-13-sg
created: "2023-04-17"
title: Next.js v13 で app directory を有効にして Static Generation する
visual: "./visual.png"
tags: [nextjs]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

OGP は [Astro 回](https://blog.ojisan.io/astro-de-client-turakatta/)でトロを食べてしまったので罪悪感で具無しホットドックを食べている画像だ。新年度、もうすぐ健康診断だ。そろそろ走り始めないといけない。

## 前回までのあらすじ

[原神の TODO リスト](https://genshin-todo.ojisan.dev/)を [Astro Component 使って書いたら辛かった](https://blog.ojisan.io/astro-de-client-turakatta/) ので、React on Astro するか Next にするか悩んだ。

## 選ばれたのは Next でした

結局 Next を使った。Astro ver は丸一日くらいかかっていたのが i18n 含めて 1 時間くらいで移行できた。Next 最高！

移行の最中、Static Generation が App Dir に対応したと知ったのでせっかくなので App Dir で SSG してみたログを書く。

## app directory で SG する方法

### next.config.js の設定

v13.3 から config で SG がサポートされた。

FYI: <https://nextjs.org/blog/next-13-3#static-export-for-app-router>

```js
/** @type {import('next').NextConfig} */
module.exports = {
  experimental: {
    appDir: true,
  },
  output: "export",
};
```

`output: "export",` があれば `next export` せずに `next build` の時点で out が作られ SG されるようになる。

### dynamic routing

動的パスだけであれば pages 時代と同じく `[id]` のようなファイル名・フォルダ名を使えば良い。

#### getStaticPaths 相応のものは generateStaticParams

app dir でない時は [getStaticPaths](https://nextjs.org/docs/basic-features/data-fetching/get-static-paths) というもので動的なパスを SG ビルド中に生成していた。

```tsx
export async function getStaticPaths() {
  return {
    paths: [{ params: { id: "1" } }, { params: { id: "2" } }],
    fallback: false, // can also be true or 'blocking'
  };
}
```

それが app dir では [generateStaticParams](https://beta.nextjs.org/docs/api-reference/generate-static-params) というものを使う。

使い方は、getStaticPaths 時代と同じくパス名とオブジェクトのキー名を一致させて使う。

```tsx
// app/products/[category]/[product].tsx

export function generateStaticParams() {
  return [
    { category: "a", product: "1" },
    { category: "b", product: "2" },
    { category: "c", product: "3" },
  ];
}

// Three versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
// - /product/a/1
// - /product/b/2
// - /product/c/3
export default function Page({
  params,
}: {
  params: { category: string; product: string };
}) {
  const { category, product } = params;
  // ...
}
```

getStaticPaths の相違点としては、export する関数が params キーを持たなくて良いところにある。ただし受け取り側では params が型に現れるので注意しよう。

#### 型を毎回注意したくないので用意された型を使いたい

ここでいう用意された型というのは pages 時代でいう GetServerSideProps や GetStaticPaths などの型のことだ。

```ts
import { GetStaticProps, GetStaticPaths, GetServerSideProps } from "next";

export const getStaticProps: GetStaticProps = async (context) => {
  // ...
};

export const getStaticPaths: GetStaticPaths = async () => {
  // ...
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  // ...
};
```

このような便利型があれば引数などは型推論を効かせられるのだが、残念ながら今のところはなさそうだ。Next.js には <https://nextjs.org/learn/excel/typescript/nextjs-types> というこういった特殊な型を集めたページがあるがそこに書かれていないのでまだ使えないのだろう。

#### 受け取り側の型は自分で定義する

今回、`GetServerSideProps<T>` のような型がないので T を使って export const した関数とコンポーネントの Props を揃えられない。自分で型を作る必要があり、その型は

```ts
export default function Page({
  params,
}: {
  params: { [x in string]: string };
}) {}
```

である。

#### getStaticProps 相応のものは不要

pages 時代は [getStaticProps](https://nextjs-ja-translation-docs.vercel.app/docs/basic-features/data-fetching/get-static-props) というものも書いていた。これは SG 中に JSX に埋め込むデータを取ってきて加工できる関数だ。

```tsx
export async function getStaticProps(context) {
  return {
    props: {}, // ページコンポーネントに props として渡されます。
  };
}
```

app dir 時代にはこの処理は不要で、代わりにコンポーネントの中に直接書いてしまう。
そんなことすれば再レンダリングのたびに関数が実行されてパフォーマンスが落ちそうに思えるが、app dir 時代は app dir 配下のものは Server Component として実行されるので再レンダリングを考慮しなくて良い。コンポーネントの中に直接ロジックを置けるので、getStaticProps が不要になるわけだ。
