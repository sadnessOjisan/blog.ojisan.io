---
path: /gijutsusyoten-17-dasu
created: "2024-11-03"
title: 【く15】技術書典17にAPI仕様書の本を出すぞ！！！！
visual: "./visual.png"
tags: ["技術書典"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

うおおおおおおおおおおおおお！！！！！！

なんと！！！今日だけ！！！半額で販売します！！！！！！！

https://techbookfest.org/product/riz8dNLcwjV00bygdf5rAt

なぜなら！！！！！！！！！

完成品にまだなっていないから！！！！！！！！！！

でも、これから完成品になるから！！！！！！

いま買うと！！！！！！

お得！！！！！！！！！！！！！！

って、なんで販促ブログを当日に書いてるんだよ！！！

今日の朝に書き上がったからだよ！！！！！！

さっき審査も終わったよ！！！！！！

てなわけでいま会場のサンシャイン池袋に向かっています！！！！！

準備何もできてねーーーーーーよ！！！！！

てか本を書く計画性のないようなやつから、開発の運用についての話なんか聞きたくない！？！？！？！？！？

うるせ〜〜〜〜〜〜〜〜〜〜〜〜〜〜〜〜〜〜〜

## 何を書いたか

スキーマ駆動開発を運用するために知っておくと良いことを雑多にまとめました。
販促文を考えるのがめんどうなので、以下、本文の前書き抜粋。

↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓

この本はAPI定義書を書くために必要となる知識をまとめた本だ。
どうしてそのような知識を広めたいかというと、スキーマ駆動開発をもっと広めたいからだ。
スキーマ駆動開発やAPI仕様書については既に知っていたり、聞いたことがあるかもしれないが、自分の経験上、クライアントサイドの開発者として満足のいくスキーマ駆動開発はできたことがあまりない。
スキーマ駆動開発をするときは、自分がその啓蒙をして、API仕様書を記述する環境を整えて開発することが多い。
API定義書やSwaggerといった言葉が広く知られているのにも関わらず、実践されている場にあまり出会わいことの理由の一つには、Open API エコシステムに対する学習コストがあるのかもしれない。
そこで Open API にまつわる知識を、スキーマ駆動開発の運用という観点からまとめてみようと思う。

### API仕様書を中心におく開発をすると何が嬉しいか

具体的な方法論に入っていく前に、スキーマ駆動開発をなぜ必要とするかをクライアントサイドの開発者という目線で書いてみる。

#### フロントエンドとサーバーサイドの情報交換

クライアントサイドの開発者はAPIの呼び出し部分を実装する時、どういうリクエストを送ったらどういうレスポンスが帰ってくるのかを知りたい。
その情報を知るためにこれまではWikiやスプレッドシートといったものを見ていたが、最新の情報を常に反映しているという保証もなく、その定義書に対して漠然とした不安を抱く。
一方でAPI仕様書が存在していれば、サーバーサイドも同じ仕様書を参照している場合に限り、その仕様書が唯一の正しい情報として信用できる。
Open API のエコシステムには Spec からドキュメントを生成する機能もあり、人間にとって可読でもある。

#### 形式言語で書かれたドキュメントとして

TypeScirptを使っている場合だと、そのレスポンスの形を元に型定義も作る。
APIという境界を跨いだ先はTypeScriptの型推論が効かないからだ。
この時、APIの仕様がWikiやスプレッドシートにまとまっていると、その情報を見ながら手作業でリクエストやレスポンスの型を作る。
このとき日本語を読み解かないといけないのは面倒であり、型という機械に嬉しいものを作るのであれば、機械可読な仕様から生成してしまいたい。
そのため形式言語で表現される仕様書というのは嬉しい存在である。

#### モックやクライアントを生成できるエコシステム

リクエストやレスポンスから型を作る作業以外にも、レスポンスのバリデーションがしたいこともあるだろう。
それはクライアントサイドからすれば仕様とサーバーの実値が一致している保証がないからだ。
そういったバリデータを作るのも型を作ることと同じくらい面倒である。
可能であれば型やバリデータまでサポートされたAPIクライアントがあると嬉しい。
機械可読な仕様があればそれを生成することも可能であり、そのようなライブラリが使えると嬉しい。
機械可読な仕様を元にすればモックサーバーを作ることも容易であり、APIの実物が完成しなくても開発を進めやすい。

そのため、機械可読な仕様を元にスキーマ駆動開発を行うことで、クライアントサイドの開発効率は上がるので、開発サイクルに取り入れたい。

### この本が伝えたい３つのこと

#### ドキュメントと型とバリデーションを整合させることをゴールに置く

APIの仕様書を作る方法はいくつもあるが、この本では機械可読な仕様を書くことで、ドキュメントと型とバリデーションを生成することを目指す。
ドキュメントはクライアントとサーバーの開発者が意思疎通を図る上で必要なものだ。
型はクライアント開発における開発生産性を向上させる上で必要なものだ。
バリデーションはドキュメントや型が本当に現実の値と一致するのかを確かめるために必要なものだ。
これら３つが揃ってスキーマ駆動開発は生産性に寄与すると思っている。

#### Open API Spec とエコシステムそのものを学ぶことで、Specを簡単に書けるようになる

おそらく既に予想がついているかもしれないが本書では仕様記述は Open API Spec(OAS) に基づき、エコシステムは Swagger を利用する。
スキーマ駆動開発では Swagger を使うことが多いと思うが、そのためにはどのような Open API Spec を書くべきかを知らないといけない。
Swagger を使ったスキーマ駆動開発が知名度の割に実際に運用されていないのは、どのように定義してどのようにエコシステムを使うかを知らないからだと思う。
そこで OAS とエコシステムそのものに焦点を当ててみる。
特に双方とも人に説明することは難しかったりするので、自分の言葉で説明できることを目標とする。
ここでは仕様そのものの解説と、エコシステムの俯瞰を行う。

#### スキーマ駆動開発を運用するために、仕様書をチームの成果物とする

知識はSpecを書く上での障壁を下げる大きな要因ではあるが、それだけだとスキーマ駆動開発は始まらない。
スキーマがあるだけではスキーマ駆動開発にならない。
ここでいう運用とは開発フローにスキーマ駆動開発を取り込むことを指す。
そのためにはサーバーサイドとクライアントサイドのエンジニアの協力が必要となる。
そこで本書では協力体制を作るための技術選定について紹介する。

## あと今日、ポケカ持ってきました。

イベント終わったらジムバトル行くか、その辺のカードショップ行こうかなって思ってる。
