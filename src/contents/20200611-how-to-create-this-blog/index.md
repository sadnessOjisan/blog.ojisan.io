---
path: /this-blog-build-stack-1st
created: "2020-06-10"
title: Gatsby + TypeScript で技術ブログを書くために
visual: "./babel.jpeg"
---

Babel のソースコード変換において、「ソースコードを AST に変換した後に、AST から AST へ変換し、その AST をコードに戻している」という話は聞いたことがあるでしょうか？
どうやら公式ドキュメントからはそのような説明を見つけられないのですが、識者的にはそうらしいです。

![ASTを使った変換](./tree.png)

とはいえ自分としてはあまり信じられなく、というのも Babel はソースコードを入れたら ES5 を吐く魔法の箱という認識が強いからです。
そこで Babel を読んでみて、そのような変換をしているのか確かめてみたいと思います。

```javascript:title=test.js
import * as React from "react"
import { graphql } from "gatsby"
import { Link } from "gatsby"
import "../vendor/css/reset.css"
import Layout from "../components/layout"
import Image from "../components/image"
import SEO from "../components/seo"
import { AllBlogsQuery } from "../../types/graphql-types"

interface IProps {
  data: AllBlogsQuery;
}

const IndexPage: React.FC<IProps> = ({ data }) => (
  <Layout>
    <SEO title="Home" />
    {data.allMarkdownRemark.nodes.map(node => (
      <Link to={node.frontmatter?.path || "/"}>{node.frontmatter?.title}</Link>
    ))}
  </Layout>
)
```
