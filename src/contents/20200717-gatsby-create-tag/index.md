---
path: /gatsby-create-tag
created: "2020-07-17"
title: Gatsby製のブログにタグ機能を追加するための方法を見直してみよう
visual: "./visual.png"
tags: [Gatsby]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

このブログにタグ機能を作りました。
タグって自作ブログを作ると絶対に欲しくなってしまう機能なのですが、Gatsby でそれを作るのはちょっと敷居の高さを感じていたので、噛み砕きながら解説しようと思います。
一度わかってしまえば単純な話だとは思うものの、gatsby-node.js の使い方やビルドプロセスの知識が問われるので、**Gatsby を使えるようになるかどうかの最初の関門になってそう**と個人的には思っています。
同様の知識は Gatsby から記事ページを生成するときにも問われますが、それは公式チュートリアルをやればすんなりと通れるため、実質タグ機能の実装が最初の関門になってそうです。
そのため "Gatsby を初めてみてチュートリアルやって静的サイトは作れるようになったけどよくわかってない" という人にとって有用になりそうな情報も含めて、タグ機能の実装に必要な知識や考え方をつらつらと書いていきます。

## 記事にタグを埋め込む

どのように記事を入稿しているかにもよりますが、まずは記事データにタグのフィールドを追加しましょう。
このブログでは [markdown 入稿](https://github.com/sadnessOjisan/blog.ojisan.io/tree/master/src/contents) しているため、markdown にそのフィールドを追加していきます。
（もし markdown 入稿でない場合は適宜クエリを読み替えながら読んでいってください。GraphQL のクエリとその結果の変数の掘り方だけ変えれば同じ話になると思っています。）

### frontmatter を使ったメタ情報埋め込み

markdown ファイル内では [frontmatter](https://www.gatsbyjs.org/docs/adding-markdown-pages/#frontmatter-for-metadata-in-markdown-files) というコードブロック形式でメタ情報を記述します。(frontmatter は Gatsby やその GraphQL 内に登場するものですが、Gatsby 固有のものではありません。[Jykill](https://jekyllrb.com/docs/front-matter/)などでもサポートされている記法です。)

この記事だと、

```js
---
path: /gatsby-create-tag
created: "2020-07-17"
title: Gatsby製のブログにタグ機能を追加するための解説
visual: "./visual.png"
tags: [Gatsby]
---
```

というメタ情報が markdown ファイルの一番上に書かれています。

記事にタグ情報を埋め込むためには、上の例にあるように tags というフィールドに記載します。
frontmatter は YAML がサポートされているため配列を使えます。
そのため `tags: [A, B]` といった風に書くことができます。
YAML 形式で書く場合、文字列は `" "` がなくても動くことは注意しておきましょう。

### GraphQL を使ったタグ情報取得

GraphQL 上で allMarkdownRemark と markdownRemark というクエリを使えば markdown ファイルを取得できます（前者は全件取得、後者は単一取得でありデータの構造は同じ）。
frontmatter の情報はその markdown ファイルに含まれているので、

```js
query AllBlogs {
  blogs: allMarkdownRemark {
    nodes {
      frontmatter {
        tags
      }
    }
  }
}
```

といったクエリや

```js
query BlogTemplate($path: String!) {
  markdownRemark(frontmatter: { path: { eq: $path } }) {
    frontmatter {
      tags
    }
    tableOfContents(absolute: false)
  }
}
```

といったクエリで取得することができます。
そしてクエリの結果を仮に data という変数に格納していれば、`data.markdownRemark.frontmatter.tags` とすればタグ情報が取得できます。（全件取得の場合は map や forEach などで要素にばらしてからアクセスしてください。）

## タグごとのページを生成する

記事に埋め込んだ tag を取得する方法がわかりましたので、その tag を使ってページを作成していきましょう。

ビルド時に動的にページを作るための仕組みは [gatsby-node.js](https://www.gatsbyjs.org/docs/node-apis/) にあります。
このファイル内で createPages という名前の関数を export しておけば、Gatsby がビルド時に実行してくれます。
この API の説明 には

> Tell plugins to add pages. This extension point is called only after the initial sourcing and transformation of nodes plus creation of the GraphQL schema are complete so you can query your data in order to create pages.

とあり、取得対象のデータを持ってきて(source 系プラグインの責務)、そのデータを Node やそのフィールドに挿入した(transformer 系プラグインの責務)後に呼ばれる処理です。
そのためこの関数内では加工後の取得対象のデータに対して GraphQL でのデータ取得が可能（正確には GraphQL でのデータ取得が可能になるのはプラグインの恩恵ではなく[setFieldsOnGraphQLNodeType API](https://www.gatsbyjs.org/docs/node-apis/#setFieldsOnGraphQLNodeType)の力ですがこの API を transformer 系プラグインから登録していくので、プラグインが GraphQL へのクエリを投げれるように整備してくれているようにエンドユーザーからは見えます。）になっており、この関数内でデータの取得とそのデータに基づいた動的なページ生成を行えます。

例えばこの Blog では、

```js
const path = require(`path`)

exports.createPages = async ({ actions, graphql, reporter }) => {
  const { createPage } = actions
  const blogPostTemplate = path.resolve(`src/templates/blogTemplate.tsx`)
  const tagTemplate = path.resolve(`./src/templates/tagTemplate.tsx`)

  const contentsResult = await graphql(`
    {
      posts: allMarkdownRemark(
        sort: { order: DESC, fields: [frontmatter___created] }
        filter: { fileAbsolutePath: { regex: "/src/contents/" } }
        limit: 1000
      ) {
        edges {
          node {
            frontmatter {
              path
            }
          }
        }
      }
      tags: allMarkdownRemark(limit: 1000) {
        group(field: frontmatter___tags) {
          tag: fieldValue
          totalCount
        }
      }
    }
  `)

  contentsResult.data.tags.group.forEach(data => {
    createPage({
      path: `/tags/${data.tag}`,
      component: tagTemplate,
      context: {
        tag: data.tag,
      },
    })
  })

  contentsResult.data.posts.edges.forEach(({ node }) => {
    createPage({
      path: node.frontmatter.path,
      component: blogPostTemplate,
      context: {},
    })
  })
}
```

といった JS を書いています。
Gatsby が実行する createPages 関数からは createPage というページを作成する関数が渡されるので、それを GraphQL の取得結果に対して実行することで動的なページ生成を実現しています。

ということはタグに紐づくページの生成はタグ情報を GraphQL で取得してその結果に対して createPage を実行すれば良いです。

タグ情報の取得は

```js
allMarkdownRemark(limit: 1000) {
  group(field: frontmatter___tags) {
    tag: fieldValue
         totalCount
    }
}
```

というクエリを投げることで可能です。

ここにある group は Gatsby に組み込まれた[schema connections](https://www.gatsbyjs.org/docs/schema-connections/)という機能です。
これを使うことでクエリ結果の集約が可能になり、そのタグが何件あるかといった情報を取得することができるようになります。
例えば Gatsby(3)/NodeJS(5) といった表記が可能になります。
この group 機能は GraphQL や markdown の plugin によるものではないので見落としがちですが、覚えておきましょう。

ではタグ情報を取得できるようになったので、タグに紐づくページを作っていきましょう。
仮にクエリの結果が data という変数に入っているなら、

```js
data.tags.group.forEach(d => {
  createPage({
    path: `/tags/${d.tag}`,
    component: tagTemplate,
    context: {
      tag: d.tag,
    },
  })
})
```

と書くことでページを作成できます。
createPage 関数を呼ぶだけでページを作れるのは楽ですね。

### tag の表記揺れへの対応をしていない理由

他の解説記事をみると

```js
const _ = require('lodash')

...

data.tags.group.forEach(d => {
  createPage({
    path: `/tags/${_.kabebCase(d.tag)}`,
    component: tagTemplate,
    context: {
      tag: d.tag,
    },
  })
})
```

といった風に tag のパスを kabab ケースに変換して表記揺れが起きないようにしているものも見られると思います。
しかしこのブログではそれは採用しませんでした。
ビルドは Node.js 上で手元/CI 上で行われるので、変換処理 を採用しても致命的なパフォーマンスロスにはならないとは思ったものの、よく考えるとその記事へのリンクを作るときにその表記揺れ変換処理関数を実行する必要があり、クライアントサイドでのコードサイズの肥大化・クライアントサイドでの実行パフォーマンスの低下が起きるのが見えたからです。
表記揺れはタグ一覧などを作っておき、そのタグをアルファベット順に並べておけば気付けるはずだし、万が一表記揺れを修正する場合もタグページでブックマークしてる人はおらんやろと思ったので、タグの表記揺れへの対応はしていません。

## 各種 Index ページからタグ情報を取得する

記事へのタグ情報付与、タグごとのページ生成ができるようになったので、そのページのスタイリング、もしくは既存ページでのタグ紐付けを行いましょう。

### 記事詳細からタグを取得

記事詳細ページにタグ情報を表示させましょう。
この記事でも上のほうに Gatsby というタグがついているはずです。

これは簡単で、記事詳細となる template の内の query に tags フィールドを追加するだけです。

```js
export const pageQuery = graphql`
  query BlogTemplate($path: String!) {
    markdownRemark(frontmatter: { path: { eq: $path } }) {
      html
      frontmatter {
        path
        title
        tags # これを追加
      }
    }
  }
`
```

そうすれば、Page コンポーネントであれば、data 変数からアクセスできるクエリ結果に tags が含まれています。

例えばこのブログでは、

```jsx
<div className={styles.tags}>
  {markdownRemark.frontmatter.tags.map(
    tag =>
      tag && (
        <Link to={`/tags/${tag}`}>
          <a>
            <Tag className={styles.tag} name={tag}></Tag>
          </a>
        </Link>
      )
  )}
</div>
```

として利用しています。

### 記事一覧からタグを取得

これも tags のクエリを発行するだけで解決します。
そのクエリは単一取得用のクエリじゃなくて、全件取得用のクエリでも使えることに留意しておきましょう。

```js
export const pageQuery = graphql`
  query AllBlogs {
    allMarkdownRemark {
      nodes {
        frontmatter {
          title
          path
          tags
        }
      }
    }
  }
`
```

先ほどの例と違って、markdownRemark ではなく allMarkdownRemark を使っていることに注目しておきましょう。

### タグごとのページからタグの取得

タグごとのページとは、 `gatsby-node.js` から生成したページです。
今回の例だと、 /tags/タグ名 でアクセスできるページです。
これらは動的生成されるページなので何らかのテンプレートを使います。

そのテンプレートで、記事一覧ページのようなものを作っていきます。
流し込まれるデータがタグごとの記事であるものの、機能としては記事一覧と全く同じになるはずです。

```js
export const pageQuery = graphql`
  query TagTemplate($tag: String!) {
    allMarkdownRemark(
      limit: 2000
      filter: { frontmatter: { tags: { in: [$tag] } } }
    ) {
      nodes {
        excerpt
        frontmatter {
          title
          path
          tags
        }
      }
    }
  }
`
```

ここでは tag が該当のタグかどうかで filter をかけています。
これにより、その tag を含む記事一覧しかこのページで表示されなくなります。
またその filter の対象となるタグは \$tag として変数化されています。

そしてこの\$tag は gatsby-node.js の createPage の context に埋め込んでおけば参照できます。
[公式チュートリアル 7 章](https://www.gatsbyjs.org/tutorial/part-seven/)を参照すると、

```js
result.data.allMarkdownRemark.edges.forEach(({ node }) => {
  createPage({
    path: node.fields.slug,
    component: path.resolve(`./src/templates/blog-post.js`),
    context: {
      // Data passed to context is available
      // in page queries as GraphQL variables.
      slug: node.fields.slug,
    },
  })
})
```

として変数を埋め込むことができます。
上の例だと slug 変数をページの中で使えるようになります。
(この context という仕組みはクエリだけではなく、直接ページ内から`data.context.hoge`として読み込むこともできます。ビルド時に作ったデータをコンポーネントに繋ぎ込むためのテクニックとして使えるので覚えておきましょう。)
この仕組みを使うと、 gatsby-node が作るページごとにこの tag も置き換わることもあり、ページごとの結果はそれぞれ絞り込まれた記事の一覧が表示されるようになります。

(お願い: 単一記事取得の例がそれなのですが、\$path も変数として呼べるのはどうしてなんですかね？どうしてこれが context の登録なしで呼べるのでしょうか。Gatsby 側が標準でサポートしているだけなのですが、そのサポートをしている趣旨の記述をドキュメントで見つけることができなかったので何かしらの情報やドキュメントの場所を知っていたら教えて欲しいです。)

### tag 一覧ページ

タグの一覧ページも作りましょう。もちろん一覧ページとしてではなく一覧コンポーネントとして提供したい場合もあると思いますが、基本的には同じように考えてくれると大丈夫です。（いまはページコンポーネント以外からも GraphQL を叩ける [useStaticQuery](https://www.gatsbyjs.org/blog/2019-02-20-introducing-use-static-query/) というのがあるのでそれも覚えておこう！）

```jsx
import * as React from "react"
import { graphql, Link } from "gatsby"
import Layout from "../components/layout"
import { TagsQuery } from "../../types/graphql-types"

interface IProps {
  data: TagsQuery;
}

const IndexPage: React.FC<IProps> = ({ data }) => {
  return (
    <Layout>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h2
          style={{ fontSize: "32px", marginTop: "32px", marginBottom: "32px" }}
        >
          タグ一覧
        </h2>
        {data.allMarkdownRemark.group.map(tag => (
          <Link to={tag.fieldValue ? `/tags/${tag.fieldValue}` : "/"}>
            <div style={{ marginTop: "12px" }}>
              <a>
                {tag.fieldValue}({tag.totalCount})
              </a>
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  )
}

export const pageQuery = graphql`
  query Tags {
    allMarkdownRemark {
      group(field: frontmatter___tags) {
        fieldValue
        totalCount
      }
    }
  }
`

export default IndexPage
```

このようにタグの集約クエリを投げて(上の例だと frontmatter の tags で集約している)、その結果でタグ一覧をタグ名と集約した数で表示させてあげれば良いです。

## おわりに

いかがでしたか、意外と手間がかかるタグ機能ですが作り方はなんとなく想像できたでしょうか。
他の SSG だったり CMS だとこの手の機能がビルトインで提供されているため簡単に実現できるのですが、Gatsby の場合だと自作しないといけなく意外と手間がかかり、さらには Gatsby そのものへの理解が問われたりして、ブログを作ろうとしている人をふるい落としてしまっている関門になっていると思っていました。
この記事がその関門をくぐるために役立ってくれると嬉しいです。
