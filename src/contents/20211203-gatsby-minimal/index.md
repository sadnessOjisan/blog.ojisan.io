---
path: /gatsby-minimumconfiguration
created: "2021-12-03"
title: Gatsby の最小構成
visual: "./visual.png"
tags: ["Gatsby"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

この記事は [sadnessOjisan Advent Calendar 2021](https://adventar.org/calendars/7015) 3 日目の記事です。

Gatsby でプロジェクトを始めるとき、`gatsby init` すると大量の依存を突っ込まれるのでそれを避ける Tips として、Gatsby の最小構成を紹介します。

と言ってもやることは簡単、src/pages にコンポーネントを作るだけです。

## 最小構成の作り方

1. npm で react, react-dom, gatsby を入れる
2. src/pages を作り、ページコンポーネントを入れる
3. `npx gatsby build`

サンプルコード: https://github.com/sadnessOjisan/gatsby-min

## いかがでしたか

いかがでしたか？
