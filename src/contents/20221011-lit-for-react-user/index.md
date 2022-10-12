---
path: /lit-for-react-user
created: "2022-10-11"
title: React ユーザーのための lit
visual: "./visual.png"
tags: ["lit"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

lit を使う機会があったので、「React でやる、あれをどうするのか」というメモを残しておく。

## 前提

環境構築めんどくさいので[playground](https://lit.dev/playground/) で試す。

## state

[Reactive properties](https://lit.dev/docs/components/properties/) という章がドキュメントにある通り、Lit には Reactive が備わっている。

```js
class MyElement extends LitElement {
  @property()
  name: string;
}
```

このようにクラスフィールドに `@property()` を付けるとそのフィールドが reactive になる。

これはクラスフィールドとしては public であるため、呼び出し元から書き換えることができてしまう。
つまり責務が閉じていない。

つまり、

```js
const myElement = document.querySelector("my-element");
console.log(myElement.name); // world
myElement.name = "ojisan";
```

のようなコードを書けてしまう。これは React で言えば親が子のコンポーネントの状態を触れてしまうということで変に依存を生み、テストなどを考えるとあまり嬉しくない。

そこで lit ではこれの責務が閉じたモードも用意されている。これが React における state 相応のものだ。
そのためにはフィールドを `protected` にした上で、`@property()` ではなく `@state()` を使う。

```js
@state()
protected _active = false;
```

こうすれば protected なので継承しない限りは触れなくなる。

この説明では public property を悪のように書いたが、実 DOM を手続的に操作したいときは使いたい機能ではあるので、なんでもかんでも `@state` を使えという主張はしない。

## props

クラスフィールドで指定した値は親から受け取れる。
ただし `@property` が必要である。
それは親から受け渡す以上は、親からそのフィールドが見えている必要があるからだ。
つまり `@state` だと動かない。

[OK](https://lit.dev/playground/#project=W3sibmFtZSI6InNpbXBsZS1ncmVldGluZy50cyIsImNvbnRlbnQiOiJpbXBvcnQge2h0bWwsIGNzcywgTGl0RWxlbWVudH0gZnJvbSAnbGl0JztcbmltcG9ydCB7Y3VzdG9tRWxlbWVudCwgcHJvcGVydHksIHN0YXRlfSBmcm9tICdsaXQvZGVjb3JhdG9ycy5qcyc7XG5cbkBjdXN0b21FbGVtZW50KCdzaW1wbGUtZ3JlZXRpbmcnKVxuZXhwb3J0IGNsYXNzIFNpbXBsZUdyZWV0aW5nIGV4dGVuZHMgTGl0RWxlbWVudCB7XG4gIEBwcm9wZXJ0eSgpXG4gIHByb3RlY3RlZCBuYW1lID0gJ1NvbWVib2R5JztcblxuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuIGh0bWxgPHA-SGVsbG8sICR7dGhpcy5uYW1lfSE8L3A-YDtcbiAgfVxufVxuIn0seyJuYW1lIjoiaW5kZXguaHRtbCIsImNvbnRlbnQiOiI8IURPQ1RZUEUgaHRtbD5cbjxoZWFkPlxuICA8c2NyaXB0IHR5cGU9XCJtb2R1bGVcIiBzcmM9XCIuL3NpbXBsZS1ncmVldGluZy5qc1wiPjwvc2NyaXB0PlxuPC9oZWFkPlxuPGJvZHk-XG4gIDxzaW1wbGUtZ3JlZXRpbmcgbmFtZT1cIldvcmxkXCI-PC9zaW1wbGUtZ3JlZXRpbmc-XG48L2JvZHk-XG4ifSx7Im5hbWUiOiJwYWNrYWdlLmpzb24iLCJjb250ZW50Ijoie1xuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJsaXRcIjogXCJeMi4wLjBcIixcbiAgICBcIkBsaXQvcmVhY3RpdmUtZWxlbWVudFwiOiBcIl4xLjAuMFwiLFxuICAgIFwibGl0LWVsZW1lbnRcIjogXCJeMy4wLjBcIixcbiAgICBcImxpdC1odG1sXCI6IFwiXjIuMC4wXCJcbiAgfVxufSIsImhpZGRlbiI6dHJ1ZX1d)

```js
import {html, css, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';

@customElement('simple-greeting')
export class SimpleGreeting extends LitElement {
  @property()
  protected name = 'Somebody';

  render() {
    return html`<p>Hello, ${this.name}!</p>`;
  }
}
```

[NG](https://lit.dev/playground/#project=W3sibmFtZSI6InNpbXBsZS1ncmVldGluZy50cyIsImNvbnRlbnQiOiJpbXBvcnQge2h0bWwsIGNzcywgTGl0RWxlbWVudH0gZnJvbSAnbGl0JztcbmltcG9ydCB7Y3VzdG9tRWxlbWVudCwgcHJvcGVydHksIHN0YXRlfSBmcm9tICdsaXQvZGVjb3JhdG9ycy5qcyc7XG5cbkBjdXN0b21FbGVtZW50KCdzaW1wbGUtZ3JlZXRpbmcnKVxuZXhwb3J0IGNsYXNzIFNpbXBsZUdyZWV0aW5nIGV4dGVuZHMgTGl0RWxlbWVudCB7XG4gIEBzdGF0ZSgpXG4gIHByb3RlY3RlZCBuYW1lID0gJ1NvbWVib2R5JztcblxuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuIGh0bWxgPHA-SGVsbG8sICR7dGhpcy5uYW1lfSE8L3A-YDtcbiAgfVxufVxuIn0seyJuYW1lIjoiaW5kZXguaHRtbCIsImNvbnRlbnQiOiI8IURPQ1RZUEUgaHRtbD5cbjxoZWFkPlxuICA8c2NyaXB0IHR5cGU9XCJtb2R1bGVcIiBzcmM9XCIuL3NpbXBsZS1ncmVldGluZy5qc1wiPjwvc2NyaXB0PlxuPC9oZWFkPlxuPGJvZHk-XG4gIDxzaW1wbGUtZ3JlZXRpbmcgbmFtZT1cIldvcmxkXCI-PC9zaW1wbGUtZ3JlZXRpbmc-XG48L2JvZHk-XG4ifSx7Im5hbWUiOiJwYWNrYWdlLmpzb24iLCJjb250ZW50Ijoie1xuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJsaXRcIjogXCJeMi4wLjBcIixcbiAgICBcIkBsaXQvcmVhY3RpdmUtZWxlbWVudFwiOiBcIl4xLjAuMFwiLFxuICAgIFwibGl0LWVsZW1lbnRcIjogXCJeMy4wLjBcIixcbiAgICBcImxpdC1odG1sXCI6IFwiXjIuMC4wXCJcbiAgfVxufSIsImhpZGRlbiI6dHJ1ZX1d)

```js
import {html, css, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';

@customElement('simple-greeting')
export class SimpleGreeting extends LitElement {
  @state()
  protected name = 'Somebody';

  render() {
    return html`<p>Hello, ${this.name}!</p>`;
  }
}
```

ここでデータを渡す時の方法だが、普通に値を渡すとそれは文字列として渡されてしまう。
実際には JSON を渡したい、イベントハンドラを渡したいはずだ。もちろんそのようなユースケースにも対応できる。

それは渡すときの attribute に魔法の記号をつければ良い。

[Expressions](https://lit.dev/docs/templates/expressions/)にある通り、boolean なら `?` , property(要するに data) なら `.`, event handler なら `@` をつければ良い。

[例](https://lit.dev/playground/#project=W3sibmFtZSI6Im15LWVsZW1lbnQudHMiLCJjb250ZW50IjoiaW1wb3J0IHsgTGl0RWxlbWVudCwgaHRtbCB9IGZyb20gJ2xpdCc7XG5pbXBvcnQgeyBjdXN0b21FbGVtZW50LCBwcm9wZXJ0eSB9IGZyb20gJ2xpdC9kZWNvcmF0b3JzLmpzJztcblxuQGN1c3RvbUVsZW1lbnQoJ215LWVsZW1lbnQnKVxuY2xhc3MgTXlFbGVtZW50IGV4dGVuZHMgTGl0RWxlbWVudCB7XG4gIEBwcm9wZXJ0eSgpXG4gIGJvZHlUZXh0ID0gJ1RleHQgaW4gY2hpbGQgZXhwcmVzc2lvbi4nO1xuICBAcHJvcGVydHkoKVxuICBsYWJlbCA9ICdBIGxhYmVsLCBmb3IgQVJJQS4nO1xuICBAcHJvcGVydHkoKVxuICBlZGl0aW5nID0gdHJ1ZTtcbiAgQHByb3BlcnR5KClcbiAgdmFsdWUgPSA3O1xuXG4gIHJlbmRlcigpIHtcbiAgICByZXR1cm4gaHRtbGBcbiAgICAgIDwhLS0gQ2hpbGQgIGV4cHJlc3Npb24gLS0-XG4gICAgICA8ZGl2PkNoaWxkIGV4cHJlc3Npb246ICR7dGhpcy5ib2R5VGV4dH08L2Rpdj5cblxuICAgICAgPCEtLSBhdHRyaWJ1dGUgZXhwcmVzc2lvbiAtLT5cbiAgICAgIDxkaXYgYXJpYS1sYWJlbD0ke3RoaXMubGFiZWx9PkF0dHJpYnV0ZSBleHByZXNzaW9uLjwvZGl2PlxuXG4gICAgICA8IS0tIEJvb2xlYW4gYXR0cmlidXRlIGV4cHJlc3Npb24gLS0-XG4gICAgICA8ZGl2PlxuICAgICAgICBCb29sZWFuIGF0dHJpYnV0ZSBleHByZXNzaW9uLlxuICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiA_ZGlzYWJsZWQ9JHshdGhpcy5lZGl0aW5nfSAvPlxuICAgICAgPC9kaXY-XG5cbiAgICAgIDwhLS0gcHJvcGVydHkgZXhwcmVzc2lvbiAtLT5cbiAgICAgIDxkaXY-XG4gICAgICAgIFByb3BlcnR5IGV4cHJlc3Npb24uXG4gICAgICAgIDxpbnB1dCB0eXBlPVwibnVtYmVyXCIgLnZhbHVlQXNOdW1iZXI9JHt0aGlzLnZhbHVlfSAvPlxuICAgICAgPC9kaXY-XG5cbiAgICAgIDwhLS0gZXZlbnQgbGlzdGVuZXIgZXhwcmVzc2lvbiAtLT5cbiAgICAgIDxkaXY-XG4gICAgICAgIEV2ZW50IGxpc3RlbmVyIGV4cHJlc3Npb24uXG4gICAgICAgIDxidXR0b24gQGNsaWNrPVwiJHt0aGlzLmNsaWNrSGFuZGxlcn1cIj5DbGljazwvYnV0dG9uPlxuICAgICAgPC9kaXY-XG4gICAgYDtcbiAgfVxuICBjbGlja0hhbmRsZXIoZTogRXZlbnQpIHtcbiAgICB0aGlzLmVkaXRpbmcgPSAhdGhpcy5lZGl0aW5nO1xuICAgIGNvbnNvbGUubG9nKGUudGFyZ2V0KTtcbiAgfVxufVxuIn0seyJuYW1lIjoiaW5kZXguaHRtbCIsImNvbnRlbnQiOiI8IWRvY3R5cGUgaHRtbD5cbjxoZWFkPlxuICA8c2NyaXB0IHR5cGU9XCJtb2R1bGVcIiBzcmM9XCIuL215LWVsZW1lbnQuanNcIj48L3NjcmlwdD5cbjwvaGVhZD5cbjxib2R5PlxuICA8bXktZWxlbWVudD48L215LWVsZW1lbnQ-XG48L2JvZHk-XG4ifSx7Im5hbWUiOiJwYWNrYWdlLmpzb24iLCJjb250ZW50Ijoie1xuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJsaXRcIjogXCJeMi4wLjBcIixcbiAgICBcIkBsaXQvcmVhY3RpdmUtZWxlbWVudFwiOiBcIl4xLjAuMFwiLFxuICAgIFwibGl0LWVsZW1lbnRcIjogXCJeMy4wLjBcIixcbiAgICBcImxpdC1odG1sXCI6IFwiXjIuMC4wXCJcbiAgfVxufSIsImhpZGRlbiI6dHJ1ZX1d)

```js
import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("my-element")
class MyElement extends LitElement {
  @property()
  bodyText = "Text in child expression.";
  @property()
  label = "A label, for ARIA.";
  @property()
  editing = true;
  @property()
  value = 7;

  render() {
    return html`
      <!-- Child  expression -->
      <div>Child expression: ${this.bodyText}</div>

      <!-- attribute expression -->
      <div aria-label=${this.label}>Attribute expression.</div>

      <!-- Boolean attribute expression -->
      <div>
        Boolean attribute expression.
        <input type="text" ?disabled=${!this.editing} />
      </div>

      <!-- property expression -->
      <div>
        Property expression.
        <input type="number" .valueAsNumber=${this.value} />
      </div>

      <!-- event listener expression -->
      <div>
        Event listener expression.
        <button @click="${this.clickHandler}">Click</button>
      </div>
    `;
  }
  clickHandler(e: Event) {
    this.editing = !this.editing;
    console.log(e.target);
  }
}
```

イベントハンドラを渡すことができれば、親の状態更新を子が呼び出すといった react でよく見る dispatch を実現できるので覚えておこう。

## lifecycle

React のライフサイクルと lit のそれは厳密には異なるが、考え方はほとんど同じなのでごちゃ混ぜにして説明する。厳密な仕様は公式ドキュメントを参考して欲しい。

FYI: <https://lit.dev/docs/components/lifecycle>

### componentDidMount

React でいう componentDidMount は

```js
@customElement('simple-greeting')
export class SimpleGreeting extends LitElement {
  @state()
  protected name = 'Somebody';

  connectedCallback() {
  super.connectedCallback()

  this.name = "ほげえ"
}

  render() {
    return html`<p>Hello, ${this.name}!</p>`;
  }
}

```

だ。こうすることで `@state` が付いたものを初期化できる。

もしくは constructor を使っても良い。

```js
@customElement('simple-greeting')
export class SimpleGreeting extends LitElement {
  @state()
  protected name = 'Somebody';

  constructor(){
    super();
    this.name = "aaa"
  }


  render() {
    return html`<p>Hello, ${this.name}!</p>`;
  }
}
```

これは 「え、でもクラスフィールド宣言時に値を代入すれば良いだけじゃん」って思うかもしれない。 その意見は正しいが、decorator を使わない場合は class field には

```js
class MyElement extends LitElement {
  static properties = {
    mode: { type: String },
    data: { attribute: false },
  };
}
```

しか現れないので、component の初期化する手順が必要となる。

それも「decorator 使えば良いじゃん」と思うかもしれないが、過去に decorator は仕様が巻き戻ったり、安定化するという確証を持てないので decorator を封じて開発したいモチベーションがあるかもしれない。実際 lit のドキュメントにも decorator を使わない場合の開発方法も指南 ([例](https://lit.dev/docs/components/properties/#declaring-properties-in-a-static-properties-class-field))されているので、decorator を使う前提を絶対とするのはやめたほうが良い。

### componentDidUpdate

[componentDidUpdate](https://ja.reactjs.org/docs/react-component.html#componentdidupdate) は React では コンポーネントが更新されたときに DOM を操作する API だ。これは親から渡される props が変わった時に、その値に応じて何かしらの処理をトリガーしたい時に使える。

```js
componentDidUpdate(prevProps) {
  // 典型的な使い方(props を比較することを忘れないでください)
  if (this.props.userID !== prevProps.userID) {
    this.fetchData(this.props.userID);
  }
}
```

このような処理は lit だと [updated](https://lit.dev/docs/components/lifecycle/#updated) を使える。

```js
updated(changedProperties) {
  if (changedProperties.has('collapsed')) {
    this._measureDOM();
  }
}
```

この例だと、 `changedProperties` は `collapsed` を key にもつ Map であり、`changedProperties.get('collapsed')` とすればアクセスできる。ただ、何が入ってくるは静的に知りたいので TypeScript で型を付けよう。その型は `PropertyValueMap<T>` であり、T には 該当の Lit コンポーネントが入る。

```ts
class MyElement extends LitElement {
  @property()
  name: string;

  updated(changedProperties: PropertyValueMap<MyElement>) {
    if (changedProperties.has("name")) {
      const prevName = changedProperties.get("name");
      const currentName = this.name;
    }
  }
}
```

こうすると changedProperties には props の 型が MyElement のフィールドの型を伝って分かる。

## おわりに

ひとまず state, props, lifecycle があれば React16.2 の DX で開発することができるので頑張ろう。
