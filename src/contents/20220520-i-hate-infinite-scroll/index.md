---
path: /i-hate-infinite-scroll
created: "2022-05-20"
title: 無限スクロールは考慮することが多い
visual: "./visual.png"
tags: ["react", "nextjs"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

毎年無限スクロールの実装をしているのだが正直なところ実装したくないので依頼されたときの反論材料として実装したくない理由を言語化しておこうと思う。

## 無限スクロールとは

無限スクロールが何を指すかを知らない人のために解説すると、ページにコンテンツを足す方式でページネーションする UI を指している。例えば Twitter のように下にどんどんコンテンツが伸びていく UI が良い例だろう。そのような UI を無限スクロールと呼ぶことが正式なのかは知らないが、このような体験の実現を支援するライブラリに infinite-scroll というものがあり、少しは普及している呼び方なのだと思い無限スクロールという言葉を使う。一方で WEB フロントエンド文脈で無限スクロールと言うと複雑 GUI やドローイングツール実装における "無限平面" のようなニュアンスもあるが、今は無限平面のことを指しているわけではない。

## 一般的な実装方法

Next.js を例に解説するが、React であれば react-router でも同様のことはできるはずである。react 以外の例は試していないが考えることは同じであるはず。

また、まずは愚直にやると辛い例を示したいので、雑な実装を紹介する。正答は後の方で解説する。

### バックエンドの API 定義

無限スクロールなんていう仰々しい名前だが、結局はページネーションの一つの形態であるのでバックエンドの API はいわゆる普通のページネーションである。つまり取得量である volume は一定として offset や cursor のようなものを指定するエンドポイントがあれば良い。ここでは offset を指定したら offset 番目以降のデータが一定 volume で取得できる API があると仮定する。この方式が気になる方は "Offset-based pagination" や "Cursor-based pagination" などで検索すると良いだろう。

### offset の操作

ここではコンテンツは「もっと」ボタンをクリックして増えるものとする。

```tsx
<button onClick={onClick}>もっと</button>
```

### offset に応じたデータ取得

onClick などのロジックは offset 操作用に定義した hooks で管理しておく。

```tsx
const useGetMore = () => {
  const [data, setData] = useState([]);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    fetch(`/api/data?offset=${offset}`)
      .then((res) => res.json)
      .then((data) => {
        setData(data);
      });
  }, [offset]);

  const onClick = useCallback(() => {
    setOffset(offset + DEFAULT_VOLUME);
  }, [offset]);

  return { onClick, data };
};
```

```tsx
const Hoge = () => {
  const { data, onClick } = useGetMore();
  return (
    <div>
      <Contents data={data} />
      <button onClick={onClick}>もっと</button>
    </div>
  );
};
```

とりあえずこれで「もっと」を押すとデータが更新されることとはなった。
しかしお気づきの通りこの実装は穴がたくさんある。
それを今から見ていこう。

## 無限スクロールの開発は何が大変か、その解決策

これから無限スクロールの考慮しないといけない点を紹介する。
また、実装経験がそれなりにあるのでこれらの解決策は知っているので解決策も紹介する。
ここで解決策を書くと「え、解決できるなら実装してよ」だったり「君は慣れてるからこの仕事よろしくね」と言われそうなので書くか悩んだのだが、いま辛い目にあっている人たちを見捨てるわけにはいかないので書いておこうと思う。

### 追加コンテンツに対するローディングの状態管理

さて、先ほどの例の

```tsx
const Hoge = () => {
  const { data, onClick } = useGetMore();
  return (
    <div>
      <Contents data={data} />
      <button onClick={onClick}>もっと</button>
    </div>
  );
};
```

は、追加コンテンツを得ようとすると `<Contents data={data} />` 全体に更新が走ってしまう。
それをもっとわかりやすくインターフェースを変えて、

```tsx
const Hoge = () => {
  const { data, onClick } = useGetMore();
  return (
    <div>
      {!loading ? <Contents data={data} /> : "loading"}
      <button onClick={onClick}>もっと</button>
    </div>
  );
};
```

としたとき、追加コンテンツを取得するとこれまで表示したコンテンツにまで loading が表示されてしまう。

これを解決するためには、表示済みのコンテンツ状態とデータ取得の状態を分離して管理する必要がある。

```tsx
type State =
  | {
      _tag: "init";
    }
  | { _tag: "loading" }
  | { _tag: "success"; contents: any };

const useGetMore = () => {
  const [staticData, setStatic] = useState<any[]>([]);
  const [data, setData] = useState<State>({ _tag: "init" });
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (data._tag === "success") {
      setStatic((current) => [...current, ...data.contents]);
    }
  }, [data]);

  useEffect(() => {
    setData({ _tag: "loading" });
    fetch(`/api/data?offset=${offset}`)
      .then((res) => res.json)
      .then((data) => {
        setData({
          _tag: "success",
          contents: data,
        });
      });
  }, [offset]);

  const onClick = useCallback(() => {
    setOffset(offset + DEFAULT_VOLUME);
  }, [offset]);

  return { onClick, data, staticData };
};
```

```tsx
const Hoge = () => {
  const { data, onClick } = useGetMore();
  return (
    <div>
      <Contents data={staticData} />
      {data._tag === "success" ? <Contents data={data.contents} /> : "loading"}
      <button onClick={onClick}>もっと</button>
    </div>
  );
};
```

### ある程度「もっと」を押された後に、画面更新された場合

#### 更新されると状態が初期状態に戻る

さて、上の実装だと何回かもっとを押された後に画面更新されると初期表示に戻ってしまう。これはよくないので更新されても前回の表示を復帰させよう。前回までの表示をローカルストレージに保存しておいて復帰させるみたいな形式でも良いが、ここでは URL を使って復帰させる。これはページネーションの実装の多くは URL で状態管理しているためである。

「もっと」を押された後の挙動は SPA としての挙動なので、URL は History API を使った操作となる。NextJS で考えるなら `useRouter`が使える。

```tsx
const useGetMore = () => {
  const router = useRouter();

  const onClick = useCallback(() => {
    const nextOffset = offset + DEFAULT_VOLUME;
    router.push({ path: "/hoge", query: { offset: nextOffset } });
    setOffset(offset + DEFAULT_VOLUME);
  }, [offset, router]);

  return { onClick, data, staticData };
};
```

こうしておけばクリックされた後は offset の付与された URL を URL バーに表示させることができる。
そうすれば更新されてもその URL を手に入れられる。

その後は useRouter で更新後の URL を parse して offset を手に入れて、その offset を起点に useEffect でデータを取得すれば復帰ができる。

しかし今は NextJS を使っているので、更新後の値は SSR サーバーから受け取る方が綺麗になるだろう。

```jsx
export const getServerSideProps = async (ctx) => {
  const offset = context.query["offset"];
  const data = getData(offset);
  return { props: data };
};
```

このデータを hooks が受け取るには引数で受け取り、useState の初期データに入れると良い。

```tsx
const useGetMore = (data) => {
  const [staticData, setStatic] = useState<any[]>(data);
  const [data, setData] = useState<State>({ _tag: "init" });
  const router = useRouter();

  const onClick = useCallback(() => {
    const nextOffset = offset + DEFAULT_VOLUME;
    router.push({ path: "/hoge", query: { offset: nextOffset } });
    setOffset(offset + DEFAULT_VOLUME);
  }, [offset, router]);

  return { onClick, data, staticData };
};
```

これで更新されてもその offset からのデータを取得できるようになった。

#### offset 以前のデータが表示されない

しかしまだ問題がある。それはその offset までのデータが表示されていないのである。
そのため `getData(offset)`の内部では `fetch('api/?volume=${offset + DEFAULT_VOLUME}&offset=0')` のようにして 0 番目からその offset までの全量を取得する必要がある。

### スクロール位置の管理

#### コンテンツ追加のたびにスクロール位置がリセットされる

遷移に router.push をそのまま使うのはあまりよくない。
なぜなら `router.push()` すると画面が更新したと思われスクロール位置がトップまで戻されてしまうためである。
幸い nextjs にはこれを防ぐ機能がある。
そのためには `router.push` を

```jsx
const onClick = useCallback(() => {
  const nextOffset = offset + DEFAULT_VOLUME;
  router.push({ path: "/hoge", query: { offset: nextOffset } }, undefined, {
    scroll: false,
  });
  setOffset(coffsetursor + DEFAULT_VOLUME);
}, [offset, router]);
```

と scroll オプションをつけると良い。

> scroll - Optional boolean, controls scrolling to the top of the page after navigation. Defaults to true

FYI: <https://nextjs.org/docs/api-reference/next/router#routerpush>

#### ブラウザバックするとまた 1 からスクロールをし直すことになる

スクロール位置の問題はこれだけにとどまらない。
ある程度もっとを押されてスクロールされて、コンテンツをクリックされて遷移されて、そのあとにブラウザバックで戻ってきた場合にコンテンツのトップに戻ってしまうのである。ちなみに先のセクションで画面更新されてもいいように URL から復旧させる実装をしたが、それをしていない場合はコンテンツも全部消えてしまっている。つまりブラウザバックされた場合の状態の復元も考えないといけないのである。

これは NextJS であれば scrollRestoration という機能で解決できる。
next.config.js に

```json
{ "experimental": { "scrollRestoration": true } }
```

を足せば良い。こうすれば next/link, next/router での遷移時んスクロール量を保持してくれるようになる。

この機能自体は History API にもあり、react-router でもサポートされているので積極的に使っていこう。

### 大量のコンテンツがメモリに載る

ここでページネーションの見栄えは実装はできているはず。
しかしまだまだ問題はある。

例えばコンテンツが 10000 個あったとして、それを全部表示させることが無限スクロールだと可能になっている。
これの何が問題かと言うと、その描画や状態がメモリに全部載ることだ。
そのためたとえばスマホのような RAM が少ない端末であればとてもスクロールが重たくなる。
これは普通のページネーションであれば 1URL につき 週十件程度の表示で済んでいるので無限スクロール特有の問題と言える。

これの解決方法はいわゆる "バーチャルスクロール" の導入だ。
React には画面の表示領域に映るものしか実際にレンダリングをしないというライブラリがあり、代表的なものは react-window や react-virtualized などが有名だ。
ただこれらは古くからあるライブラリなのでもしかすると今は新しいのがあるかもしれない。

僕はまだ使ったことがないが [react-virtual](https://react-virtual.tanstack.com/) は良さそうな雰囲気がある。安心(?)の tanstack だし。

### コンテンツ入稿のタイミングによっては key が重複し、編集事故が起きうる

大量のデータを 1 画面に表示することの危険はまだある。
それはコンテンツの key の重複だ。

React では繰り返し属性に対しては key を割り振るのが慣習である。
これは再レンダリングの回避にとても大きい貢献をする。
その key には data の id を使うことが一般的だ。
それは index 情報を key にすると、削除・追加時に key がズレて同一 key が割り振られてしまい、うまく編集できなくなるケースがあったりするからだ。

ただ id を使っていたとしても全データを一つの画面で表示させるのであれば、入稿（削除・入れ替え含む）のタイミングによっては前の offset で表示したデータがもう一度取られてしまい、同一 key が画面に表示される危険性がある。サーバーが cursor based を徹底するなどして防御していれば防げるかもしれないが、完全に防げる保証はない。クライアントで key の unique を配列操作で担保すればいいかもしれないが、それも走査のコストがあるのでしたくはない。

ただ、key の重複は UI 上でコンテンツを追加・削除・編集・入れ替えのような機能がなければコンソールに警告が出るだけでは済むので、無視してもいいかもしれない。（僕はよく目を瞑っている）

## 無限スクロールはユーザーにとってどうなのか

さて、ここまで開発者目線で無限スクロールについて語ったが、ユーザーからするとどうであろうか。

### 一度通過したコンテンツを探しにくい

もし普通のページネーションであれば、「あれは 2 ページ目にあった」といったことを覚えておけばその数値をクリックもしくは URL に打ち込めば簡単に戻れる。しかし無限スクロールだとそれは難しい。

### スキップできない

もし普通のページネーションであれば、「あれは最後の方のページにあった」といったことを覚えておけば末尾のリンクをクリックして一気にスキップできる。しかし無限スクロールだと URL に直接 offset 値を打たない限りは難しい。

このようにユーザーの自由のネットサーフィンを阻害するケースもある。
個人的には無限スクロールより普通のページネーションの方が嬉しい場合の方が多い。

## 無限スクロールが適している場面

一方で無限スクロールが適している場面もある。

例えばザッピング目的の機能であれば適していると思う。
なので Twitter は正しい実装をしていると思う。

探したいコンテンツが決まっている・その位置を知っているユーザーにとっては適していないだけとも言えるかもしれない。

## まとめ

無限スクロールは実装が大変なので正直やりたくない。
無限スクロールが適している場面はあるが、無限スクロールじゃないといけない場面というのはそうそうないはずである。
今回の例は「もっと」ボタンを押させる実装にしているが、もっとハードなものは末尾までのスクロールによって自動で更新が走るや pull to refresh などがあり、intersection observer との格闘などまだまだある。

無限スクロールを要件に入れたい場合は開発コストに見合うものかと言うことは一度考えた方が良いと思う。

正直やりたくない or 昇給 please...
