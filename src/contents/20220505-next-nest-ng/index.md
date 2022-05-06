---
path: /next-nest-ng
created: "2022-05-05"
title: NextJS でコンテンツモデルを無視してHTMLを書くと Dev サーバーでエラー扱いになる理由を調べた
visual: "./visual.png"
tags: ["react", "nextjs"]
userId: sadnessOjisan
isFavorite: false
isProtect: true
---

next-nest-ng っていうとても紛らわしい URL になってしまいましたが、今日話したいことはずばりそれです。

結論: 理由が完全には分からなかったが、ちゃんと HTML は書きましょう。

ある日、

```
Unhandled Runtime Error
Error: Hydration failed because the initial UI does not match what was rendered on the server.
```

なんていうエラーが出て「ほへ？」ってなったので、今日はこれが起きる原因を探る。

![エラー画面](./error.png)

## 実験

どういう HTML が NextJS 的に NG になるのか実験する。

これは OK

```jsx
export default () => {
  return <div>div tag</div>;
};
```

これも OK

```jsx
export default () => {
  return (
    <div>
      <p>p tag</p>
    </div>
  );
};
```

これはダメ

```jsx
export default () => {
  return (
    <div>
      <p>
        p tag
        <div>div</div>
      </p>
    </div>
  );
};
```

これは OK

```jsx
export default () => {
  return (
    <span>
      <div>
        <a>hoge</a>
      </div>
    </span>
  );
};
```

これもダメ

```jsx
export default () => {
  return (
    <span>
      <a>
        <div>
          <a>hoge</a>
        </div>
      </a>
    </span>
  );
};
```

## エラーを詳しく見る

スクショには Next に止められたときのエラーしか出ていないがブラウザの Console を見るとたくさんエラーが出ている。警告を含め、上から眺める。

### コンソールにあるエラーの一覧

```
next-dev.js?3515:25 Warning: Expected server HTML to contain a matching <div> in <a>.
    at div
    at a
    at span
    at __WEBPACK_DEFAULT_EXPORT__
    at App (webpack-internal:///./node_modules/next/dist/pages/_app.js:177:9)
    at ErrorBoundary (webpack-internal:///./node_modules/next/dist/compiled/@next/react-dev-overlay/client.js:8:20746)
    at ReactDevOverlay (webpack-internal:///./node_modules/next/dist/compiled/@next/react-dev-overlay/client.js:8:23395)
    at Container (webpack-internal:///./node_modules/next/dist/client/index.js:323:9)
    at AppContainer (webpack-internal:///./node_modules/next/dist/client/index.js:825:26)
    at Root (webpack-internal:///./node_modules/next/dist/client/index.js:949:27)
```

```
react-dom.development.js?ac89:14388 Uncaught Error: Hydration failed because the initial UI does not match what was rendered on the server.
    at throwOnHydrationMismatch (react-dom.development.js?ac89:14388:1)
    at tryToClaimNextHydratableInstance (react-dom.development.js?ac89:14401:1)
    at updateHostComponent$1 (react-dom.development.js?ac89:20711:1)
    at beginWork (react-dom.development.js?ac89:22447:1)
    at HTMLUnknownElement.callCallback (react-dom.development.js?ac89:4161:1)
    at Object.invokeGuardedCallbackDev (react-dom.development.js?ac89:4210:1)
    at invokeGuardedCallback (react-dom.development.js?ac89:4274:1)
    at beginWork$1 (react-dom.development.js?ac89:27405:1)
    at performUnitOfWork (react-dom.development.js?ac89:26513:1)
    at workLoopSync (react-dom.development.js?ac89:26422:1)
    at renderRootSync (react-dom.development.js?ac89:26390:1)
    at performConcurrentWorkOnRoot (react-dom.development.js?ac89:25694:1)
    at workLoop (scheduler.development.js?bcd2:266:1)
    at flushWork (scheduler.development.js?bcd2:239:1)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js?bcd2:533:1)
```

```
next-dev.js?3515:25 Warning: An error occurred during hydration. The server HTML was replaced with client content in <div>.
```

```
next-dev.js?3515:25 Warning: validateDOMNesting(...): <a> cannot appear as a descendant of <a>.
    at a
    at div
    at a
    at span
    at __WEBPACK_DEFAULT_EXPORT__
    at App (webpack-internal:///./node_modules/next/dist/pages/_app.js:177:9)
    at ErrorBoundary (webpack-internal:///./node_modules/next/dist/compiled/@next/react-dev-overlay/client.js:8:20746)
    at ReactDevOverlay (webpack-internal:///./node_modules/next/dist/compiled/@next/react-dev-overlay/client.js:8:23395)
    at Container (webpack-internal:///./node_modules/next/dist/client/index.js:323:9)
    at AppContainer (webpack-internal:///./node_modules/next/dist/client/index.js:825:26)
    at Root (webpack-internal:///./node_modules/next/dist/client/index.js:949:27)
```

```
react-dom.development.js?ac89:14388 Uncaught Error: Hydration failed because the initial UI does not match what was rendered on the server.
    at throwOnHydrationMismatch (react-dom.development.js?ac89:14388:1)
    at tryToClaimNextHydratableInstance (react-dom.development.js?ac89:14401:1)
    at updateHostComponent$1 (react-dom.development.js?ac89:20711:1)
    at beginWork (react-dom.development.js?ac89:22447:1)
    at beginWork$1 (react-dom.development.js?ac89:27381:1)
    at performUnitOfWork (react-dom.development.js?ac89:26513:1)
    at workLoopSync (react-dom.development.js?ac89:26422:1)
    at renderRootSync (react-dom.development.js?ac89:26390:1)
    at performConcurrentWorkOnRoot (react-dom.development.js?ac89:25694:1)
    at workLoop (scheduler.development.js?bcd2:266:1)
    at flushWork (scheduler.development.js?bcd2:239:1)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js?bcd2:533:1)
```

```
react-dom.development.js?ac89:20658 Uncaught Error: There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.
    at updateHostRoot (react-dom.development.js?ac89:20658:1)
    at beginWork (react-dom.development.js?ac89:22444:1)
    at beginWork$1 (react-dom.development.js?ac89:27381:1)
    at performUnitOfWork (react-dom.development.js?ac89:26513:1)
    at workLoopSync (react-dom.development.js?ac89:26422:1)
    at renderRootSync (react-dom.development.js?ac89:26390:1)
    at recoverFromConcurrentError (react-dom.development.js?ac89:25806:1)
    at performConcurrentWorkOnRoot (react-dom.development.js?ac89:25706:1)
    at workLoop (scheduler.development.js?bcd2:266:1)
    at flushWork (scheduler.development.js?bcd2:239:1)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js?bcd2:533:1)
```

どうやら正しくない HTML を書いたことによる`validateDOMNesting` のチェックに理由がありそうだ。

### validateDOMNesting について

まずは validateDOMNesting についてみていこう。これは ReactDOM のメソッドで、DOM の入れ子関係が適切かどうかをチェックしてくれる。
例えば span タグの中に p タグを入れたりすると警告が発せられる。

FYI: <https://github.com/facebook/react/blob/cae635054e17a6f107a39d328649137b83f25972/packages/react-dom/src/client/validateDOMNesting.js>

つまり、HTML が想定しているコンテンツモデルを守れと言うことである。

FYI: <https://html.spec.whatwg.org/multipage/parsing.html#has-an-element-in-scope>

どの要素にどの要素を入れられることができるかと言うのは [MDN](https://developer.mozilla.org/ja/docs/Web/Guide/HTML/Content_categories) で調べられるので、このエラーが出たときはどのタグには何が許可されるかを調べて解決を図る。

### Next でトースターが出るのはどう言うことか

さて、さきほどのは警告であったが、どうして NextJS でエラーのトーストが出ていたのだろうか。
コンソールには警告だけでなくエラーも現れていたのでちゃんと確認しておこう。

```
Uncaught Error: Hydration failed because the initial UI does not match what was rendered on the server.
```

```
Uncaught Error: There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.
```

どうやらサーバーが返す HTML とクライアントが作る HTML が一致しないことで hydration に失敗しているようだ。
これは Next でも想定されているエラーでもある。

FYI: <https://nextjs.org/docs/messages/react-hydration-error>

その同様のエラーは forum を覗くと多数報告されている。

FYI: <https://github.com/vercel/next.js/discussions/35773>

結局はちゃんとタグを書こうという話ではあるのだが、どうしてこのルールを破ると Next はエラーとして警告を出すのだろうか。

### NextJS ではいつトースターが出るのか

トースターが出る条件については実験をするとわかる。

```jsx
export default () => {
  useEffect(() => {
    throw new Error("aaa");
  }, []);
};
```

のようにエラーを投げてそれが捕捉されなければ Next は先ほどの警告を出す。

では validateDOMNesting は警告を出すのであろうか？
先ほど読んだが console.error するだけであった。
ではこの例外はどこから来るのだろうか？

### React 側を読んでみる

ここから先は最後まで読み切れていないかつ、React のコードベースを全て読んだことはないので不正確な情報があると思う。詳しい人は助けて欲しい。

まずエラーメッセージでコードベースを調べてみる。
そうすると <https://github.com/facebook/react/blob/ce13860281f833de8a3296b7a3dad9caced102e9/packages/react-reconciler/src/ReactFiberBeginWork.new.js#L1331> に該当のメッセージがある。

そしてそれは

```jsx
const recoverableError = new Error(
  "There was an error while hydrating. Because the error happened outside " +
    "of a Suspense boundary, the entire root will switch to " +
    "client rendering."
);
```

といかにもそれっぽいコードである。

これがクライアントに伝わっていると言うことは recover されていないということであろう。

また、"Hydration failed because the initial UI ~" という物に関しては、

```jsx
function throwOnHydrationMismatch(fiber: Fiber) {
  throw new Error(
    "Hydration failed because the initial UI does not match what was " +
      "rendered on the server."
  );
}
```

が該当する。

FYI: <https://github.com/facebook/react/blob/b4eb0ad71fb365cb760a5b9ab1a1e2dd6193fac7/packages/react-reconciler/src/ReactFiberHydrationContext.new.js#L410>

前後を読んでみると

```jsx
if (shouldClientRenderOnMismatch(fiber)) {
  warnNonhydratedInstance((hydrationParentFiber: any), fiber);
  throwOnHydrationMismatch(fiber);
}
```

となっており、その判定は

```jsx
function shouldClientRenderOnMismatch(fiber: Fiber) {
  return (
    (fiber.mode & ConcurrentMode) !== NoMode &&
    (fiber.flags & DidCapture) === NoFlags
  );
}
```

となっている。

「なんだこの条件比較は？」と思うかもしれないが React は内部ではフラグをビット列で持っており、ビット演算で計算することが可能になっている。

```js
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type TypeOfMode = number;

export const NoMode = /*                         */ 0b000000;
// TODO: Remove ConcurrentMode by reading from the root tag instead
export const ConcurrentMode = /*                 */ 0b000001;
export const ProfileMode = /*                    */ 0b000010;
export const DebugTracingMode = /*               */ 0b000100;
export const StrictLegacyMode = /*               */ 0b001000;
export const StrictEffectsMode = /*              */ 0b010000;
export const ConcurrentUpdatesByDefaultMode = /* */ 0b100000;
```

つまり fiber.mode が ConcurrentMode で、fiber.flags が DidCapture と一致しなければ（なぜなら NoFlags になるということはすべてのフラグが折れる = 異なるフラグで&演算したということ）例外を投げると言うことである。ここで面白いことが起きるのだが、つまり ConcurrentMode じゃなければこの条件節に入らないと言うことなので、 React のバージョンを v17.0.2 まで落とすとこのエラーは発生しない。最近このエラーが React や Next の Issue やフォーラムに立っているのはみんな v18 に上げてしまったからであろう。えらい！

FYI: <https://github.com/facebook/react/blob/b4eb0ad71fb365cb760a5b9ab1a1e2dd6193fac7/packages/react-reconciler/src/ReactTypeOfMode.js>

じゃあ React18 でのエラーは fiber.flags の値に依存するわけなので、どこでこの値が決まるかをみていく。全部は追えなかったが、 shouldClientRenderOnMismatch から精一杯頑張って読んでいった感じ、<https://github.com/facebook/react/blob/b4eb0ad71fb365cb760a5b9ab1a1e2dd6193fac7/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L881>にたどり着き読み進め（戻り）ると、hydration の失敗を検知したときに呼び出す recoverFromConcurrentError で fiber.flag を書き換えてその render のエラーを報告するような仕組みに見えた。実際これらの関数はエラー時のスタックトレースを追うと呼ばれていたので、この関数に辿り着いたのは正しく読めていると思う。

ただ、どうして HTML を正しく書かないと hydrate で失敗するのかがよく分からなかった。詳しい人は教えて欲しい。

↑ 不正な HTML はブラウザが直してくれるから、サーバーが生成する HTML と mismatch が起きるとのことだった。thanks [@uhyo\_](https://twitter.com/uhyo_/status/1522386973918638080?s=20&t=1ceWyLzrRvMrzi4CcsX7kQ)

また https://github.com/facebook/react/pull/24250 や関連している Issue や Discussion を眺めていると不正な HTML があることによって例外が投げられること自体がバグ扱いになっている気もする（本当に？）

## 結論

ちゃんと HTML を書きましょう。

実験に使ったコード: <https://github.com/ojisan-toybox/next-dom-nest>
