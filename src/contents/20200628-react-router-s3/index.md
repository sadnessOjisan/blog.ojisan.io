---
path: /s3-spa-deploy
created: "2020-06-28"
title: S3にSPAはデプロイできるのか -HostingとRouting-
visual: "./visual.png"
tags: [S3, SPA]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

できます。
[ここ](https://qiita.com/ikamirin/items/6377c390034a064190f5)にある通り、**S3 の設定ページで エラードキュメント に index.html をセットするだけ**で良いです。CloudFront がなくてもできます。
（完）

ただ、たとえば /about でリロードして、404 Not Found になっていたものが、エラードキュメントに index.html を指定したら /about が見れるって違和感ありませんか？
少なくとも私は「index.html に redirect するのだから、そこで見えるものって / なのでは！なんで/about が見えるんですか!？」という疑問を持っていました。
あと、「S3 SPA」で検索すると、[CloudFront](https://aws.amazon.com/jp/cloudfront/) 前提だったり、index.html を書くことで解決される理由は書かれてなさそうなので、そういうのを解説したいと思います。

## どうして SPA のホスティングで悩むのか

[SPA(Single Page Application)](https://ja.wikipedia.org/wiki/%E3%82%B7%E3%83%B3%E3%82%B0%E3%83%AB%E3%83%9A%E3%83%BC%E3%82%B8%E3%82%A2%E3%83%97%E3%83%AA%E3%82%B1%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3) のホスティングで問題になりがちなのは、ページのリロード処理です。

一般的にはルーティングはブラウザが管理していますが、SPA では JavaScript がその責務を一部担います。
私たちが普段 Web ページをみるときは routing に対応した HTML をサーバーに取りに行き、それをブラウザで参照します。
例えば、example.com/hoge.html とあれば、example.com が割り当てられた web サーバー にある hoge.html を取得し、それをブラウザが表示します。

一方で SPA でそのサイトが作られている場合は example.com/hoge とあれば、example.com にある HTML 上の JS を実行して、その JS が hoge に該当するコンテンツを client 側で生成・レンダリングします。
そのため**サーバーに HTML ファイルを取得するリクエストはしません。**

しかしこのとき、 example.com/hoge で画面をリロードすると、example.com にある HTML と JS を読み込んでおらず、/hoge に対するリクエストが web サーバーに飛んでいってしまいます。
その結果サーバーは example.com/hoge にある hoge を返そうとします。
しかし、SPA においては アプリケーションは example.com/index.html にしかなく、hoge はサーバー上に存在しないのでリソースが見つからず HTML は返りません。

そのため HTTP Request の結果は 404 Not Found となります。
**つまり SPA をホスティングすると、ユーザーがなんらかのパス上でリロードした際、リクエストが Web サーバーに行きリソースが見つからず表示することができません。**

それが S3 上でも発生しするので調べると、エラーページのリダイレクト対応として index.html(ルートページ)を指定すれば解決できることが分かりました。（もっともその設定は CloudFront 上でされていることが多いですが。）

## どうしてルートリダイレクトで SPA の遷移ができるのか

その理由は HTML5 の [History API](https://developer.mozilla.org/ja/docs/Web/API/History_API) とクライアント側での DOM 操作にあります。
History API は JavaScript の世界から アドレスバーやページの navigation state を制御できる API です。

代表的な SPA routing の実装 では、link は

```js
const routes = {
  "/": `<p>route直下だよ</p>`,
  "/hoge": `<p>hogePageだよ</p>`,
}

// hogeページへのリンクをクリックした時に実行される関数
function handleClickToHogeLink(e) {
  // 本当にaタグで遷移してしまわないようにブラウザ本来のイベントを止める
  // (遷移してしまうとサーバーにリクエストが飛ぶため)
  e.preventDefault()

  // hogeに遷移
  window.history.pushState(
    {}, // 遷移時にobjectを登録できる, ページ遷移イベントのときにその時点でのobject(つまりstate)を取り出してアクセスできる
    "hoge" // ページタイトル,
    window.location.origin + pathName // 遷移先として登録するURL
  )

  // 遷移後のpageの内容を作る
  el.innerHTML = routes[window.location.pathname]
}
```

として表現できます。
[navi](https://frontarm.com/navi/en/) などの SPA routing ライブラリの経験がある方はなんとなく見覚えがあるのではないでしょうか。

ここで、routing を司る関数(たとえばコンポーネントが mount されるときに、URL の path から遷移対象のコンポーネントを出し分けるなど)をルートページに置いておけば、404 NotFound のときにそのルートに redirect させることで routing 関数を実行し、本来アクセスしようとしたパスに対応するページを表示させられます。

これが先ほどのエラーページとして ルートドキュメントを指定することで、404 Not Found を回避できる理由です。

## S3 の場合

CloudFront だけでなく S3 も、 このようなエラーに対する Redirect 処理 を書くことができます。
これが先ほど紹介した[エラードキュメント](https://docs.aws.amazon.com/ja_jp/AmazonS3/latest/dev/CustomErrorDocSupport.html)です。
この設定を使って、routing の設定がされた JS を読み込んだ HTML を返すことで、その routing に対応した JS が実行され SPA をレンダリングさせられます。

この設定画面は S3 の設定ページにあるので、わざわざ CloudFront を使わなくてもできます。

![S3上でエラーのリダイレクト設定をする](s3error.png)

検証に使ったコードは[こちら](https://github.com/ojisan-toybox/s3-spa-deply)です。
S3 操作が可能な IAM を用意して、GitHub Actions の Secrets と AWS CLI を設定すれば動くはずです。

## じゃあ Cloud Front は 不要？

SPA をホスティングするだけなら、ルーティングへのサポートのことを考えても、不要です。

ただしそのサイトを HTTPS 対応したい場合は必要になりそうです。
確証は持てませんが、 [S3 を HTTPS 化する記事](https://cre8cre8.com/aws/https-s3-and-cloudfront.htm) などをみるとそのようです。
また S3 の可用性に問題はなくとも、配信パフォーマンスを考えると前段に CDN があった方が良いとも思います。
[S3 を使った配信をする場合の構成パターン集](https://dev.classmethod.jp/articles/static-contents-delivery-patterns/)を見ていると、やっぱり CloudFront は欲しくなりました。

また [Stack Overflow](https://stackoverflow.com/questions/16267339/s3-static-website-hosting-route-all-paths-to-index-html) 上には S3/Redirect based approach を意図的に使わない理由を述べている人がおり、hash(#)ベースの SPA Routing 設定をしている場合の考慮も必要で、CloudFront が使えるなら使った方がよいみたいです。（この辺りは詳しくないので説明できません。申し訳ございません。）

なので、本当は[S3 を使った配信をする場合の構成パターン集](https://dev.classmethod.jp/articles/static-contents-delivery-patterns/)にある横綱パターンを使いたいが、大人の事情でできない場合の奥の手くらいとして、S3 単体でも SPA 作れるようと覚えておけばいいのではと思います。
（いまは コストや手間の観点からも[Amplify](https://aws.amazon.com/jp/amplify/) という良い選択肢があるので、個人的にはそれを推したい気持ちはあります。）

## 参考文献

- https://www.slideshare.net/ushiboy/spa-76170499
- https://medium.com/@bryanmanuele/how-i-implemented-my-own-spa-routing-system-in-vanilla-js-49942e3c4573
- https://medium.com/@kevinwkds/spa-routing-background-8499949be087
- https://aws.amazon.com/jp/premiumsupport/knowledge-center/cloudfront-serve-static-website/
