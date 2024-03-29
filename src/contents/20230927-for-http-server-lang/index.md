---
path: /for-http-server-lang
created: "2023-09-27"
title: HTTPサーバーを書くための言語が不在だと思う
visual: "./visual.png"
tags: [http]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## tl;dr

- 今ある選択肢で十分にHTTPサーバーを書ける
- 言語組み込みの機能のみでHTTPサーバーを書けるように、デザインされた言語はないと思う
- サーバー開発に特化した言語があってもいいのではとふと思った

## はじめに

最近いくつか新規開発をする機会があって言語の選定に頭を悩ませた。要件や状況やチームに応じて言語選択の正解は変わるとは思うので、現実に合わせて妥協するしかないのだが、選択に際してそもそも HTTP サーバーを書くことを意識して設計された言語がないような気がした。いま自分達がHTTPサーバーを作れているのは、汎用プログラミング言語とエコシステムの力、そして開発者の取捨選択と創意工夫のおかげだと思う。それで十分に間に合っていると思う。

なのにどうしてHTTPサーバー用の言語があるかどうかを気にするかと言うと、サードパーティのエコシステムに頼りたくないからだ。それは長期的なメンテナンスをするにあたって、自分のツール選定が負債を作り込むかもしれなく、なるべく自分が選択しないといけない場面は減らしたいと思っている。だからエコシステム経由で入れる機能は最初から標準に組み込まれていてほしいと自分は考える。今日はどういう機能が入っておいてほしいかメモがてら書いてみようと思う。いつか言語を作るときに見返したい。

## どういう機能があると嬉しいか

注: FWではなく、言語についての話。

### 標準で HTTP をサポートしてほしい

世の中のほとんどの言語は、net module などで TCP に対してはデフォルトでサポートがあったり、libc のラッパーを使ってインターネット越しの通信をある程度は直感的に書けるようになっている。ただ、HTTP に対するサポートは標準にはないと思う。ここでいうHTTPに対するサポートとはずばりHTTPでのパースであり、リクエストからヘッダとボディを取得できて、レスポンスを書き込むことを指す。現状、req, res を簡単に扱うためには何かしらのWebFWを選定しないといけなくなっているかのように思える。この作業は未来におけるWebFWの趨勢の読みをしないといけない。自分はそれを苦に感じるときがある。なので言語が標準でHTTPサーバーを提供してくれていれば考えなくて済むのにとよく思う。

### Routing が賢くなってほしい

そんなHTTPサーバーを標準で備えてくれている言語としては自分は最初にGoが思いつく。なので Go では標準ライブラリ縛りでサーバー開発をできそうと思ったのだが、いざ使ってみると `/:id` のようなパスマッチのルーティングができなくて結局ライブラリを入れたことがある。この解決をルーターライブラリなしでするには、正規表現と分岐を使う必要がある。`/:id` のようなパスの定義はサーバーを書く以上はほぼ登場すると思うので、サポートされて欲しい。このようなルーティングを宣言的に書けるサードパーティライブラリはあるので、それが公式でも取り入れられて欲しい。

### 関数型（と呼ばれているもの）によくある構文が欲しい

Result, Future 型と、パターンマッチやif式が欲しい。do や for のような flatMap を簡単に展開 できるものがあると嬉しい。HTTP サーバー開発は「未決定の値」と「失敗するかもしれない値」に溢れると思う。なのでそれらに対するハンドリングの仕組みは言語側で用意されていてほしい。特に、どのエラーを回復させるか、どのエラーはどのステータスコードにマップするのかとエラーに対する扱いの引き出しは多く欲しい。

### 標準でIO特化の非同期ランタイムを持ってほしい

HTTPサーバー開発のメイントピックは並行プログラミング、非同期プログラミングだと思う。そのため非同期ランタイムは標準で組み込まれていてほしい。Goは goroutine が、JS は libuv の抽象を使えるが、Rustのように開発者がランタイムを用意しないといけないと言うこともある。Rust のケースだと、非同期ランタイムを自由に入れ替えられることでパフォーマンスの追求ができるようになっていたり、言語でのサポートを待たずに新しいOSの機能を取り入れられたりできるという利点があるのだが、Webサーバーの開発においては IO 主体の非同期ランタイムがあればそれで良いと思う。それが標準で備えられていることの方が嬉しい。

### 型を誤魔化す手間が、型を誤魔化さない手間を超えて欲しい

Webサーバーは unknown な input を受け取り、（自身にとって）known な output をするものだと思う。いかに入り口や外部境界のunknownをknownなものに変えていくかが品質向上の鍵だと思っている。なので TS でいう any や ts-ignore は使うべきでないと思っている。ただ any や ignore のような緊急ハッチが必要なのはわかる。だからハッチを作るのは良いのだが、ハッチを開けやすくはしておいてほしくない。気づいたら any だらけになっているということを言語自体の自体で封じたい。Rustのようにunsafeを使ってめんどくさいことをしないと誤魔化せないようにしてほしい。

### （デ）シリアライザを備えて欲しい

外部境界のunknownをknownに変える方法には（デ）シリアライザーがあるだろう。そしてデシリアライズした結果、型がつく機能がほしい。そのため標準でシリアライズやマーシャルと呼ばれている機能が備わってほしい。

### リソースの管理は自動でしてほしい

GCがあると嬉しい。WebサーバーにおいてはGCよりもっと大きいボトルネックはあると思うのでGCはあって良いと思う。仮にパフォーマンスを追求してGCを備えないのであれば、RAIIのような仕組みがほしい。つまり開発者がリソースの確保・解放を自分でしなくて良いような仕組みは備わってほしい。

ここでいうリソースとはメモリだけでなく File IO や ロック も該当する。File IO の開け閉めの自動化はすでに Python や Java にもあったはずだし JS でもできるようになるらしく、今時の言語は備えてくれるだろう。その上でスコープを抜けたらロックの自動解放もされてくれると嬉しい。これは Rust だと Drop と RAII で実現していることだが、この機能が欲しい。HTTPサーバー開発でロックを使いたい機会はたくさんある。

### その上で汎用プログラミング言語としてのポテンシャルを秘めて欲しい

あとは公式のフォーマッターやリンターが付いてくれたり、他の言語の良いところたくさん取り込んだものができてほしい。後発と呼ばれているプログラミング言語が備えている機能は一通り欲しい。

## 言語がHTTPをサポートしていないゆえの嬉しさ

と、ここまでつらつらと書いたが言語がHTTPをサポートしていないことのメリットもあるとは思う。それは自分達で実装できる余地があるので、いくらでもパフォーマンスの追求ができることだ。だから言語自体がHTTPの方を向き過ぎていないのは良い点とも言える。

またHTTPは L7 未満のレイヤーと比べて追従しないといけない変更の頻度は多いと思う。なので言語自体でサポートするのは大変なことだとも思う。

## おわりに

なので、言語自体がHTTPサーバーを作るための機能を持たないのは合理的だと思うし、優れた汎用プログラミング言語の優れたライブラリを使えばいくらでも間に合うので、別に言語自体がHTTPサーバーを持つべきとは思わない。ただ、HTTPサーバーを作るときの選択でいつも苦しむ自分としては、HTTPサーバー開発のための機能が一通り揃った言語があると選ぶと思うし、いまその座は空白だと思うのでなんか作ってみたいなーという気持ちがある。
