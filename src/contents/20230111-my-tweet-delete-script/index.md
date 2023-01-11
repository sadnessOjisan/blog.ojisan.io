---
path: /my-tweet-delete-script
created: "2023-01-11"
title: 自分のツイートを全消しするスクリプト
visual: "./visual.png"
tags: [twitter, nodejs]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## tldr

- Twitter Developer Platform で API キーを発行
- 下記コードを実行

```js
import dotenv from "dotenv";
import Twitter from "twitter";

dotenv.config();

const client = new Twitter({
  consumer_key: process.env.APIKEY,
  consumer_secret: process.env.SECRET,
  access_token_key: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
});

client.get(
  "statuses/user_timeline.json?screen_name=sadnessOjisan&count=200",
  (error, tweets, response) => {
    if (error) throw error;
    // console.log(
    //   tweets.map((a) => ({
    //     text: a.text,
    //     id: a.id_str,
    //   }))
    // );
    tweets.forEach((t) => {
      console.log(t.id);
      client.post(`statuses/destroy/${t.id_str}.json`, (err, tweets, res) => {
        console.log(err);
      });
    });
  }
);
```

.env も `process.env.***`にあるものを使ってください。
.env めんどくさかったらハードコーディングしてもいいとは思います。

## Twitter Developer Platform での設定

自分のツイートを消すためにはまず <https://developer.twitter.com/en> で開発者用アカウントを発行してください。そしてアプリ登録（ここではツイート削除アプリを作るという設定）をしたら API キーが発行されて、自由にアカウントを API 経由で触ることができます。

### v1 か v2 か

v2 にはレートリミットがあるようです。<https://developer.twitter.com/en/docs/twitter-api/rate-limits> によると 15 分で 50 件しか削除できないようです。

なので v1 を使いましょう。[node-twitter](https://github.com/desmondmorris/node-twitter) というライブラリは v1 のクライアントを提供します。

### key 発行

自分だけが使う場合、レートリミットに引っかかることもないと思うので開発者用キーだけ発行すれば良いです。これは審査なしで取得できます。

### どのキーを使うか

- API Key and Secret
- Access Token and Secret

[node-twitter](https://github.com/desmondmorris/node-twitter) で

```js
const client = new Twitter({
  consumer_key: process.env.APIKEY,
  consumer_secret: process.env.SECRET,
  access_token_key: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
});
```

として使ってください。

## 実装

### API Doc

- https://developer.twitter.com/en/docs/twitter-api/v1

### 設計

自分のタイムラインからツイート取得して順番に消していきます。

取得 API の Doc: https://developer.twitter.com/en/docs/twitter-api/v1/tweets/timelines/api-reference/get-statuses-user_timeline

これによると 200 件ずつしか取得できないです。
15 分の rate limit が 900 回なので、900 \* 200 = 180,000 ツイートしか一気に消せないです。
なのでツイートが多い人は注意しましょう。
開発アカウントじゃなくて審査うける必要があるかもしれないです。

削除 API の Doc: https://developer.twitter.com/en/docs/twitter-api/v1/tweets/post-and-engage/api-reference/post-statuses-destroy-id

レートリミットはあるが書かれていないです。
ただ質問はフォーラムでされており、

https://twittercommunity.com/t/where-are-the-destroy-rate-limits/62406 によると、

> As we’ve explained several times 42 (but not documented clearly enough, and I’ve been promising to work on this for over a year… sorry), the rate limits for non-read actions are part of the limits associated with user accounts, not with application access. Therefore, we don’t return them in the rate limit endpoint, or in the more useful x-rate-limit headers.
>
> Generally if there is no limit documented anywhere then the default is 15 calls per window, as at the end of this page 63. There’s also a statement to be aware of at the end of the Automation Rules and Best Practices page 91 relating to automated deletion.
>
> Sorry not to be more specific.

とのことです。

う〜ん、アカウントによるからわからんということですね！！！ただ 40000 ツイートくらいは一瞬で消すことができましたのでそれくらいなら問題ないと思います。

## おわりに

ガンガン消して不用意な発言していこうな
