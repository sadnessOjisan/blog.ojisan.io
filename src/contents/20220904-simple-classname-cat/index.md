---
path: /simple-classname-cat
created: "2022-09-04"
title: TSプロジェクトにコピペするだけの classname 連結関数
visual: "./visual.png"
tags: ["typescript", "css"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## CSS classname

CSS の class 名を連結させるライブラリがある。[classnames](https://www.npmjs.com/package/classnames) や [clsx](https://www.npmjs.com/package/clsx) だ。
これは配列や可変長引数を引数にとって、それを連結した文字列を返す。

```js
classNames("foo", "bar"); // => 'foo bar'
```

ところでこの手のライブラリはただ classname を連結するだけでなく、falsy 値をいい感じに扱ってくれる仕組みがある。

```js
import { clsx } from "clsx";

// Strings (variadic)
clsx("foo", true && "bar", "baz");
//=> 'foo bar baz'

// Objects
clsx({ foo: true, bar: false, baz: isTrue() });
//=> 'foo baz'
```

この機能はこと React においてはとても便利なものである。

状態に応じてスタイルを当てたい時、その状態とスタイルのマッピングをオブジェクトで作っておけば、それを clsx に渡すだけで意図した classname 文字列を作れるからである。

## 既存ライブラリを使いたくない

### 既存実装のオーバーエンジニアリング

とはいえ、これらのライブラリはオーバーエンジニアリングに感じないこともない。例えば、

```js
// Objects (variadic)
clsx({ foo: true }, { bar: false }, null, { "--foobar": "hello" });
//=> 'foo --foobar'

// Arrays
clsx(["foo", 0, false, "bar"]);
//=> 'foo bar'

// Arrays (variadic)
clsx(["foo"], ["", 0, false, "bar"], [["baz", [["hello"], "there"]]]);
//=> 'foo bar baz hello there'

// Kitchen sink (with nesting)
clsx(
  "foo",
  [1 && "bar", { baz: false, bat: null }, ["hello", ["world"]]],
  "cya"
);
//=> 'foo bar hello world cya'
```

のように配列で渡す場合、可変長引数で渡す場合、nest した構造を渡す場合などいろんな渡し方がある。

そして私はこれらは TypeScript + React を前提とした場合にはオーバーエンジニアリングな機能だと思う。すくなくとも私はこれらの機能を使ったことがない

引数の型に様々なバリエーションがあったり、可変長引数での渡し方は TypeScript を想定すると渡しにくく、React のユーザーからすれば object, もしくは要素が falsy 判定できる配列で渡せればそれで良い（スタイルと状態のマッピングが目的）と思う。

そしてそれらの機能をサポートするためか、[classnames](https://www.npmjs.com/package/classnames) も [clsx](https://www.npmjs.com/package/clsx) も内部の処理が結構複雑である。（clsx のは処理が複雑というよりは実装を短くするために色々テクいことをしている）

### そもそも外部ライブラリを入れたくない

そして class 文字列を作るためにわざわざ別のライブラリを入れたくないという理由もある。バージョンアップがあればその更新がめんどくさいし、本来であれば util に一つ簡単な関数をポンとおけばそれでしまいにもできるからである。

それならば完成品の clsx をプロジェクトファイルにそのまま配置すればいいと思うかもしれないが、現代は TypeScript が前提となることが多いので、JS プロジェクトをそのまま持ち込むことはビルド周りの workaround が必要になってこれもあまりやりたくない。

そこで TS ベースで class 文字列を作るツールを作る動機が生まれた。調べた限りでは作っている人が見当たらなかったので自分で作ることにした。まあ、`["hoge fuga"].join(" ")` するだけのような処理をライブラリや記事にしようとする人の方が少数派なのであろう。

## TypeScript で最低限の実装のものを作る

### 機能

Variadic な引数は TypeScript と相性が悪く、配列と一緒にサポートしようとすると配列の取り出しがめんどくさくなるので、Variadic な引数はサポートしない。

React で使われることを想定するので状態と class のマッピングもしたい。そのためには Falsy を値に持つ場合は無視するようにするのと、引数のオブジェクト形式もサポートする。

そしてその引数からクラス名の文字列を返す関数を作る。

## 実装

```ts
type Value = string | boolean | number | null | undefined;

// FIXME: Use ReadonlyArray after https://github.com/microsoft/TypeScript/issues/17002 is resolved.
type ArrayInput = Array<Value>;

type ObjectInput = Record<string, Value>;

/**
 * Join class name.
 * This is only support for Object and Array input.
 * And this is not supported for nest input.
 * If you want support for variadic input, nest input, and so on, you should use {@link https://github.com/lukeed/clsx clsx}.
 * @param input
 * @return Joined string.
 * @example cn(["a", "b"])
 * // "a b"
 * @example cn(["a", "b" && false, "c", 0])
 * // "a c"
 * @example cn({a: true, b: false, c: true})
 * // "a c"
 */
export const cn = (input: ArrayInput | ObjectInput): string => {
  if (Array.isArray(input)) {
    return catForObjectArray(input);
  } else if (typeof input === "object") {
    if (input === null) {
      throw new Error("Input type should be array or object.");
    }
    return catForObjectInput(input);
  } else {
    throw new Error("Input type should be array or object.");
  }
};

const catForObjectArray = (input: ArrayInput): string => {
  return input.filter((el) => el && el !== true).join(" ");
};

const catForObjectInput = (input: ObjectInput): string => {
  return Object.entries(input)
    .filter((set) => {
      const value = set[1];
      // Check truthy not empty. This is compatible with classnames.
      return Boolean(value);
    })
    .map((set) => set[0])
    .join(" ");
};
```

こうなる。

あとはこれをプロジェクトにコピーして使うと良い。ソースコードは [こちら](https://github.com/sadnessOjisan/nuko)。 npm から使う場合(そんな人はいないと思うが)は

```
$ npm install

$ yarn install
```
