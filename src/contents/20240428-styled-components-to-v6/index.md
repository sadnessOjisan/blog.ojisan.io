---
path: /styled-components-to-v6
created: "2024-04-28"
title: styled-components を v6 に上げた時の話
visual: "./visual.png"
tags: ["styled-components"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

少し前に Next.js の v12 から v14 への update を依頼されたことがあり、必然的に React のアップデートもするのだが、そのときに先に styled-components を update しなければいけないという状況に陥った。
普段は CSS modules や tailwind を使っているのでもう s-c の記憶は朧げであり、updateにかなり苦労したのでその時のメモである。

## どうして v6 へのアップデートが必要になったのか

原因をきちんと追ったわけではないのだが、React のバージョンを上げて型検査すると s-c 側で

```
hoge.tsx: error TS2786: 'Hoge' cannot be used as a JSX component.
  Its return type 'ReactElement<WithOptionalTheme<{ dir?: string | undefined; children?: ReactNode; onError?: ReactEventHandler<HTMLDivElement> | undefined; id?: string | undefined; ... 262 more ...; onTransitionEndCapture?: TransitionEventHandler<...> | undefined; } & Partial<...>, any>, string | JSXElementConstructor<...>>' is not a valid JSX element.
```

のようなエラーが出た。
おそらくだが、Hoge は `styled()` でラップされたコンポーネントであったことと、型 `FC` が `children` を持たなくなったこととが原因な気はする。
そこで styled-components のアップデートを決意した。

## v5 -> v6 への変更点

公式の FAQ に "What do I need to do to migrate to v6?" というセクションがあるのでそれを参考にすれば良い。

see: https://styled-components.com/docs/faqs#what-do-i-need-to-do-to-migrate-to-v6

意識すべきことは、

- TypeScript
- `shouldForwardProp` is no longer provided by default
- Vendor prefixes are omitted by default
- Update stylis plugins
- Nested syntax handling
- Transient `$as` and `$forwardedAs` props have been dropped
- Dropped legacy `withComponent()` API
- Minimum Node support raised to v16+

だ。

## アップデートのために実際にしたこと

### 型定義ファイルの削除

v6 から TypeScript サポートが入り、d.ts がライブラリに含まれる。
そのため @types/styled-components がいらなくなる。

### snapshot test を更新する

Vendor prefixes が付かなくなったり、付いたとしても限られたものとなる。
そのためコンポーネントに対してスナップショットテストを書いていると影響がある。
そこでスナップショットを更新した。
出てきた変更点は次のとおりだ。

- ms 系のベンダープレフィックスが消える
- ベンダープレフィックスされたCSSの出現位置が少し変わる
- media クエリなどにホワイトスペースが入る
- CSSセレクタの記号のホワイトスペースに変化がある

### JSXの標準props埋め込み回避のために、transient props を使わない

v6 にすると JSX の標準 props が生成後のHTMLに埋め込まれる。
どういうことかというと、

```html
<div
  bg="#0099DD"
  bottom="0"
  class="c0"
  flexdirection="column,row"
  justifycontent="space-between"
  position="fixed"
  width="100vw"
></div>
```

といったHTMLが生成されてしまっている。
HTMLのattributeには存在していないはずのものだ。
そしてこれらは次の styled-components から生成されている。

```jsx
<Flex
  width="100vw"
  position="fixed"
  bottom="0"
  flexDirection={["column", "row"]}
  justifyContent="space-between"
>
  ...
</Flex>
```

そのため styled-components に渡した attr が、JSX に props として渡ってきてしまい、HTMLに展開された時に残ってしまうのである。
これを解消するためには [transient-props](https://styled-components.com/docs/api#transient-props) が有効そうに見えるのだが、そのためには属性名の前に `$` をつけないといけない。
それを全てのコンポーネントでするのは流石にめんどくさい。
この問題は `StyleSheetManager` で解消できることが migration guide にある。

see: https://styled-components.com/docs/faqs#shouldforwardprop-is-no-longer-provided-by-default

```jsx
import isPropValid from "@emotion/is-prop-valid";
import { StyleSheetManager } from "styled-components";

function MyApp() {
  return (
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      {/* other providers or your application's JSX */}
    </StyleSheetManager>
  );
}

// This implements the default behavior from styled-components v5
function shouldForwardProp(propName, target) {
  if (typeof target === "string") {
    // For HTML elements, forward the prop if it is a valid HTML attribute
    return isPropValid(propName);
  }
  // For other elements, forward all props
  return true;
}
```

`shouldForwardProp` を埋め込んだ `StyleSheetManager` でアプリ全体を囲えばOKというわけだ。

ただやはり正攻法としてはtransient-propsを使っていきたいですな。

### props で呼び出す型引数の明示

これまでは

```jsx
const Base = styled.button`
  width: ${(props: BaseProps) => props.width || 32}px;
  height: ${(props: BaseProps) => props.height || 32}px;
`;
```

のような定義でも動いていたが、

```jsx
const Base = styled.button<BaseProps>`
  width: ${(props: BaseProps) => props.width || 32}px;
  height: ${(props: BaseProps) => props.height || 32}px;
`
```

とする必要が生まれた。

## まとめ

なんか色々と懐かしかった。
