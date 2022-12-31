---
path: /jscodeshift-test-rule
created: "2022-12-31"
title: jscodeshift に付随するテストツールである defineTest の規則を調べてみた
visual: "./visual.png"
tags: ["jscodeshift"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

[jscodeshift](https://github.com/facebook/jscodeshift) という codemod を作るための素晴らしいライブラリがあるのですが、この transformer のテストの書き方がいまいち分からなかったので、同梱されているテストの util を読んでみました。

## 公式ドキュメントに使い方は書いてあるが痒いところに届くのか分からない

まず、[unit-testing](https://github.com/facebook/jscodeshift#unit-testing) という章にやり方は書いてあります。

```md
## Unit Testing

jscodeshift comes with a simple utility to allow easy unit testing with Jest, without having to write a lot of boilerplate code. This utility makes some assumptions in order to reduce the amount of configuration required:

- The test is located in a subdirectory under the directory the transform itself is located in (eg. \_\_tests\_\_)
- Test fixtures are located in a \_\_testfixtures\_\_ directory

This results in a directory structure like this:

/MyTransform.js
/\_\_tests\_\_/MyTransform-test.js
/\_\_testfixtures\_\_/MyTransform.input.js
/\_\_testfixtures\_\_/MyTransform.output.js
A simple example of unit tests is bundled in the sample directory.

The testUtils module exposes a number of useful helpers for unit testing.

#### `defineTest`

Defines a Jest/Jasmine test for a jscodeshift transform which depends on fixtures

jest.autoMockOff();
const defineTest = require("jscodeshift/dist/testUtils").defineTest;
defineTest(\_\_dirname, "MyTransform");

An alternate fixture filename can be provided as the fourth argument to `defineTest`.
This also means that multiple test fixtures can be provided:

defineTest(\_\_dirname, "MyTransform", null, "FirstFixture");
defineTest(\_\_dirname, "MyTransform", null, "SecondFixture");

This will run two tests:

- `__testfixtures__/FirstFixture.input.js`
- `__testfixtures__/SecondFixture.input.js`
```

ここから読み取れることとしては、`__testfixtures__` にある `*.input.js` を入力に、`*.output.js` を出力としたテストは は、defineTest で transformer とテストファイル名を引数に指定することでテストができるということです。

しかしこの時僕はこのような疑問が思い浮かびました。

- .ts は行けるのだろか？
- フォルダ構成は強制なのか推奨なのか、オプションに変更の余地はあるのか。
- テストファイル内に describe, it はいらないのか？

なので読んでみます。

## defineTest はユーザーが使う test util

```ts
/**
 * Handles some boilerplate around defining a simple jest/Jasmine test for a
 * jscodeshift transform.
 */
function defineTest(
  dirName,
  transformName,
  options,
  testFilePrefix,
  testOptions
) {
  const testName = testFilePrefix
    ? `transforms correctly using "${testFilePrefix}" data`
    : "transforms correctly";
  describe(transformName, () => {
    it(testName, () => {
      runTest(dirName, transformName, options, testFilePrefix, testOptions);
    });
  });
}
```

まず describe や it は global にあるものを使います。これは古い jest では生えていますが、新しい jest や vitest だと module import していると思います。global でも使えるようにしておきましょう。

```ts
// vitest.config.ts

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
  },
});
```

渡された引数は全部 runTest に渡るので、runTest をみてみます。

## runTest で決められたフォルダ構成を前提にテストランナーを動かす

```ts
/**
 * Utility function to run a jscodeshift script within a unit test. This makes
 * several assumptions about the environment:
 *
 * - `dirName` contains the name of the directory the test is located in. This
 *   should normally be passed via __dirname.
 * - The test should be located in a subdirectory next to the transform itself.
 *   Commonly tests are located in a directory called __tests__.
 * - `transformName` contains the filename of the transform being tested,
 *   excluding the .js extension.
 * - `testFilePrefix` optionally contains the name of the file with the test
 *   data. If not specified, it defaults to the same value as `transformName`.
 *   This will be suffixed with ".input.js" for the input file and ".output.js"
 *   for the expected output. For example, if set to "foo", we will read the
 *   "foo.input.js" file, pass this to the transform, and expect its output to
 *   be equal to the contents of "foo.output.js".
 * - Test data should be located in a directory called __testfixtures__
 *   alongside the transform and __tests__ directory.
 */
function runTest(
  dirName,
  transformName,
  options,
  testFilePrefix,
  testOptions = {}
) {
  if (!testFilePrefix) {
    testFilePrefix = transformName;
  }

  const extension = extensionForParser(testOptions.parser);
  const fixtureDir = path.join(dirName, "..", "__testfixtures__");
  const inputPath = path.join(
    fixtureDir,
    testFilePrefix + `.input.${extension}`
  );
  const source = fs.readFileSync(inputPath, "utf8");
  const expectedOutput = fs.readFileSync(
    path.join(fixtureDir, testFilePrefix + `.output.${extension}`),
    "utf8"
  );
  // Assumes transform is one level up from __tests__ directory
  const module = require(path.join(dirName, "..", transformName));
  runInlineTest(
    module,
    options,
    {
      path: inputPath,
      source,
    },
    expectedOutput,
    testOptions
  );
}
```

### ts の指定が使える

まず、

```ts
const extension = extensionForParser(testOptions.parser);
```

とあることから、testOptions.parser を指定すれば`.js` 以外の拡張子も使えそうです。

追ってみると

```ts
function extensionForParser(parser) {
  switch (parser) {
    case "ts":
    case "tsx":
      return parser;
    default:
      return "js";
  }
}
```

とあるので、ts, tsx も OK です。

### `__testfixtures__` を使うことは決まり

`const fixtureDir = path.join(dirName, "..", "__testfixtures__");` とあるので、`*.input.ts` などを入れるファイルは `__testfixtures__` という名前で固定されます。

また、

```ts
const inputPath = path.join(fixtureDir, testFilePrefix + `.input.${extension}`);
```

```ts
const expectedOutput = fs.readFileSync(
  path.join(fixtureDir, testFilePrefix + `.output.${extension}`),
  "utf8"
);
```

とあることから、第四引数 testFilePrefix は `__testfixtures__` に入れたファイル名を一致させる必要があります。言い方を変えると、`defineTest` は第四引数にある名前を `__testfixtures__` から探してテストしてくれます。

### transformer は `__tests__` に入れるのが無難

transformer を探索しているコードを読みます。

```ts
// Assumes transform is one level up from __tests__ directory
const module = require(path.join(dirName, "..", transformName));
```

このように指定した dirName の親 dir の兄弟から兄弟を探しています。
なのでテストファイルを `hoge.test.ts` や `hoge.spec.ts` としていると実行されないこととなってしまいます。
もちろん親を辿るだけなので `__specs__/` に入れてもいいですが、コード内に

> Assumes transform is one level up from **tests** directory

とあるので `__tests__` に入れるのが良いでしょう。

テストランナーによってはここを見てくれない可能性があるので、設定に入れておきましょう。

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/__tests__/**/*.ts", "**/*.test.ts"],
  },
});
```

## runInlineTest で input, output の比較をしている

runInlineTest の実行結果を matcher に適用してくれています。

```ts
function runInlineTest(module, options, input, expectedOutput, testOptions) {
  const output = applyTransform(module, options, input, testOptions);
  expect(output).toEqual(expectedOutput.trim());
  return output;
}
```

## applyTransform は input に対して codemod を実行して返してくれる

transformer である module を input に適用してその結果を返すだけの関数です。

```ts
function applyTransform(module, options, input, testOptions = {}) {
  // Handle ES6 modules using default export for the transform
  const transform = module.default ? module.default : module;

  // Jest resets the module registry after each test, so we need to always get
  // a fresh copy of jscodeshift on every test run.
  let jscodeshift = require("./core");
  if (testOptions.parser || module.parser) {
    jscodeshift = jscodeshift.withParser(testOptions.parser || module.parser);
  }

  const output = transform(
    input,
    {
      jscodeshift,
      j: jscodeshift,
      stats: () => {},
    },
    options || {}
  );

  return (output || "").trim();
}
```

## test runner は vitest でも OK

しれっとここまで vitest を使いましたが、vitest でも jscodeshift は動いてくれます。
ドキュメントには

> Defines a Jest/Jasmine test for a jscodeshift transform which depends on fixtures

とありますが大丈夫です。

## まとめ

- テストファイルは .js 以外にも .jsx, .tsx でもいける。defineTest の第５引数のオプション指定で `{ parser: "ts" }` を入れると良い。
- テスト対象の transformer を親から辿れるようにテストファイル(defineTest を書いているファイル)は `__tests__` に入れる。これは transformer の兄弟である必要がある。
- その上でテスト対象の transformer 名 は defineTest の第二引数に書く
- describe, it などの runner 用の語彙は defineTest が内部で生成するからユーザーは書かなくていいが、それらを import できるように global に describe や it を呼べる必要がある。お使いのテストランナーの設定を忘れないように。
- テストに使う input, output fixture は `__testfixtures__` に入れないといけない
- jest 以外にも、describe, it があれば vitest なども使える。

総論としてはフォルダ構成はがっちり決まっていますね、チクショ〜〜〜〜ってことです。
