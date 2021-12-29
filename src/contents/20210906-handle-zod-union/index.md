---
path: /handle-zod-union
created: "2021-09-06"
title: zod で union をハンドリングする時に知っとくと良いこと
visual: "./visual.png"
tags: ["zod"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

どうも、schema validation library での union の扱いが苦手マンです。とはいえ zod ではそんなにひどい目に合わず結構気に入っていて、使っていて身につけた手癖のようなものを紹介します。

## エラーの読み方

早速次のような schema で parse してみましょう。

```ts
import { z } from "zod";
const leftSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const rightSchema = z.object({
  pid: z.number(),
  user_id: z.number(),
});

const schema = z.union([leftSchema, rightSchema]);

const validate = (data: unknown) => {
  return schema.safeParse(data);
};
```

わざと失敗させてみます。

```ts
console.log(validate(3));
```

```json
{
  success: false,
  error: ZodError: [
    {
      "code": "invalid_union",
      "unionErrors": [
        {
          "issues": [
            {
              "code": "invalid_type",
              "expected": "object",
              "received": "number",
              "path": [],
              "message": "Expected object, received number"
            }
          ],
          "name": "ZodError"
        },
        {
          "issues": [
            {
              "code": "invalid_type",
              "expected": "object",
              "received": "number",
              "path": [],
              "message": "Expected object, received number"
            }
          ],
          "name": "ZodError"
        }
      ],
      "path": [],
      "message": "Invalid input"
    }
  ]
}

```

unionErrors というところにどの型にあてはめたときにどのようなエラーが出るかが表示されます。Left, Right 両方ともで失敗しているので両方ともにエラーが出ます。これは中途半端に Left に当てはまっている型での失敗においても、Right に当てはめたときのエラーが出ます。

```ts
console.log(validate({ id: 2, name: 3 }));
```

```json
{
  success: false,
  error: ZodError: [
    {
      "code": "invalid_union",
      "unionErrors": [
        {
          "issues": [
            {
              "code": "invalid_type",
              "expected": "string",
              "received": "number",
              "path": [
                "name"
              ],
              "message": "Expected string, received number"
            }
          ],
          "name": "ZodError"
        },
        {
          "issues": [
            {
              "code": "invalid_type",
              "expected": "number",
              "received": "undefined",
              "path": [
                "pid"
              ],
              "message": "Required"
            },
            {
              "code": "invalid_type",
              "expected": "number",
              "received": "undefined",
              "path": [
                "user_id"
              ],
              "message": "Required"
            }
          ],
          "name": "ZodError"
        }
      ],
      "path": [],
      "message": "Invalid input"
    }
  ]
}
```

Left に当てはめたときは name の型がおかしいと表示されますが、 Right に当てはめたときはそもそも key が違うので、key の数だけ issue が出ています。

これはシンプルな例なので当たり前のような話に見えますが、もし Union が増えてさらにオブジェクトのネストが膨らんでいくと、それにつれてこのエラーのログも増えていくので、どこにエラーがあるのか探すのかが難しくなります。そのためエラーを読むためには、どの Union で失敗しそうかはある程度自分の頭であたりをつけて読む必要があります。ファイト！

## 型の narrowing

さて、parser に成功したとします。

```ts
const parsedData = validate({ id: 2, name: "hoge" });
if (parsedData.success) {
  // parsedData.success から id を取り出したい
}
```

例では Left の例を与えましたが、これを型安全に取り出すにはどうしたらいいでしょうか。取り出す専用の関数を作ったり is で無理やり型をつけても良いですが、こういうときは in を使うのが良いでしょう。

```ts
const parsedData = validate({ id: 2, name: "hoge" });
if (parsedData.success) {
  if ("id" in parsedData.data) {
    const left: Left = parsedData.data;
  } else if ("pid" in parsedData.data) {
    const right: Right = parsedData.data;
  }
}
```

これでその該当の型にしかない key を指定すれば型を振り分けられます。万が一双方に含まれる key を指定してしまっても良いように、念のため僕は `const left: Left = parsedData.data;` のような型注釈を与えられるクッションを用意しています。このクッションがあれば万が一割り振りに失敗した時にコンパイルでエラーが出るので安心です。
Left 型は

```ts
type Left = z.infer<typeof leftSchema>;
```

といった infer 機能で schema から作り出せます。

zod では 独自の schema 定義を正として TS の型を作り出せます。

※ 個人的にこの点に関しては 既存の型を JSONSchemaType 注釈を schema に振って、schema 自体が型と整合するかを検査できる(いわば型を正として考えられる) [ajv](https://ajv.js.org/) の方が好きだったりします。
