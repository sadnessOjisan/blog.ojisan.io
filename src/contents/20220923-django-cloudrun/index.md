---
path: /django-cloud-run
created: "2022-09-23"
title: Django 製アプリを Cloud Run で動かすまで
visual: "./visual.png"
tags: ["cloudrun", "django", "python"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## ベースとなるイメージ作成

とりあえずローカルにあるもの全部コンテナにつっこんでいます。

```
FROM python:3
EXPOSE 8080
ENV PYTHONUNBUFFERED 1
RUN mkdir /code
WORKDIR /code
ADD requirements.txt /code/
RUN pip install -r requirements.txt

ADD . /code/

CMD ["python3", "manage.py", "runserver", "0.0.0.0:8080"]
```

不要なものは適宜 dockerignore などで除けておいてください。

`python3 manage.py runserver` は引数でホストやポートを指定できます。インターネットに公開する + Cloud Run のデフォルト指定を使いたいのでここは 0.0.0.0:8080 にします。

## ワークフローの定義

### GitHub Actions からデプロイ

今回は GHA からデプロイします。その手続き自体は[GitHub Actions から CloudRun にデプロイする](https://blog.ojisan.io/gha-cloudrun/)に書いたものと同じ通りにします。

```yaml
name: docker_build

on:
  push:
    branches:
      - "*"
      - "*/*"
      - "**"
      - "!main"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout the repository
        uses: actions/checkout@v2
      - id: "auth"
        uses: "google-github-actions/auth@v0"
        with:
          credentials_json: ${{ env.GCP_SERVICE_ACCOUNT_KEY }}
      - name: Configure docker to use the gcloud cli
        run: gcloud auth configure-docker --quiet
      - name: Build a docker image
        run: docker build -t ${{ env.IMAGE }} -f docker/dev/Dockerfile .
      - name: Push the docker image
        run: docker push ${{ env.IMAGE }}
      - name: Deploy to Cloud Run
        id: deploy
        uses: google-github-actions/deploy-cloudrun@v0
        with:
          service: ${{ env.SERVICE_NAME }}
          image: ${{ env.IMAGE }}
          region: ${{ env.GCP_REGION }}
```

### Database の設定

migration は GHA でしようと思います。起動時、手元、ワークフロー、Docker ビルド時などいくつか方法はありますが、今回はワークフローでの実行をします。

今回は Django は Cloud SQL に接続させます。登録時のパスワード、設定画面で表示されるホストは setting.py で使わせます。

```py
DATABASES = {
    'default': {
        'ENGINE': env('ENGINE'),
        'NAME': env('DB_NAME'),
        'USER': env('DB_USER'),
        'PASSWORD': env('DB_PASSWORD'),
        'HOST': env('DB_HOST'),
        'PORT': env('DB_PORT'),
  },
}
```

こうしておくことで `python3 manage.py migrate` や `python3 manage.py createsuperuser` が通るようになります。しかし Cloud SQL を手順通りに設定している場合はうまくいかないかもしれません。もし Cloud SQL に IP 制限をしているのであれば、GHA から migrate することができません。これを解決するためにはワークフロー内で自分の IP を調べて（これは action.ipv4 みたいな変数に入っているのですぐ調べられる）、gcloud コマンドなり terraform 経由で CloudSQL の IP 穴あけをすれば実現できますが、めんどくさいので別の方法を考えます。

それは IP 制限をなくしてしまうことです。とはいえ GCP の設定上はなんらかの IP 値を入れないといけないので `0.0.0.0:0` を指定します。これは任意の IP アドレスとして認識されます。危険と思うかもしれませんが planetscale など他のサービスではデフォルトが IP 制限なしなので危険ではないと認識しています。（インターネットから隔離するのは常とされてはいるが、DB 然り SSH 先然り）

FYI: <https://stackoverflow.com/questions/28339849/google-cloud-sql-authorize-all-ips>

### ワークフローから一連のコマンド実行

マイグレーションを行う`python3 manage.py migrate`、admin 情報を登録する `python3 manage.py createsuperuser`、seed の追加をする `python3 manage.py loaddata src/fixtures/rule.json ` を行います。

```yaml
name: docker_build

on:
  push:
    branches:
      - "*"
      - "*/*"
      - "**"
      - "!main"

env:
  GCP_REGION: asia-northeast1
  SERVICE_NAME: splatoon3-hansei-server-dev
  IMAGE: asia.gcr.io/${{ secrets.GCP_PROJECT_ID_DEV }}/hoge:${{ github.sha }}
  GCP_SERVICE_ACCOUNT_KEY: ${{ secrets.GCP_SERVICE_ACCOUNT_KEY_DEV }}
  ENGINE: django.db.backends.mysql
  DB_NAME: ${{ secrets.CLOUD_SQL_DB_NAME_DEV }}
  DB_USER: ${{ secrets.CLOUD_SQL_USER_DEV }}
  DB_PASSWORD: ${{ secrets.CLOUD_SQL_PASSWORD_DEV }}
  DB_HOST: ${{ secrets.CLOUD_SQL_HOST_DEV }}
  DB_PORT: 3306
  DJANGO_SUPERUSER_USERNAME: ${{ secrets.DJANGO_ADMIN_NAME_DEV }}
  DJANGO_SUPERUSER_EMAIL: ${{ secrets.DJANGO_ADMIN_EMAIL_DEV }}
  DJANGO_SUPERUSER_PASSWORD: ${{ secrets.DJANGO_ADMIN_PASSWORD_DEV }}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout the repository
        uses: actions/checkout@v2
      - id: "auth"
        uses: "google-github-actions/auth@v0"
        with:
          credentials_json: ${{ env.GCP_SERVICE_ACCOUNT_KEY }}
      - name: Configure docker to use the gcloud cli
        run: gcloud auth configure-docker --quiet
      - name: Build a docker image
        run: docker build -t ${{ env.IMAGE }} -f docker/dev/Dockerfile .
      - name: Push the docker image
        run: docker push ${{ env.IMAGE }}
      - name: install python lib
        run: pip install -r requirements.txt
      - name: migration
        run: python3 manage.py migrate
      - name: create admin account
        continue-on-error: true
        run: python3 manage.py createsuperuser --noinput
      - name: load seed
        run: python3 manage.py loaddata src/fixtures/rule.json && python3 manage.py loaddata src/fixtures/buki.json
      - name: Deploy to Cloud Run
        id: deploy
        uses: google-github-actions/deploy-cloudrun@v0
        with:
          service: ${{ env.SERVICE_NAME }}
          image: ${{ env.IMAGE }}
          region: ${{ env.GCP_REGION }}
```

面白いのは create admin account の `continue-on-error: true` です。admin 情報の登録は 1 度しかできず繰り返し実行すると失敗します。そこでこれは失敗してもいいように`continue-on-error: true`を設定しました。ちなみにあまり知られていませんが、管理画面の管理ユーザーは DJANGO_SUPERUSER_USERNAME,DJANGO_SUPERUSER_EMAIL,DJANGO_SUPERUSER_PASSWORD という環境変数があれば `python3 manage.py createsuperuser --noinput` コマンドで宣言的に実行できます。
