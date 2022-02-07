---
path: /gha-cloudrun
created: "2022-02-08"
title: GitHub Actions から CloudRun にデプロイする
visual: "./visual.png"
tags: ["gcp", "cloudrun", "github-actions"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

ググったらすでに正解例が出ていると思いますが、たどり着くまでに色々あったのでメモ。

## 完成系

```yaml
name: docker_build

on:
  push:
    branches:
      - "main"

env:
  GCP_REGION: ${{ secrets.GCP_REGION_PRD }}
  IMAGE: asia.gcr.io/${{ secrets.GCP_PROJECT_ID_PRD }}/hoge:${{ github.sha }}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout the repository
        uses: actions/checkout@v2
      - id: "auth"
        uses: "google-github-actions/auth@v0"
        with:
          credentials_json: "${{ secrets.GCP_SERVICE_ACCOUNT_KEY_PRD }}"
      - name: Configure docker to use the gcloud cli
        run: gcloud auth configure-docker --quiet
      - name: Build a docker image
        run: docker build -t ${{ env.IMAGE }} -f docker/client/prd/Dockerfile .
      - name: Push the docker image
        run: docker push ${{ env.IMAGE }}
      - name: Deploy to Cloud Run
        id: deploy
        uses: google-github-actions/deploy-cloudrun@v0
        with:
          service: hoge
          image: ${{ env.IMAGE }}
          region: ${{ env.GCP_REGION }}
```

google-github-actions/auth に関しては [いま GitHub Actions から GCP を使うなら](https://blog.ojisan.io/gha-gcloud/) を参照。

## なんで GHA から CloudRun を使おうとしたか

もともと GHA を使う予定はなく、GCP 環境で IaC しようとして CloudBuild を採用予定でした。
ただ、

- レポジトリ連携で手作業が必要になる
- CloudRun を apply するときにイメージの指定が要求される

という点から IaC をやめました。

CloudRun + GCR + CloudBuild は

```ts
new CloudRunService(this, "hoge-cloud-run", {
  name: "hoge",
  location: "asia-northeast1",
  template: {
    spec: {
      containers: [
        {
          image: "us-docker.pkg.dev/cloudrun/container/hello",
          ports: [
            {
              containerPort: 8080,
            },
          ],
        },
      ],
    },
  },
});

const policy = new DataGoogleIamPolicy(this, "publicAccessPolicy", {
  binding: [
    {
      role: "roles/run.invoker",
      members: ["allUsers"],
    },
  ],
});

new CloudRunServiceIamPolicy(this, "no-auth", {
  service: "hoge",
  policyData: policy.policyData,
  location: "asia-northeast1",
});

new CloudbuildTrigger(this, "hoge-cloud-build", {
  triggerTemplate: {
    branchName: "[^(?!.*main)].*", // 正規表現で書ける
    repoName: "sadnessOjisan/hoge",
  },
  filename: "cloudbuild.yaml",
});

new ContainerRegistry(this, "gcr", {
  project: projectId,
  location: "asia",
});
```

のような設定で IaC できますが、CloudRun のアプライ時にイメージを上書くのがよくないと思ってやめました。
インフラの更生管理を変えただけでデプロイ成果物が変わってしまうのはおかしいからです。
もちろん `@latest` をつけるなどの工夫や、最新のイメージを別途取得して渡すなりして連携できますが、イメージを書き換えるということ自体の解消はしていないのでやめました。
そして IaC をやめるのであれば GCP に CI/CD を寄せなくていいやと思って GHA を採用しました。

IaC しないということはポートの設定やドメインのマッピングなどで手作業が必要になりますが、それはやむなしです。
