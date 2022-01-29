---
path: /add-nullable-to-json-schema
created: "2021-12-22"
title: JSON Schema の required じゃないところに nullable をつける
visual: "./visual.png"
tags: ["json-schema"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

この記事は [sadnessOjisan Advent Calendar 2021](https://adventar.org/calendars/7015) 22 日目の記事です。書かれた日付は 1/29 です。気付いたらサボって 1 ヶ月以上経ってたました。

## これまでのあらすじ！

JSON Schema に nullable を付ける理由 は [TypeScript, JSON Schema, Ajv の組み合わせを考える](https://blog.ojisan.io/typescript-json-schema-ajv/) の問題を解決するためです。

ここに書かれている内容を簡潔にまとめると、

- Ajv は JSON Schema ベースのバリデーションライブラリ
- バリデーションした後には型が付いて欲しい
- 型をつけるためにはその型と対応した JSON Schema が必要
- その JSON Schema を手で書くのめんどくさいから型から生成したい
- 生成できるライブラリがあるが、その生成した JSON Schema は Ajv が期待する JSON Schema ではない
- その期待する形というのが required でないフィールドに nullable がついていること

という感じです。

詳しくはこちら。

- https://ajv.js.org/guide/typescript.html#utility-types-for-schemas
- https://github.com/YousefED/typescript-json-schema/issues/419

## どのように解決するか

ライブラリが生成した JSON Schema を解析して required がなければそのフィールドに `nullable` を追加するスクリプトを作りました。

- https://github.com/sadnessOjisan/nullable-adder-to-json-schema

```sh
> npx nullable-adder-to-json-schema json-schema.json > converted.json
```

## どれくらい解決した？

社内にある型定義ファイルに対して使っていますが、2 つの型定義ファイルを除いてきちんと動作しているのでほとんどのケースではカバーできそうです。

ではカバーできていない問題はどういう問題かというと

1. 配列の中の型がオブジェクトのユニオンで表現されるもの
2. 再帰

1 に関しては anyOf の扱いを僕のライブラリが考慮していないだけの問題です。なので僕がちゃんと対応すれば治るのですが、めんどくさいので anyOf を見つけたときは手で直してます。

2 に関してはそもそも JSON Schema 自体を生成できないので諦めてます。本当に再帰しない限りは再帰させないようにしましょう。

実装はサボっていますが、仕事で普通に使えているのでまあいいかという気持ちです。直してくれる人がいたら助かります。
