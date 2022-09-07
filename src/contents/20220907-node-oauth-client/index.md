---
path: /node-oauth2-client
created: "2022-09-07"
title: Node.js の OAuth2.0 クライアントを自作する
visual: "./visual.png"
tags: ["node.js", "oauth2.0"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## なぜ自作するか

自作したい動機は次の通りだ。

- 有名どころのライブラリは TS 実装されていない。
- 有名どころのライブラリは HTTP Client のためのライブラリを使っている。Node.js v18 を対象にするなら何も入れなくていい。
- プロダクトの認証フローで複数のフローをサポートしないなら、その目的の機能を持った関数があればそれでいい。
- **フローによっては本当にすごく単純な仕様なので手書きした方が早いし考えることが減って楽**

主な動機を一言で言うと、既存実装は歴史が長いため古いコードであり、いま作り直すともっとスマートに作れるというところにある。それに （どのライブラリにも言える話ではあるが） accessToken が欲しいだけなのにライブラリを入れていると、その依存ライブラリのバージョニング次第ではセキュリティホールになったり、そもそも node_modules のインストール時間が長くなるなど弊害もないことはない。

## OAuth2.0 のフロー

この辺りの解説は [Authlete の作者の解説動画](https://www.youtube.com/watch?v=PKPj_MmLq5E)や[記事](https://qiita.com/TakahikoKawasaki/items/200951e5b5929f840a1f)をみると一発で分かるので気になる方は見て欲しい。これには何度もお世話になった。

認証認可のフローは何パターンかあり、サービス特性によってよって使われるフローが変わる。代表的なところで言うと認可コードフローとクライアントクレデンシャルフローであろう。認可コードフローは外部サービスとの連携をしてその外部サービスのリソースを使いたい時の認証フローである。これらは外部サービスの ID/PASS を打ち込むことで連携しリソースにアクセスできるアクセストークンを発行する。認可コードフローではアクセストークンを一度に引き換えず、認可コードを経由して引き換える。なぜ認可コードを経由させるかと言うと、連携元に制御を戻すときに URL 上にアクセストークンが見えると盗まれる危険があり、それを認可コードを経由させる(token endpoint からは JSON レスポンスとしてアクセストークンを吐き出せるので、アクセストークンは URL に出てこない)ことで軽減できるからだ。（[って徳丸先生が言っていた](https://teratail.com/questions/376469)）そしてクライアントクレデンシャルフローは主にサービス間通信だったり（サービス共通の client_id, client_secret を使っている場合）、自社サービスに対する認証認可(ユーザーに client_id, client_secret を吐き出している場合)に使える。

この辺りの解説は先週末に有給を費やして認証認可サーバーそのものを自作したのでそのうちブログに書く予定だ。（スプラトゥーン３に飽きたらの話）

では今日は client credeintials flow の client を自作する。

## 仕様を確認する

OAuth2.0 の仕様は RFC6749 にあり、Client Credentials Flow は[4.4 Client Credentials Grant](https://www.rfc-editor.org/rfc/rfc6749#section-4.4) に書かれている。では一つずつ確認していこう。

> The client makes a request to the token endpoint by adding the following parameters using the "application/x-www-form-urlencoded" format per Appendix B with a character encoding of UTF-8 in the HTTP request entity-body:
> grant_type: REQUIRED. Value MUST be set to "client_credentials".
> scope: OPTIONAL. The scope of the access request as described by Section 3.3.

Client Credentials Flow では application/x-www-form-urlencoded、つまりフォームとしてボディを送る必要がある。そしてボディは grant_type=client_credentials を必要がある。

ではこのリクエストの送り主の特定、認証はどうするのであろうか。Client Credentials Grant には

> The client credentials grant type MUST only be used by confidential clients.

とあることから、[RFC6749 2.3. Client Authentication](https://www.rfc-editor.org/rfc/rfc6749#section-2.3) する必要がある。client type には public と confidential があり、confidential では client_id と client_secret が要求される。その認証方式だが、

> The authorization server MUST support the HTTP Basic authentication scheme for authenticating clients that were issued a client password.

とあるから、クライアントからすれば Basic 認証を使えると思っておけば良い。ただしエンドポイントや実装によってはリクエスト body に直接 client_id や client_secret を詰めることもできることもできる。その辺は認証認可サーバーの実装者に確認しよう。

さて Basic 認証は [RFC7617](https://www.rfc-editor.org/rfc/rfc7617) で定義されており、

> 1.  obtains the user-id and password from the user,
>
> 2.  constructs the user-pass by concatenating the user-id, a single
>     colon (":") character, and the password,
>
> 3.  encodes the user-pass into an octet sequence (see below for a
>     discussion of character encoding schemes),
>
> 4.  and obtains the basic-credentials by encoding this octet sequence
>     using Base64 ([RFC4648], Section 4) into a sequence of US-ASCII
>     characters ([RFC0020]).

要するに、`base64({client_id}:{client_secret})` で認証情報が手に入る。あとはこれを

```
Authorization: Basic xxx
```

をヘッダにつけて送ると良い。

認証認可に成功した時のレスポンスは https://www.rfc-editor.org/rfc/rfc6749#section-5.1 のような形だ。中に access_token が入っているので、これをリソース取得に使える。token_type も確認して使うべきだが、ほとんどの場合 Bearer の指定が入っているので Authorization ヘッダに Bearer ${token} をつけてあげると良い。

## Node.js で実装

では、Node.js で実装する。

まずは Basic 認証部分を作る。 Node.js では base64 は `Buffer.from().toString("base64")` で作れる。

```ts
const buildAuth = ({
  clientId,
  clientSecret,
}: {
  clientId: string;
  clientSecret: string;
}) => {
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
};
```

次に form parameter の組み立てだ。x-www-form-urlencoded はフォーム送信のときの形式だ。ただし Node.js には FormData がないので自力で組み立てる必要がある。
[MDN](https://developer.mozilla.org/ja/docs/Web/HTTP/Methods/POST) によると

> application/x-www-form-urlencoded: キーと値は、 '&' で区切られ、キーと値の組が '=' で結ばれた形でエンコードされます。キーや値が英数字以外の文字であった場合は、パーセントエンコーディングされます。このため、このタイプはバイナリデータを扱うのには向きません（代わりに multipart/form-data を使用してください）

とのことであり、これをナイーブに実装する。(MDN から引用してしまったが、application/x-www-form-urlencoded って仕様のどこに定義されているのか誰か教えて欲しい。)

```ts
const buildFormParams = (params: Record<string, string | number | boolean>) => {
  let formBody = [];
  for (const param in params) {
    const encodedKey = encodeURIComponent(param);
    const encodedValue = encodeURIComponent(params[param]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  const body = formBody.join("&");
  return body;
};
```

あとはこれらの値をトークンエンドポイントへ application/x-www-form-urlencoded 形式で送る。

```ts
const body = buildFormParams({ grant_type: "client_credentials" });
const auth = buildAuth({
  clientId: process.env.CLIENT_ID || "",
  clientSecret: process.env.CLIENT_SECRET || "",
});
const res = await fetch(`${ORIGIN}/token`, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Basic ${auth}`,
  },
  body: body,
});
const json = await res.json();
const token = json["access_token"] as string;
```

これで token が手に入る。

## まとめ

このようにとても簡単に Client Credentials flow を実装できた。認証フローによってはとても単純なのでそのためだけにライブラリを使わなくても十分に実装できる。バンドルサイズの削減や依存管理の簡略化のために皆さんも自作してみると良いだろう。
