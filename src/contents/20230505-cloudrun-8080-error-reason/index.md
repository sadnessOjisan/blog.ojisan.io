---
path: /cloudrun-8080-error-reason
created: "2023-05-05"
title: CloudRun 起動時の8080PORT空いてませんよエラーの原因はPORT8080が空いていないことが原因とは限らない
visual: "./visual.png"
tags: [cloudrun]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## Cloudrun でよくみるエラー

Cloudrun でよくみるエラーと言えば、

> The user-provided container failed to start and listen on the port defined provided by the PORT=8080 environment variable. Logs for this revision might contain more information.

だろう。

Cloudrun は 8080 ポートを使うことが前提だ。なのでコンテナの 8080 ポートを開けたり、それと自分のアプリケーションのポートとのマッピングを設定に書かないといけない。（僕はめんどくさいのでアプリケーションを 8080 で立ち上げて 8080:8080 しかしないが）

で、そういうエラーが出てその対応をしたけど治らなかった。

## 関係ないエラーだった

> The user-provided container failed to start and listen on the port defined provided by the PORT=8080 environment variable. Logs for this revision might contain more information.

というエラーが出たときの Cloud Logging を見ると

```
DEFAULT 2023-05-04T10:51:17.198156Z node:internal/modules/cjs/loader:1078
DEFAULT 2023-05-04T10:51:17.198187Z throw err;
DEFAULT 2023-05-04T10:51:17.198193Z ^
DEFAULT 2023-05-04T10:51:17.198208Z Error: Cannot find module 'fastify'
DEFAULT 2023-05-04T10:51:17.198212Z Require stack:
DEFAULT 2023-05-04T10:51:17.198217Z - /usr/src/app/dist/index.js
DEFAULT 2023-05-04T10:51:17.198224Z at Module._resolveFilename (node:internal/modules/cjs/loader:1075:15)
DEFAULT 2023-05-04T10:51:17.198230Z at Module._load (node:internal/modules/cjs/loader:920:27)
DEFAULT 2023-05-04T10:51:17.198237Z at Module.require (node:internal/modules/cjs/loader:1141:19)
DEFAULT 2023-05-04T10:51:17.198243Z at require (node:internal/modules/cjs/helpers:110:18)
DEFAULT 2023-05-04T10:51:17.198249Z at Object.<anonymous> (/usr/src/app/dist/index.js:6:35)
DEFAULT 2023-05-04T10:51:17.198255Z at Module._compile (node:internal/modules/cjs/loader:1254:14)
DEFAULT 2023-05-04T10:51:17.198273Z at Module._extensions..js (node:internal/modules/cjs/loader:1308:10)
DEFAULT 2023-05-04T10:51:17.198279Z at Module.load (node:internal/modules/cjs/loader:1117:32)
DEFAULT 2023-05-04T10:51:17.198286Z at Module._load (node:internal/modules/cjs/loader:958:12)
DEFAULT 2023-05-04T10:51:17.198294Z at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12) {
DEFAULT 2023-05-04T10:51:17.198300Z code: 'MODULE_NOT_FOUND',
DEFAULT 2023-05-04T10:51:17.198306Z requireStack: [ '/usr/src/app/dist/index.js' ]
DEFAULT 2023-05-04T10:51:17.198312Z }
DEFAULT 2023-05-04T10:51:17.198319Z Node.js v18.16.0
WARNING 2023-05-04T10:51:17.261805835Z Container called exit(1).
```

だった。

これ自体は Dockerfile 内に node_modules をコピーし忘れていたというものなのだが、これが 「8080PORT がどうのこうの」と言われる。まあ実際は 8080PORT エラーが開いていないことがエラーの原因とはエラーメッセージは言ってはいないのだが、これまでの経験則やわざわざポート番号まで出すエラーメッセージなのでそう思うところがあった。なので教訓として、

> The user-provided container failed to start and listen on the port defined provided by the PORT=8080 environment variable. Logs for this revision might contain more information.

と言われても 8080 PORT 開けて解決するとは限らないよということを覚えておこう。

## おわりに

ちなみに Cloud Functions にも CORS が原因じゃないのに CORS 周りのエラーメッセージが出る挙動ってのがあったりもする。

FYI: https://blog.ojisan.io/firebase-functions-on-call/
