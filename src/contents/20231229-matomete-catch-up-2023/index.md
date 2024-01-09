---
path: /matomete-catch-up-2023
created: "2023-12-29"
title: 今年サボった勉強を冬休みで全部取り戻す計画
visual: "./visual.png"
tags: [雑記]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

どうも、仕事を納めてしまうと、何も予定がない人になってしまった人です...

てなわけで、公式ドキュメント、リリースノート、信頼できる情報源全部読んじゃうぞという計画を立てました。計画倒れしないようにちゃんと読むことをブログで宣言します！

## 何をするのか

マジでやること何もないので、日頃サボったプログラミングの勉強を一気にしようと思っている。「勉強していない」なんていうと「嘘つけ」と言われそうだが、いつも必要になったことをその都度調べて誤魔化しているだけであり、読むのは本や記事といった誰かの二次三次情報なので、実は一次情報には触れていない。なので以下に挙げるドキュメントは実はちゃんと読んだことがない。全て雰囲気で使っている。

そのため自分は歳の割には未知になっている範囲がとても多く（この構文ってフリーレンぽくてなんかかっこいいよね）、未知の未知にとても弱いため、わかっている人から見るとおかしなコードを書いたり設計していることがよくある。その弱点をいい加減潰すぞという計画なのである。

## レギュレーション

と、言うのを毎年考えているのだが、大体遊んでいる（これは遊びに誘う人間やゲーム会社が悪いと思っている）ので、今回はサボらないようにブログで宣言し、その上でレギュレーションを決める。

そのレギュレーションとは、冬休み中毎日ドキュメントを読んで、自分にとっての Today I Learned を毎日ブログにしていくと言うことだ。読む順番などのスケジュールは決めていないが、毎日読んで、寝る前か寝起きに記事を上げていく。サボっていたら突いてください。

読むドキュメントは以下の通り。基本的には一次情報だが、質の良い二次情報も「あとで読む」に入っているものがたくさんあるのでそれを消化していく。

## 読むもの

### HTML

一次情報なら仕様を読めと思ったかもしれないが、読む体力ないしコスパを考えると読むべきはMDNとweb.devな気がした。知らないタグや属性は絶対にあるのと、コンテンツモデルの関係が完全に頭に入っていないのでそれを復習したい。あと A11y も雰囲気でしか知らないのでこの機会に読む。

- https://developer.mozilla.org/ja/docs/Web/HTML
- https://web.dev/learn/html
- https://web.dev/learn/accessibility
- https://web.dev/learn/images
- https://web.dev/learn/forms
- https://developer.mozilla.org/ja/docs/Web/Accessibility

### CSS

これも知らない属性がたくさんあるはずなのでそれを埋めたい。あと transition, transform, keyframe がごちゃごちゃになっているので整理したい。あと CSS Scope はそろそろ調べておきたい。

- https://developer.mozilla.org/ja/docs/Web/CSS
- https://web.dev/learn/css

### JS

普段使っているメソッドしか知らないので総復習する。Arrayとか怪しい。PromiseとESM周りは完全に怪しいので復習したい。

- https://developer.mozilla.org/ja/docs/Web/JavaScript
- https://zenn.dev/estra/books/js-async-promise-chain-event-loop
- https://speakerdeck.com/qnighy/hands-on-native-esm-at-jsconf-jp-2022
- https://web.dev/learn/performance

### Git

知らないコマンドとオプションだらけだと思うので読む。

- https://git-scm.com/doc

### TypeScript

実は TypeScript を TypeScript として勉強したことがないので、初めて公式を読んでみる。tsconfig の設定もかなり怪しいので復習したい。あと 3.4 あたりからリリースノートも読んでいないのでリリースノート追いかけたい。

- https://www.typescriptlang.org/docs/
- https://devblogs.microsoft.com/typescript/

### Node.js

散々非同期ランタイムの記事を書いておきながら、実は Node.js の仕組みは何も知らない。libuv がコアなことしか知らない。いい加減勉強してみる。

- https://hiroppy.me/blog/nodejs-event-loop/

### React

React 18 以降かなり怪しい。レビューのために勉強はしていたが、包括的にはやれていないので一旦全部ドキュメントとブログを読んでみる。あと、有名なブログ記事も読む（昔読んだけど今読むと違う収穫がありそう）。

- https://react.dev/reference/react
- https://react.dev/blog
- https://overreacted.io/a-complete-guide-to-useeffect/
- https://react.dev/learn/you-might-not-need-an-effect
- https://speakerdeck.com/recruitengineers/react-2023

### Next

App Router以降かなり怪しいのでまずは公式とブログを全部読む

- https://nextjs.org/docs
- https://nextjs.org/blog

### libs & toolchain

普段使っているライブラリのドキュメント、実は読んでないのでこれを機に読んでみる。

- https://recoiljs.org/docs/introduction/installation
- https://react-hook-form.com/
- https://tailwindcss.com/docs/installation
- https://mswjs.io/
- https://jestjs.io/ja/
- https://eslint.org/
- https://playwright.dev/

### HTTP

実は怪しいのでそう復習したい。来年はVCLを書く予定があるので今のうちに復習をば。

- https://developer.mozilla.org/ja/docs/Web/HTTP

### VCL

来年はFastlyでVCLをガッツリ書く予定があるので今のうちに復習をば。

- https://docs.fastly.com/ja/guides/
- https://developer.fastly.com/reference/

### GraphQL

何も理解せずに使い続けているのでいい加減知りたい。真面目な話として、GraphQL自体の仕様が何なのか知らない（知らない人の方が大多数だとは思っているけど...）

- https://graphql.org/learn/
- https://spec.graphql.org/

gRPC も同じ怪しさを抱えているのだけど、来年は GraphQL の方が多そうなので GraphQL 有線で勉強する。

### OpenTelemetry

マジで何も理解せずに雰囲気で使っているので一旦ドキュメントを読む。

- https://opentelemetry.io/docs/

### GCP

これもかなり雰囲気で使っているので一応全部読んでおきたい。特に CloudRun と GKE と VPC と IAM と gcloudコマンド

- https://cloud.google.com/docs?hl=ja

### Docker

公式ドキュメント読んだことないので読んでおきたい

- https://docs.docker.com/get-started/overview/
- https://docs.docker.com/reference/

### その他

時間があったら k8s, ArgoCD, Prometheusあたりも読みたいけど、流石に時間が足りなさそうなのでこれは後回し。

あと、これ読め的なのがあると教えて欲しいです。

---

## 2023/12/30

### https://developer.mozilla.org/ja/docs/Learn/HTML/Introduction_to_HTML/Getting_started

<img> のような閉じタグがない要素は[空要素](https://developer.mozilla.org/ja/docs/Learn/HTML/Introduction_to_HTML/Getting_started#%E7%A9%BA%E8%A6%81%E7%B4%A0)と呼ばれる。

> メモ: HTML では、例えば <img src="images/cat.jpg" alt="cat" /> のように、空要素のタグの末尾に / を追加する必要はありません。しかし、これは有効な構文であり、 HTML を有効な XML にしたい場合に使うことがあります。

なので、`/` あってもよさそう。JSXは求めるわけだしとりあえず `/` つけてもよさそう。

### https://developer.mozilla.org/ja/docs/Learn/HTML/Introduction_to_HTML/HTML_text_fundamentals

`<em>` はイタリックにするが、この目的は強調。スクリーンリーダー越しにもそのように解釈される。

b, i, u はイタリック、太字、下線だが、表示にしか影響を与えない表示要素であり、もはや使用するべきではないらしい。

### https://developer.mozilla.org/ja/docs/Learn/HTML/Introduction_to_HTML/Creating_hyperlinks

画像リンクが公式（？）に言及されていたのちょっと面白い。

a タグ、title 属性でツールチップの制御できる

リンク語にこちらなどがダメな理由が a11y 面にある。よくダメとは聞いていたがこういう理由があるらしい。

### https://developer.mozilla.org/ja/docs/Learn/HTML/Introduction_to_HTML/Advanced_text_formatting

dl, dt, dd、説明に使うタグというのは知っていたけど、リストの仲間だった。

引用は q タグでインラインでできる。blockquote タグは cite 属性でURLをかける（マークダウンでもこれやりたいな）

abbrタグで略語を表現できる。title 属性で正式名称

連絡先には adddess タグ。pタグも囲める

上付き下付き文字は sub, sup で表現できる

### https://developer.mozilla.org/ja/docs/Learn/HTML/Introduction_to_HTML/Document_and_website_structure

サイドバー `<aside> `は `<main>` の中に置かれることが多い。

`<main>` はページごとに 1 回だけ使用し、 [<body>](https://developer.mozilla.org/ja/docs/Web/HTML/Element/body) の中に直接入れてください。理想的には、これを他の要素の中に入れ子にしないでください。

[<article>](https://developer.mozilla.org/ja/docs/Web/HTML/Element/article) は、ページの残りの部分（例えば、単一のブログ記事）なしでそれ自体が意味をなす関連コンテンツのブロックを囲みます。

[<section>](https://developer.mozilla.org/ja/docs/Web/HTML/Element/section) は <article> に似ていますが、1 つの機能（例：ミニマップ、記事の見出しと要約のセット）を構成するページの単一部分をグループ化するためのものです

つまり section は article の中で入れ子で使われる感じかな。

header は article や section のためのヘッダーに使っても良い

span や div は意味を与えないために利用できる。変にサイドバー使う方が混乱させる時がある。

### https://developer.mozilla.org/ja/docs/Learn/HTML/Introduction_to_HTML/Debugging_HTML

https://validator.w3.org/ でHTMLのバリデーションできる

### https://developer.mozilla.org/ja/docs/Learn/HTML/Multimedia_and_embedding/Images_in_HTML

警告: 他人のウェブサイトでホスティングされている画像を、許可なく src 属性で指してはいけません。これは「ホットリンク」と呼ばれます。誰かがページにアクセスしたときに画像を配信するための帯域幅のコストを他の誰かが負担することになるため、一般に倫理的に問題があると考えられています。

画像を表示しないブラウザが存在する。https://ja.wikipedia.org/wiki/Lynx_(%E3%82%A6%E3%82%A7%E3%83%96%E3%83%96%E3%83%A9%E3%82%A6%E3%82%B6)

画像へのキャプションは figure と figcaption

装飾のための画像は CSS から読み込ませるべき。

### https://developer.mozilla.org/ja/docs/Learn/HTML/Multimedia_and_embedding/Video_and_audio_content

webbtt と track 要素で動画に字幕をつけられる

### https://developer.mozilla.org/ja/docs/Learn/HTML/Multimedia_and_embedding/Other_embedding_technologies

sandbox 属性に allow-scripts と allow-same-origin の両方を追加しないことです。この場合、埋め込みコンテンツは、サイトのスクリプトの実行を停止する同一オリジンセキュリティポリシーをバイパスし、 JavaScript を使用してサンドボックスを完全に無効にすることができます。

### https://developer.mozilla.org/ja/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images

srcset も size もヒント

ブラウザが使う画像を決めるロジック

1. その端末の幅を見る。
2. sizes リストの中のどのメディア条件が真であるかを確認する。
3. そのメディア照会で与えられたスロットサイズを見る。
4. 選択したスロットサイズに最も近い srcset リストで参照される画像を読み込みます。

media 属性は、アートディレクションのシナリオでのみ使用してください。 media を使用する場合は、sizes 属性内でメディア条件を指定しないでください。

### https://developer.mozilla.org/ja/docs/Learn/HTML/Tables/Basics

列に共通のスタイルを付ける方法として col 要素と colgroup がある。tr, td ごとにスタイルしなくていい仕組みだ。

scope属性でth 要素に追加して、ヘッダーがどのセルのヘッダーであるかをスクリーンリーダーに正確に伝えることができる

scope 属性を使用する代わりに、id 属性と headers 属性を使用して、ヘッダーとセル間の関連付けを作成することもできる

### https://developer.mozilla.org/ja/docs/Web/HTML/Element

タグのリファレンスのトップページ

base, 文書内におけるすべての相対 URL の基点となる URL を指定します。文書内に 1 つだけ置くことができます。

hgroup, 小見出し、代替タイトル、キャッチフレーズなどの副次的コンテンツとグループ化された見出しを表します。

data, 与えられたコンテンツの断片を機械可読な翻訳にリンクします。コンテンツが時刻または日付に関連するものであれば、time 要素を使用する必要があります。

dfn, 定義句や文の文脈の中で定義している用語を示すために用いられます。 `<dfn>` の直近の祖先である `<p>` 要素、 `<dt>/<dd>` の組み合わせ、 `<section>` 要素が用語の定義とみなされます。

kbd, キーボード、音声入力、その他の入力端末からのユーザーによる文字入力を表すインラインの文字列の区間を表します。慣習的に、ユーザーエージェントは既定で `<kbd>` 要素の中身を等幅フォントで表示しますが、 HTML 標準で規定されているものではありません。

mark, 周囲の文脈の中でマークを付けた部分の関連性や重要性のために、参照や記述の目的で目立たせたり強調したりする文字列を表します。

rp, `<ruby>` 要素によるルビの表示に対応していないブラウザー向けの代替表示用括弧を提供するために使用します。`<rp>` 要素は、注釈の文字列を `<rt>` 要素を囲む開き括弧と閉じ括弧をそれぞれ囲む必要があります。

rt, ルビによる注釈（振り仮名）のルビ文字列の部分を定義し、東アジアの組版において発音、翻訳、音写などの情報を提供するために使用します。 `<rt>` 要素は常に `<ruby>` 要素の中で使用されます。

ruby, ベーステキストの上、下、隣に描画される小さな注釈で、よく東アジアの文字の発音を表すのに使われます。他の種類の注釈にも使われることがありますが、この使い方はあまり一般的ではありません。

samp, コンピュータープログラムからのサンプル出力を表すインライン文字列を含めるために使用されます。内容は普通、ブラウザーの既定の等幅フォント（Courier や Lucida Console など）を使用して表示されます。

small, 表示上のスタイルとは関係なく、著作権表示や法的表記のような、注釈や小さく表示される文を表します。既定では、 small から x-small のように、一段階小さいフォントでテキストが表示されます。

var, 数式やプログラムコード内の変数の名前を表します。挙動はブラウザーに依存しますが、通常は現在のフォントのイタリック体を使って表示されます。

wbr, 改行可能位置 — テキスト内でブラウザーが任意で改行してよい位置を表しますが、この改行規則は必要のない場合は改行を行いません。

area, イメージマップの中でクリック可能な領域をあらかじめ定義します。イメージマップでは、画像上の幾何学的な領域をハイパーテキストリンクと関連付けすることができます。

map, `<area>` 要素とともに、イメージマップ（クリック可能なリンク領域）を定義するために使用します。

portal, 他の HTML ページを現在のページに埋め込み、新しいページへの移動がスムーズにできるようにします。

noscript, このページ上のスクリプトの種類に対応していない場合や、スクリプトの実行がブラウザーで無効にされている場合に表示する HTML の部分を定義します。

del, 文書から削除された文字列の範囲を表します。これは例えば、「変更の追跡」や、ソースコードの差分情報を描画するときに使用することができます。 `<ins>` 要素は逆の目的に、文書に追加された文字列を示すために用いることができます。

ins, 文書に追加されたテキストの範囲を表します。同様に、 `<del>` 要素を使用して文書から削除されたテキストの範囲を表すことができます。

datalist, 他のコントロールで利用可能な値を表現する一連の `<option>` 要素を含みます。

fieldset, ウェブフォーム内のラベル (`<label>`) などのようにいくつかのコントロールをグループ化するために使用します。

legend, その親要素である `<fieldset>` の内容のキャプションを表します。

meter, 既知の範囲内のスカラー値、または小数値を表します。

optgroup, `<select>` 要素内の選択肢 (`<option>`) のグループを作成します。

output, サイトやアプリが計算結果やユーザー操作の結果を挿入することができるコンテナー要素です。

progress, タスクの進捗状況を表示します。プログレスバーとしてよく表示されます。

### https://graphql.org/learn/schema/#interfaces

```gql
type Human implements Character {
  id: ID!
  name: String!
  friends: [Character]
  appearsIn: [Episode]!
  starships: [Starship]
  totalCredits: Int
}

type Droid implements Character {
  id: ID!
  name: String!
  friends: [Character]
  appearsIn: [Episode]!
  primaryFunction: String
}
```

と

```gql
{
  search(text: "an") {
    __typename
    ... on Human {
      name
      height
    }
    ... on Droid {
      name
      primaryFunction
    }
    ... on Starship {
      name
      length
    }
  }
}
```

は

```gql
{
  search(text: "an") {
    __typename
    ... on Character {
      name
    }
    ... on Human {
      height
    }
    ... on Droid {
      primaryFunction
    }
    ... on Starship {
      name
      length
    }
  }
}
```

としてクエリできる。

### https://graphql.org/learn/introspection/

introspectionでどんなクエルが使えるかを調べることができる。

### https://graphql.org/learn/best-practices/#server-side-batching-caching

versioning 不要なこと、明記されているんだ。

> In contrast, GraphQL only returns the data that's explicitly requested, so new capabilities can be added via new types and new fields on those types without creating a breaking change. This has led to a common practice of always avoiding breaking changes and serving a versionless API.

### https://www.typescriptlang.org/docs/handbook/tsconfig-json.html

jsconfig.json というのがある。js系のオプション使うときに使えるぽい？

### https://www.typescriptlang.org/tsconfig

#### files

指定したファイルだけtranspileできる。多いときはinclude使う

#### extends

設定ファイル内で見つかったすべての相対パスは、 その設定ファイルからの相対パスで解決されます。

#### include

glob pattern 使える。`?` 使える。

#### exclude

include の中の deny を宣言するだけ。ファイルのimport先としてexclude指定のものがあったら、それは見られてしまう。

#### exactOptionalPropertyTypes

真にoptionalにしたいときの `?` に対して、undefinedを代入できないようにしてくれる。

#### noImplicitOverride

継承時にメソッドoverride したいとき、overrideキーワードをつけさせる。そうすることで、継承元からメソッドが消えたときに、コンパイルエラーになって、継承元のメソッドをoverrideしていない（新しいめそっどをついかしている）ことに気づけるようになる

#### noPropertyAccessFromIndexSignature

. ではなく `[""]` でアクセスさせる。

（何が嬉しい？）

#### strictFunctionTypes

???

## 2023/10/31

### https://www.typescriptlang.org/tsconfig

#### moduleResolution

Node.js の最新バージョンでは 'node16' または 'nodenext' を指定

bundlerはimportsの相対パスにファイル拡張子を要求しない。TSだけどtype: moduleにしてるときに相性良さそう。

### https://www.typescriptlang.org/docs/handbook/modules/theory.html#module-resolution

#### moduleSuffixes

コンパイル対象の拡張子をしていできる。異なる値で tsconfig 複数作っておけばRN で便利なときがあるらしい。

#### resolvePackageJsonExports / resolvePackageJsonImports

node_modules 読むとき、package.json の exports / imports を見てくれる

#### rootDir

指定した階層にあるものしかプロジェクトで使えなくなる

デフォルト値は、最長のパスになるよう動的に計算される。なので src の親にあるものを参照していたらその親がデフォルト値に入り、tsc したときの成果物に src が含まれる。つまり dist/src/\*.js のようなものができあがる。注意が必要。

#### rootDirs

仮想的なフォルダを作り、指定したフォルダたちが型推論上は同じ場所にあるとみなしてくれるようになる。例えば d.ts だけ別の専用フォルダにまとめたいときとかに使える。

usecase: https://qiita.com/Quramy/items/44ab1a046d58449cd783#rootdirs

#### declarationMap

project reference 使ってるときにあると良いらしい

map ファイルというのも作ってくれて、IDEでのジャンプ時にd.ts ではなく ts ファイルを見れるらしい。

（が、これはライブラリを作る側がそれを作っていたらの話であって、エンドユーザーは恩恵なさそう？）

#### downlevelIteration

古いJSでも使えるような 変換をiterationに対してしてくれる。

今はあまり考えなくて良さそう

#### emitBOM

BOM つきで出せる。

false 推奨

#### emitDeclarationOnly

d.ts だけ吐く。TS -> JS を別ライブラリでやっているときに便利

#### importsNotUsedAsValues

value import が type import として扱われた時の挙動を制御。tsconfig/strictest は error 指定としているが、これはそのような挙動があるとエラーとして警告を出すということ。デフォルト挙動は remove で消すだけ。

#### inlineSourceMap

sourcemap をファイルに埋め込んでくれる

#### newLine

CRLF, LF を指定できる

#### noEmitOnError

デフォルトではfalse, つまりコンパイルエラーになってもファイル出力できるならされる

#### outFile

成果物を1ファイルにまとめられる

ただmodule is None, System, or AMDの場合のみなので出番あまりなさそう

#### stripInternal

internal を jsdoc で指定していたら、型を生成しない

#### maxNodeModuleJsDepth

???

#### disableSizeLimit

TS コンパイラ、実はメモリの上限がある。それをオフにできる

#### plugins

plugin 機能がある。（が、使ったことないからイメージ湧かないや）

Quramyさんのプラグインが公式に言及されていた。

https://github.com/Quramy/ts-graphql-plugin

#### allowSyntheticDefaultImports

`import * as react from 'react'` と書くべきところを `import react from 'react'` と書いても、型検査では問題なくなる。

esModuleInterop の型検査のみバージョン？

see: https://omochizo.netlify.app/posts/2020/08/commonjs-esm/

#### esModuleInterop

esm から cjs を読み込めるように、default をつけてくれる

see: https://omochizo.netlify.app/posts/2020/08/commonjs-esm/

#### isolatedModules

1ファイルとしてトランスパイルできる実装をしないとエラーが出るようになる。tsc でなく babel などで transpile すると、型の情報を知った状態でトランスパイルできない。たとえば

```ts
import { someType, someFunction } from "someModule";

someFunction();

export { someType, someFunction };
```

的なコードを書くことができない。なぜなら someType が関数か型かはこのファイルだけではわからないからだ。type 識別子をつけるとOKだが、そうでない場合にエラーとなるようにしてくれるのがこのオプションだ。

#### preserveSymlinks

（何が嬉しいのか？）

#### verbatimModuleSyntax

???

#### jsxImportSource

たとえば emotion では css props を受け取るための専用の React が必要。

### https://speakerdeck.com/recruitengineers/react-2023

- 現在のReactは仮想DOMと言わずにUIツリーと呼ぶ
- イベントハンドラはDOMに直接アタッチされない, react がイベントを受け取りハンドラを呼び出す、イベントオブジェクトはブラウザの違いを吸収したものとなっており、合成イベントと呼ばれる（syntetic event)
- hook の前で if 呼ぶと壊れる (= 常に同じ順番で同じ数のhooksを呼ばないといけない、Reactはhookが呼ばれるたびにvdomにhookごとの情報を追加、連結リストで管理)
  - （だけど、壊れる理由がいまいちまだしっくり来ていない）
- Array.prototype.with を使った更新
- コンポーネントの主目的はDOMのレンダリングで、それ以外のリソースの扱いを副作用と定義。コンポーネントはレンダーフェーズで実行。レンダーは破棄されて再実行されることもあるのでべき等であるべき。逆にレンダーフェーズで実行されないコードであれば副作用を持ってもよい。 -> useEffect
- AbortControllerでクリーンアップを描く
- useLayoutEffect, DOM更新されたブラウザ画面をペイントする前に実行する関数。スクロール位置の調整とかに使える。

## 2024/1/1

### https://react.dev/learn/start-a-new-react-project

> If you want to build a new app or a new website fully with React, we recommend picking one of the React-powered frameworks popular in the community.

meta framework として使えの話はこれかの気持ち

### https://react.dev/learn/typescript

context を使うときに null かもしれない問題、毎回チェックして例外投げるのは公式推奨だった。

```ts
const useGetComplexObject = () => {
  const object = useContext(Context);
  if (!object) {
    throw new Error("useGetComplexObject must be used within a Provider");
  }
  return object;
};
```

子コンポーネントの型には `React.ReactNode` か `React.ReactElement` を使うと良い。 `React.ReactNode`はJSXで渡せる型の全ての型を表現して、`React.ReactElement`は primitive な element を含まない。

### https://react.dev/learn/render-and-commit

trigger -> render -> commit

“Rendering” is React calling your components.

### https://react.dev/learn/state-as-a-snapshot

> Its props, event handlers, and local variables were all calculated using its state at the time of the render.

なので、state からの計算というのが根本

```ts
import { useState } from 'react';

export default function Counter() {
  const [number, setNumber] = useState(0);

  return (
    <>
      <h1>{number}</h1>
      <button onClick={() => {
        setNumber(number + 1);
        setNumber(number + 1);
        setNumber(number + 1);
      }}>+3</button>
    </>
  )
}
```

は

```
  setNumber(0 + 1);
  setNumber(0 + 1);
  setNumber(0 + 1);
```

### https://react.dev/learn/queueing-a-series-of-state-updates

いわゆるバッチ概念の解説。同一 setxxx を実行したら最後のものが適用される。

先の　`setNumber(number + 1);` を `setNumber(n => n + 1);` にすると 3 に更新される。n + 1 を3回行うので。

### https://web.dev/learn/accessibility/measure?hl=ja

> アクセシビリティ標準にはさまざまなものがあります。通常は、業種、商品カテゴリ、国や地域の法律やポリシー、または全体的なユーザー補助の目標に応じて、従うべきガイドラインや達成すべきレベルが決まります。プロジェクトに特定の標準が必要ない場合は、最新バージョンの Web Content Accessibility Guidelines（WCAG）に従うことが標準の推奨事項となります。

逆にWCAG以外にガイドラインがあるんだ。

### https://web.dev/learn/accessibility/aria-html?hl=ja

WAI-ARIA は旧称。今は ARIA.

The accessibility treeをDOMから作る

> WebAIM Million 年間ユーザー補助レポートによると、ARIA を実装したホームページは、ARIA を実装していないホームページよりも、主に ARIA 属性の不適切な実装により検出されたエラーが平均 70% 多いことが判明しています。

> キーボードのフォーカスの順序に関する潜在的な問題を防ぐため、可能な限り正の整数でタブ インデックスを使用することは避けてください。

aria-label は使う場面がありそう。特に視覚情報（位置・色）からは当たり前だけど、そうでない場合の注釈には使う場面多そう。

heading は順番を守らないとスクリーンリーダーが使いにくい

### https://web.dev/learn/accessibility/more-html?hl=ja

タグごとに言語指定できたりする。

```html
<span lang="et">"Kas sa räägid inglise keelt?"</span>
```

iframe は title を設定する、scrolling を auto にしておくのが良い。iframe内にスクロールバーを追加できる。

### https://web.dev/learn/accessibility/focus?hl=ja

menu の数が多いとき、`#content` のようなリンクを、UI上は非表示にしておいて、skip to main みたいなラベルを与えておけば、そこん飛べるリンクを用意できる。ナビゲーションをtab 連打しないといけないとメインコンテンツにいけないような場合に利用できる。

focus indicator, 目が見えるけどタブを使って移動する人向けに残すべきで消しては行けない。

### https://web.dev/learn/accessibility/javascript?hl=ja

JS書く時も支援ツールのこと意識した方が良い。例えば数秒で消えるnotificationを支援ツールが読み取ってくれるかなど。 -> aria-live が使えそう？

モーダルと a11y (???)

状態管理: メニューが開いているかどうかは aria-expanded で伝えられる。ボタンが押されていることは aria-pressed で伝えられる。

### https://web.dev/learn/accessibility/motion?hl=ja

we'll look at some of the ways to help better support people with all types of movement-triggered disorders. に該当するところが翻訳されていない。

アニメーションに関するOS設定、@prefers-reduced-motion というメディアクエリで拾える。これによって出し分けられる。

## 2024/1/2

### https://mswjs.io/docs

> MSW uses the Service Worker API to intercept actual production requests on the network level. Instead of patching fetch and meddling with your application’s integrity, MSW bets on the platform, utilizing the standard browser API to implement a revolutionary request interception logic.
>
> Even in Node.js, where there are no standard means to intercept requests, MSW uses class extension instead of module patching to ensure your tests run in the environment as close to production as possible.

### https://mswjs.io/docs/getting-started

Node.js で service worker 使えなくねと思っていたが、module patch で拡張してるとのこと。

> Developers come to MSW for various reasons: to establish proper testing boundaries, to prototype applications, debug network-related issues, or monitor production traffic. This makes it all the more challenging to write a single tutorial that would suit all those needs at the same time. In the end, it is your choice how you utilize the capabilities of the library, and we believe it should be you who decides on the right path to follow in this tutorial.

多様なユースケースに対応できる道具の、チュートリアルを書くにあたってはこの文言良いなという気持ちになった。

### https://mswjs.io/docs/basics/intercepting-requests

GraphQL も専用のメソッドでinterceptできる

### https://mswjs.io/docs/basics/mocking-responses

mock のレスポンスは標準のResponseクラスでなく、ライブラリ提供のHttpResponseを使った方が良い

jsonレスポンスは HttpResponse.json() で作った方が良い。ヘッダに application/json 指定してもいいが、冗長

### https://mswjs.io/docs/philosophy

msw が嬉しい理由のほとんどはツール非依存なところ。モックではなく、ネットワークの挙動そのものを再現できる。 = Network behavior

### https://mswjs.io/docs/limitations

firefox では XMLHttpRequest 非対応。つまり ajax できなさそう。けど、msw は開発ツールなので問題ないと考える。

ネットワークの挙動をラップする仕組みなので、並行テストに弱い。msw を使用するときはテストの並列実行を無効にした方が良い。

### https://mswjs.io/docs/migrations/1.x-to-2.x

jest を使うとNode.js globalsにあるべきものが見つからないことがある（fetchとか)。undiciとかから持ってきたメソッドをglobalThisに入れてあげるようなセットアップスクリプトが必要かもしれない。また、JSDOMを使っているときは customExportConditions の条件が必要かもしれない。jestの走るNode.js 環境からbrowser fetchを動かそうとしていることもあるから。 -> react-testing-lib とかでテスト書くときは vitest か jest mock でやった方が良いかもな。

### https://mswjs.io/docs/integrations/browser

`npx msw init <PUBLIC_DIR>` とすれば service worker ファイルを作ってくれるので、それを使えば開発時もモック用のAPIエンドポイントを用意できる。

### https://mswjs.io/docs/integrations/node

テストランナーでやることは

```ts
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### https://mswjs.io/docs/best-practices/custom-request-predicate

高階resolverを作れば、「idというクエパラがあるときはこのレスポンス」みたいな出しわけを作れる。

どのidに対して物共通処理（例えばidの存在チェックなど）は高階resolverの外に書く。

### https://mswjs.io/docs/best-practices/dynamic-mock-scenarios

シナリオごとにデータを管理し、アプリケーションに対してクエパラを与えて、そのクエパラで起動するswを切り替えると、シナリオごとに動作を切り替えられる。

### https://mswjs.io/docs/recipes/response-patching

handler に実在するURL（サードパーティなど）を渡すと、そこへのリクエストもmockしてくれる。

そのとき、bypass を使ってデータを取得した上で、独自の HttpResponse を返せば、既存レスポンスを拡張して返すことができる。

### https://mswjs.io/docs/recipes/polling

ジェネレータを使えば、一定回数呼ばれた後に別のレスポンス返すみたいな実装できる。

### https://mswjs.io/docs/recipes/network-errors

ネットワークエラーは HttpResponse.error() で表現できる。

アプリケーションとしてのエラーの場合は `return new HttpResponse(null, { status: 401 })` を使う。

### https://mswjs.io/docs/recipes/responding-with-binary

fs でファイルをとり、content type を指定すれば、バイナリをレスポンスできる

### https://mswjs.io/docs/recipes/custom-worker-script-location

worker.start するときの引数で、読み込むサービスワーカー切り替えられる

### https://playwright.dev/docs/writing-tests

beforeEach とか、テストの塊ごとに作れる。(jestもそうだっけ？)

```ts
import { test, expect } from "@playwright/test";

test.describe("navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Go to the starting url before each test.
    await page.goto("https://playwright.dev/");
  });

  test("main navigation", async ({ page }) => {
    // Assertions use the expect API.
    await expect(page).toHaveURL("https://playwright.dev/");
  });
});
```

### https://playwright.dev/docs/running-tests

```
npx playwright test --debug
```

でデバッグモードが使える。

```
npx playwright test example.spec.ts:10 --debug
```

のような数字指定で break point みたいなことができる。

### https://playwright.dev/docs/ci-intro

`if: github.event.deployment_status.state == 'success'` のような条件をGHAに書けば、デプロイ終了後にデプロイ成果物に対してテストを走らせられる。

### https://playwright.dev/docs/test-annotations

テストにタグ付けできて、実行できる。

```
import { test, expect } from '@playwright/test';

test('Test login page @fast', async ({ page }) => {
  // ...
});

test('Test full report @slow', async ({ page }) => {
  // ...
});
```

```
npx playwright test --grep @fast
```

### https://playwright.dev/docs/test-sharding

sharding したら分割したテストをレポーティングのためにマージしないといけない。playwright自体にその機能がある。
なのでGHAでそれぞれのレポートをアップロードしてからマージすると良い。

```yaml
jobs:
---
merge-reports:
  # Merge reports after playwright-tests, even if some shards have failed
  if: always()
  needs: [playwright-tests]

  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    - name: Install dependencies
      run: npm ci

    - name: Download blob reports from GitHub Actions Artifacts
      uses: actions/download-artifact@v3
      with:
        name: all-blob-reports
        path: all-blob-reports

    - name: Merge into HTML Report
      run: npx playwright merge-reports --reporter html ./all-blob-reports

    - name: Upload HTML report
      uses: actions/upload-artifact@v3
      with:
        name: html-report--attempt-${{ github.run_attempt }}
        path: playwright-report
        retention-days: 14
```

### https://eslint.org/docs/latest/use/getting-started

`npm init @eslint/config -- --config semistandard` で開始できる。--config オプション知らなかった。

### https://eslint.org/docs/latest/use/configure/configuration-files-new

flat config, eslint.config.js おかなくても ESLINT_USE_FLAT_CONFIG で有効化できる。

eslint.config.js の内容は type: "module" かどうかで esm, cjs のどちらで export するかが決まる

デフォルトでは **/\*.js, **/_.cjs, \*\*/_.mjsにマッチ

files, ignore に従って、file objects はカスケーディングされていく。衝突したら後勝ち。

reportUnusedDisableDirectives　というオプションで未使用の disable があるときに炙り出せる。これは CLI のオプションからでも指定できる。

ecmaVersion はデフォルトでは latest, そのJSが古いJSとして評価されることを期待しない限りは latest 推奨。

sourceType で esm, cjs, script を指定できる。何も指定しなければ、.js, .mjs は esm として評価される。

何も設定していないなら、eslint は ecmaVersion 指定で入る global 以外のものを想定しない。ここに特定の global を足したいとき、globals というパッケージから定義を引っ張ってくると便利。

plugin のキー名のところはルール名の指定と対応する。

```js
import jsdoc from "eslint-plugin-jsdoc";

export default [
  {
    files: ["**/*.js"],
    plugins: {
      jsd: jsdoc,
    },
    rules: {
      "jsd/require-description": "error",
      "jsd/check-values": "error",
    },
  },
];
```

eslint 自体には predefined な rule がある。

```js
import js from "@eslint/js";

export default [js.configs.recommended];
```

で有効化できる。

## 2023/1/3

### https://docs.github.com/ja/actions/using-workflows/about-workflows

デフォルトでは、ワークフロー内のジョブはすべて同時並行で実行されます。

キャッシュが作成されると、同じリポジトリ内のすべてのワークフローで使用できるようになります。

### https://docs.github.com/ja/actions/using-workflows/triggering-a-workflow

組み込みの GITHUB_TOKEN を使っているときはワークフローからワークフローをトリガーできない。再帰を防ぐ。

trigger には fork があって、誰かに fork されたときに実行させられる

branches と branches-ignore フィルターの両方をワークフロー内の同じイベントで使うことはできない。除外を使いたいときは `!`

paths を使えばファイル名や拡張子でトリガーをかける

### https://docs.github.com/ja/actions/using-workflows/workflow-syntax-for-github-actions

if 条件の中で式を使う際には、式構文 ${{ }} を省略できます。これは、GitHub Actions が if 条件を式として自動的に評価するためです。

> ワークフローの実行またはジョブが開始されると、GitHub は、同じコンカレンシー グループで既に進行状況にあるワークフローの実行またはジョブをキャンセルします。

続けて push した時の挙動だ。

job でoutputして、別のjobで `needs.job1.outputs.output1` として拾える

env と enviroment 何が違う？

条件文でシークレットを直接参照することはできない。env に詰め込む必要ある。

別actionの選択はuse

> Git ref、SHA、または Docker タグを指定することで、使っているアクションのバージョンを含めることを、強くお勧めします。

既定では、フェイルファスト動作は、sh と bash の両方に set -e を使用して強制されます。 shell: bash が指定されている場合、ゼロ以外の終了ステータスを生成するパイプラインからの早期終了を強制するために -o pipefail も適用されます。

sh ライクのシェルは、スクリプトで実行された最後のコマンドの終了コードで終了します。これは、アクションの既定の動作でもあります。 runnerは、この終了コードに基づいてステップのステータスを失敗/成功としてレポートします。

> 同じ名前で複数の環境変数が定義されている場合、GitHub では最も具体的な変数を使用します。 たとえば、ステップ中で定義された環境変数は、ジョブやワークフローの同じ名前の環境変数をステップの実行の間オーバーライドします

job の step にも env設定できる口がある

step で continue-on-errorを使えばエラーでも継続させられる

> Dockerは自動的に、同じDockerのユーザ定義ブリッジネットワーク上のコンテナ間のすべてのポートを公開します。 サービスコンテナは、ホスト名で直接参照できます。 ホスト名は自動的に、ワークフロー中のサービスに設定したラベル名にマップされます。

> \*: 0 個以上の文字と一致しますが、/ 文字とは一致しません。

`**/**` のようなコードを書く理由
