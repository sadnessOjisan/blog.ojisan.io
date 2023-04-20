---
path: /i-use-ajv-instead-of-zod
created: "2023-04-21"
title: zod ではなく ajv を使っている話
visual: "./visual.png"
tags: [zod, ajv]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

[encraft #2](https://knowledgework.connpass.com/event/279962/) までの間、スキーマスキーマした話をたくさん書きたい。好き好きスキーマと言いたいところだが、zod に対しては人気に対して逆張り意見的なのを持っているのでそれを書いていきたい。

OGP は Ajv ユーザーと焼肉をしたときの画像だ。網もスキーマが大事ってことですね。

## 独自性の高いスキーマを使うのは危険だと思っている

zod は便利だ。とても流行っている。その結果 [yup](https://github.com/jquense/yup) や [joi](https://github.com/hapijs/joi) で作られたものが負債扱いされているような気までする。だが思い出してほしいのだが、yup だって出てきた当初はとても便利なものとして人気があった気がする。特に [Formik](https://formik.org/) と組み合わせるのは一種のパターンになっていたような気もする。しかし最近はそれらが zod に取って代わられてしまったと思っている。エコシステムの選択や対応を見ていると zod 一強だ。

(ちなみに npm trends でみると joi 一強です。 Server FW から HTTP Client まで hapi family は至る所に生きている。)

だが、zod より便利なものが今後出たらどうなるのだろうか。zod も負債扱いされる未来が来るような気がしている。これまでの傾向からしてユーザーはスキーマライブラリを気軽に乗り換えていく。だが僕はスキーマには本当に長生きしてほしい（後でマジで首絞まるので・・・）。なので長生きするような技術選定をしたい。

## 長生きするスキーマ

zod に限らず正直なところ何を使っても負債扱いされると思っているので、移植性を重きに置いた技術選定をしようと思った。そこで JS/TS に依存しない IDL として

- JSON Schema
- GraphQL
- protobuf

などが良いと思っている。このうち自分は表現力の都合で JSON Schema を使うことが多く、その validator として Ajv を使っている。

**長生きしてほしい、だから僕は JSON Schema を使い続ける。**

## zod が嬉しいとき

一方で zod が得意なことや zod にしかできないこともある。例えば zod は クラスなど、plain でないもののバリデーションがしやすい。また TS first なのを生かして [Brand 型の対応](https://github.com/colinhacks/zod#brand)などもできる。

もしかしたら今は Ajv もできるかもしれない(実際できるけど型推論が大変なことになる)が [zod は再帰型のバリデーションもできる](https://github.com/colinhacks/zod#recursive-types)。そして[Firestore に対する Validation は zod 一択](https://blog.ojisan.io/firestore-schema-with-zod)だと思っている。

zod も最高！なので結局は何を使う時はその時にあったものを使いましょう（完）
