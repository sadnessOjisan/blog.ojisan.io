---
path: /ls-in-dockerfile
created: "2023-04-21"
title: Dockerfile 内の ls とか echo の出力をみたい
visual: "./visual.png"
tags: [docker]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

Dockerfile を書く時にいつも調べているのでメモ。

## Dockerfile のデバッグをしたい

僕だけかもしれませんが、node_modules フォルダをコンテナに COPY しようとして、その中身を全部ヒラでコピーすることがよくあります。というか毎回やらかしています。で、そういう間違いを気づくための調査として ls や echo をしたいわけですが、ビルド後にそのコンテナに exec して中で ls をすれば見れるものの、毎回入るのはめんどくさいです。というわけで Dockerfile に `RUN ls` のようなことを書きたいわけですが、これだと出力されません。

## Dockerfile 内の ls をターミナルに出す

というわけで書くと良いのが、

```
docker build --progress=plain --no-cache -t your_container_name -f path/to/Dockerfile .
```

や

```
docker compose build --progress=plain --no-cache your_container_name
```

です。

progress オプションは公式には

> --progress auto 進行状況の出力タイプを設定（auto、plain、tty）。plain を使うと、コンテナの出力を表示

とあります。

FYI: https://docs.docker.jp/engine/reference/commandline/build.html

なんか昔は plain だったのがいい感じに出力されるようになっているのが今のモードらしい。

ls した行がデバッグごとに毎回必ず実行されるように --no-cache オプションも付けています。

> --no-cache イメージの構築時にキャッシュを使用しない

## おわりに

ls とかせずに一発でシュッと書けるようになりたい。
