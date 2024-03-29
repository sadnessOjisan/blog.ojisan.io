---
path: /monorepo-vs-polyrepo
created: "2023-05-24"
title: モノレポにすべきか、レポジトリを分割すべきか
visual: "./visual.png"
tags: [nodejs, monorepo]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

先日 [フロントエンドの Monorepo をやめてリポジトリ分割したワケ](https://kaminashi-developer.hatenablog.jp/entry/2023/05/22/goodbye-monorepo) というブログがバズっていた。そのおかげか、Twitter でもモノレポに関する言及がちょこちょこあった。一家言あるドメインなので書きたい。ただの一家言(a.k.a お気持ち)なのでぜひ皆さんの意見も聞いてみたい。

## tl;dr

別に自分はどっち派とかではなく、どっちも選ぶ。強いて言うならリポジトリ分割派で、依存更新がしんどくなったら monorepo 派。

## 免責

モノレポに対する一家言を書きたいだけであって、内容自体は[フロントエンドの Monorepo をやめてリポジトリ分割したワケ](https://kaminashi-developer.hatenablog.jp/entry/2023/05/22/goodbye-monorepo) と全く関係なく、そのブログで述べられている施策については何も言及しません。ただ一つ言及するとしたら肉の部位がコードネームに採用されているのは良いと思いました。🍖🍖🍖

## モノレポにしたくなる状態の前提にあるもの

前提は元記事と同じように Node.js をベースに敷いたクライアントアプリケーションの文脈だ。また Node.js ベースのツールチェインのみ(lerna, yarn workspace など)を前提とする。Bazel や make などの存在は仮定しない。

また、フロントエンド・Node.js 文脈でのモノレポは ServiceA, ServiceB があってそれが libA を依存に持つといったケースを実現したいからだと思うので、そういう構成を前提に考える。これは Frontend, Backend が typeDef を依存に持つというのも同じ構成と見做している。

## モノレポにする嬉しさは何か

お恥ずかしながら自分は元記事のリンクにある [Monorepo 開発のメリット vs デメリット](https://circleci.com/ja/blog/monorepo-dev-practices/) を知らなかった。メリットとしては次のことが挙げられていた。権威あるところがアナウンスしているぽいので、持論を述べる前にまずは目を通してみる。そして自分なりにコメントしたいところがあるとすれば、

> 通常、このような Monorepo では、コードから実行可能なアプリケーションを生成するビルド パイプラインも 1 つだけです。

「え、そうなの？GitHub Actions Workflow ファイルたくさん作るでしょ。」と思ったけど、CircleCI の記事だった。.circleci/config.yaml に確かに全部書く。これは CircleCI を前提とするかで変わってくるので一旦スルー。

> しかし、リポジトリの分割にはリスクもあります。複数のリポジトリを各担当チームがバラバラにメンテナンスするので、システムに関する知識が分散してしまうのです。 その結果、システム全体をビルドしデプロイする方法を知っている人がだれもいないという事態になりかねません。

前半はとてもわかる。後半はシステム構成次第なので自分はよくわからなかった。サービス全体のことをシステムと読んでいるのであればなんとなく言いたいことはわかるけど、それはパイプライン設計次第では気にしなくてもいいのではと思った。

> 見やすい: 担当のマイクロサービスで他のマイクロサービスを呼び出す場合、該当するコードを見てしくみを把握できます。バグが発生した場合も、原因が自分の担当範囲にあるのか、他のチームのマイクロサービスにあるのかを突き止められます。

InteliJ のような強力な IDE で開いていると確かにその通りだと思った。が、GitHub のコード検索でも同等のことは分かりそうというのと、モノレポでも自分が管理やコーディングしていなかったり、自分の知らない技術スタックが採用されていたのならどちらにせよ分からないとも思った。Chromium や AOSP のレポジトリ渡されて、「はい、原因どこ」って言われても分からないと思う（※半分ふざけて極端な例を出していますが、本当に大きい会社ならそういうこともあるのではとも半分で思っている）。モノレポからこの恩恵を受けるのであれば組織設計やマネジメントが前提になっていると思った。

話は逸れるが、その点で dinii って会社のモノレポ戦略はとても良いと思った記憶がある。「チームがワンチームだからモノレポなんだ」というのは組織設計を反映した上でのモノレポ選定で、モノレポの力を活かせている事例だと思った。

FYI: https://note.com/dinii/n/n9be778bd7da3?magazine_key=mf6424286cfa2#8wybV

> コードを共有できる: 複数のチームでさまざまなマイクロサービスを開発していると、コードが重複し、エンジニアリングの間接コストが増えがちです。 リポジトリを単一化し、共通モデル、共有ライブラリ、ヘルパー コードをすべてまとめておけば、マイクロサービスが多くてもこれらを使いまわせます。

同意

> コラボレーションがしやすい: モノレポなら、チーム間に障壁やサイロが生じることがないので、連携性の高いマイクロサービスを設計、メンテナンスしやすくなります。

少し上に書いた組織的な話につながる。が、これはモノレポのおかげではなく、そういう組織構造だったりルールだったり社風が先にあると思っている。

逆にレポジトリ分割をするなら別チームというかお客さんに提供すると言う意識を持って欲しいと思っている。つまりインターフェースの定義・公開の徹底やドキュメンテーションの徹底、バージョニングの徹底、リリースノートの徹底などだ。

モノレポは上記のめんどくささを少しサボってもリカバリーが効くモノだと思っている。

> 標準化が容易: モノレポは、ポリレポに比べてチーム間でのコードやツールの標準化が簡単です。 ブランチ ポリシーを適用することで、メイン ブランチの簡素化や特定のブランチへのアクセス制限、命名ガイドラインの適用、コード レビュアーの配置、ベスト プラクティスの実践を強制できるからです。 完了済みの成果物に開発中のコードが混じってしまうこともありません。

9 割同意、1 割懐疑。設定が共通化できるのはそうなのだが、例えば静的解析系の設定は難しかったりもして、その辺を解決できる人がチームにいることが前提となる。例えば、ESLint や TS の設定は ESM/ CJS, ブラウザ/Node.js 向けかなどで変わるはずで、その辺りを共通の設定に組み込んだり、設定を pluggable にしたり、ビルド時間削減のために特定検査だけを走らせる仕組みを用意したり、それをメンテする力が求められる。ぶっちゃけ自分はかなり苦手だ。自分はどんぶり設定にしがちだ。

> 状況を把握しやすい: モノレポでは、コード全体をひと目で把握できます。 ポリレポに比べて、リポジトリ全体の状態の確認、全ブランチの調査、変更の追跡が大幅に簡単になります。

同意

> リリースを管理しやすい: モノレポなら、システム全体をデプロイする方法がわからなくなることはありません。 ビルドとデプロイのパイプラインを自動化すれば、一部のチームだけがデプロイ方法を知っているという状況も避けられます。

そもそもシステムまるっとデプロイすると言うことはあるのだろうか、それは必要とされるのだろうか。テンプレートエンジン書いていた時代ならともかく、モノレポ移行を意識するような会社はフロントエンドチームとバックエンドチームがいて、それぞれがそれぞれのワークフローを書いてデプロイするという形態の方が多い気がする。なのでこれも組織や技術選定次第かなと思う。

> リファクタリングが容易: モノレポでは、すべてのマイクロサービスに直接アクセスできるため、コードをリファクタリングしやすくなります。 コードの構造変更も行えます。 ソース コードを移動する際も、リポジトリ間ではなくフォルダーやサブフォルダー間で移動すればよいので、手間がかかりません。

同意。

と言った感じだ。否定的なところもあるが、それは今僕が Node.js を前提として考えていると言うのが大きいだろう。おそらく CircleCI のモノレポの話は、本当に会社のコード全部、もしくは１サービス（ビジネスの単位）のコード全部をモノレポにするという話な気がするので前提は少しずれているかもしれない。あと単純に自分は CircleCI の規模や特性のシステムを作ったことがないというのもある。

あとこれらに Node.js 観点でメリットを一つ付け足すとすれば、「モノレポでなければ依存ライブラリのバージョンを上げた時に、他のライブラリ全部上げる作業が発生するのに対し、モノレポはそれらのコストがない」がある。同様に何か同じ作業が発生した時に全部で行わないといけないと言うのは結構辛い。

## モノレポにする辛さ

CircleCI のブログには

> 上述のようなメリットがある一方で、モノレポにはデメリットもいくつか存在します。 共通のコードを変更すると、数多くのアプリケーション コンポーネントに影響が及んでしまいます。ソースの競合によりマージしにくい場合もあります。 デプロイ プロセスが複雑化する可能性があり、ソース管理システムのスケーリングも必要です。

> とはいえ、状況さえ整っていれば、こうしたデメリットよりもモノレポを導入するメリットが上回ります。

とあるが、自分は結構あるので書きたい。

### 機動力の低下

ワンチームで運用できることの裏返しだが、モノレポになることでチーム標準のレビュープロセスが行われると思う。そのため非合法実装からの非合法デプロイでサービスインみたいなことはできなくなる。まあ普通に考えたらそんなことは封じた方が良いのだが、そのような動きをした方が良い場面というのもあるので、そういう動きをした方が良い場面ではモノレポ構成はデメリットかもと思う。

もちろん依存を配布するというプロセスが入り込むから一手間が加わるという点でモノレポの方が機動力があるのではと思うかもしれないが、必要なものだけをバージョン上げたらいいと思うのでそこまで機動力は低下しないと思う。どちらかというと雑に実装できるのはレポジトリ分割の良さだ。モノレポという聖域に雑な実装は誰も放り込みたくないと思う。モノレポにすると、雑に実装すると言う選択肢が奪われることになると思う。

これは事前の政治や根回し次第で解消もできるが、そのような政治が苦手だったり難しい場面でもデプロイできてしまうのはレポジトリ分割していたときの良さだろう。

まあそういう動きがしたいなら、それはチームで合意があるはずなのでそういう根回しは事前に済んでいてここであげたデメリットは考えなくてもいいかもしれない。とはいえ、理由もなくなんとなくモノレポにするというのもありそうな気がしているので書いてみた。

### 最新への追従が強制されることとその影響の予測が大変

これも良い悪い両方の側面があるのと、機動力の低下に含まれる話ではあるのだが、自分達のメンテしているパッケージを更新したら、その変更が即座に全サービスに影響する。つまりバージョン管理で影響を食い止めることができない。

これはバグの原因にもなるし、それを防ぐには莫大な検証コストを払わなきゃで返って機動力が失われるときがある。

またある 3rd party 依存を更新したときにそれがグローバルな依存であればそれも即座に影響が全部に現れるなど、影響の予測が大変だ。

そこで安全に倒すと、その変更が入るタイミング遅くなったり、そもそも変更が入らないとかになると思う。監視だったりデプロイ方法の仕組みで決行もできるがそれはそれでまた別の大変さがあるとは思う。

### 壊れた時のリカバリーが難しい

モノレポ、気づいたらロックファイルが何かおかしいという場面がある。もちろんモノレポを実現するツールやバージョン次第なところはあるが、レポジトリに関わる人が多くなってロックファイルが競合しやすくなりその競合解決を間違えるだとか、直接依存するはずなのに依存を追加せずに別サービスが追加した同名の依存を使ったり（ビルドは通るからよくあると思う）、あと原因はよく分からんが本当に壊れているみたいなことは何回か経験した。

で、こういうのは何か新しい依存を追加しようとして謎のエラーが出て、ググるとロックファイルを作り直せと言われたりするのである。そして自分にはロックファイルを作り直せる勇気はない。なぜならモノレポで依存を入れ直すと全サービスに影響が出るからだ。ちなみにこの時は `yarn add` 使わずに手で package.json に依存書いて `yarn install` するとエラーが出ないことに気づいてそれで糊口を凌いだ思い出がある。

このように何か根幹のところをいじった時に影響範囲が全部にまたがるというのはモノレポの良くないところだと思う。それを避けようとするにはモノレポ構成にも関わらず依存するライブラリを全パッケージごとで入れ直す（つまりワークスペース全体の依存として持たない）とかになるのだろうけど、それでもモノレポのツール自体やパッケージ管理システム全体に関する変更による影響からは逃れられないと思う。

勿論これはちまちま依存管理するデメリットを解消したことによる裏返しなので、どっちが良いかと論ずるのは違うかもしれないが、そもそもそのリスクを認識して吟味すべきではあると思う。

### ビルドシステムに複雑さが入り込む

ぶっちゃけ CirucleCI のブログ上でデメリットのところが薄いのは強者の理屈だと思っている。

（いろいろツッコミどころがあるかもしれないが、いろんな制約条件があるんだなということを念頭に入れた上で）「俺は！ いつも workspace で困ってるし！！なんか lockfile おかしいことになってたりするし！！！！ コマンド定義する時にルートから実行されること想定なのか、フォルダに入られること想定なのかで頭悩ませるし！！！！！VSCode 再起動しないと型定義ファイルを読み込まない時あるし！！！！！！ 依存元の事情を考えてそれぞれの環境用の成果物を吐き出させるために前段にバンドラ挟んでみたりするし（たとえば tsc だけでビルドするサーバーがある場合、main に index.ts を指定したものは置けなくて、パッケージ側でビルドするか、呼び出し側にバンドラーが必要になって、呼び出し側にバンドラ入れないときとか。）！！！！！！！！！！前段にビルドプロセス挟むなら CI/CD 組む時も Dockerfile 内でそのビルドコマンド呼び出す必要あるし！！！！！！！！だったらビルド成果物のキャッシュさせなきゃで設定ファイル難しくなっていくし！！！！！！！！！あぁエントリが index.js と index.d.ts で配布されている node_modules だけをみるようにして GitHub Actions でキャッシュ効かせている設計の方が楽！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！」という気持ちだ。

まあこれは俺が勉強不足ってなだけだが、モノレポを使うのは勉強不足でもなんとなくいい感じに動くというメリットを捨てているなと思ったりする。なお自分の所属先の構成はモノレポ構成だが、その辺りは全部同僚が面倒を見てくれているので自分は恩恵だけを受けている。いつもありがとう。

## まとめ

メリット・デメリットを書いた上で自分はどういう構成を取るか考える。

1. 管理下のサービス全てに対して何かのアップデートがあったときの追従をやり切る覚悟がある、モノレポにめちゃくちゃ詳しい、エラー全部解決できる、それがチームで可能ならモノレポにする。そうでないならパッケージを分割する。
2. パッケージ分割をしてみて、ある libA を更新したとしてその依存元の version bump がしんどくなってきたらモノレポにする
3. パッケージ分割をするのであれば依存元はお客さんという認識を持って、ライブラリ提供するかのように振る舞う。具体的には IF の定義と公開、ドキュメンテーション、バージョン管理、リリースノート管理をする。

とするかなぁと思っている。皆さんはどうですか？
