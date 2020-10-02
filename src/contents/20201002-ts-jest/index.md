---
path: /ts-jest
created: "2020-10-02"
title: "preset: ts-jest とは"
visual: "./visual.png"
tags: [jest, ts-jest]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

Jest で TypeScript を動かす時「`preset: ts-jest` とすればいい」という話をたまに聞くのでその補足です。

## 結論

jest.config.js の transform もしくは preset に ts-jest をセットすれば TypeScript をテストできるようになります。ただ TypeScript が使えるようになる直接的な立役者は transform であり、preset は内部で transform の設定をしているだけです。そのためユーザーは `preset: ts-jest` と設定すればよく、公式推奨の Basic Usage もこのやり方です。

## 準備

パッケージインストール

```sh
npm i -D jest @types/jest typescript
```

ツールの設定ファイルを生成

```sh
npx jest --init

npx tsc --init
```

テスト対象を作成

```ts:title=src/index.ts
export const sum = (left: number, right: number): number => {
  return left + right
}

console.log(sum(1, 2))
```

テストを作成

```ts:title=src/index.test.ts
import { sum } from "."

describe("index.js", () => {
  it("should be 3 when inputs are 1, 2", () => {
    const actual = sum(1, 2)
    expect(actual).toBe(3)
  })
})
```

jest の設定. 検証用として preset は undefined にする。

```js:title=jest.config.js
module.exports = {
  clearMocks: true,
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "babel",
  // A preset that is used as a base for Jest's configuration
  // preset: undefined,
  // The test environment that will be used for testing
  testEnvironment: "node",
  // A map from regular expressions to paths to transformers
  // transform: undefined,
}
```

TypeScript の設定

```js:title=tsconfig.js
{
  "compilerOptions": {
    "target": "es5",
    "module": "commonjs",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}

```

## Jest の設定で preset を指定しないと何が問題になるか

上の設定で preset を undefined にしました。
この状態で TypeScript のテストを実行します。

```sh
npm run test

 FAIL  src/index.test.ts
  ● Test suite failed to run

    Jest encountered an unexpected token

    This usually means that you are trying to import
    a file which Jest cannot parse, e.g. it's not plain JavaScript.

    By default, if Jest sees a Babel config,
    it will use that to transform your files, ignoring "node_modules".

    Here's what you can do:
     • To have some of your "node_modules" files
     transformed, you can specify a custom
     "transformIgnorePatterns" in your config.
     • If you need a custom transformation
     specify a "transform" option in your config.
     • If you simply want to mock your non-JS modules
     (e.g. binary assets) you can stub them out with
     the "moduleNameMapper" config option.

    You'll find more details and examples of
    these config options in the docs:
    https://jestjs.io/docs/en/configuration.html

    Details:

    import { sum } from ".";
    ^^^^^^

    SyntaxError: Cannot use import statement outside a module

      at Runtime._execModule

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        1.13 s
Ran all test suites.
```

当然素の JS では import が使えないので、予想通り失敗しました。

### preset: ts-jest に設定してみる

次に preset に ts-jest を指定してみましょう。

```sh
npm i -D ts-jest
```

```js:title=jest.config.js
module.exports = {
  clearMocks: true,
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "babel",
  // A preset that is used as a base for Jest's configuration
  preset: "ts-jest",
  // The test environment that will be used for testing
  testEnvironment: "node",
  // A map from regular expressions to paths to transformers
  // transform: undefined,
}
```

```sh
$ npm run test

 PASS  src/index.test.ts
  index.js
    ✓ should be 3 when inputs are 1, 2 (2 ms)

  console.log
    3

      at Object.<anonymous> (src/index.ts:5:9)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        3.041 s
Ran all test suites.
```

成功しました。

## transform と何が違うのか？

ちなみに先ほどのコードは、preset を使わずに transform に `ts-jest` を指定してもうまく行きます。

```js:title=jest.config.js
module.exports = {
  clearMocks: true,
  coverageProvider: "babel",
  preset: undefined,
  testEnvironment: "node",
  transform: {
    ".ts": "ts-jest",
  },
}
```

それでは僕たちはどういう設定をすべきなのでしょうか。
どっちでもいいのでしょうか？

## preset と transform のどちらを使うべきなのか

### ts-jest とは

そもそも preset にも transform にも設定した [ts-jest](https://github.com/kulshekhar/ts-jest) とは何なのでしょうか。
これは、

> ts-jest is a TypeScript preprocessor with source map support for Jest that lets you use Jest to test projects written in TypeScript.

とあり、TS で書かれたコードをテストするための preprocessor です。

ちなみにこのページに ts-jest それ自体の使い方がまとまっていますので、気になる方は参照してください。

FYI: https://kulshekhar.github.io/ts-jest/user/config/

### preset

jest の[preset](https://jestjs.io/docs/ja/configuration#preset-string) は

> A preset that is used as a base for Jest's configuration. A preset should point to an npm module that has a jest-preset.json or jest-preset.js file at the root.

とあり、jest のいろんな設定の詰め合わせです。

つまり `{preset: ts-jest}` としていたのは、いろんな設定を読み込んでいたのです。

### transorm

一方で[transorm](https://jestjs.io/docs/en/configuration#transform-objectstring-pathtotransformer--pathtotransformer-object) は、

> A map from regular expressions to paths to transformers. A transformer is a module that provides a synchronous function for transforming source files.

とあり、指定されたファイルパターンのファイルに変換をかけてくれる機能です。

つまり、**transform が TypeScript でテストを実行できる立役者**です。

## preset: "ts-jest" はどういう設定を提供しているのか

ts-jest の中に [create-jest-preset](https://github.com/kulshekhar/ts-jest/blob/b0464e9cd57c52bbc65835b6ec784629cf5e7f73/src/presets/create-jest-preset.ts) というのがあり、これは

```ts
export function createJestPreset(
  { allowJs = false }: CreateJestPresetOptions = {},
  from: Config.InitialOptions = {}
): TsJestPresets {
  logger.debug(
    { allowJs },
    "creating jest presets",
    allowJs ? "handling" : "not handling",
    "JavaScript files"
  )

  return {
    transform: {
      ...from.transform,
      [allowJs ? "^.+\\.[tj]sx?$" : "^.+\\.tsx?$"]: "ts-jest",
    },
    ...(from.testMatch ? { testMatch: from.testMatch } : undefined),
    ...(from.moduleFileExtensions
      ? { moduleFileExtensions: from.moduleFileExtensions }
      : undefined),
  }
}
```

としています。
つまり、jest の**transform, testMatch, moduleFileExtensions** を設定しているわけです。
transform は先ほど説明したからはしょるとして、残りの 2 つは何をしているのでしょうか

### testMatch

[testMatch](https://jestjs.io/docs/ja/configuration#testmatch-arraystring) はテストファイルを検出するのに Jest が使用する glob パターンを指定します。
標準では、`__tests__/**/` や `*.test.` がサポートされていますが、ts-jest を使うとこれを TypeScript 用にセットしてくれます。

ただデフォルトで `[ "**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)" ]`がサポートされているので、ts-jest 側から恣意的に上書きたい場合にしか嬉しくない気がします。
（=ts-jest を直接使うユーザーからは恩恵がなさそうな気も）

### moduleFileExtensions

[moduleFileExtensions](https://jestjs.io/docs/ja/configuration#modulefileextensions-arraystring) は拡張子のファイル自動解決をしてくれるオプションです。
import 時に自動で resolve してくれます。（同一ファイル名なら先頭が優先される）

ただこれもデフォルトで `Default: ["js", "json", "jsx", "ts", "tsx", "node"]` がサポートされているので、ts-jest 側から恣意的に上書きたい場合にしか嬉しくない気がします。
（=ts-jest を直接使うユーザーからは恩恵がなさそうな気も）

## 結局 preset: ts-jest は何をしているのか

Jest には transform という機能があり、特定のファイルに変換処理をかけられる。
preset がこの transform を実行してファイルを変換しているので、ts-jest を指定すると TypeScript 対応ができる。
ts-jest 自体はただの変換ツールなので、直接 transform に指定して実行することもできる。

## サンプルコード

https://github.com/ojisan-toybox/ts-jest-practice
