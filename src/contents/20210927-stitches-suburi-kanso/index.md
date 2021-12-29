---
path: /stitches-suburi-kanso
created: "2021-09-27"
title: stitches 素振り 感想
visual: "./visual.png"
tags: ["stitches", "素振り"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

結論: 惜しいけど推し！

良いライブラリだし好意的な意見が多く目立つので、感想と言いつつあえてイチャモン多めに書いてみようと思います。

## stitches とは

[stitches](https://stitches.dev/) は near zero runtime の CSS in JS です。
ツイッターなどで言及され始めていた当時は linaria や vanila-extract と同列に紹介されていた記憶があるのですが、それらのようにビルド時に静的な CSS を吐いてくれる zero runtime CSS in JS ツールではないです。
それでもランタイムでのオーバーヘッドが少ないとのことで気になっていました。

## パフォーマンスについての調査

### ランタイムのオーバーヘッド

near zero runtime なので、linaria や vanila-extract のようにビルド時に静的な CSS を吐いてくれるツールではないです。
実験していないので確証はないですが、JS を切ると動かなくなりそうです。
近頃は JS を切った状態でも見れるようにするべきといった論もちらほら聞こえるので怖いですね。

どういう仕組みで実現しているのかは知りませんし、コードも追っていません。
開発元がそのうちブログ的なのを書いてくれるらしいのでそれを待ってます。

FYI: <https://github.com/modulz/stitches-site/issues/42>

### バンドルサイズ

公式によると 6kb ほどあるらしいです。
emotion が 7.2kb なのでそれよりちょっと軽いくらいなのであまり強みとは言えなさそうです。
一方で goobeer は 1.2kb なので、単純にここだけの比較だと goober を推したいです。
(オーバーヘッドはあるので使い方の工夫は必要ですが・・・)

## 使い勝手の感想

### css props がサポートされている

自分は css props を使ってスタイリングするのが好きです。

```tsx
const styles = {
  wrapper: css({ display: "flex" }),
};

export const Flex = () => <div classNames={styles.wrapper()}>hoge</div>;
```

のような定義が好きです。

多くの CSS in JS ライブラリの例では

```tsx
export default () => {
  return <Flex>aaa</Flex>;
};
const Flex = styled.div`
  display: flex;
`;
```

のような定義をしていますが、この記法が styling の度にファイルが膨らんでいくのであまり好きではないです。さらに css in props の object を一箇所にまとめることで、 HTML と CSS の分離も可能になるので好きです。この記法ができるので推しです。

### とはいえ classname の出力がちょっと気持ち悪い

styled-components, emotion, goober, linaria などの他のツールは

```tsx
export const Flex = () => <div classNames={styles.wrapper}>hoge</div>;
```

とできますが、stitches は

```tsx
export const Flex = () => <div classNames={styles.wrapper()}>hoge</div>;
```

と関数呼び出しする必要があります。
これは少しウッっていう感想を持ちました。

### css props がサポートされているが、css を書けない

オブジェクト形式でしか定義できません。
tagged template literal があって欲しかった。
つまり既存の CSS をそのままコピペしたり、逆に CSS への移植が困難です。
オブジェクト形式にしているのは意図的であるとのことです。

FYI: <https://stitches.dev/blog/migrating-from-emotion-to-stitches>

### config と エントリポイントで返す関数が異なるのがモニョる

上の例に挙げた css や styled 関数は @sticles/react から export されているだけでなく、createStitches の戻り値にもあります。つまり、

```tsx
import { styled, css } from "@stitches/react";
```

だけでなく、

```tsx
import { createStitches } from "@stitches/react";

export const {
  styled,
  css,
  globalCss,
  keyframes,
  getCssText,
  theme,
  createTheme,
  config,
} = createStitches({
  theme: {
    colors: {
      gray400: "gainsboro",
      gray500: "lightgray",
    },
  },
  media: {
    bp1: "(min-width: 480px)",
  },
  utils: {
    marginX: (value) => ({ marginLeft: value, marginRight: value }),
  },
});
```

といった定義が可能で、ここにある styled や css を呼び出せます。

にこの stitches オブジェクトがデザイントークンを定義できる機能で、stitches をメタデザイン言語として使えるようになる要となる機能です。便利ですね。

そして、createStitches からしか返せない値があります。
例えば `getCssText` です。
これは SSR するときは 初期のテンプレート html に埋め込むことが必要となる値で、NextJS などと併用する場合は必須のものです。
そのため NextJS を使う場合は、デザイントークンの定義が不要でただスタイリングしたいだけの場合でも、SSR するためには stitches オブジェクトを作る必要がでてきてなんかウッという気持ちになりました。

## お前さっきから文句ばっか言ってるけどじゃあ何を選定するんだよ

- デザイントークンの定義からしたい → stitches
- コンポーネントライブラリを作る → stitches
- アプリを作る → goober or linaria(with 覚悟)
- 他のコンポーネントライブラリが何か CSS in JS の依存を持ってる（ex. chakra + emotion） → それで
- バンドルサイズもパフォーマンスにこだわったところで誤差な環境 → なんでもよさそう

異論反論マサカリは認めます。
