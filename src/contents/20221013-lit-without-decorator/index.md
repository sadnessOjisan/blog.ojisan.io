---
path: /lit-for-react-user
created: "2022-10-13"
title: decorator を使わずに lit を使う
visual: "./visual.png"
tags: ["lit"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

lit は decorator を使え、ドキュメントを見る限りでは推奨の方法にも思えるが、「いくら stage3 とはいえ前科持ちだ、何が起こるか分からねぇ」ということで使いたくない人もいるだろう。実際ドキュメントにも decorator を使わなくて良い方法が書かれているのでそれをまとめる。

## decorator 一覧

lit で使える decorator は [built-in-decorators](https://lit.dev/docs/components/decorators/#built-in-decorators) にまとまっている。どうやら必要なのは、customElement, Event, Properties, Shadow DOM なのでそれらをまとめる。

## @customElement

よく見る構文である。

```js
@customElement("my-element")
export class MyElement extends LitElement {
  @property() greeting = "Welcome";
  @property() name = "Sally";
  @property({ type: Boolean }) emphatic = true;
  //...
}
```

これは

```js
customElements.define("my-element", MyElement);
```

と同等であり、ただカスタムエレメントを登録しているだけである。

## @eventOptions

event listener の `addEventListener(type, listener, options)` の options 部分を付け加えれる decorator である。

```js
class MyElement {
  clicked = false;

  render() {
    return html`
      <div @click=${this._onClick}>
        <button></button>
      </div>
    `;
  }

  @eventOptions({ capture: true })
  _onClick(e) {
    this.clicked = true;
  }
}
```

つまりこれを decorator 使わずに実現したければ、直接 constructor などで

```js
el.addEventListner("click", func, { capture: true });
```

などどすれば良い。el は後述する query で取ってこれる。

## Properties

Properties には `@property` と `@state` がある。これはクラスフィイールドをリアクティブパラメータに変えられる decorator だ。

これは

```js
class MyElement extends LitElement {
  static properties = {
    mode: { type: String },
    data: { attribute: false },
  };

  constructor() {
    super();
    this.data = {};
  }
}
```

のように、static propery `properties`を使うことで設定できる。

FYI: <https://lit.dev/docs/components/properties/#declaring-properties-in-a-static-properties-class-field>

そしてそれらには、 attribute, converter, hasChanged, noAccessor, reflect, state, type というオプションを指定できる。

FYI: <https://lit.dev/docs/components/properties/#property-options>

このうち internal state, つまり `@state` を使いたければ、state を true にすれば良い。

```js
class MyElement extends LitElement {
  static properties = {
    mode: { type: String, state: true },
  };

  constructor() {
    super();
    this.mode = "pc";
  }
}
```

noAccessor というオプションは、これを使って状態の公開を防げるが state で代用できるのでドキュメントにもある通り、"This option is rarely necessary." だろう。

## query

@query はクラスフィールドに DOM への ref を保持してくれる decorator だ。

```js
class MyElement {
  @query("#first")
  first: HTMLDivElement;

  render() {
    return html`
      <div id="first"></div>
      <div id="second"></div>
    `;
  }
}
```

queryAll などもこの用途の亜種と思えば良い。

要するに querySelector なので decorator を使わない場合はそれを使えばよさそうだが、Shadow DOM は直接見えない。そこで、`this.renderRoot` というところから取ってくる。

FYI: <https://lit.dev/docs/components/shadow-dom/>

つまり、

```js
import { LitElement, html } from "lit";
import { query } from "lit/decorators/query.js";

class MyElement extends LitElement {
  @query("#first")
  _first;

  render() {
    return html`
      <div id="first"></div>
      <div id="second"></div>
    `;
  }
}
```

は

```js
get _first() {
  return this.renderRoot?.querySelector('#first') ?? null;
}
```

として書ける。
