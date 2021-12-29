---
path: /firebase-functions-on-call
created: "2021-12-10"
title: firebase functions の onCall で CORS が出るときの対処
visual: "./visual.png"
tags: ["firebase"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

ふぁっ、ふぁっ、ふぁーーんっくしょん！

この記事は [sadnessOjisan Advent Calendar 2021](https://adventar.org/calendars/7015) 10 日目の記事です。
書かれた日付は 12/18 です。
8 日サボったのはさすがにやりすぎた。

今日は onCall についてです。
onCall を使ったときに CORS で怒られることがある。

```
Access to fetch at 'https://asia-northeast1-nensyu-match-development.cloudfunctions.net/hoge' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: Redirect is not allowed for a preflight request.
```

## onCall とは

Firebase Functions, Cloud Functions は文字通り Function 単位でデプロイできる、FaaS である。そのため基本的には HTTP 経由で関数を実行する。しかしこれらには JS 用の SDK が用意されていて、HTTP を使わずにライブラリ経由で関数を実行できる。

```ts
const functions = getFunctions(app, "asia-northeast1");

export const addUserData = httpsCallable(functions, "xxx");

addUserData({ name: "yosuke", age: 17 });
```

## なにが嬉しいか

この記法を使うことによる嬉しさは、自分でしないといけない手癖をもろもろやってくれることだ。例えば、認証や CORS があげられる。

認証を例に挙げると、これまではクライアント側で idToken の生成と header の追加をして、その token の decode として Function 側で

```ts
const match = req.headers.authorization?.match(/^Bearer (.*)$/);
if (match === undefined || match === null) {
  throw new Error("authed err");
}
const idToken = match[1];
admin.auth().verifyIdToken(idToken);
```

のような処理を書く必要があったが、それが onCall があれば

```ts
context.auth.uid;
```

だけで済む。

このように便利だが、なぜが CORS エラーがよく発生する。その理由や対策について。

## CORS のエラーじゃなくても CORS のエラーが出ているだけ

CORS が原因で出ているのではなさそうです。存在しない関数を呼ぶとそのようなエラーが出ているようです。

### 存在しない関数名

```ts
export const route = functions
  .region("asia-northeast1") // TODO: 関数の先頭は共通化できそう
  .https.onCall(async (data, context) => {
  }
```

として定義したのに、

```ts
const functions = getFunctions(app, "asia-northeast1");

export const root = httpsCallable(functions, "xxx");

root({ name: "yosuke", age: 17 });
```

と route と root でタイポすると、

```
Access to fetch at 'https://asia-northeast1-nensyu-match-development.cloudfunctions.net/hoge' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: Redirect is not allowed for a preflight request.
```

のようなエラーが発生。

### Region

onCall ではデプロイするリージョンを指定できますが、その指定先と実際のリクエストの region が異なると CORS のエラーが発生。

```ts
const functions = getFunctions(app); // 指定しないとデフォルトリージョンがセットされアメリカにリクエストが飛ぶ

export const root = httpsCallable(functions, "xxx");

root({ name: "yosuke", age: 17 });
```

## まとめ

落ち着いて、ゆっくり。
