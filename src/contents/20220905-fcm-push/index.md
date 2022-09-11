---
path: /fcm-push
created: "2022-09-05"
title: FCM で実現する Web push 通知 の解説
visual: "./visual.png"
tags: ["firebase", "web push", "fcm"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## なにを作ったか

それは秘密です。とある何かを作ったのですが、公式から DM で怒られたので公開を停止しています。その供養も兼ねて、そのときの学びを書いていきます。

## Web の Push 通知についての全体的な解説

### 通知と Push

さて、Push 通知がされると、ブラウザがそれを受け取ってデスクトップだったり、アプリケーション内に通知を表示できます。

実はこれらは１つの仕様で定義されているのではなく、通知 API と Push API という 2 つの仕様で構成されています。

#### Notification API

通知を表示する仕組みが[Notification API](https://developer.mozilla.org/ja/docs/Web/API/Notifications_API/Using_the_Notifications_API)です。

#### Push API

通知を受け取る仕組みが[Push API](https://developer.mozilla.org/ja/docs/Web/API/Push_API)です。

これは、

> アプリがプッシュ通知メッセージを受信するために、アプリでサービスワーカーが動作している必要があります。サービスワーカーが動作している時に、 PushManager.subscribe() を利用してプッシュ通知に加入することができます。

とある通り、サービスワーカーを前提としています。そのためサービスワーカー側にコードを書く必要があり、その設定も必要です。

### Push 通知が届くまで

詳しくは <https://laboradian.com/web-push/> にある図を見ると良いと思いますが、Push 通知は各ブラウザベンダの Push Service に指示することで送らせることができます。

そこでブラウザが SW で Push 機能を有効にして、各ブラウザごとの Push Service からの通知の subscribe を ON にし、そのときにもらえる個人の識別情報などの resource を開発者のアプリケーションサーバーなどで受け取り、Push を送るときはその resource をもとに個人を特定したりしてメッセージを送るという流れです。

だいたいこんな感じです。なんでこんないい加減に説明を省いているかというと、こと今回においては FCM がその辺を全部まるっとしてくれるからです。この辺りの仕組みはいつか FCM 抜きで自作するときに紹介します。

## FCM で通知を送る

では、[Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging) を使ったやり方を説明します。Firebase プロジェクトのセットアップは完了しているものとします。

### フォアグラウンド通知

先にコードの全容を書いておきます。

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <link rel="manifest" href="./manifest.json" />
  </head>
  <body>
    <div id="message">hoge</div>
    <script type="module">
      import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-app.js";
      import {
        getMessaging,
        getToken,
        onMessage,
      } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-messaging.js";
      import {
        getFirestore,
        collection,
        setDoc,
        doc,
      } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-firestore.js";

      document.addEventListener("DOMContentLoaded", function () {
        const firebaseConfig = {
          apiKey: "hoge",
          authDomain: "hoge",
          projectId: "hoge",
          storageBucket: "hoge",
          messagingSenderId: "xxx",
          appId: "www:xxx:zzz:yyy",
          measurementId: "x-xxxxx",
        };

        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);
        const db = getFirestore(app);

        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            onMessage(messaging, (payload) => {
              console.log("Message received. ", payload);
            });
            getToken(messaging, {
              vapidKey: "vapidKey_hoge_hoge",
            })
              .then((currentToken) => {
                if (currentToken) {
                  setDoc(doc(db, "token", currentToken), {
                    token: currentToken,
                  })
                    .then((ref) => {
                      console.log(ref);
                    })
                    .catch((err) => console.log(err));
                } else {
                  // Show permission request UI
                  console.log(
                    "No registration token available. Request permission to generate one."
                  );
                  // ...
                }
              })
              .catch((err) => {
                console.log("An error occurred while retrieving token. ", err);
                // ...
              });
          }
        });
      });
    </script>
  </body>
</html>
```

#### SDK module の import

今回、手抜きのために TypeScript や module bundler すら使っていないです。そうなると ESM 形式で配布されているライブラリが使えないです。ただ、ESM 形式のものは v9 で最新版であり、ドキュメントもそちら前提になっていることが増えているので v9 を使いたかったです。そのため CDN 経由で v9 を ESM 形式で import しています。

```js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-app.js";
import {
  getMessaging,
  getToken,
  onMessage,
} from "https://www.gstatic.com/firebasejs/9.9.3/firebase-messaging.js";
import {
  getFirestore,
  collection,
  setDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/9.9.3/firebase-firestore.js";
```

そのためこれらのコードを読み込む script tag は `<script type="module">` とあるように `type=module` をつけます。

#### token の取得

次に、通知の許可を取ります。

```js
Notification.requestPermission().then((permission) => {
    }
```

そして許可が取れたら、通知をフォアグラウンドで受け取った時の処理を登録します。

```js
Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            onMessage(messaging, (payload) => {
              console.log("Message received. ", payload);
            });

          }
```

その通知は token を指定して個人に送られるので、その token も取得します。その token は送信時にも使うので firestore に保存しています。

token を取得するときに指定している vapidKey は、firebase のコンソールで取得できます。この VAPID(Voluntary Application Server Identification) はいわばなりすましを防ぐための公開鍵認証を利用したフローです。つまり vapidKey は公開鍵です。あらかじめ公開鍵をブラウザベンダの Push Service に登録しておくことで、秘密鍵を使って Push 通知を署名すれば、それを Push Service が妥当かどうか判断できてなりすましを防げるといった仕組みです。<https://developer.mozilla.org/ja/docs/Web/API/PushManager/subscribe> を見れば公開鍵を登録している箇所がわかります。

詳しくは仕様の他にも <https://zenn.dev/tomokisato/articles/f82dcf5a4850a1> にまとまっています。

```js
getToken(messaging, {
  vapidKey: "vapidKey_hoge_hoge",
})
  .then((currentToken) => {
    if (currentToken) {
      setDoc(doc(db, "token", currentToken), {
        token: currentToken,
      })
        .then((ref) => {})
        .catch((err) => console.log(err));
    } else {
    }
  })
  .catch((err) => {});
```

さて、上で公開鍵認証がどうのこうのと書きましたが、では秘密鍵はどこにあるのでしょうか。それは FCM を使っている以上、送信側の SDK が勝手によしなにしてくれています。そもそも `PushManager.subscribe()` も SDK が隠蔽してくれているので知らなくて良いです。

### バックグラウンド通知

ではバックグラウンド通知の実装です。コードの全容はこちらです。

```js
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js"
);

firebase.initializeApp({
  apiKey: "hoge",
  authDomain: "hoge",
  projectId: "hoge",
  storageBucket: "hoge",
  messagingSenderId: "xxx",
  appId: "www:xxx:zzz:yyy",
  measurementId: "x-xxxxx",
});
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  const data = JSON.parse(payload.data.value);
  const notificationTitle = `${data.title} | ${data.sender}`;
  const notificationOptions = {
    body: data.text,
    icon: "/xxx.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

フォアグラウンド版と違って sw で SDK モジュールをインポートするのは、`type=module` 相応のものがないので importScript 構文を使っています。そのため ESM 版も使っていません。

通知は self.registration.showNotification(notificationTitle, notificationOptions); で受け取るように登録しています。こうすることでバックグラウンドで通知を受け取れます。

### service worker の登録はどのようにしたか？

さて、service worker のコードを書きましたが、この登録をしている箇所が見つかりません。実はこれは SDK が勝手にしてくれるので不要です。そのためにはさきほどのファイル名を firebase-messaging-sw.js にしておく必要があります。

またこの登録処理ですがなぜか上手くいかないこともあって、そのときに manifest.json を使うと上手くいきました。これが原因かわかりませんし、原因の切り分けを調査するのがめんどくさいのでしていませんが、もし上手くいかない場合は試してみてください。

### Push の送信

認証鍵を作って専用のエンドポイントに POST するといったこともできますが、今回はあるイベントをトリガーに Push を送るとしたかったので FCM の Admin SDK を Cloud Function から使いました。

```js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

const topic = "all";

admin.initializeApp();

exports.registerTokenTrigger = functions
  .region("asia-northeast1")
  .firestore.document("token/{tokenId}")
  .onCreate((snap, context) => {
    const newValue = snap.data();

    const token = newValue.token;

    admin
      .messaging()
      .subscribeToTopic(token, topic)
      .then((response) => {
        console.log("Successfully subscribed to topic:", response);
        response.status(200).send("set token");
      })
      .catch((error) => {
        console.log("Error subscribing to topic:", error);
        response.status(500).send("fail to set token");
      });
  });

exports.hogeTrigger = functions
  .region("asia-northeast1")
  .firestore.document("data/{dataId}")
  .onCreate((snap, context) => {
    const newValue = snap.data();

    const message = {
      data: {
        value: JSON.stringify(newValue),
      },
      topic,
    };

    admin
      .messaging()
      .send(message)
      .then((response) => {
        // Response is a message ID string.
        console.log("Successfully sent message:", response);
        return;
      })
      .catch((error) => {
        console.log("Error sending message:", error);
        return;
      });
  });
```

registerTokenTrigger で token をトピックに紐づけています。こうすることでトピックに対して Push を送れ、一括送信ができます。

hogeTrigger は firestore が更新されたら通知を送るようにしている処理です。

## FCM に対する感想、お気持ち

FCM、すごい便利なのですが色々勝手にやってくれる処理が多くて MDN に書かれていることがあまり役に立たない場面も多かったです。FCM は FCM 独自のお作法が多いので FCM 自体の勉強をしなきゃだなと思いました。
