---
path: /c10k-wakaran
created: "2023-04-08"
title: C10K 問題、実は理解していない
visual: "./visual.png"
tags: [multi thread, async runtime]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## お願い

「C10K 問題とは何か」がわかる方は是非 [Issue](https://github.com/sadnessOjisan/blog.ojisan.io) や [Twitter](https://twitter.com/sadnessOjisan) などで教えてください。

## はじめに

ちょうど先週の今日くらいに [Web サーバーアーキテクチャ進化論 2023](https://blog.ojisan.io/server-architecture-2023/) という記事を書いた。予想以上にバズって驚いている。それでも [yuuk1 先生が書いた原典](https://blog.yuuk.io/entry/2015-webserver-architecture) に比べると全然ブクマされていないし、改めて読み直すとすごく分かりやすい説明だなと思った。なので自分の版には改善の余地がたくさんあるだろうし、定期的に補足を足していこうと思うし(Erlang 足せと言われているので勉強中です)、現にところどころ修正している。とはいえこの分野というか非同期ランタイムはそもそもの問題の対象が難しすぎるし分かりやすく書くのそもそも難しいというのはある。

さて、実はあの記事に対する指摘に「ここボカしてるよね」というものがあり、実はその通りだ。その中でも C10K の説明がいい加減という指摘があった。実に鋭い。なんと実は筆者は C10K 問題をきちんと理解していない。今日は C10K 問題の何を理解していないのか書く。

## そもそも C10K 問題とは何か

まず筆者はこの答えを知らない。そこで原典を確認してみると、I/O Strategies のセクションが大部分の分量を占めており、

1. Serve many clients with each thread, and use nonblocking I/O and level-triggered readiness notification
2. Serve many clients with each thread, and use nonblocking I/O and readiness change notification
3. Serve many clients with each thread, and use asynchronous I/O and completion notification
4. Serve one client with each server thread

とあり、パターンに応じた実装テクニックを紹介しているドキュメントに思える。

FYI: <http://www.kegel.com/c10k.html>

なのであまり問題についての解説ではないのかと思ったが、どうやら[今の版はドキュメント公開時とは様変わりしていることを教えてもらい](https://github.com/sadnessOjisan/blog.ojisan.io/issues/316)、その[当時の原典](https://web.archive.org/web/19990508164301/http://www.kegel.com/c10k.html)を確認してみると、

- Limits on open filehandles
- Limits on threads
- Other limits/tips
- Kernel Issues

に重きがあるドキュメントのようだ。

この時の版の時代には epoll がまだないので epoll の言及がないのも味わい深い。

ただ現在の原典・当時の原典共に

> It's time for web servers to handle ten thousand clients simultaneously, don't you think? After all, the web is a big place now.
> And computers are big, too. You can buy a 500MHz machine with 1 gigabyte of RAM and six 100Mbit/sec Ethernet card for $3000 or so. Let's see - at 10000 clients, that's 50KHz, 100Kbytes, and 60Kbits/sec per client. It shouldn't take any more horsepower than that to take four kilobytes from the disk and send them to the network once a second for each of ten thousand clients. (That works out to $0.30 per client, by the way. Those $100/client licensing fees some operating systems charge are starting to look a little heavy!) So hardware is no longer the bottleneck.

> One of the busiest ftp sites, ftp.cdrom.com, currently serves around 3600 clients simultaneously through a 70 megabit/second pipe. Pipes this fast aren't common yet, but technology is improving rapidly.

> With that in mind, here are a few notes on how to configure operating systems and write code to support thousands of clients. The discussion centers around Unix-like operating systems, for obvious reasons.

とある通り、大量のクライアントをどう裁くかの技術の紹介が目的のドキュメントではあるようだ。

ただ私は So hardware is no longer the bottleneck. の一文が大切で、クライアントが増えた時にハードウェアの限界でない理由でのパフォーマンス劣化を C10K 問題と呼んでいるのだろう。

そしてその理由が 先に挙げた

- Limits on open filehandles
- Limits on threads
- Other limits/tips
- Kernel Issues

に書かれているわけだ。

ざっと見た限りそれらの制限は

- fd に上限がある
- スレッド作成数に上限がある
- スレッドサイズが固定長だとメモリに上限がくる

と指摘しており、さらに現在の版では poll は fd を全部舐めるためにクライアントが増えるとパフォーマンスが劣化する(おそらく 1req ごとに 1thread を作って割り当てたらという前提がある)ことも言及している。

とはいえ 2023 年においては Kernel の実装も進化しているのでまた事情が異なってきていそうだ。 当時指摘の C10K 問題も現代の OS から見るとかなり緩和されているのではないだろうか。

## 現代における金の弾丸

また現代においては金の弾丸というべきものがある。リクエストが多いなら負荷分散として水平スケーリングする技術が進化している。つまりコンテナとコンテナオートスケーラーだ。<http://www.kegel.com/c10k.html> は C10K を避けるテクニックを紹介してくれているが、現代においてはそれはホスティングサービスの選定次第でそもそもそのようなテクニックを使わなくていいかもしれない。

もっとも僕たちが 2023 年に使う言語や FW は <http://www.kegel.com/c10k.html> のテクニックがふんだんに使われているはずなので、知らず知らずのうちに恩恵は受けている。

## ところでコンテキストスイッチは C10K 問題の原因なのだろうか

C10K 問題と一緒に語られる問題にコンテキストスイッチがある。

- <https://www.google.com/search?q=context+switch+c10k>
- <https://www.google.com/search?q=%E3%82%B3%E3%83%B3%E3%83%86%E3%82%AD%E3%82%B9%E3%83%88%E3%82%B9%E3%82%A4%E3%83%83%E3%83%81+c10k>

とかでググるとたくさん出てくる。

ググるとなんか昔に自分が書いたテックブログも出てきた。

- <https://blog.recruit.co.jp/rls/2019-12-13-node-async-io/>

いや、C10K とコンテキストスイッチは原典では紐付けられていないんだよなぁ・・・

ただ OS のネイティブスレッドで大量にスレッドを使うとコンテキストスイッチのコストが発生するのは事実で、1req ごとに 1thread 立てているとクライアントが増えれば増えるほどサーバーのパフォーマンスは劣化するだろう。さて、これは C10K 問題の原因の一つとして扱っていいのだろうか。僕は正直わかっていない。

というかコンテキストスイッチも [グリーンスレッドの自作に必要なものは何か](https://blog.ojisan.io/multi-green-thread/) で実装はしたものの、本物のプログラミング言語や OS がどう実現していて何がコストになるのか知らない。これもわかる人は教えて欲しいです。

## そもそも原典から状況が変わりすぎているので C10K とは何かを考え直してもいいかもしれない、もしくは C10K はそもそも気にしなくていいのかもしれない

と、ここまで 「C10K 分からん」「コンテキストスイッチ分からん」と書いたが、実は時代のせいなのかもは思っている。原典が書かれた時代は epoll も コンテナもないのでそのときの C10K 問題 が先の定義であって、現代における C10K 問題 の定義は必ずしも原典通りである必要はないのかもしれない。そもそもコンテナだったり Go 言語、Node.js、tokio, cats-effect などに恵まれた現代において C10K 問題について議論する必要はないかもしれない。もし議論するのが歴史に関することであれば原典の定義で話し、現代のサーバーアーキテクチャについてついて語るのであれば、筆者にとっての C10K 問題をその時その時で定義すればいいのかもしれない。知らんけど。皆の思う C10K 問題を教えてください。
