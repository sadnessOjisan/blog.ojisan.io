---
path: /prettier-eslint-cli
created: "2020-09-24"
title: Prettier と ESLint の組み合わせの公式推奨が変わり plugin が不要になった
visual: "./visual.png"
tags: [Prettier, ESLint]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

前に書いた [ESLint と Prettier の共存設定とその根拠について](/eslint-prettier) が公式推奨が変わったことにより一部間違った情報になっているのでその訂正記事です。
該当記事に書いた内容は Prettier と ESLint の関係を読み解く上で役立つ情報だと思うので、警告とこのページへのリンクを書いた上でそのまま残しておきます。

(追記) この記事の内容も間違った内容を書いていました。なので一度大幅な訂正をしています。prettier-eslint も推奨ではありません。

## 変更点の要約

Prettier と ESLint の組み合わせについて[公式](https://github.com/prettier/prettier/blob/554b15473dd4032a036d7db91a8f579e624c9822/docs/integrating-with-linters.md) の推奨方法が変わりました。
きっといつかこの情報も古くなるので直リンクではなく、ドキュメントの GitHub のリンクを貼っておきます。
ドキュメント自体のリンクは[こちら](https://prettier.io/docs/en/integrating-with-linters.html)です。

新しいドキュメントを要約すると、

- Linter と Formatter の競合は ESLint の config を入れて回避できる
- 競合の回避に ESLint の plugin の利用は推奨しない

これらの意味について解説します。

## Formatter と Linter の組み合わせの復習

競合問題について知っていれば読み飛ばしていい節です。

### そもそも Formatter と Linter の組み合わせは何が問題だったか

ESLint にも format に関するルールがあり、そのルールの設定と Prettier の設定が矛盾すると、eslint 後の prettier、もしくは prettier 後の eslint でエラーが起きるからです。
このとき 後に実行する方を eslint なら `--fix`, prettier なら `--write` オプションをつけてルール違反の箇所を上書けばエラーで落ちたりしませんが、CI などでそれをやると静的検査にならないのでよくない設定であり避けるべきです。

### 設定の矛盾への対応策

ESLint のルールは Formatting rules と Code-quality rules という 2 つのカテゴリがあります。
このうち Formatting rules を ESLint 側で off にします。
ただそのルールを探し出して全部ちまちま手で off にしていくと大変なので extends を使ってオフにするルールをセットにした config を読み込みます。
それが [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier) です。
これらの config は ESLint の react や typescript の plugin ごとに対応する config があるので、それらを足していくことで柔軟にコントロールができます。

そして ESLint -> Prettier, Prettier -> ESLint といった順序についても悩まなくていいように ESLint の中で Prettier を実行し、さらには Prettier のエラーを ESLint のエラーとして扱うようにします。
それを担うのが [eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier) です。
そして eslint-plugin-prettier は その内部で eslint-config-prettier も読み込む設定もしてくれるので、ESLint の設定としてはこの eslint-plugin-prettier を使うことで解決ができます。

実際には eslint-plugin-prettier の sharable config を extends して読み込ませるのでもう少し複雑なことをしているのですが、その説明をすると膨大になるのでそちらについては過去に書いたこちらをご覧ください。

- [ESLint と Prettier の共存設定とその根拠について](/eslint-prettier)
- [ESLint の Plugin と Extend の違い](https://blog.ojisan.io/eslint-plugin-and-extend)

## 新しい変更はどういうものか

大きな変更点は **ESLint の plugin 系の利用は推奨しない** ことです。

> The downsides of those plugins are:
> You end up with a lot of red squiggly lines in your editor, which gets annoying. Prettier is supposed to make you forget about formatting – and not be in your face about it!
> They are slower than running Prettier directly.
> They’re yet one layer of indirection where things may break.

拙訳すると、

これらのプラグインには次の欠点があります。

- エディターに赤いニョロニョロがたくさん出てくる。Prettier は format のことを気にしなくてもいいようにさせるツールなのに、フォーマットの警告が前面にでてきてしまう。
- 直接 Prettier を実行するより遅い
- レイヤーをひとつ挟んでおり、不整合が起きる可能性がある

さらに 最近のエディタのプラグインは直接 Prettier を実行できるようにもなっているので、エディタの eslint プラグインを動かすためにわざわざ eslint-plugin-prettier の内部で prettier を import して設定をセットアップして実行すると言った手間を省けます。

Prettier が新しいものだった時は plugin を使うのが推奨されてしましたが、今はエディタなどがネイティブでサポートするようになったので、Prettier を実行する層を挟まなくて良くなったと言ったところでしょうか。

また同様の変更として prettier-eslint の利用も推奨しないことが新たに付け加えられています。

[prettier-eslint](https://github.com/prettier/prettier-eslint) は

> Formats your JavaScript using prettier followed by eslint --fix

とあり、 `eslint --fix` の前に Prettier をかけてくれるツールです。

これは、Prettier で整形後に eslint --fix に渡します。
この方法で、prettier の整形機能を得ることができ、ESLint の整形機能も得られます。
つまり、フォーマットを Prettier で行ってから ESLint で行うということです。
なぜこれで競合を回避できるかと言うと eslint --fix で上書いているから です。
やっていることはとてもシンプルなのですが、このライブラリを入れることで ESLint のプラグイン側から Prettier を呼び出す必要がなくなり、ESlint を利用するエディタ 上での Prettier にまつわるボトルネックやエラーを解消できるというわけです。

ただこれもレイヤーを一つ挟んでいるので、prettier を直接実行するよりかは遅くなります。

## 結局どう設定したらいいのか

**eslint-config-prettier で競合ルールを OFF にした後、prettier && eslint といった風にチェックをかける**です。
これまでは eslint plugin や外部ライブラリに prettier の実行を任せていたものをユーザー側で実行させようとのことですね。

prettier 本体の prettier の設定もこうなっています。

```json
{
  "fix": "run-s fix:eslint fix:prettier",
  "fix:eslint": "yarn lint:eslint --fix",
  "fix:prettier": "yarn lint:prettier --write"
}
```

FYI: https://github.com/prettier/prettier/blob/master/package.json#L151-L153

eslint-config-prettier がルールへの追従が遅れるとエラーが出るのでアップデートに綱渡り感もあるのですが、公式推奨はこれです。
一応 prettier-eslint なら eslint-config-prettier がなくてもルールの競合を気にせずに使えるのでこちらも有力手ではあると思います。
また prettier-eslint は format 用のツールなので lint に関してはまた別途 lint の npm scripts を定義して実行してください。
prettier-eslint を動かす例はこちらを参照ください。

サンプルコード: https://github.com/ojisan-toybox/prettier-eslint-example.git

## あとがき

気合入れて書いた記事が 3 ヶ月持たずに大幅に変更になってつらいです。
まだ 推奨方法が変わってから日が浅かったり、ドキュメントもしっかり読み込めていないので不正確な情報が混じっているかもしれないので、もし何か怪しそうなところや疑問点があれば Issue や DM をいただきたいです。
