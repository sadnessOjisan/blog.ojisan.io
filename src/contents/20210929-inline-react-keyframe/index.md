---
path: /inline-react-keyframe
created: "2021-09-29"
title: react の inline style で keyframe animation を使う
visual: "./visual.png"
tags: ["react"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

最近見つけた小技を紹介。

## やりたいこと

```tsx
const Marquee: FC<Props> = (props) => (
  <div>
    <div
      style={{ animation: `toLeft 1s infinite`, transform: "translateX(100%)" }}
    >
      {props.children}
    </div>
  </div>
);
```

に、

```css
@keyframes toLeft {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}
```

というアニメーションを与えたい。

## そもそも CSS の keyframe を使うためには？

<https://www.w3schools.com/css/css3_animations.asp> にあるように、定義した keyframe を、animation の name に与えることで有効にできます。

そのため、keyframe を React の inline style で使うためには、animation プロパティに渡すための keyframe name をどこかであらかじめ定義する必要があります。

## どのようにして inline style の animation と keyframe を紐づけるか

keyframe を紐づけるためには先に keyframe を定義する必要があります。
そこで、`<style />` も element であることを利用して、JSX 内に定義してしまいましょう。

```tsx
const Marquee: FC<Props> = (props) => (
  <>
    <style>
      {`@keyframes toLeft {
        0% {
          transform: translateX(100%);
        }
        100% {
          transform: translateX(-100%);
        }
      }`}
    </style>
    <div>
      <div
        style={{
          animation: `toLeft 1s infinite`,
          transform: "translateX(100%)",
        }}
      >
        {props.children}
      </div>
    </div>
  </>
);
```

こうするだけで

```jsx
<div
  style={{
    animation: `toLeft 1s infinite`,
  }}
>
  {props.children}
</div>
```

と toLeft という名前を通してアニメーションを紐づけられます。

鍵は keyframe の定義 React の世界からを HTML+CSS として持ち込むことです。そのためには style タグを element として JSX として定義してしまえば良いわけです。

## 余談

"react inline style keyframe" などで検索すると、<https://gist.github.com/yamadayuki/f1ea9ccacad7f1c140457b5877fb54cc> のようなページがひっかかると思います。

```js
const injectStyle = (style) => {
  const styleElement = document.createElement("style");
  let styleSheet = null;

  document.head.appendChild(styleElement);

  styleSheet = styleElement.sheet;

  styleSheet.insertRule(style, styleSheet.cssRules.length);
};

export default injectStyle;
```

```jsx
import React from "react";
import injectStyle from "./path/to/injectStyle";

export default class SampleComponent extends React.Component {
  constructor(props) {
    super(props);

    const keyframesStyle = `
      @-webkit-keyframes pulse {
        0%   { background-color: #fecd6d; }
        25%  { background-color: #ef7b88; }
        50%  { background-color: #acdacf; }
        75%  { background-color: #87c3db; }
        100% { background-color: #fecd6d; }
      }
    `;
    injectStyle(keyframesStyle);

    this.state.style = {
      container: {
        WebkitAnimation: "pulse 10s linear infinite",
      },
      title: {
        fontSize: "2rem",
      },
    };
  }

  render() {
    const { style } = this.state;

    return (
      <div style={style.container}>
        <h3 style={style.title}>Hello world using React!</h3>
      </div>
    );
  }
}
```

これは 実 DOM 内に style タグを作り、そこに参照させたい keyframe を流し込み、それを React の中から参照する仕組みをとっています。これも考え方は同じで、animation が参照する keyframe 名をどこかに作っておくことでアニメーションを実行できるというものです。このように React の世界から 実 DOM の style タグを作り出し、スタイルを流し込む方法は keyframe 機能のサポートに限らず CSS in JS ライブラリが内部的にやっている一般的な方法でもあり、このような方法を使うのも良いと思います。
