---
path: /for-doc-job
created: "2023-09-19"
title: ドキュメントを書く仕事を探している
visual: "./visual.png"
tags: [雑記]
userId: sadnessOjisan
isFavorite: false
isProtect: true
---

飲み会で「お前、次の転職どうするよ？」的な話をするときはいつも

- これまでは[自分が一番下手くそなバンドメンバー](https://shop.ohmsha.co.jp/shopdetail/000000001848/)になれる職場を意図的に探していたし、今の職場もその基準で選んだが、そろそろ俺の音楽をやりたい
- プログラミングそのものをドメインとした仕事をしたい
- ドキュメントやチュートリアルの整備をしたい。あわよくば今 blog.ojisan.io を書いていること自体が仕事になるようなことをしたい

的なことを言っている（はず、アルコールが入っているので記憶が定かでない）。

で、この最後の 「ドキュメントやチュートリアルの整備をしたい」というのはここ１年くらい言っている気がするのだが、そろそろ本当に動き出そうと思って最近ふわふわ考えていることを書いてみようと思う。そういう仕事をしている人の目に止まってくれると嬉しい。

## どうしてドキュメントを書くような仕事をしたいのか

いまこういったブログを運営している理由でもあるのだが、自分が困ったことに対する怒りがあるからだ。自分はプログラミングが好きであれど苦手だ。大体の既存のドキュメントは「それは書かれなくても知ってる」「なんもわからん」という感想だ。「なんもわからん」なドキュメントに出会うたびに、学習のラダーというのは全然整備されていないなと常々思う。どの分野でも言われているとは思うが、中級者への道が整備されていないというやつだ。なので「俺は中級者向けへの道を整備するぞ」の気持ちで、自分ができなかったことに挑戦したらそれを理解するまでの過程を包み隠さずブログにしている。自分のブログの題材がライブラリのコードリーディングやら、低レイヤーからの自作やら、自分が困ったことのワークアラウンドやら、ソリューションになるのはそういった理由がある。

そういった、中級者へのラダー的な視点を持ったドキュメントを書く仕事は存在するのかが最近気になっている。エンジニア向けのサービスを提供している会社は自社の製品を広く使ってもらう必要があって、そのために使うためのハードルを下げるというのはその製品のファンを増やすという点でとても有効だ。「なんか便利そうだけど自分が解決したい問題が本当に解決できるかわからなくて採用できない」というケースはそれなりにあるだろう。以前 t_wada さんの「[そのギャップを補うための公式チュートリアルだと思うのですよ。「わかる」は「動かす」の後からついてくる。](https://twitter.com/t_wada/status/1701412333292249235)」というツイートを見て、ドキュメントだけでなくExampleのようなものを充実させる仕事で解決できるかもしれないと思ったのと、自分は手が動くし動かすのも好きだからそのような仕事をする機会がないだろうかと考えるようになった。

## ドキュメントを書くためのキャリアパスは？

### DevRel

真っ先に思い浮かぶのは DevRel と呼ばれる職業だ。ごちゃ混ぜにしたら本業の人に怒られそうな気もするが、Developer Advocate や エバンジェリストとも呼ばれているかもしれない。これらの３つの言葉の意味は分からないし、区別もできていないのだが DevRel に含めて考える。その DevRelという言葉だが、「DevRel の仕事は何ですか？」と聞かれて答えられるだろうか。自分は答えられなかった。そこでDevRel でググって出てくる情報をみると

- ハッカソンの運営
- SNS発信
- コミュニティマネジメント
- 社内広報
- 技術ブログ運営などの社外広報
- ドキュメントやExampleの整備

といった感じであった。

DevRelがドキュメントやExampleの整備をしている事例で一番印象に残っているのは Fastly だ。例えば [DevRel チームの一番（？）偉い人が書いた記事](https://www.fastly.com/jp/blog/andrew-betts) (Andrew Betts を持ち出すのは極端な例という自覚はあるが…)とかを読んでいると、いかに Fastly を使いこなすかということがユーザー目線で書かれている。例えば [OpenTelemetry 第2回 : VCL で OpenTelemetry を使用する](https://www.fastly.com/jp/blog/opentelemetry-part-2-using-opentelemetry-in-vcl) なんかは自分でも VCL での計装やりたいと思わせてくれたり、W3C の Tracing Context の Spec を読むきっかけになった記事でもあり、自分の心を動かしてくれた記事だ。( そもそも VCL じゃなくて C@E 使えと言われそうだが、どうしても VCL を使い続けないといけない会社の元に生まれてしまったり、computing より deliver の方が遥かに安上がりという理由で VCL を使い続ける人だっているのだ。わざわざVCLでやる方法を記事にしてくれているのは現場の開発者への寄り添い力が高くて最高！）この記事を読み終わってから、「俺も！こういう記事を！仕事として書きたい！！」と思った。

自分は [Varnish の勉強は Fastly のドキュメントサイト](https://docs.fastly.com/ja/guides/guide-to-vcl)を見ていたので、Fastly 製品関係なくたくさん勉強できた。自社製品に直結しないことまでケアした資料を出してくれるのはめちゃくちゃかっこいいと思うし、自分はFastlyのファンになった。ドキュメント以外にも実践的なユースケースを[全部 Example で用意してくれている](https://developer.fastly.com/solutions/examples/)のは仕事する上でもとても役に立った。こうやって自分が魅了されてみて、今度は自分がそういったドキュメントやExampleを書く仕事をしたいと思った。

自分は世のクラウドベンダーや開発者向けSaaSなどのドキュメントやExampleに対してして「うわああああん😢読んでも分からないよ〜僕にも分かるように書いてよ〜〜〜😭」という感じなのだが、もしこれが「本当はもっと充実させたいのだけど、人手が足りなくて・・・」といったことに起因しているのであれば、是非とも雇われたい。書かせてください。

### カスタマーエンジニア / ソリューションアーキテクト

自社製品のファンを作る仕事をすると言う点では、カスタマーエンジニアやソリューションアーキテクトと呼ばれる職種も考えている。これらの仕事の定義は分からないし、他にも呼び方はいろいろあるとは思うが、つまりは "顧客の現場での課題を解決する、手を動かすコンサル"的な仕事をしたい。

この職種はドキュメントを書くことが仕事ではないと思うのだが、実際に困っている顧客の助けになれるのは、自分がブログを書いている動機に近いところがある。実際に困っているユースケースの解消からしか書けないドキュメントもあるだろうし、そういったドキュメントは課題解決という点数がとても高いので、まさしく自分が書きたいドキュメントを書ける職種だと思っている。

### 採用広報

以前、誰かが「自社製品を持たない会社もDevRelというポジションを作っていて、本来のDevRelという意味が変容している」みたいなことをツイートしていた。本来の意味というのが何かはよく分からなかったが、元々から広報という側面はあったはずでそれが製品ユーザーではなく、採用候補者やコミュニティにも向き始める仕事が生まれているということだと思う。自社製品を持っているところだって、製品に関係なく自社が使っている技術についての教育的なあるいは趣味的な発信をしている。もしそういう発信をするポジションがあるのであれば自社製品を持っていようが持っていまいができる仕事だと思う。なので技術広報も兼ね備えた採用広報的なポジションも最近は見ている。ただ自分はSNSでのお行儀が悪い方なので多分コミュニティ活動には向かないと思っているし、あまり興味もない。やはりドキュメントを書く仕事をしたい。なので採用広報という立ち位置で、技術発信、ドキュメント執筆（自社ブログとか？）、Example整備（やってみたブログの成果物とか？）のようなことができると嬉しい。そんな会社があるのかというと、ざっと見た限りではなさそうだが・・・

### 記者

盲点だった。身近な人に聞いて見たり、購読してみて思ったのは、新聞や雑誌の記者職という手もあるのかということだった。自分で調べて文字にして発信するというところだけを見れば当てはまる。自分でコードを書いてそれを発信するということはできないのだろうが、記者の人と話して見た限りでは開発の現場で通用、もしくはそれ以上の専門性が必要だとも感じ、ずっと勉強をしなければいけないという点でも楽しそうだと思った。もし良い記事を書く自体を目的にできるのなら、自分の性格や志向にも合いそうと思った。

## ゆるぼ

というわけでドキュメントを書く仕事の採用状況に詳しい人がいましたら話を聞かせてほしいです。仕事の性質上、目指す会社が自社製品を持っている会社に限られ、それは現在では外資が主になってしまうと思っています。外資に勤めている知人はあまりいないのでこの辺りの実状を聞く機会というのがあまりなく、もしドキュメントを書く仕事をしている人やポジションの話があるのなら積極的に聞いていきたいです。

転職のステータスとしては、いましている仕事をやり切るまでは転職するつもりはないのと、それをやり切ってからも転職する気はいまのところはないという感じですが、DMお待ちしております。押しには弱い自信があります。
