---
path: /sakura-vps
created: "2021-06-28"
title: ブログを さくらVPS に移管しました
visual: "./visual.png"
tags: ["VPS"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

僕のファン（いたら嬉しい）はお気づきかと思いますがブログのデザインが一新されました。デザイン以外にも設計や構成も全て代わり、フルスクラッチで書き直しました。
テーマは "筋トレ" で、なるべく便利なライブラリや SaaS は使わないようにして、そのうえで高速化などを目指して自分の力を伸ばすことが目的です。

その中でデプロイ先も Netlify から さくら VPS へと移しました。
今日はこのブログ をさくら VPS で動かすまでの苦労を紹介したいと思います。
といっても HTML をホスティングするだけなのできっと高度なことは何もやっていないはずです。
それでも、自分にとってはかなり難易度の高い仕事でした。
（というのも自分がプログラマになったときにはすでに Zeit now(現 Vercel) や Netlify があり、これまで VPS や ウェブサーバー 未経験でもなんとかなっていたという事情があります。）

## さくら VPS の設定

### 初期設定

会員登録してコンソールに入ってください。
初期設定するときに root の password も設定するのでメモしておきましょう。

### OS のインストール

CentOS 8 を選択しました。
選択できる CentOS で一番新しかったです。
CentOS8 は yum コマンドがなくなるとのことで不安でしたが、代替コマンドがあったり、エイリアスが貼られていたりするとのことで、大丈夫だろうと思い選びました。

### パケットフィルタリングの設定

デフォルト設定では SSH 用に 22 番ポートが空いています。
Web サイトを作るので 80/443 番ポートを開けます。

ちなみにコンソールでこの設定をしなければ、いくら VPS 内から `firewalld` などで設定しても繋がりません。
思わぬ落とし穴なので注意しましょう。

### SSH キーの登録

さくら VPS ではコンソールから秘密鍵の登録ができます。
ローカルマシンからの SSH を考えるので、いま使っている SSH キーの公開鍵を登録します。

この仕組みを使えば `ssh-copy-id` が不要です。

## VPS の設定

### SSH による接続

```sh
ssh root@160.16.68.139 -i ~/.ssh/sakura_vps__blog_rsa
```

などとして SSH で環境に入ります。

### パスワードなしで入れるようにする

SSH するたびにパスワード聞かれるのはめんどくさいので、パスワードなくても秘密鍵さえあれば入れるようにします。
セキュリティ的な問題もあるかもしれませんが、後々 にデプロイ自動化などをやろうとするときに大変なので、秘密鍵だけで入れるようにします。

`/etc/ssh/sshd_config` を書き換えましょう。

```sh
PubkeyAuthentication yes
#PasswordAuthentication yes
```

設定したら sshd プロセスを再起動します。

```sh
systemctl start sshd.service

systemctl status sshd.service
```

### Nginx

HTML ファイルを配信するサーバー機能としては nginx を使います。

ただ、標準の yum で引っ張ってこれる nginx はあまりにも古かったので、デフォルト以外のストリームから取るようにします。

```sh
yum module list nginx
```

こうすることで、install 可能なバージョンとそのストリームが表示されます。
EOL を考え、なるべく新しいものを選ぶと良いでしょう。

```sh
yum module enable nginx:1.18

yum install nginx
```

#### 起動

```sh
# 自動起動
systemctl enable nginx

systemctl start nginx
```

この状態で http://{your_is_address}:8080 にアクセスするとデフォルトのページが表示されるはずです。

#### 設定ファイルの記述

さて、一番大変だったのは nginx.conf の記述です。

私の[旧 blog.ojisan.io](https://amazing-goodall-59e3b0.netlify.app) の URL はトレイリングスラッシュがありません。
これは意図したものではなくたまたま Gatsby を Netlify にホスティングしたらそうなったというだけです。
しかし今ではその URL にブックマークサービスなどでブックマークされていることもあり、URL を変えることはできませんでした。
そこで nginx の設定を頑張って同じ URL でホスティングしなければいけなく、その設定に苦労しました。

- rewrite で / がついているものを / がない URL へ飛ばす
- しかし / を消すと記事から画像に対する相対パスが壊れる(`/` を消すことで dir 配下に画像があるとブラウザが解釈せず、root/\*.png をみに行ってしまうため)ので、そうはならないように `$referrer/*.png` の画像をみにいくようにする

などといった工夫をしました。

```nginx
server {
    listen 80;
    server_name blog.ojisan.io;

    location ~ ^/([-a-z0-9]*)\.png$ {
        rewrite ^/([-a-z0-9]*)\.png$ $http_referer/$1.png permanent;
        try_files $http_referer/$1.png =404;
        add_header Cache-Control no-cache;
    }

    location / {
        rewrite ^/(.*)/$ /$1 permanent;
        try_files $uri/index.html $uri/visual.png $uri =400;
    }

    root  /var/www/html;
    index index.html;

    access_log /var/log/nginx/access.log;
    error_log  /var/log/nginx/error.log;
}
```

ちなみに、きっと Netlify 時代にそのルーティングができていたのは Gatsby のおかげな気がしていたのでビルド時にパスを解決するような work around も当初は実装していました。

新しいブログではSSG の仕組みそのものを自作しているので(template engine を SSG と読んでいいかは要審議)、 markdown を変換するタイミングでいくらでもいじれる機会はありました。
幸い使っていた md parser([pulldown-cmark](https://github.com/raphlinus/pulldown-cmark)) には replacer という機能があり、その辺は柔軟に書き換えることができました。

```rust
let parser = Parser::new(&res).map(|event| match event.clone() {
    ...,
    Event::Start(Tag::Image(link_type,url,title)) =>{
        let url_string = url.clone().into_string();
        let url_str = url_string.as_str();
        let new_url = format!("{}/{}",&front.path.as_str(), url_str);
        let replaced_url = url.replace(url_str, new_url.as_str());
        Event::Start(Tag::Image(link_type, replaced_url.into(), title))
    },
    _ => event
});
```

けど、さきほどの nginx の設定で動いたのでこの案はやめました。
nginx の設定を教えてくださった [@Holly_Nuts\_](https://twitter.com/Holly_Nuts_)さんありがとうございます。

#### nginx の設定

設定ファイルを書いてそれが動くか試すのに以下のコマンドを多用すると思うのでメモがわりに書いておきます。

```sh
# 設定ファイルの位置
/etc/nginx/nginx.conf
/home/ojisan/dst/index.html
```

```sh
# 再起動
systemctl restart nginx
```

```sh
# lint
sudo nginx -t
```

```sh
# 設定再読み込み
systemctl reload nginx
```

```sh
# 状態の確認
systemctl status nginx
```

#### Mac で debug するとき

毎回毎回デプロイするのもめんどくさいので、ローカルでも動くようにしておきましょう。

```sh
brew install nginx

brew services start nginx

brew services stop nginx
```

設定ファイルは `/usr/local/etc/nginx/nginx.conf` に置くと良いです。

#### Docker で debug するとき

ローカルに nginx をいれると持ち運びや環境の衝突がめんどくさいので、docker を使うのも手です。

このような dockerfile を用意します。
もちろん COPY 元には該当ファイルは置いておいてください。

```sh
FROM nginx
COPY ./public /var/www/html
COPY ./conf /etc/nginx/conf.d
```

[https://github.com/ojisan-toybox/docker-nginx-config](https://github.com/ojisan-toybox/docker-nginx-config)

### HTTPS 化

これでページは表示されるようになりましたが、HTTPS ではつながらないのでその対応をします。
ここでは Let's Encrypt と certbot を使います。

certbot の install をします。

```sh
dnf install -y epel-release

dnf install certbot python3-certbot-nginx
```

次に certbot コマンドを使いたいのですが、このコマンドは引数にドメインを取ります。

```sh
$ certbot --nginx -d ojisan.io
Challenge failed for domain ...
```

なので、適当なサブドメインを取って、そこに A レコードを紐付け、そのサブドメインを引数に取らせるようにします。
blog.ojisan.io はすでに使っているため、そのドメインが使えないことの回避策です。
このときはこのやり方でうまくいくかわからなかったので、デバッグに時間がかかってダウンタイムが増えるのが嫌だったので、 blog.ojisan.io は使わずにわざわざこんなめんどくさいことをしました。

```sh
certbot --nginx -d tmp.ojisan.io
```

このコマンドでいろいろ質問が聞かれるのでそれに答えましょう。

これでうまく行ったら tmp.ojisan.io は削除し、VPS サーバーの IP アドレスと blog.ojisan.io を紐付けましょう。

最後に証明書の更新を自動で行うようにします。
Let's Encrypt の SSL 証明書は有効期間が 90 日なためです。

```
# crontab
crontab -u root -e

# cron で自動化
00 04 01 * * certbot renew && systemctl restart nginx
```

この辺りの設定をまとめて教えてくださった [@inductor](https://twitter.com/_inductor_)さんありがとうございます。

### rsync

最後にデプロイを考えます。
ページのデプロイには rsync の利用を考えています。
そのため server / client(local) 双方に rsync を入れます。(rsync は server をまたぐなら双方に必要)

CentOS 側は以下のコマンドで入ります。

```
sudo yum install rsync
```

あとはローカルから次のコマンドを叩くことでデプロイできます。

```sh
# web page のデプロイ
rsync -av -e 'ssh -i ~/.ssh/sakura_vps__blog_rsa' public/ root@160.16.68.139:/var/www/html

# nginx の設定デプロイ
rsync -av -e 'ssh -i ~/.ssh/sakura_vps__blog_rsa' server/nginx.conf root@160.16.68.139:/etc/nginx/conf.d/
```

DevOps が叫ばれる時代に手元で rsync とは何かまずいことをしている気もするのですが、rsync は 秘密鍵さえあれば GitHub Actions からのデプロイできるので、Developer Experience 的にも将来なんとかなる予定です。（まだできてない）

## おわりに

OGP 画像はさくら VPS のイメージキャラクターです。
これは何かのカンファレンスのブースでもらったクリアファイルなのですが、中に入っていたサーバー無料券を無くしてしまっていて少し凹んでいます。
