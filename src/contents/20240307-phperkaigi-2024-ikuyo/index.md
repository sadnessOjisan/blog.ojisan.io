---
path: /phperkaigi-2024-ikuyo
created: "2024-03-07"
title: phperkaigi2024 で Webサーバーを理解して Laravel on Docker する話をします
visual: "./visual.png"
tags: [php, laravel, docker]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## 予告

3/8 14:40-15:20 に [PHPerKaigi](https://phperkaigi.jp/2024/) のトラックCで話します。
PHP を Docker に固めてデプロイするときに ApacheやらNginxが求められることに対して、そもそも Webサーバーとは何かを理解し、Dockerやデプロイの設定を見直す話をします。

キーワードは

- PHP
- Laravel
- SAPI
- TCP
- マルチプロセス
- マルチスレッド
- 非同期ランタイム
- グリーンスレッド
- Docker
- Nginx
- LB
- CDN
- Laravel Octane
- FrankenPHP

あたりです。
PHPやLaravelというよりは WebサーバーとLinuxについての比重が多いです。

自分のバックグラウンド的に「別言語をメインウエポンにしている」「クライアントサイドという視点からWebを見ている」という点で、PHPの勉強会ではあまりされないような話をすると思いますので、 ぜひ楽しみにしてください。いや、これめちゃくちゃハードル上がりますね。楽しみにしないでください。

## 不安

正直なところ PHP は自分のメインウエポン言語ではなく、歴もすごく浅いので、間違ったこと言ったらどうしよう的な不安がずっとあります。
一応、リファレンスは用意したりしているのですが、それでも自分の言葉で完全に噛み砕けているかと言う点では不安が残っています。
変なことを言っていたら優しく指摘してもらえると助かります。

あと、普段入り浸っているフロントエンド分野と違って、PHP分野には一方的に知っている人しか居ないので、緊張してます。
当日はよろしくお願いします！
