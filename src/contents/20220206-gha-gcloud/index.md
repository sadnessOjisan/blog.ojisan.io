---
path: /gha-gcloud
created: "2022-02-06"
title: いま GitHub Actions から GCP を使うなら
visual: "./visual.png"
tags: ["github-actions", "gcp"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

GitHub Actions と GCP の連携方法でググったときの情報が何か古い気がしたので、2022 年 2 月版を書いておく。

## setup-gcloud

action には Google が公式で出している [setup-gcloud](https://github.com/google-github-actions/setup-gcloud#authorization) を使う。

### master ブランチを使わない

ドキュメントにも

> Do not pin this action to @master, use @v0 instead. We are going to rename the branch to main in 2022 and this will break existing workflows. See Versioning for more information.

と書かれている通り、`@master` は使わないようにしよう。

```yaml
jobs:
  job_id:
    # Add "id-token" with the intended permissions.
    permissions:
      contents: "read"
      id-token: "write"

    steps:
      - id: "auth"
        uses: "google-github-actions/auth@v0"
        with:
          workload_identity_provider: "projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider"
          service_account: "my-service-account@my-project.iam.gserviceaccount.com"

      - name: "Set up Cloud SDK"
        uses: "google-github-actions/setup-gcloud@v0"

      - name: "Use gcloud CLI"
        run: "gcloud info"
```

のようにして使う。

(<https://github.com/google-github-actions/setup-gcloud#usage>)

## service_account 周りのフィールドは deprecated

これまでは、

- service_account_key
- service_account_email
- export_default_credentials
- credentials_file_path
- cleanup_credentials

を認証に使えていましたが、今のバージョンでは全て使えない。

代わりに

```yaml
job:
  job_id:
    steps:
      - id: "auth"
        uses: "google-github-actions/auth@v0"
        with:
          credentials_json: "${{ secrets.GCP_CREDENTIALS }}"

      - name: "Set up Cloud SDK"
        uses: "google-github-actions/setup-gcloud@v0"

      - name: "Use gcloud CLI"
        run: "gcloud info"
```

のように credentials_json を使う。

credentials_json は service account の 鍵 json ファイルを base64 したもので、それを GitHub の secret に設定すれば良い。
Mac であればこのようなコマンドで取得できる。

```
cat your-service-key.json | base64 | pbcopy
```

(<https://blog.wadackel.me/2019/cloud-run-pull-request-preview/#github-%E3%81%AE-secrets-%E8%A8%AD%E5%AE%9A>)

なお、公式ドキュメントには preferred way として

```yaml
jobs:
  job_id:
    # Add "id-token" with the intended permissions.
    permissions:
      contents: "read"
      id-token: "write"

    steps:
      - id: "auth"
        uses: "google-github-actions/auth@v0"
        with:
          workload_identity_provider: "projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider"
          service_account: "my-service-account@my-project.iam.gserviceaccount.com"

      - name: "Set up Cloud SDK"
        uses: "google-github-actions/setup-gcloud@v0"

      - name: "Use gcloud CLI"
        run: "gcloud info"
```

といった例が説明されているが、これは Workload Identity Federation と呼ばれているやり方だ。

これまでは service account の認証情報を secret として GitHub に持たせていたが、それなりの権限をもつトークンをずっと GitHub に持たせるのはよくないという問題意識で作られたのが Workload Identity Federation である。

<https://cloud.google.com/blog/ja/products/identity-security/enable-keyless-access-to-gcp-with-workload-identity-federation>

ただまだ一般的なものではなく、GCP 側での設定がめんどくさかったので今回は使っていない。
興味がある人は使うと良いと思う。
