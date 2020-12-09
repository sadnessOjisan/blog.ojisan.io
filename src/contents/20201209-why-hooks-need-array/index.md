---
path: /why-hooks-need-array
created: "2020-12-09"
title: custom hookの返り値は配列であるべきか
visual: "./visual.png"
tags: ["React"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

つい先日、知人とペアプロしているときに custom hooks の戻り値は配列かオブジェクトかで意見が分かれたことがあって、結局何が正しいのかを調べてみました。

## 結論

どっちでもいい。

## hooks は何でも返せる

返り値を持つ hooks の返り値は配列であることをよく見ます。

```tsx
export default () => {
  const [state, setState] = useState()
  const [store, dispatch] = useReducer(reducer, initalState)
  return <div>ほげ</div>
}
```

これを、

```tsx
export default () => {
  const { state, setState } = useState()
  const { store, dispatch } = useReducer(reducer, initalState)
  return <div>ほげ</div>
}
```

と返さない理由って何でしょうか。
実際のところ、配列で返さない hooks ライブラリも存在します。

```tsx
export default () => {
  const value = useContext(MyContext)
  const { loading, error, data } = useQuery(
    gql`
      query GetGreeting($language: String!) {
        greeting(language: $language) {
          message
        }
      }
    `,
    {
      variables: { language: "english" },
    }
  )
  const { data, error } = useSWR<User, Error>(`/users/${id}`, () =>
    fetchUser(id)
  )

  return <div>ほげ</div>
}
```

hooks の返り値は何でもいいのですが、なぜわざわざ配列で返すような API が存在しているのでしょうか。
特に配列で返すとオブジェクトで返す場合と比べて取り出しの自由度は下がりそうです。

## 名前を自由に付けれる

その理由は、配列で返しておけば受け取る時に名前を自由に付けられるからです。
たとえば、

```tsx
export default () => {
  const [state, setState] = useState()
  const [store, dispatch] = useReducer(reducer, initalState)
  return <div>ほげ</div>
}
```

は、

```tsx
export default () => {
  const [user, setUser] = useState()
  const [posts, postDispatch] = useReducer(reducer, initalState)
  return <div>ほげ</div>
}
```

などとして、そのコンポーネントを使う文脈に合わせた名前を割り当てられます。
もしこれがオブジェクトとして返っていると、hooks の呼び出し後に名前を付け直す必要があります。
そのため **custom hooks の開発者はその hooks が汎用的に使われ文脈にそった名前を与えられる使われ方をするか**どうかを考えて、オブジェクトで返すか配列で返すかをすれば良いです。

swr, applo, react-query などはデータ取得の hooks で基盤のような動きをし、それをラップした別の hooks から呼ばれることが多くそのときに別の名前が割り当てられるのでオブジェクトで返す API であっても良いのかなと個人的に解釈しています。(View から呼ぶ hooks は文脈に即した名前で返ってくるため)

## 配列で返して不都合？

たとえばなんらかの custom hooks を

```tsx
export const useHoge = () => {
  // something
  return [loading, data, error, refetch]
}
```

のように返したとして、呼び出し側が data だけ欲しい場合などはどうすればいいでしょうか。
配列で返すとオブジェクトのように key で自由に取り出しができず、また index でのアクセスは range error などを想定すると使いたくない選択肢です。

### destructuring と placeholder を活用しよう

配列はラベルでアクセスできませんが、\_などの placeholder を用意してピンポイントで必要な要素を取り出せます。

```ts
const getVal = () => [1, 2, 3, 4]

const [_, second] = getVal()
```

```sh
> second
2
```

(追記)

`_` を使わなくても、

```ts
const getVal = () => [1, 2, 3, 4]

const [, second] = getVal()
```

とすれば取得できます。

`_` を使うと複数定義できないのであまり良い方法ではなさそうです。

## 結論

hooks 関数から戻り値を配列で返すと、 hooks の呼び出し時に束縛する変数名を自由に変えられ、可読性を上げられる。

## 参考にしたもの

- https://dev.to/theianjones/should-hooks-always-return-an-array--21np
