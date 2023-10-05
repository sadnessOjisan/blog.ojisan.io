---
path: /laravel-docker-wakaran
created: "2023-10-05"
title: Laravel を Docker で動かしてホスティングするまで
visual: "./visual.png"
tags: [php, laravel, docker]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

ひょんとしたことから PHP をやることになったのですが、Laravel を コンテナでホスティングするのが難しすぎて困っています。とりあえず今できていることをメモです。こうした方が良いよ的なアドバイスがあったら教えて欲しいです。

ちなみに本当は昨日公開予定のブログでしたが、Xが急遽OGPに対する仕様を変えたのでそれを踏まえた新しいOGイメージでお送りします。

## 注意

↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓

この文章は Laravel歴 1週間ちょっとのペーペーによって書かれたものです。書かれている内容を間に受けないでください。

↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑

## tl;dr

Docker で動かす最小構成がわからないのですが、とりあえずこう書けば動きはします。

```
FROM php:8.2-fpm

ENV COMPOSER_ALLOW_SUPERUSER 1
ENV COMPOSER_NO_INTERACTION 1

RUN apt-get update
RUN apt-get -y install libzip-dev
RUN docker-php-ext-install zip pdo_mysql

COPY --from=composer /usr/bin/composer /usr/bin/composer

COPY . .

RUN composer update
RUN composer install

CMD ["php", "artisan", "serve", "--host", "0.0.0.0"]
```

が、後述しますが artisan serve は本番向けではないので良くないです。
なので前段にウェブサーバーを置いて運用することを考えてみました。
php-fpm+Nginx か php-apacheかを悩みましたが、コンテナデプロイするときに複数デプロイするのはめんどくさいのでphp-apacheを選びました。

## Laravel + Docker に関する情報が全然ない！

### ChatGPT に聞いてみた

sadnessOjisan:「`php artisan serve` するために必要な Dockerfile をください」

chatGPT: 「php artisan serveを実行するための基本的なDockerfileは以下の通りです。LaravelプロジェクトをDockerコンテナ内で動かす基本的なセットアップを提供します。」

```
# Use the official image from the dockerhub
FROM php:7.4-fpm

# Set working directory
WORKDIR /var/www

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    locales \
    zip \
    jpegoptim optipng pngquant gifsicle \
    unzip \
    curl \
    git

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install extensions
RUN docker-php-ext-install pdo_mysql mbstring zip exif pcntl
RUN docker-php-ext-configure gd --with-freetype=/usr/include/ --with-jpeg=/usr/include/
RUN docker-php-ext-install gd

# Install composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Add user for laravel application
RUN groupadd -g 1000 www
RUN useradd -u 1000 -ms /bin/bash -g www www

# Copy existing application directory permissions
COPY --chown=www:www . /var/www

# Change current user to www
USER www

# Expose port 9000 and start php-fpm server
EXPOSE 9000
CMD ["php-fpm"]
```

こんなにたくさん必要なのは絶対に違うと思いました。僕が初心者だから誤魔化せると思っても、そうはいきません。

### ググってみた

正解を知るために大人しくググってみました。しかし、晒し上げのようになるのは嫌なので詳細は書きませんが、ChatGPT で作ったような例のようなコードがたくさんでてきました。もしくは

```
docker-compose exec server /bin/bash
```

のようにコンテナに入って起動したりインストールコマンドの実行もしていました。docker-compose を使った例もそれなりにあったのですが、ほぼ全部が volume マウントしていて、コンテナの中に入って作業する前提になっていました。

### コンテナの中には入りたくない

自分はコンテナにいろいろなものを入れるのはセキュリティ的なリスクや、経費削減の観点からやるべきではないと考えています。なので普段は実行ファイルに落とし込んで distroless に移し替えてそれだけをホスティングするとかのやり方を好みます。また、自動デプロイを好むのでコンテナの中に入って起動するといったこともしないです。なのでこれらのやり方は自分の好みとは大きく外れています。そして自分の好みに合うコンテナへの固め方に関する情報は全然出てきませんでした。どうしてでしょうか。

### コンテナは開発用のものであり、ホスティングのためのものではない？

一つ思いあたったのは、PHPの郷においてはコンテナはホスティング目的ではないという可能性です。以下は "Laravel Docker" でググった結果のタイトル一覧です。

- DockerでLaravel開発環境を手軽に構築する手順
- 最強のLaravel開発環境をDockerを使って構築する
- Laravel 10 の開発環境をdockerで実現する方法
- Laravel開発環境をDockerを使って構築する（LEMP環境
- Laravelの開発環境をdocker-composeで自作してみる
- Laravelローカル環境構築（Docker その①）
- 超簡単！Docker 未経験者が Laravel の Docker 環境を構築 ...
- Laravel Sail - Laravel 10.x - The PHP Framework For Web ...
- 手順をすべて紹介。Windows環境にLaravel×Dockerで ...
- How to Get Started with Docker and Laravel
- 【Web開発】Docker＋Nginx＋PHP（laravel）で開発環境構築 ...

ここからみて分かる通り、Docker はホスティングが目的ではなく開発環境構築のために使われているようです。そしてコンテナの中に入るワークフローが推奨されることからも Git のようなツールもコンテナの中に入れていくこととなり、その結果、Dockerfile の `apt get` 部分が大きくなっているかのように思います。

ではコンテナを使わずにどうやってデプロイしているのだろうかと思って 今度は "Laravel Deploy" で調べてみました。その結果、ほとんどがレンタルサーバーに対してアップローダーやGitを通してアップロードしており、コンテナデプロイはあまり流行っていなさそうでした。

## Docker + Laravel に対する公式やエコシステムの見解

しかし Laravel は現代も流行りのFWだとは思います。流石に現代の言語・FWがコンテナへのサポートが薄いとは考えられません。そこで公式をみてみました。

### Sail

公式に [laravel-and-docker](https://laravel.com/docs/10.x/installation#laravel-and-docker) というセクションがあり調べてみると、[sail](https://laravel.com/docs/10.x/sail) というのがあります。これで救われたと思うのですが、

> Laravel Sail is a light-weight command-line interface for interacting with Laravel's default Docker development environment.

とあり、開発環境であると説明がされています。

コミュニティでも

> In the Laravel documentation it says that Sail is for a development environment, the best option for production environments is to use Laradock.

と、開発目的であることが記されています。一応 sail に publish コマンド的なのもあるのですが、eject のようなもので sail の rail に乗る必要があり、アプリケーションの実行部分だけをコンテナに詰めてホスティングみたいな薄い使い方はできなさそうでした。

FYI: https://laracasts.com/discuss/channels/servers/sail-for-production-server?page=1&replyId=804422

別の選択肢を探そうと思っているのですが、このコメントでは Laradock を使えとあるのですがどうなのでしょうか。

### Laradock

[Laradock](https://laradock.io/) も公式には

> Laradock is a full PHP development environment for Docker.

とあります。

これはいわば Laravel を Docker 上で開発するためのテンプレ集だと自分は思っています。開発も Getting Started にある通り、新規開発ならgit clone してきてその上で開発するか、既存開発なら git submodule を使って開発するかとなっています。

`docker-compose up -d nginx mysql phpmyadmin redis workspace` のようにして起動できますが、開発した成果物だけを publish することはできなさそうです。

[publish や deploy で調べると出るページ](https://laradock.io/documentation/#prepare-laradock-for-production) には docker-compose ごと、つまり Laradock ごとデプロイしてしまえば良いように書いているのですが、mysql も redis もマネージドなものを使いたいので、その使い方はしたくないです。つまりアプリケーションのコンテナだけを CloudRun や ECS にホスティングしたい場合は向かなさそうです。

## というわけで気合いでデプロイ

そこで公式ツールに頼らず自力で頑張っていきましょう。スクリプト言語のコンテナ化はしたことがあります。過去に実行ファイルに落とし込まずに Docker で動かす方法として、[持続可能なスプラトゥーン３反省システム](https://blog.ojisan.io/splatoon3-hansei-site2/) を作った時のことを思い出しました。これは Django を CloudRun にデプロイしてあり、このときの Dockerfile は

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

としていました。つまりは

- パッケージマネージャーで依存を入れる
- ソースをコンテナに詰め替える
- エントリポイントを呼び出す

とすれば良いのです。

## php artisan serve を Docker からやる方法を見つける

なので PHP をコンテナで動かすのであれば PHP コマンドが使える環境にスクリプト一式を入れると良いのです。その結果がこれです。

```
FROM php:8.2-fpm

ENV COMPOSER_ALLOW_SUPERUSER 1
ENV COMPOSER_NO_INTERACTION 1

RUN apt-get update
RUN apt-get -y install libzip-dev
RUN docker-php-ext-install zip pdo_mysql

COPY --from=composer /usr/bin/composer /usr/bin/composer

COPY . .

RUN composer update
RUN composer install

CMD ["php", "artisan", "serve", "--host", "0.0.0.0"]
```

これを

```
docker build . -t server

docker run -p 8000:8000 server
```

とすれば起動します。

### LaravelやComposerが依存するコマンドや拡張のインストール

解説すると、

```
RUN apt-get update
RUN apt-get -y install libzip-dev
RUN docker-php-ext-install zip pdo_mysql
```

は compose が入れるライブラリが zip 形式なので、その解凍に必要なツールです。ベースイメージによっては最初から入っていると思いますが、入っていなかったので入れています。`php:8.2-fpm` はデファクトのように使われているものなのに入っていないということは、このコマンドを叩くのも儀式的なものだと思います。

### Composer の install

```
COPY --from=composer /usr/bin/composer /usr/bin/composer
```

は composer の install です。他の解説では apt でいろんな資材を入れたり、curl でバイナリ落としてきたりしていますが、composer のコマンド自体は composer イメージからマルチステージドビルドで引っ張ってくることができます。それを bin 配下に保存してしまえばコンテナの中からいきなり composer コマンドを使えるようになります。

### 依存のDL

そして

```
RUN composer update
RUN composer install
```

で composer.json をもとに vendor に依存を引っ張ります。

### 起動

あとはスクリプトを起動すれば Laravel サーバーが動きます。

```
CMD ["php", "artisan", "serve", "--host", "0.0.0.0"]
```

## Web サーバーを使う

さて、Laravel のドキュメントを見ていると、Apache や Nginx と使われることを想定しているようにも見えます。先のコンテナだと Nginx は経由していないです。

FYI: https://laravel.com/docs/10.x/deployment#nginx

自分は「こんなことしなくてもアプリケーションサーバーはアプリケーションサーバーとしてホスティングしておいて、その前段で CDN なりリバースプロキシをおけば良いだけでは。だから php artisan serve すればいいのでは」と思っていました。しかしどうも "artisan serve production" などでググるとそれは違うようなのです。

例えば artisan serve が内部で使う PHP ビルトインサーバーには

> Warning: This web server is designed to aid application development. It may also be useful for testing purposes or for application demonstrations that are run in controlled environments. It is not intended to be a full-featured web server. It should not be used on a public network.

という記述があります。

FYI: https://www.php.net/manual/en/features.commandline.webserver.php

また single-threaded process ともあるのでこれを本番で使うのはやめた方がよさそうです。そこで解決するのが Webサーバーとして前段に web server を置き、backend request としてプロキシすることです。このときに fastcgi, fpm を使えば効率的にスケーリングさせられるようです。こうしたことから Laravel と Web サーバーを組み合わせることへの公式の言及や、記事が多いこと理由がわかりました。そこで Apache か Nginx のどちらかを選択するわけですがどちらを選べば良いのでしょうか。

### 自分は Apache を使うと思った

ここでDockerfileのベースイメージをどれにするかの選択が必要です。選択肢は php-fpm と php-apache です。Nginx を使うと nginx + php-fpm という組み合わせになります。Nginx でリクエストを受けて、fastcgi 経由で laravel の index.php を呼び出すやり方です。これは一見してよさそうなのですが、コンテナデプロイを考えると２つのコンテナをデプロイする必要があります。めんどくさいのでやめました。

php-apache を選択するとウェブサーバーとアプリケーションサーバーが同居することになります。しかしapacheはマルチプロセスなモデルなのでapache部分をコンテナ内ではスケーリングさせられて、大量のアクセスが来てもIOバウンドであれば single threaded process なモデルよりパフォーマンスは改善するはずです（多分非同期ランタイムでは動いてないはずなので、この辺の議論が気になる人は [Webサーバーアーキテクチャ進化論2023](https://blog.ojisan.io/server-architecture-2023/) を読んでみてください）。

スケーリングを考えると nginx + php-fpm で完全に分離させて nginx コンテナだけスケーリングさせるとかすればもっと金銭的なコスパよくスケーリングさせられるのですが、まあめんどくさいので今はしません。何がめんどくさいかというとその一つには nginx の設定ファイルを環境変数が使えないから dev, stg, prd ごとに切り分ける必要が出てくることです。nginx ではしたことないのですが VCL 書いている時は handlebars や terraform の template から環境ごとにビルドして vcl を作り出すみたいなことをしていて、このパイプライン作るのが結構めんどくさいので本当にやりたくないです。

というわけで apache を使います。nginx + php-fpm の方が性能的にはよさそうですがどうせコンテナの数を増やせば、よほど過酷な環境じゃない限り性能的には変わらないと思います。そもそも性能を気にするならPHPを選ばないというのもあります。

#### 完成形

先に完成形を見せます。

```
FROM php:8.2-apache

WORKDIR /var/www/

RUN apt-get update && apt-get install -y \
    libzip-dev \
    && docker-php-ext-install zip pdo_mysql
COPY --from=composer /usr/bin/composer /usr/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER 1
ENV COMPOSER_HOME /composer
EXPOSE 8080
COPY . /var/www/
COPY ./000-default.conf /etc/apache2/sites-available/000-default.conf
RUN composer install
RUN chmod 777 -R /var/www/storage/ && \
    echo "Listen 8080" >> /etc/apache2/ports.conf  && \
    a2enmod rewrite
```

##### 前提のtree

またフォルダ構造はこうなっているとします。

```
❯ tree -L 2 .
.
├── README.md
├── db
│   ├── data
│   ├── my.cnf
│   └── sql
├── default.conf
├── docker-compose.yaml
└── server
    ├── Dockerfile
    ├── README.md
    ├── app
    ├── artisan
    ├── bootstrap
    ├── composer.json
    ├── composer.lock
    ├── config
    ├── database
    ├── package.json
    ├── phpunit.xml
    ├── public
    ├── resources
    ├── routes
    ├── storage
    ├── tests
    └── vite.config.js
```

##### composer の設定

`ENV COMPOSER_HOME /composer` までの部分は `artisan serve` したときと同じやり方です。

##### apache の設定

```
COPY ./000-default.conf /etc/apache2/sites-available/000-default.conf

RUN chmod 777 -R /var/www/storage/ && \
    echo "Listen 8080" >> /etc/apache2/ports.conf  && \
    a2enmod rewrite
```

を動かすためにはまずDockerfileと同じ階層に 000-default.conf が必要です。
これは Apache の設定です。

この設定は

```
<VirtualHost *:8080>

  ServerAdmin webmaster@localhost
  DocumentRoot /var/www/public/

  <Directory /var/www/>
    AllowOverride All
    Require all granted
  </Directory>

  ErrorLog ${APACHE_LOG_DIR}/error.log
  CustomLog ${APACHE_LOG_DIR}/access.log combined

</VirtualHost>
```

とします。Laravel は public にある index.php がエントリポイントになるのでそこをDocumentRootにします。

`chmod 777 -R /var/www/storage/` はログファイルを書き込むときにそのままだと権限が足りないので 777 をつけています。

`a2enmod rewrite` は rewrite モジュールの有効化です。これがないとパスをLaravelの世界に持ち越せず、トップページしか表示できなくなります。（この辺は僕もよくわかってない。Apache 使うの初めてだし・・・）

##### ビルド & 起動

まずローカルの起動に関しては docker compose でやると良いと思います。

```
version: '3'
services:
  app:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - '8080:8080'
```

初歩的ですがports を忘れないようにしましょう。自分は最初 fpm + nginx で組んでいてそのときは application server 側の port をつなげる必要がなかったのでこの設定をいれておらず、あとで apache に切り替えたときにそのことを忘れていてかなり時間を溶かしました。

ビルドするときは

```
docker build -t ${{ env.IMAGE }} -f ${{ env.DOCKER_FILE_PATH }} server
```

な感じでしてください。ビルドコンテキストを server にするのは忘れないでください。
そうしないと COPY するときに対象がずれてしまい誤ったコピーや not found になります。
今回だと一応 ./000-default.conf のコピーの部分で止まってくれます（ホスティング時に１敗）

### ホスティングはしないけど、Nginx で動かす例を紹介

ここで今回は Nginx を使わなかったのですが、ホスティングせずローカルで動かしていた時は採用していたので、そのときの動くコードも紹介します。
今回も置き場と階層はこのようになっているとします。

```
❯ tree -L 2 .
.
├── README.md
├── db
│   ├── data
│   ├── my.cnf
│   └── sql
├── default.conf
├── docker-compose.yaml
└── server
    ├── Dockerfile
    ├── README.md
    ├── app
    ├── artisan
    ├── bootstrap
    ├── composer.json
    ├── composer.lock
    ├── config
    ├── database
    ├── package.json
    ├── phpunit.xml
    ├── public
    ├── resources
    ├── routes
    ├── storage
    ├── tests
    └── vite.config.js
```

まず Laravel 側のコンテナはこう定義します。

```
FROM php:8.2-fpm
RUN apt-get update && apt-get install -y \
    libzip-dev \
    && docker-php-ext-install zip pdo_mysql
WORKDIR /var/www/server
COPY --from=composer /usr/bin/composer /usr/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER 1
ENV COMPOSER_HOME /composer
COPY . .
RUN chown www-data:www-data -R ./storage
RUN composer install
```

そして docker compose の設定をします。

```yaml
version: "3"
services:
  app:
    build:
      context: ./server
      dockerfile: Dockerfile
  nginx:
    image: nginx
    container_name: nginx
    ports:
      - 8000:80
    volumes:
      - .:/var/www
      - ./default.conf:/etc/nginx/conf.d/default.conf
    working_dir: /var/www
    depends_on:
      - app
```

nginx の設定は Docker に切り出すか悩んだのですが、一旦は設定ファイルをコンテナに置ければそれでいいので、volume で解決します。その設定ファイルは

```
server {
  listen 80;
  root /var/www/server/public;
  index index.php;

  location / {
    root /var/www/server/public;
    index index.php;
    try_files $uri $uri/ /index.php$query_string;
  }

  location ~ \.php$ {
    try_files $uri =404;
    fastcgi_split_path_info ^(.+\.php)(/.+)$;
    fastcgi_pass app:9000;
    fastcgi_index index.php;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    fastcgi_param PATH_INFO $fastcgi_path_info;
  }
}
```

となります。いま Laravel は `FROM php:8.2-fpm` というイメージで動かしており、fpm は FastCGI Process Manager を指し、これはウェブサーバーからの呼び出しを効率的に行うツールです。そのため nginx の設定は laravel アプリケーションへのプロキシが仕事となります。ここで注意なのは普通は CDN やら リバースプロキシからはルーティングを呼び出すのですが、Laravel の場合は index.php でハンドリングします。そのため Nginxへのリクエストは index.php に送る必要があります。それは Laravel アプリケーションの public/ 配下に入っているので root 指定するときはこれに気をつける必要があります。

ただこれはホスティングで困ったので不採用です。

## DB との接続はどうするのか

ついでにDBとの接続もしてしまいましょう。このような docker-compose.yaml になります。

```yaml
version: "3"
services:
  app:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
  db:
    image: mysql:8.0.33
    ports:
      - "3306:3306"
    environment:
      MYSQL_DATABASE: laravel_database
      MYSQL_PASSWORD: root
      MYSQL_ROOT_PASSWORD: root
    command: mysqld --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    volumes:
      - ./db/data:/var/lib/mysql
      - ./db/my.cnf:/etc/mysql/conf.d/my.cnf
      - ./db/sql:/docker-entrypoint-initdb.d
```

そして Laravel 側の環境変数は

```
APP_NAME=Laravel
APP_ENV=local
APP_KEY=base64:+nankatekitounaataiwoiretene==
APP_DEBUG=true
APP_URL=http://localhost
DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=laravel_database
DB_USERNAME=root
DB_PASSWORD=root
```

とします。DB_HOST のところを localhost ではなく、db といった docker compose 上の DB の service 名にしておいてください。そうしないとつながりません（docker network で繋いでいるわけでもないのになんで？）。

ただデプロイのことを考えたらこれらの環境変数はコンテナの中からも渡してあげるようにしておいてください。Dockerfile の上に

```
FROM php:8.2-apache

ENV APP_NAME Laravel
ENV APP_ENV local
APP_KEY=base64:+nankatekitounaataiwoiretene==
ENV APP_DEBUG true
ENV APP_URL http://localhost
ENV DB_CONNECTION mysql
ENV DB_HOST db
ENV DB_PORT 3306
ENV DB_DATABASE laravel_database
ENV DB_USERNAME root
ENV DB_PASSWORD root
```

のように差し込んでおいてください。

これで繋がるようになったので、Laravel 側から migration しましょう。migration しないとデータをとってくることはできません。

あらかじめDBを起動しておき、その状態で migration コマンドを叩きます。

```
docker compose up # DB ごと全て立ち上げる

docker compose exec app php artisan migrate:fresh --seed # container の中の artisan を使って migration
```

このコマンドは docker-compose.yaml が階層あるところで実行してください。そうしないとコンテナが動いていても not found になります。（１敗、docker ps では見えてるのに docker compose ps では見えないのなんで！？と時間を溶かした。）

ここまでくると

```
curl http://127.0.0.1:8000/api/users/1
```

とかでデータが返ってきます。

## Laravel を CloudRun にホスティングする

さて、これで Laravel を Docker で動かすコードがローカルで動きます。
しかしコンテナを使いたいのはホスティングも目的に入っているはずです。
そこまでやりましょう。
ここまでにコンテナの中身とビルドについては紹介したのであとは繋ぎ合わせるだけです。

まず GitHub Actions を用意します。これはいろんな人に怒られていてあまり勧められる方法ではないのですが、デプロイ用のサービスアカウントを使ってデプロイします。サービスアカウント情報のセットの仕方は [いま GitHub Actions から GCP を使うなら](https://blog.ojisan.io/gha-gcloud/) をみてください。

```yaml
name: laravel deploy dev

on:
  push:
    branches:
      - "*"
      - "!main"

env:
  GCP_REGION: asia-northeast1
  IMAGE: asia.gcr.io/${{ secrets.GCP_PROJECT_ID }}/laravel-dev:${{ github.sha }}
  GCP_CREDENTIALS: ${{ secrets.GCP_CREDENTIALS }}
  DOCKER_FILE_PATH: ./server/Dockerfile
  SERVICE_NAME: laravel-dev

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout the repository
        uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18.x"
      - id: "auth"
        uses: "google-github-actions/auth@v0"
        with:
          credentials_json: "${{ env.GCP_CREDENTIALS }}"
      - name: Configure docker to use the gcloud cli
        run: gcloud auth configure-docker --quiet
      - name: Build a docker image
        run: docker build -t ${{ env.IMAGE }} -f ${{ env.DOCKER_FILE_PATH }} server
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

DBの接続情報もクラウド環境に合わせて切り替えたいです。そのときは build args を使ってください。

```
docker build -t ${{ env.IMAGE }} -f ${{ env.DOCKER_FILE_PATH }} . --build-arg hoge=${{ env.hoge }}  --build-arg fuga=${{ env.fuga }}} --build-arg piyo=${{ env.piyo }}
```

としてビルド時に引数を渡せるので、Dockerfile でそれをセットしてください。

```
ARG hoge
ENV hoge=$hoge

ARG fuga
ENV fuga=$fuga

ARG piyo
ENV piyo=$piyo
```

こうすることで GHA の yaml を環境ごとに用意するだけで dev, stg, prd それぞれに向けた Laravel アプリケーションをホスティングできます。

## 自分が Laravel で開発をするならばどうするか

自分がコンテナに対して感じる一番の嬉しさは、手元で動いたものがクラウドでも動くという安心感です。なのでコンテナの中で開発などはする気がないです。そしてビルドの再現性も好きです。（全部ネイティブでやっている頃に比べると）手元だろうがCI/CD上だろうが環境際に引っ張られることなくビルドもできます。そのため Git の管理下にあるものからだけでコンテナを作れることを意識しています。つまり dependency install はコンテナの中でします。だから自分の開発フローは、

- 基本はローカルの環境に package manager でいろいろなものを入れながら開発する
- vendor 配下は git ignore する
- Git の管理下にあるものだけでコンテナを作れるようにし、そのコンテナはローカルで動かす
- コンテナイメージをCI/CD上からも作れるようにする
- コンテナレジストリにイメージを、コンテナをホスティングサービスにデプロイして動作確認
- 本番も同じようにデプロイ

といった感じにします。先の設定ファイルはこれを達成するものと言えます。

## 実装まとめ

情報がとっちらかったので コンテナデプロイ可能で、手元でも検証ができる Laravel + Docker 環境の最小構成を置いておきます。

前提

```
❯ tree -L 2 .
.
├── README.md
├── db
│   ├── data
│   ├── my.cnf
│   └── sql
├── default.conf
├── docker-compose.yaml
└── server
    ├── Dockerfile
    ├── README.md
    ├── app
    ├── artisan
    ├── bootstrap
    ├── composer.json
    ├── composer.lock
    ├── config
    ├── database
    ├── package.json
    ├── phpunit.xml
    ├── public
    ├── resources
    ├── routes
    ├── storage
    ├── tests
    └── vite.config.js
```

Dockerfile

```
FROM php:8.2-apache

WORKDIR /var/www/

RUN apt-get update && apt-get install -y \
    libzip-dev \
    && docker-php-ext-install zip pdo_mysql
COPY --from=composer /usr/bin/composer /usr/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER 1
ENV COMPOSER_HOME /composer
EXPOSE 8080
COPY . /var/www/
COPY ./000-default.conf /etc/apache2/sites-available/000-default.conf
RUN composer install
RUN chmod 777 -R /var/www/storage/ && \
    echo "Listen 8080" >> /etc/apache2/ports.conf  && \
    a2enmod rewrite
```

docker-compose

```
version: '3'
services:
  app:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - '8080:8080'
  db:
    image: mysql:8.0.33
    ports:
      - '3306:3306'
    environment:
      MYSQL_DATABASE: laravel_database
      MYSQL_PASSWORD: root
      MYSQL_ROOT_PASSWORD: root
    command: mysqld --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    volumes:
      - ./db/data:/var/lib/mysql
      - ./db/my.cnf:/etc/mysql/conf.d/my.cnf
      - ./db/sql:/docker-entrypoint-initdb.d
```

GHA

```yaml
name: laravel deploy dev

on:
  push:
    branches:
      - "*"
      - "!main"

env:
  GCP_REGION: asia-northeast1
  IMAGE: asia.gcr.io/${{ secrets.GCP_PROJECT_ID }}/laravel-dev:${{ github.sha }}
  GCP_CREDENTIALS: ${{ secrets.GCP_CREDENTIALS }}
  DOCKER_FILE_PATH: ./server/Dockerfile
  SERVICE_NAME: laravel-dev

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout the repository
        uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18.x"
      - id: "auth"
        uses: "google-github-actions/auth@v0"
        with:
          credentials_json: "${{ env.GCP_CREDENTIALS }}"
      - name: Configure docker to use the gcloud cli
        run: gcloud auth configure-docker --quiet
      - name: Build a docker image
        run: docker build -t ${{ env.IMAGE }} -f ${{ env.DOCKER_FILE_PATH }} server
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
