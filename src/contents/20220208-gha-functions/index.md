---
path: /gha-functions
created: "2022-02-08"
title: GitHub Actions から Cloud Functions にデプロイする
visual: "./visual.png"
tags: ["gcp", "cloud-functions", "github-actions"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

完全な形

## 完成系

```yaml
name: functions

on:
  push:
    branches:
      - "main"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: setup Node
        uses: actions/setup-node@v1
        with:
          node-version: v16.x
          registry-url: "https://registry.npmjs.org"
      - id: "auth"
        uses: "google-github-actions/auth@v0"
        with:
          credentials_json: "${{ secrets.GCP_SERVICE_ACCOUNT_KEY_PRD }}"
      - name: Install npm packages
        run: yarn install
      - name: typecheck
        run: yarn run build
      - id: "deploy_hoge"
        uses: "google-github-actions/deploy-cloud-functions@v0"
        with:
          name: "hoge"
          runtime: "nodejs14"
          region: asia-northeast1
          description: hoge trigger
          entry_point: hoge
          ingress_settings: ALLOW_ALL
      - id: "deploy_fuga"
        uses: "google-github-actions/deploy-cloud-functions@v0"
        with:
          name: "fuga"
          runtime: "nodejs14"
          region: asia-northeast1
          description: fuga trigger
          entry_point: fuga
          ingress_settings: ALLOW_ALL
```

一見簡単そうに見えますが、暗黙の前提などがあるので一つずつ解説していきます。

## 解説

### エントリポイントを全 export するだけでは不十分

Firebase の Cloud Functions に慣れている人にとってはびっくりな罠です。
Firebase 版では root で export したものがあればそれが勝手にエンドポイントとなっていました。
しかし GCP 版ではデプロイ時にエントリポイントを指定する必要があります。

```yaml
- id: "deploy_fuga"
  uses: "google-github-actions/deploy-cloud-functions@v0"
  with:
    name: "fuga"
    runtime: "nodejs14"
    region: asia-northeast1
    description: fuga trigger
    entry_point: fuga
    ingress_settings: ALLOW_ALL
```

### エントリポイントは package.json で指定する

```json
{
  "name": "hoge",
  "version": "1.0.0",
  "main": "lib/index.js",
  ...
}
```

つまり、TS などを使っている場合は tsconfig の設定などでそのパスに output する必要があります。

```json
{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "outDir": "./lib",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

### デプロイ対象はプロジェクト全体

その package.json でデプロイ対象を指定するので、CI 側には package.json も含めないといけません。
つまり GHA の`working-directory`でビルド対象のディレクトリの指定するなどをすると上手くデプロイできないことがあります。
モノレポにしているときなどに注意してください。（逆にデプロイ時に working-directory で該当の package.json がルートに入るように指定する必要がある。）

### 自由なアクセスを許可する

Firebase 版では何も考えずにホスティングしたらすぐ全国公開でしたが、GCP 版は通信の権限を設定できます。
デフォルトでは第三者が通信できないようになっているので、それを解除します。

```
ingress_settings: ALLOW_ALL
```

さらにこれだけでは足りず、起動元の権限も緩める必要があります。
関数一覧から設定できるので、起動元に権限を割り振りましょう。

FYI: <https://cloud.google.com/functions/docs/securing/managing-access-iam#allowing_unauthenticated_function_invocation>

この設定は GHA からもできますが、IAM の設定はデプロイスクリプトで行うのはアンチパターンといった言説を見かけたのでコンソールから手作業でやっています。
