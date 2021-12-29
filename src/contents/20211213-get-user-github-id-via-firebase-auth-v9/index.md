---
path: /get-user-github-id-via-firebase-auth-v9
created: "2021-12-13"
title: Firebase Authentication で GitHub ID を取得する
visual: "./visual.png"
tags: [Firebase]
userId: sadnessOjisan
isFavorite: false
isProtect: true
---

この記事は [sadnessOjisan Advent Calendar 2021](https://adventar.org/calendars/7015) 13 日目の記事です。書かれた日は 12/28 です。

## GitHub ID を取り出したい

Firebase を使った GitHub 認証を考えます。
公式のサンプル通りに作ればこのようなコードになるでしょう。

```js
import { getAuth, signInWithPopup, GithubAuthProvider } from "firebase/auth";

const auth = getAuth();
signInWithPopup(auth, provider).then((result) => {
  // The signed-in user info.
  const user = result.user;
  // ...
});
```

FYI: https://firebase.google.com/docs/auth/web/github-auth

この user の中身を見てみます。
そのままこの変数の型定義情報を見てみます。
そうすると UserInfo 型を継承していることがわかります。
そのフィールドを見てみます。

```ts
/**
 * User profile information, visible only to the Firebase project's apps.
 *
 * @public
 */
export declare interface UserInfo {
  /**
   * The display name of the user.
   */
  readonly displayName: string | null;
  /**
   * The email of the user.
   */
  readonly email: string | null;
  /**
   * The phone number normalized based on the E.164 standard (e.g. +16505550101) for the
   * user.
   *
   * @remarks
   * This is null if the user has no phone credential linked to the account.
   */
  readonly phoneNumber: string | null;
  /**
   * The profile photo URL of the user.
   */
  readonly photoURL: string | null;
  /**
   * The provider used to authenticate the user.
   */
  readonly providerId: string;
  /**
   * The user's unique ID, scoped to the project.
   */
  readonly uid: string;
}
```

ありました、displayName です。
なので、ここを見れば良いと良さそうです。

が、実はこれは GitHub ID ではありません。

なぜなら GitHub では ID と Name が別のものだからです。

![GitHub](./gh.png)

今回の例だと、display name を通して得られるのは Oji san の方です。

## scope 追加で id を取得できる

OAuth には scope というものがあり、アプリに対してユーザーのリソースのどこまでに許可を渡せるかを指定できます。
GitHub ID であれば、`read:user` が必要となります。

```ts
const ghProvider = new GithubAuthProvider();
ghProvider.addScope("read:user");
```

こうすれば user 情報に GitHub の ID が含まれます。
それは `user.additionalUserInfo.userName` として取得できます。

FYI: https://firebase.google.com/docs/reference/unity/class/firebase/auth/additional-user-info?hl=ja

しかし、2021/12/28 現在、この方法は使えません。

## Firebase v9 の仕様変更

https://github.com/firebase/firebase-js-sdk/issues/5257 によると V9 からはやり方が変わっているようです。

getAdditionalInfo という関数を呼び出すことで取得できるとのことです。

```js
signInWithPopup(firebaseAuth, provider)
  .then((result) => {
    const details = getAdditionalUserInfo(result);
    console.log(result);
    console.log(details);
  })
  .catch((error) => {
    console.log(error);
  });
```

Firebase v9 はパフォーマンス上いろいろと嬉しいですが、メソッドチェーンができないのであらかじめ関数名を覚えておく必要があり大変ですね。
