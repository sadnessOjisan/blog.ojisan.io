---
path: /company-watch-your-job-hunting
created: "2022-12-23"
title: 人事はテックブログを監視すれば社員の転職活動を見抜けるので、対策を考える
visual: "./visual.png"
tags: ["キャリア"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

この記事は [エンジニア転職活動ハックをシェアしよう！ by キャリアデザインセンター「Direct type」 Advent Calendar 2022](https://qiita.com/advent-calendar/2022/directtype) の 23 日目です。OGP は何も思いつかないし AI 生成もいい言葉思いつかなくて [Canva](https://www.canva.com/) で適当に素材眺めていたときに一目惚れしたハンバーガーです。

[転職サイトはリファラを送るのをやめた方が良いと思う](https://blog.ojisan.io/referer-is-kowai/) という記事を 3 ヶ月ほど前に書きました。これは「転職サイトに求職者が実績として会社のテックブログへのリンクを貼った場合、会社側はブログのアクセス解析ツールを使うことで記事執筆者が転職活動中であることを見抜ける」という内容です。今日はその対策を考えます。

## どうして転職活動がバレるのか

転職活動がバレる理由は、採用サイト側からその記事へ遷移した際にはリファラが付くからです。

[Referer](https://httpwg.org/specs/rfc7231.html#header.referer) (referrer ではなく referer, typo が正しい) は、

> The "Referer" [sic] header field allows the user agent to specify a URI reference for the resource from which the target URI was obtained

とある通り、[user agent](https://httpwg.org/specs/rfc7230.html#rfc.section.2.1) (クライアント. field 名ではなく rfc の term としての意) がターゲット URI を取得したリソースの URI 参照 を指定できるようになります。一般的には 現在リクエストされているページへのリンク先を持った直前のウェブページのアドレスを含めます。

HTTP リクエストにはいろいろな形がありますが、いわゆるリンクを辿った Navigation Request の場合は、シークレットモードなどを使わない限りはブラウザが勝手にセットしてくれます。

このリファラがつくことで企業の人は自社のテックブログのアクセス解析を見て「おや、xxx さんの記事に転職サイトからたくさんアクセスされているぞ？おやおや＾＾」となるわけです。

## リファラを知る

リファラはアクセス解析に便利ですが、転職活動がバレるきっかけになったり、そもそも機密を扱うページなどの存在がバレたりと危険なものでもあります。
当然このリファラを制御するための規格や取り決めは存在します。
それが Referrer-Policy です。

### Referrer-Policy の設定

#### Link type "noreferrer"

一つは anchor link に noreffer を指定することです。

```html
<a href="..." rel="noreferrer">hoge</a>

<a href="http://example.com" referrerpolicy="noreferrer"></a>
```

https://html.spec.whatwg.org/multipage/links.html#link-type-noreferrer

こうすることで referrer がつかなくなります。

#### HTML

noreferrer だとリンクごとに指定しないといけないので指定漏れするかもしれません。
HTML 上で meta tag を設定すれば HTML ドキュメント全般に設定を施すことができます。

```html
<meta name="referrer" content="noreferrer" />
```

https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Referrer-Policy

#### Response header

また、HTTP Header でも指定できます。

```
Referrer-Policy: no-referrer
```

これはサイト A から サイト B へ referer を送りたくないなら、サイト A の Response Header に含めます。

### Referrer-Policy の種類

Referrer-Policy には no-referrer 以外にも

```
Referrer-Policy: no-referrer
Referrer-Policy: no-referrer-when-downgrade
Referrer-Policy: origin
Referrer-Policy: origin-when-cross-origin
Referrer-Policy: same-origin
Referrer-Policy: strict-origin
Referrer-Policy: strict-origin-when-cross-origin
Referrer-Policy: unsafe-url
```

といった種類があります。

いま Referrer-Policy がないサイトで Chrome が リンク遷移すると Referer に Origin だけが詰められます。
それはデフォルトで strict-origin-when-cross-origin が指定されるからです。
つまりフルパスで入ることはありません。

FYI: [Chrome 85 Will Set Website Referrer Headers if Missing](https://www.searchenginejournal.com/chrome-85-website-referrer-headers/376407/)

ただこれでも転職サイトからどの URL にアクセスされているか特定されてしまうので Referrer Policy の設定が必要です。

## 求職者が取れる防衛策

さて、上にあげたリファラ送信を抑制する方法ですが、残念ながら **該当ページをみる人にしか取れない方法** です。
つまりその人とは、転職サイトを例に考えると皆さんのポートフォリオや経歴書を見る人、もしくは運営です。

なのでまずは「「「転職サイトは referer を付けるのやめろ」」」というのを大声で言いたいです。
とはいえ対策されるかは分からないので自分達でも防衛策を考えましょう。

ここで起きている問題として、転職サイトが noreffer を明示しなければ、在籍企業は A さんが書いた技術ブログに対しての転職サイトからのアクセスを検知できることです。
なので中間プロキシを挟むと良さそうです。

### 短縮 URL サービスは使わない方が良い

なので一つの選択肢としては [bitly](https://bitly.com/) のような短縮 URL サービスの利用です。
これは短縮 URL にアクセスすると該当の URL に 301 リダイレクトしてくれます。
しかし [Does 301 redirect always preserve referrer?](https://stackoverflow.com/questions/1398277/does-301-redirect-always-preserve-referrer) によると

> RFC doesn't specify any referrer-specific behavior in status 301 definition, nor 301-specific behavior in Referer header definition. Thus, I have to say that although this referrer-preserving behavior is logical, it is not defined in RFC and thus you can never be sure.

> When going between HTTP and HTTPS the HTTP spec says that a referer header should NOT be sent (see 15.1.3 in RFC2616). The spec doesn't say what should happen between HTTPS pages however.
> Interestingly firefox defaults to ignoring the spec in this case, but can be made to conform by setting the network.http.sendSecureXSiteReferrer configuration setting.

とあります。

つまりもしかするとリファラが付くかもしれないし、または所属企業人事がぼくのこのブログを知っていると「こいつ、小細工を・・・」となるのでやめた方が良いと思います。

そこで確実なのは、リンクまとめサイトを作る、もしくは自由なドメインを取れる PaaS を借りることです。

### まとめサイトを作る

リンクまとめサイトを作って、その HTML もしくは HTTP Response Header に Referrer Policy として noreferrer を付けてあげると、企業ブログには no referer としてアクセスがされるようになります。
あとはそのリンクを転職サイトに貼れば良いです。

### リダイレクトするだけのサーバーを立てる

いまは Vercel や CloudFlare Worker などタダでエッジでリダイレクトをかけられるコードをホスティングできる環境があります。
しかもドメインもある程度カスタマイズできるのでリファラもカムフラージュできます。

## まとめ

こういう防衛策を考えるのはめんどくさいので、各転職サイトはデフォルトで no referrer を付けてほしいです。
