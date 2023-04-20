---
path: /firestore-schema-with-zod
created: "2023-04-21"
title: firestore を zod でバリデーションする
visual: "./visual.png"
tags: [zod, firebase, firestore]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

[encraft #2](https://knowledgework.connpass.com/event/279962/) までの間、スキーマスキーマした話をたくさん書きたい。

OGP は昨日食べた火鍋だ。Fire 感があるのでこれを使おうと思った。（[Firebase の記事を書く時は炎の画像を使っていた](/tags/firebase/)のに、炎系のフリー素材をたくさん使いすぎて似た画像ばかりになりストックがなくなったことは秘密）

## firestore は withConverter で validation できる

なんか似たようなブログを書いた気がしていたのだが、どうやら [firestore の入出力に型をつける](https://blog.ojisan.io/typed-firestore/) で `withConverter` を紹介していた。なので詳しくはそれを見てほしい。

```tsx
export const sitemapConverter: FirestoreDataConverter<SitemapSchema> = {
  toFirestore(sitemapDto: SitemapSchema): DocumentData {
    const record: SitemapSchema = {
      origin: sitemapDto.origin,
      url: sitemapDto.url,
      created_at: sitemapDto.created_at,
      updated_at: sitemapDto.updated_at,
    };
    const parsed = sitemapSchema.parse(record);
    return parsed;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): SitemapSchema {
    const data = snapshot.data();
    const parsed = sitemapSchema.parse(data);
    return {
      url: parsed.url,
      origin: parsed.origin,
      updated_at: parsed.updated_at,
      created_at: parsed.created_at,
    };
  },
};
```

さて、先の例ではしれっと sitemapSchema という zod schema が登場しているのだが、この fromFirestore で validation すれば firestore からの戻り値を検証して型を付けられる。

## Firebase 独特のものをバリデーションしたい

で、number やら string を firestore に入れている限りでは普通に zod の `z.string()` `z.number()` を使うだけでスキーマを定義できるのだが、firestore の組み込み型には Timestamp や Reference 型といったものが登場する。そしてこれは利用することがほぼ確定しているようなものだ。頑張ってこれのスキーマを定義しよう。

### Timestamp

Firestore における日付表現だ。この型でデータを保存しておくと日付順のソートができるようになるので重宝する。

Timestamp は Date 型とはまた違うので `z.date()` ができない。そこで `z.instanceof` を使おう。

```tsx
z.instanceof(Timestamp);
```

FYI: [https://github.com/colinhacks/zod#instanceof](https://github.com/colinhacks/zod#instanceof)

### DocumentReference

DocumentReference は別 collection の Document に対する参照だ。ドキュメント ID だけ文字列で保存していると、そのドキュメントにたどり着くまでのパスを作らないといけないが、参照を保存しておけば一発でそのドキュメントまで辿れる。それを実現する特別な型が DocumentReference だ。テーブルの正規化などでとくにお世話になるだろう。

これも instanceof なんていう便利なものがあれば DocumentReference に対しても型を付けられそうだ。が、実は使えないのである！

FYI: [https://stackoverflow.com/questions/74346759/use-zod-to-validate-schema-with-firestore-documentreferences-in-it-with-default](https://stackoverflow.com/questions/74346759/use-zod-to-validate-schema-with-firestore-documentreferences-in-it-with-default)

実は private constructor を持っている物に対してはこの手法は使えないのである。どうやら `FieldValue` に対しても同様の問題があるようだ。(え、constructor が private ってなんやねんと思った方は Static Factory Method を調べたり [Effective Java](https://www.maruzen-publishing.co.jp/item/?book_no=303408) の第 1 章を読んでみよう)

FYI: [https://github.com/colinhacks/zod/issues/384](https://github.com/colinhacks/zod/issues/384)

こうなると無理やりに突破するしかない。そこで refine の出番である。僕も最近まで知らなかったのだが篩型のサポートがあった。といってもここでは篩篩したようなことはせず、any 型で一旦型検査をパスさせて、JS 本来の instanceof で検証して通ればユーザー定義ガードで型を付けさせる。refine がそういう API なのでそうする。

```tsx
page_ref: z.any().refine(
  (x: object): x is DocumentReference => x instanceof DocumentReference
);
```

便利〜〜〜

zod は最悪の場合に TS の世界で型を付けられるのは便利ですね。Ajv にはできない芸当だ・・・

## 最後に

ここまで書いておいてアレですが、同日に 「[zod 使わない！](/i-use-ajv-instead-of-zod)」というブログ書いているので読んでみてください。
