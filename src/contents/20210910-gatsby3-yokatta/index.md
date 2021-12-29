---
path: /gatsby3-yokatta
created: "2021-09-10"
title: Gatsby3 はいいぞ
visual: "./visual.png"
tags: ["Gatsby"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

僕は Gatsby が嫌いですがこの退避ブログは Gatsby で作りました。
そして Gatsby3 が想像以上に良くなっていて感動したのでその紹介をしたいです。

## ここが良かった Gatsby3

もしかしたら 2 系の機能が入ってるかもしれませんが、少なくともこのブログの[初代](https://github.com/sadnessOjisan/blog.ojisan.io) との差分で良かったところを紹介します。

### graphql に型をつけやすい

```ts
const { site } = useStaticQuery<SeoSiteQuery>(
  graphql`
    query SeoSite {
      site {
        siteMetadata {
          title
          description
          author
        }
      }
    }
  `
);
```

と言った感じで useStaticQuery のジェネリクスで型を指定でき、GraphQL の結果に対して型定義をかけます。

`SeoSiteQuery` は [graphql-code-generator](https://www.graphql-code-generator.com/) と [gatsby-plugin-graphql-codegen](https://www.gatsbyjs.com/plugins/gatsby-plugin-graphql-codegen/)などで生成すれば良いです。
しかしこれは 2 系時代でもありましたが、時間がかかったり、再生成されて補完が壊れたりなどの辛い面はあります。

こういうデータソースに型をつけるときは zod などを使いたいのですが、Gatsby は NextJS のように getStaticProps で取得処理をビルド時に分離できないのでバリデーションするタイミングがなくて使えませんでした。（コンポーネントの中で呼ぶと再レンダリングのたびに schema validation されてパフォーマンスが落ちること懸念有）
あと graphql-code-generator は型が `null | undefined | T` で持つので存在チェックがめんどくさいです。これはおそらく Gatsby プラグインを使わずに graphql-code-generator をそのまま使えば解決できるのですが、そうなると開発ビルドごとに型を作るなどがしづらくなるので見送りました。やはり zod が欲しいです。

ちなみに ページコンポーネントにおける`export const query` によるデータ取得も`PageProps` という型があるので、`.data` に値が入ることを見落としません。

```ts
type DataProps = BlogPostsQuery;

const UsingTypescript: React.FC<PageProps<DataProps>> = (props) => {};
```

### gatsby-node で個別ページを作らなくて済んでいる

ブログの個別ページなどでは gatsby-node.js で GraphQL 経由でデータをとってルーティングごとに props を埋め込むといった処理を書く必要がありましたが、なんと Gatsby にもファイルパスによるルーティングが提供されてこの手間がなくなりました。

GrapshQL のフィールドとパスが対応し、そのフィールド名をファイル名にすればそのフィールドを props に埋め込んだページを作ってくれます。なので ブログだと slug だけこのシステム経由で渡し、その slug を使って pages コンポーネントからクエリを発行するだけでブログの個別ページを作れます。例えばこのブログの実装では `{MarkdownRemark.frontmatter__path}.tsx` というファイル名です。

### ビルドが早くなっている

gatsby-image 込みでもビルドが早いです。
記事自体 100 個近くあるので、前はキャッシュファイルを使った上でビルドしても 10 分近くかかっていました。
いまは 2 分ほどでビルドが完了しています。

### プラグイン周り

2 系の頃からあった plugin 周りはそのまま使えています。
plugin を入れるだけで諸々の設定が完了するのは Gatsby の良いところです。（悪いところでもあるのですが）

## おわりに

NextJS にしなかった理由はどこかでまたブログにします。
なんだかんだでブログを作るのであれば Gatsby は良いと思っています。
