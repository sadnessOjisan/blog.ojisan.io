---
path: /firebase-admin-init
created: "2020-11-25"
title: 柔軟に firebase admin を初期化する
visual: "./visual.png"
tags: ["Firebaase"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

毎回やり方を調べている気がするシリーズです。

[firebase-admin](https://www.npmjs.com/package/firebase-admin) を初期化する際、[サーバーに Firebase Admin SDK を追加する](https://firebase.google.com/docs/admin/setup) を見ると、

```js
var admin = require("firebase-admin")
var app = admin.initializeApp()
```

や、

```js
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://<DATABASE_NAME>.firebaseio.com",
})
```

として初期化されています。

しかし、この初期化方法だと困ることがあります。

例えば前者では、initializeApp の引数がなくこれは[default service account](https://cloud.google.com/docs/authentication/production)が読み込まれる GCP 上でしか動作しないコードです。
そして後者は予め環境変数`GOOGLE_APPLICATION_CREDENTIALS`にサービスアカウント情報を持った json ファイルへのパスを指定しておく必要があり、GitHub への PUSH をトリガーに Vercel などにデプロイする時には実現しづらい方法だったりします。(使用する PaaS によっては credential 情報を.git で管理する必要があるから)

## initializeApp に認証情報を渡すことで初期化する。

そこで GCP 以外の PaaS にデプロイする方法を紹介します。

`admin.initializeApp` に [Credential](https://firebase.google.com/docs/reference/admin/node/admin.credential.Credential-1?hl=en) を渡せば初期化できるので、それを作って渡すと認証を通せます。
つまりサービスアカウント情報が書かれた json ファイルに書かれている内容をそのまま渡せば良いです。

そして、その Credential は [cert](https://firebase.google.com/docs/reference/admin/node/admin.credential?hl=en#cert)から作れます。

```js
const cert = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
}
admin.initializeApp({
  credential: admin.credential.cert(cert),
})
```

firebase のサービスアカウントの認証情報は projectId, clientEmail, privateKey 以外にもたくさんありますが、 cert が受け取る [ServiceAccount](https://firebase.google.com/docs/reference/admin/node/admin.ServiceAccount)は、projectId, clientEmail, privateKey で構成されているのでこの 3 つだけ渡してください。

replace 以下はエスケープ避けを回避するための処理です。

FYI: https://stackoverflow.com/questions/50299329/node-js-firebase-service-account-private-key-wont-parse

## まとめ

- firebase admin を使うためには `admin.initializeApp()` を実行する必要がある
- GCP 以外にデプロイ・key file をデプロイ環境に含めない場合は、`Credential` を `initializeApp` に渡して初期化
- `Credential` は `admin.credential.cert` に projectId, clientEmail, privateKey を渡すと作れる。

## 参考文献

- https://firebase.google.com/docs/reference/admin/node/admin?hl=en#initializeapp
- https://firebase.google.com/docs/reference/admin/node/admin.AppOptions?hl=en
