---
path: /my-step-up
created: "2020-12-24"
title: 自分がプログラミング力の成長を実感できるようになった瞬間について
visual: "./visual.png"
tags: ["雑記", "駆け出しプログラマー応援"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

私はプログラミングを 3 年近くやってみて、「ただ知らなかっただけで損した」という悔しい経験をたくさんしました。
そこで自分にとって「これを知っているだけでエンジニアとしてステップアップできた」というものをまとめてみようと思います。

ちなみにステップアップする前の私はこのようなとても凄いコードを書いていました。
ご査収ください。
プログラミングを始めて最初に作った成果物です。

https://gist.github.com/sadnessOjisan/6f1a1956d4848e3c17f0c0c5af28cfb8

(`//varを付けたらダメだよ(ローカル変数になっちゃう。関数内だからローカル変数使うと外部からアクセスできない)` というコメントがすごい・・・)

## はじめに

### 書こうと思ったきっかけ

自分は大学生の時にプログラミングに触れたことがあるものの情報系を出ておらず、エンジニアになったのも社内異動をきっかけとしたものであり、なんらかの教育を受けたわけでも知識を持っていたわけでもありません。
そんな中、知識がないと経験を積むための作業もできず調べ物も勉強もできないという状態になっていました。

きっといま駆け出しプログラマーとして頑張っている方も同じような悩みを持っていると思っており、なにか成長のための道標を残しておこうと思いこの記事を書いています。
ただ初学者のみを対象に書いてはいないので、初学者にとっては所々で難しく感じるかも知れません。
なので、何か質問がございましたら、[issue](https://github.com/sadnessOjisan/blog.ojisan.io/issues)などに書いてくだされば回答いたします。

### 選定基準

知っておくべきこととして選んだ基準は、

- 世界観が変わった
- 知っただけでレベルが上がった（学習効率が上がった・仕事ができるようになった）
- なにかのきっかけ（教えてもらう・偶然）がないと知れなかった

です。
もちろん個人差はある選定なので異論はあると思います。
そういうものがありましたら、「他にもこういうの知っておいた方が良いよ」というアドバイスいただきたいので、リプライをいただけると嬉しいです。

（注）私は Web フロントエンドエンジニアなので主にフロントエンド寄りの情報になっています。
あと、自分はエンジニアとしては成功しているとは言えず、そういった人が努力をした結果として社会で働けるようになれたというレベルの話です。
エンジニアとして大成・成功している人が書いたエントリは私も読みたいです。

## 基礎的な考え

### インターネットと IE と Yahoo は違う

当たり前のことと思われるでしょうが、少なくとも私は 20 歳のときまではこの区別がついていませんでした。
この区別ができないとそもそも「ブラウザとはなにか」を理解できないので、それぞれの違いは説明できるようになっておきましょう。

ざっくりとだけ説明すると、インターネットはコンピュータのネットワークで、ブラウザはインターネットにあるサーバーに接続できるソフトウェアで、Yahoo はサービス名で、IE というブラウザが最初に開いていたサービスです。

### HTML はファイルで、サーバーがクライアントに配信する

私たちが普段見ているウェブページの画面 は HTML ファイルから成り立っています。
HTML はホスティングされたサーバーから配信されて私たちの手元の端末に届きます。
それらにスタイルや動きをつける CSS・JS もファイルで、サーバーが配信しています。
そのファイルたちをブラウザ（クライアント）が解釈することで、ウェブページとして私たちは見ることができます。

ここでは明確に**クライアントとサーバーが分かれている**ことを理解しておきましょう。
これを知らないと React をサーバーで動かす方法とか、jQuery から DB を操作する方法とかを調べることになります。
はい、私はよく調べていました。。。

FYI: https://wa3.i-3-i.info/word12356.html

FYI: https://wa3.i-3-i.info/word11773.html

## HTTP

### ブラウザからすれば HTML はただの文字

さきほど HTML はファイルと言いましたが、ブラウザからすれば HTML の実体は、HTTP の body に詰められた文字列としても受け取れます。
HTML、CSS、JS は全て body にある文字列としてブラウザは受け取れます。
それをブラウザがパースして解釈し、私たちが見えるページが作られます。

これを知っていれば何もライブラリを使わずに HTML を返す web サーバーを立てれます。
また HTML を少しだけ改造したいときに body をそのままいじればいいことにも気づけます。

### body 以外にも header がある

HTTP には body 以外にヘッダがついてきます。
どのようなものが返ってくるかは curl コマンドに --verbose をつけると手元でも簡単にみれます。

ヘッダには HTTP の仕様として指定されている値以外にも、サーバーサイドで好きにデータを詰め込めます。
うまく使えばログインしたかどうかの識別したり、クライアントに振る舞いを要求（たとえばキャッシュ）できます。
このようにただ文書を返すだけでなく、クライアントを補助する何かの機能を実現するために使われます。

HTTP のヘッダを使うのは実務における初めの方で出会う壁なのでなるべく早く知っておきましょう。
認証・キャッシュ・ContentType の指定・CORS のハンドリングで必ずお世話になるはずです。

FYI: https://developer.mozilla.org/ja/docs/Web/HTTP/Headers

ヘッダに関して網羅的に学べる本としては、[Real World HTTP](https://www.amazon.co.jp/Real-World-HTTP-%E7%AC%AC2%E7%89%88-%E2%80%95%E6%AD%B4%E5%8F%B2%E3%81%A8%E3%82%B3%E3%83%BC%E3%83%89%E3%81%AB%E5%AD%A6%E3%81%B6%E3%82%A4%E3%83%B3%E3%82%BF%E3%83%BC%E3%83%8D%E3%83%83%E3%83%88%E3%81%A8%E3%82%A6%E3%82%A7%E3%83%96%E6%8A%80%E8%A1%93/dp/4873119030/) がよかったです。

### ブラウザと実装者の間でみるべき仕様がある

ブラウザには様々な API が用意されており、それはある定まったルールに則った振る舞いをすれば呼び出せます。
それらは RFC という、インターネットの様々な技術的仕様群・ルール群にまとまっています。

FYI: https://tools.ietf.org/rfc/

そのルールにしたがって実装すればブラウザに秘められた機能を呼び出せます。
たとえば ブラウザ・サーバーで双方向通信する機能をライブラリを使わずに実装できます。

FYI: https://blog.ojisan.io/rust-websocket

このようにブラウザや Web サーバーはなんらかの仕様に則っていることを前提にしており、その仕様通りに何かコードを書けば開発者はクライアントやサーバーを完全にコントロールできます。
この感覚はとても大切で、**ブラウザもサーバーも制御不能な祈りを捧げるだけの箱ではなく、私たち開発者がドキュメントを読んで頑張れば制御できる、しかもそのドキュメントは公開されている**ということに気づけます。
その気づきがあるとブラウザもサーバーに向き合うことが**怖くなくなります**。

## JavaScript

### 部分更新には Ajax

リンクタグでの遷移やサーバーでの routing 以外にもコンテンツを切り替える方法があります。
その一つは Ajax であり、ページの部分更新を可能にする技術です。

FYI: https://ja.wikipedia.org/wiki/Ajax

例えば Rails などのサーバーでルーティングさせると、全ページが切り替わってしまいますが、
Ajax を使った部分更新は、データをクライアントで取得してそのデータから DOM を作ることで実現できます。
このとき知っておくべきことは Ajax はクライアントサイドの技術であることです。
Rails のサーバー側でやる技術ではありません。
(注: クライアントから Ajax で Rails を叩くことありえます)

### JavaScript を使ってクライアント側で UI を生成できる

HTML を画面に映し出したり更新するのは routing でページを移動するだけではありません。
クライアント側の JS で DOM を操作することで UI を作れます。

DOM は簡単に言うと Web ページのデータ表現で、主に JS から操作します。

FYI: https://developer.mozilla.org/ja/docs/Web/API/Document_Object_Model/Introduction

DOM を追加・削除・編集などすれば、ブラウザに映し出されている UI も更新できます。
この DOM 操作を JS から行えば、JS だけで UI を作ることができ、SPA 技術の根幹になる操作です。
ちなみに JS だけで Routing もできます。

FYI: https://blog.ojisan.io/s3-spa-deploy

いわゆる **SPA を作りたいのであれば、HTML 要素がなくても JS だけで UI を作れる**ということを覚えておきましょう。

### JavaScript は AST という構造に変換でき、操作できる

JS だけに限りませんがソースコードは AST という木構造で表現できます。

FYI: http://www.momo.cs.okayama-u.ac.jp/~sasakura/jikken/2018/AST/AST.pdf

木構造として変換したらトランスパイルは木構造の変換として扱え、lint は Node の検査として実行できます。
つまり babel や eslint でやりたいことがやりやすくなり、実際これらのツールは AST への操作として実装されています。

AST を知ると JS ツールチェイン(babel, eslint, prettier) が何をしているかを想像しやすくなり、抵抗や恐怖感が薄れます。
機会があれば AST を覗いてみると良いでしょう。

FYI: https://astexplorer.net/

## React/Preact

### UI = f(state)

(p)react では、UI のあるべき姿を宣言するだけで UI を構築できます。
これまで jQuery などでは、DOM を全部手で操作していたものが、操作なしで UI を構築できるようになりました。

FYI: https://qiita.com/mizchi/items/4d25bc26def1719d52e6

FYI: https://zenn.dev/mizchi/books/0c55c230f5cc754c38b9

それは React に state を渡せば React が勝手に UI を構築してくれるためです。
そのため state を操作さえすれば UI の追加・削除・編集を行えます。

この考えを知れば React における state の役割が分かり、一気に React の習得が捗ります。
また、jQuery との対比は理解における突破口になりやすいです。
昔 jQuery と比較して React を学ぶチュートリアルを作ったことがあります。
よければ参考にしてみてください。

FYI: https://github.com/sadnessOjisan/HELL_todo_jquery

FYI: https://github.com/sadnessOjisan/MVC_todo_jquery

FYI: https://github.com/sadnessOjisan/ES6_todo_jQuery

FYI: https://github.com/sadnessOjisan/todo_react

### VDOM は DOM の JS 表現

その宣言したコンポーネントをブラウザ上の UI に変換するためのデータ構造が VDOM です。
VDOM は DOM の JS 表現で、オブジェクトです。

FYI: https://eh-career.com/engineerhub/entry/2020/02/18/103000

(p)react ではこの VDOM をレンダリングする関数に渡すことで HTML を組み立てたり、DOM 要素の追加・削除・編集を行えます。
つまり UI を作れます。

### サーバーサイドで HTML を作ることができる

クライアントで JS が動く、JS が DOM 要素を作ると言いましたが、VDOM を使っていればそれをサーバーで実行することもできます。
なぜなら VDOM はただの JS のオブジェクトだからです。
NodeJS の上でという制約はつきますが、そのオブジェクトは HTML に変換できます。
(p)react には組み込みでその関数がある(renderToString)ので、それを実行して HTML 文字列を手に入れることができます。

FYI: https://ja.reactjs.org/docs/react-dom-server.html

サーバーサイドで HTML を作るといえば Rails や Spring と何が違うのだと言う話ですが、VDOM から HTML を作る点がこれまでの erb や thymeleaf などのテンプレートでやっていたこととの大きな違いです。
SSR にも宣言的 UI の考え方を取り入れることができます。

## プログラミング言語

### コンパイラはフロントエンドとバックエンドに分かれる

コンパイラは、ある文法で書かれたプログラミング言語を解釈して AST にするフロントエンド部分と、その AST を最適化などの操作をしたのちにアセンブラを出力するバックエンド部分に分けられます。
このようなコンパイラを作ることがプログラミング言語を実装するとも言えます。

アセンブラを出力しているのがポイントで、これこそがプログラミング言語を実装できて動かせる理由です。一定の文法でコードを書けば、それを CPU の命令として変換できるためです。

また、コンパイラを使わない言語は AST を評価する関数を作ることで実装できます。
評価部分が必要なので、これを実装するためには AST 作成や評価器の部分を別の言語で作る必要はあります。

こういったプログラミング言語がどのようにできているかという全体感を掴むには min-caml という教材が網羅的でよかったです。

FYI: http://esumii.github.io/min-caml/

また、似たようなチュートリアルとして　[9cc](https://www.sigbus.info/compilerbook#%E3%82%B9%E3%83%86%E3%83%83%E3%83%971%E6%95%B4%E6%95%B01%E5%80%8B%E3%82%92%E3%82%B3%E3%83%B3%E3%83%91%E3%82%A4%E3%83%AB%E3%81%99%E3%82%8B%E8%A8%80%E8%AA%9E%E3%81%AE%E4%BD%9C%E6%88%90), インタプリタを実装する本として [Go 言語で作るインタプリタ](https://www.amazon.co.jp/Go%E8%A8%80%E8%AA%9E%E3%81%A7%E3%81%A4%E3%81%8F%E3%82%8B%E3%82%A4%E3%83%B3%E3%82%BF%E3%83%97%E3%83%AA%E3%82%BF-Thorsten-Ball/dp/4873118220) があります。この Go 言語の本は何も知識がない状態でも読んでいけたので、最初に読む本としてはオススメです。

この知識があると、プログラミング言語がどうして動くのかという理解ができます。
私がこれを知ったのはつい半年前くらいのことですが、そのときは長年の謎が晴れて感動しました。

### CPU が理解できる形式としてネイティブコード

JavaScript からは見えてこない概念としてネイティブと呼ばれるものがあります。
もしかすると耳に聞き覚えがあるかもしれません。

ネイティブで動くコードは CPU の命令をそのまま叩けます。
先ほどの例で言うと、コンパイラのバックエンド（emitter） が出力した命令です。
つまり emitter を持つプログラミング言語はどのプラットフォームでも(emitter が各 CPU ごとに正しく実装されていれば)動かせます。
CPU の命令をそのまま叩けるので、そうでないプログラミング言語に比べるとパフォーマンスも良い傾向があります。
フロントエンドエンジニアをしていると JS の対義語として聞きがちなネイティブですが、こういう意味でした。
（iOS のことだと思っていました）

### 型検査はただの関数

型エラーが出たり、型が推論されるのはなんと魔法の力ではありません。
コンパイラは型検査も行えます。
この検査は型付け規則を関数で表現したものとして実装できます。

FYI: https://www.cis.upenn.edu/~bcpierce/tapl/checkers/simplebool.tar.gz

型検査も AST を使って行えます。（正確には言語によると思いますが）
なぜなら AST の Node は int などのラベルがついているからです。

さきほどあげた リンクの例では 字句解析・構文解析を通った次のステップとして実装されています。
つまり、型検査はプログラミング言語の一機能として実装できます。

このあたりは TaPL と言う有名な本で勉強できるという話ですが、私には難しすぎて何も分からなかったので、TaPL の実装パートを動かしたり、「型検査 pdf」などでググって出てくる大学の資料などで勉強していました。

FYI: https://www.math.nagoya-u.ac.jp/~garrigue/lecture/2005_AW/algo7.pdf

正直今でも人に説明したり理解ができていないものですが、型検査の正体が関数であると知っただけで普段使っているプログラミング言語の裏側を想像できるようになって、原因の切り分けやデバッグで大いに役立っています。
プログラミング言語によってはこの型検査の振る舞いに介入できる口もあるので型検査に対するイメージを持っておくと役に立つ時が来るでしょう。

## 心構え

### ライブラリは JavaScript/TypeScript で書かれている

ライブラリは神様が作ったものではなく、人間が作ったものでした。
そして神や上位者にしか読めない言語で書かれているわけではなく、**JavaScript/TypeScript で書かれていました**。
この事実に気づいたとき、ライブラリが読めるようになりました。
ただもちろんコツや慣れは必要です。
そのあたりの慣れについてはまとめたことがありますのでよければ参考にしてみてください。

FYI: https://blog.ojisan.io/how-to-read-js

ライブラリを読めるようになると解像度高く理解した状態でライブラリを操作できるので、デバッグがかなりしやすくなります。
普段使っているライブラリを読むことはオススメです。

### 新しい道具を学ぶ時は何を解決したかに注目する

「フロントエンドは移り変わりが早い！」「勉強しても無駄になりやすい」といったことをたまによく言われますが、それはこれまでの不便を解消しようとしている動きが活発とも捉えられます。
日に日に便利になっていると考えると、勉強しても無駄かもみたいな抵抗感はなくなりました。

ただ、その道具が自分にとって必要なさそうと思えるのであれば勉強時間を他のことに割いてもいいと思います。
（もっとも知識として知らなければ自分にとって不要か判断できないというジレンマもあるのですが、、、）
全てをキャッチアップするためには、自分が強くなってなんでも学習コスト 0 で勉強できるスーパーエンジニアになる方法がありますが、私にとっては現実味がありません。
ただ自分が強くなりさえすればキャッチアップできると言う考えは自分に勇気を与えてくれ、食わず嫌いをすることは減りました。

また学習コストを下げる方法はあり、それは新しく登場したものが「これは何を解決したか」という視点で眺めてみるということです。
そうすると既存ツールとの関係が見えてきて、理解が迷子になることは減りました。

## おわりに

書き終わって読み返すと「当たり前のことかも」という気持ちなのですが、昔はこれが当たり前じゃなかったので本当に「知っている」という状態は大切なんだなぁと身に染みていまた。
そして「なんだかんだで私は頑張ったのかも」とも思えてきました。
来年もたくさん勉強して、いろんな人と出会って、もっと色んなことを知りたいです。

メリークリスマス
