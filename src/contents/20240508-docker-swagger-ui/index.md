---
path: /docker-swaggger-ui
created: "2024-05-08"
title: Dockerとyamlで言語非依存にSwagger UIを構築し、Basic認証にも対応する
visual: "./visual.png"
tags: ["docker", "swagger"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## 言語非依存にSwagger UIを構築したいモチベーション

スキーマファーストにAPI Specを作るなら、API Specはバックエンドチーム、クライアントサイドチームの共有財産であるべきだと私は思います。
そしてお互いのチームが異なる言語を使っているのならば、どちらかの言語で書いてしまうとどちらかに学習コストが発生するので、SpecはJSONやyamlなどで書きたいです。
ただJSONだとコメントが書けなかったり、JSON SChema 手書きはしんどかったりで避けたいです。
そこで yaml だけで swagger-ui を使って API Spec を作りたいです。

## swagger-ui が v3 から yaml を読める

swagger-ui は v3 から yaml に対応しました。
元々は環境変数 SWAGGER_JSON にspecのjsonへのパスを渡すことで構築できていました。

see: https://swagger.io/docs/open-source-tools/swagger-ui/usage/installation/#docker

これが API_URL という環境変数にyamlへのパスを渡すと同じように構築できるようになりました。
（なんだけど、公式のドキュメント見てもそんなことは書かれてないんだよな）
（あと[一説](https://qiita.com/A-Kira/items/3d17396c7cc98873e29d)によると SWAGGER_JSON に yaml を渡せるらしい）

```
FROM swaggerapi/swagger-ui:v5.17.3

# see: https://qiita.com/NewGyu/items/6a00e0f09a7f8a93cfd5
COPY spec.yaml /usr/share/nginx/html/spec.yaml

ENV API_URL=spec.yaml

EXPOSE 8080
```

swagger ui は組み込まれているNginxで配信されているので、nginx が見てるルートにスペックをコピーし、そこにAPI_URLを設定しておきます。

## Basic 認証する

さて、API仕様書を別チームで共有するからには、そのSpecはインターネット越しに常に最新のものが見られるようにしたいです。
ただインターネットに公開されているのは危険なのでBasic認証をかけます。
なんらかの言語を使っているならその言語の機能でBasic認証は簡単に実装できますが、今我々はそのようなものはないです。
そのためNginxの上に乗っかって、Basic認証をします。

```
FROM swaggerapi/swagger-ui:v5.17.3

# see: https://qiita.com/NewGyu/items/6a00e0f09a7f8a93cfd5
COPY spec.yaml /usr/share/nginx/html/spec.yaml

ENV API_URL=spec.yaml

# Basic認証
# see: https://github.com/ravindu1024/swagger-ui-basic-auth/blob/master/Dockerfile
RUN apk update
RUN apk add apache2-utils

ARG USERNAME=hoge
ARG PASSWORD=fugafuga

RUN htpasswd -c -b /etc/nginx/.htpasswd ${USERNAME} ${PASSWORD} && cat /etc/nginx/.htpasswd

COPY basic-auth.sh /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/basic-auth.sh

RUN cat /etc/nginx/conf.d/default.conf
EXPOSE 8080
```

```
sed -i 's|location / {|location / {\n\tauth_basic \"Restricted Content\";\n\tauth_basic_user_file /etc/nginx/.htpasswd;\n|g' /etc/nginx/conf.d/default.conf
sleep 5 && nginx -s reload &
```

htpasswdは Apache のためのようにも思えますが、Nginx も auth_basic_user_file で htpasswd を指定するとBasic認証ができます。
そのため htpasswd を作り、それをコンテナ立ち上げ時にdefault設定されているNginxの設定に対して htpasswd を使うように書き換えます。
そうすることで Basic 認証が実現できます。

このやり方は https://github.com/ravindu1024/swagger-ui-basic-auth/blob/master/Dockerfile にある Dockerfile を参考にしました。
