---
path: /eslint-ts-ignore
created: "2020-10-23"
title: ESLint と TS をごまかしたい時のおまじない
visual: "./visual.png"
tags: [ESLint, TypeScript]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

ESLint にも TypeScript にも「ルールを設定してみたけど、いざ運用するとなるとエラー出ちゃった。ごまかしちゃえ ⭐️」って時に使えるハッチが存在しています。

## TypeScript

### word 単位で無視する

ご存知の通り as や any が使えます。

### 行単位で無視する

`@ts-ignore` でごまかせます。

TS2.6 からの機能で[Suppress errors in .ts files using ’// @ts-ignore’ comments](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-6.html#suppress-errors-in-ts-files-using--ts-ignore-comments)によると、

> TypeScript 2.6 support suppressing errors in .js files using // @ts-ignore comments placed above the offending lines.

とあり エラーが起きている箇所の上に `@ts-ignore` と書くとその箇所のエラーを誤魔化すことができます。

#### React Element(JSX) に対して抑制させたい

`render` や `return` の中では コメントを書くのが難しいかもしれません。
例えば、

```tsx
const Hoge = () => {
  return (
    <div>
      // ここに ignore を入れたい(例えば存在しないpropsが含まれている)
      <HogeChild
        type="admin"
        user={user}
        items={items}
        handleClick={handleClick}
      />
    </div>
  )
}
```

といった場合です。
JSX の中では `//` が文字列として認識されることもあります。

そのときは

```tsx
const Hoge = () => {
  return (
    <div>
      {/* //@ts-ignore としましょう */}
      <HogeChild
        type="admin"
        user={user}
        items={items}
        handleClick={handleClick}
      />
    </div>
  )
}
```

`{/* //@ts-ignore */}` と言ったように `{}` で JS の式を入れられるようにして、そこに `//@ts-ignore` を埋め込みましょう。

### ファイル単位で無視する

`// @ts-nocheck` でごまかせます。

TS3.7 からの機能で[Announcing TypeScript 3.7 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-3-7-beta/)によると、

> TypeScript 3.7 allows us to add // @ts-nocheck comments to the top of TypeScript files to disable semantic checks. Historically this comment was only respected in JavaScript source files in the presence of checkJs, but we’ve expanded support to TypeScript files to make migrations easier for all users.

とあり、TS ファイルの先頭に `// @ts-nocheck` とつけることでそのファイルの型検査を無視することができます。

### ブロック単位で無視する

というのはできなさそうです。`no-nocheck` だけでは足りないという意見は出ているのでもしかしたら・・・（？）

FYI: https://github.com/Microsoft/TypeScript/issues/19573

## ESLint

公式の[Disabling Rules with Inline Comments](https://eslint.org/docs/user-guide/configuring.html#disabling-rules-with-inline-comments) にある程度まとまっていますが、補足を加えながらまとめます。

### ファイル単位で無視する

2 つの方法があります。

#### .eslintignore で指定する

`.eslintignore` に書いたファイル名は検査から除外されます。
ファイル名だけでなく glob 記法も使えます。

これは手軽で便利なのですがあまりお勧めはしません。
追加したことを忘れていたらずっと無視され続けるからです。
.eslintignore はそんなに定期的に見直すものでもないのでエラーを抑制したことを忘れてしまうことは十分に考えられます。

#### eslint-disable を付ける

`/* eslint-disable */` を先頭につけたファイルは検査から除外されます。

### ルール単位で無視する

`/* eslint ルール名: 0|1|2 */` をファイル先頭に書くことで制御できます。
ESLint の rule の設定そのものを書けるので、ここで 0(つまり off)を指定すればエラーを抑制できます。

### 行単位で無視する

```js
// eslint-disable-next-line ルール名
hoge
```

とすることで下の行のエラーをピンポイントで抑制できます。

また、

```js
hoge // eslint-disable-line ルール名
```

とすれば同一行のエラーを抑制できます。

### ブロック単位で指定する

`eslint-disable` と `eslint-enable` で囲った範囲はそこだけエラーを抑制できます。

```js
/* eslint-disable ルール名 */
hoge
fuga
/* eslint-enable ルール名 */
piyo
```

### 複数のルールを対応する場合

`/* eslint ルール名: 0|1|2 */` も `// eslint-disable-next-line ルール名` も `/* eslint-disable ルール名 */` も `/* eslint-enable ルール名 */` も単一のルールに対しての書き方です。
複数のルールに対して制御したい場合はどうすればいいでしょうか。

それは、**ルールを単にコンマでつなげるだけ**で良いです。

つまり、たとえば行単位での無視の場合

```js
alert("foo") // eslint-disable-line no-alert, quotes, semi

// eslint-disable-next-line no-alert, quotes, semi
alert("foo")

alert("foo") /* eslint-disable-line no-alert, quotes, semi */

/* eslint-disable-next-line no-alert, quotes, semi */
alert("foo")
```

とすれば良いです。

同様に ブロック単位の無視においては

```js
/* eslint-disable no-alert, no-console */

alert("foo")
console.log("bar")

/* eslint-enable no-alert, no-console */
```

とすれば良いです。

`/* eslint ルール名: 0|1|2 */`　を複数対応するときは少し記法が変わり、

`/* eslint ルール名: 0, ルール名: 1 */` とします。例えば、`/* eslint eqeqeq: 0, curly: 1 */`となります。

FYI: https://eslint.org/docs/user-guide/configuring.html#disabling-rules-with-inline-comments

### コメントの種類に注意！

抑制するコメントに使うコメントタイプが `/* */` なのか `//` なのかは意識しておきましょう。
`//` は行単位の抑制でしか使いません。
disable したのに想定通りの挙動にならない時の犯人はこの取り違いだったりします。

## ごまかすくらいなら最初からルール設定するなよとはいえ・・・？

僕はどちらかと言うとこういうごまかしは「「「悪」」」という立場なのですが、実際には「次の要件でこういう機能実装しないといけないから実現可能かちょっと試したい」や「認識合わせのために制作途中のものを開発環境にデプロイしたい」といったカジュアルなビルドは通したい時というのはあったりして、こういうときはいちいち型合わせたりルールを遵守したりというのはしなくて良いと思うので、こういうルールを誤魔化す方法はしっといた方が良いと思います。

もちろん恒久的にはルールに適合するコードを書く努力やルールそのものを見直すべきだと思います。

## 参考にしたもの

- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-6.html
- https://github.com/Microsoft/TypeScript/issues/19573
- https://devblogs.microsoft.com/typescript/announcing-typescript-3-7-beta/
- https://eslint.org/docs/user-guide/configuring.html#disabling-rules-with-inline-comments
- https://qiita.com/nju33/items/2d0cfea4fffbfdbff87a
