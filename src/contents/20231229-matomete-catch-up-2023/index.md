---
path: /matomete-catch-up-2023
created: "2023-12-29"
title: 今年サボった勉強を冬休みで全部取り戻す計画
visual: "./visual.png"
tags: [雑記]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

どうも、仕事を納めてしまうと、何も予定がない人になってしまった人です...

てなわけで、公式ドキュメント、リリースノート、信頼できる情報源全部読んじゃうぞという計画を立てました。計画倒れしないようにちゃんと読むことをブログで宣言します！

## 何をするのか

マジでやること何もないので、日頃サボったプログラミングの勉強を一気にしようと思っている。「勉強していない」なんていうと「嘘つけ」と言われそうだが、いつも必要になったことをその都度調べて誤魔化しているだけであり、読むのは本や記事といった誰かの二次三次情報なので、実は一次情報には触れていない。なので以下に挙げるドキュメントは実はちゃんと読んだことがない。全て雰囲気で使っている。

そのため自分は歳の割には未知になっている範囲がとても多く（この構文ってフリーレンぽくてなんかかっこいいよね）、未知の未知にとても弱いため、わかっている人から見るとおかしなコードを書いたり設計していることがよくある。その弱点をいい加減潰すぞという計画なのである。

## レギュレーション

と、言うのを毎年考えているのだが、大体遊んでいる（これは遊びに誘う人間やゲーム会社が悪いと思っている）ので、今回はサボらないようにブログで宣言し、その上でレギュレーションを決める。

そのレギュレーションとは、冬休み中毎日ドキュメントを読んで、自分にとっての Today I Learned を毎日ブログにしていくと言うことだ。読む順番などのスケジュールは決めていないが、毎日読んで、寝る前か寝起きに記事を上げていく。サボっていたら突いてください。

読むドキュメントは以下の通り。基本的には一次情報だが、質の良い二次情報も「あとで読む」に入っているものがたくさんあるのでそれを消化していく。

## 読むもの

### HTML

一次情報なら仕様を読めと思ったかもしれないが、読む体力ないしコスパを考えると読むべきはMDNとweb.devな気がした。知らないタグや属性は絶対にあるのと、コンテンツモデルの関係が完全に頭に入っていないのでそれを復習したい。あと A11y も雰囲気でしか知らないのでこの機会に読む。

- https://developer.mozilla.org/ja/docs/Web/HTML
- https://web.dev/learn/html
- https://web.dev/learn/accessibility
- https://web.dev/learn/images
- https://web.dev/learn/forms
- https://developer.mozilla.org/ja/docs/Web/Accessibility

### CSS

これも知らない属性がたくさんあるはずなのでそれを埋めたい。あと transition, transform, keyframe がごちゃごちゃになっているので整理したい。あと CSS Scope はそろそろ調べておきたい。

- https://developer.mozilla.org/ja/docs/Web/CSS
- https://web.dev/learn/css

### JS

普段使っているメソッドしか知らないので総復習する。Arrayとか怪しい。PromiseとESM周りは完全に怪しいので復習したい。

- https://developer.mozilla.org/ja/docs/Web/JavaScript
- https://zenn.dev/estra/books/js-async-promise-chain-event-loop
- https://speakerdeck.com/qnighy/hands-on-native-esm-at-jsconf-jp-2022
- https://web.dev/learn/performance

### Git

知らないコマンドとオプションだらけだと思うので読む。

- https://git-scm.com/doc

### TypeScript

実は TypeScript を TypeScript として勉強したことがないので、初めて公式を読んでみる。tsconfig の設定もかなり怪しいので復習したい。あと 3.4 あたりからリリースノートも読んでいないのでリリースノート追いかけたい。

- https://www.typescriptlang.org/docs/
- https://devblogs.microsoft.com/typescript/

### Node.js

散々非同期ランタイムの記事を書いておきながら、実は Node.js の仕組みは何も知らない。libuv がコアなことしか知らない。いい加減勉強してみる。

- https://hiroppy.me/blog/nodejs-event-loop/

### React

React 18 以降かなり怪しい。レビューのために勉強はしていたが、包括的にはやれていないので一旦全部ドキュメントとブログを読んでみる。あと、有名なブログ記事も読む（昔読んだけど今読むと違う収穫がありそう）。

- https://react.dev/reference/react
- https://react.dev/blog
- https://overreacted.io/a-complete-guide-to-useeffect/
- https://react.dev/learn/you-might-not-need-an-effect
- https://speakerdeck.com/recruitengineers/react-2023

### Next

App Router以降かなり怪しいのでまずは公式とブログを全部読む

- https://nextjs.org/docs
- https://nextjs.org/blog

### libs & toolchain

普段使っているライブラリのドキュメント、実は読んでないのでこれを機に読んでみる。

- https://recoiljs.org/docs/introduction/installation
- https://react-hook-form.com/
- https://tailwindcss.com/docs/installation
- https://mswjs.io/
- https://jestjs.io/ja/
- https://eslint.org/
- https://playwright.dev/

### HTTP

実は怪しいのでそう復習したい。来年はVCLを書く予定があるので今のうちに復習をば。

- https://developer.mozilla.org/ja/docs/Web/HTTP

### VCL

来年はFastlyでVCLをガッツリ書く予定があるので今のうちに復習をば。

- https://docs.fastly.com/ja/guides/
- https://developer.fastly.com/reference/

### GraphQL

何も理解せずに使い続けているのでいい加減知りたい。真面目な話として、GraphQL自体の仕様が何なのか知らない（知らない人の方が大多数だとは思っているけど...）

- https://graphql.org/learn/
- https://spec.graphql.org/

gRPC も同じ怪しさを抱えているのだけど、来年は GraphQL の方が多そうなので GraphQL 有線で勉強する。

### OpenTelemetry

マジで何も理解せずに雰囲気で使っているので一旦ドキュメントを読む。

- https://opentelemetry.io/docs/

### GCP

これもかなり雰囲気で使っているので一応全部読んでおきたい。特に CloudRun と GKE と VPC と IAM と gcloudコマンド

- https://cloud.google.com/docs?hl=ja

### Docker

公式ドキュメント読んだことないので読んでおきたい

- https://docs.docker.com/get-started/overview/
- https://docs.docker.com/reference/

### その他

時間があったら k8s, ArgoCD, Prometheusあたりも読みたいけど、流石に時間が足りなさそうなのでこれは後回し。

あと、これ読め的なのがあると教えて欲しいです。
