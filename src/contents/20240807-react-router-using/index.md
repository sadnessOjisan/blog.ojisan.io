---
path: /react-router-using
created: "2024-08-07"
title: react-router 使う機能、使わない機能
visual: "./visual.png"
tags: ["react", "react-router"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

最近久しぶりに [React Router](https://reactrouter.com/en/main) を使う機会があった。
SSR不要な要件だったのでNext.jsではなく Vite を選んだら、ルーターが必要となり React Router を選定した。
React Router は Remix との統合もある通り、もはやただのルーターではなく、fetch や form action までもサポートされている。

採用にあたって考えるのはどこまで React Router の機能を使うかだ。
自分は router が欲しくて入れるので fetcher や action は不要だ。
一方で React Router を FW と考えると FW の標準に乗るのは自然な発想にも思える。
今回、React Router の機能に寄せて開発してみて、この機能使う・この機能使わないという土地勘ができたのでメモをしておく。

## router

ルーターライブラリなので、ルーターの機能は当然使う。
router 定義の方法も何通りかあるが、自分は `createBrowserRouter` で定義している。

```ts
const router = createBrowserRouter([
	{
		path: "/",
		element: <Layout />,
		children: [
			{
				index: true,
				element: <RootPage />,
			},
			{
				path: "/xxx",
				element: <XxxPage />,
				errorElement: <ErrorBoundary service="piyo" />,
				loader: loader,
				children: [
					{
						path: "/yyy/config",
						element: <Config />,
						errorElement: "画面を表示できません。",
						children: [
							{
								path: "y",
								element: <YConfig />,
								loader: yConfigLoader,
								errorElement: "画面を表示できません。",
								index: true,
							},
							{
								path: "x",
								element: <ZConfig />,
								loader: zConfigLoader,
								errorElement: "画面を表示できません。",
							},
						],
					},
				],
			},
		],
	},
]);

function App() {
	return <RouterProvider router={router} />;
}

export default App;
```

これの良いところは

- ルーティングは入れ子にできる
- :id のようなマッチが使える
- Error Boundary 的なものが備わっている
- routing をさも state のように扱える (index のおかげで)

などがある。

## outlet

ルーティングの入れ子と併用して強力なのが outlet だ。

see: https://reactrouter.com/en/main/components/outlet

```ts
function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* This element will render either <DashboardMessages> when the URL is
          "/messages", <DashboardTasks> at "/tasks", or null if it is "/"
      */}
      <Outlet />
    </div>
  );
}
```

としておくと、入れ子のルーティングの中身を Outlet の部分に表示させられる。
これは共通レイアウトを作る時に強力な機能だ。

そして outlet には Context という機能がある。

see: https://reactrouter.com/en/main/hooks/use-outlet-context

Context により state も共通も持たせられ、それを useContext のように値をとってくることもできる。
共通ヘッダーの実装などでお世話になりやすい。

## Navigate

他のFWのようにuseNavigate のようなナビゲーション用のAPIが生えているが、 Navigate がコンポーネントになっているのも嬉しい。
これは「要素が０件の場合は表示せずに別ページに飛ばす」といった実装を React Elemet 内で書ける。
そういった実装を React Elemet 外に書くと、early return のためにコンポーネント切り出しがめんどくさくなったり、処理を書くための useEffect が生えたりしてちょっとロジックが複雑に見えてしまう。
それを React Element 内に書けるので便利だ。

see: https://reactrouter.com/en/main/components/navigate

## loader

loader は react-router に備わったデータfetchの機能だ。
結論から言うと自分は使わない機能だと思っていたけど、最終的には積極的に使っていた。
しかしそのうち使わなくなるとは思う。

see: https://reactrouter.com/en/main/hooks/use-loader-data

```tsx
import {
  createBrowserRouter,
  RouterProvider,
  useLoaderData,
} from "react-router-dom";

function loader() {
  return fetchFakeAlbums();
}

export function Albums() {
  const albums = useLoaderData();
  // ...
}

const router = createBrowserRouter([
  {
    path: "/",
    loader: loader,
    element: <Albums />,
  },
]);

ReactDOM.createRoot(el).render(<RouterProvider router={router} />);
```

router 定義時にデータを返す関数をセットで登録しておくと、それをコンポーネントの中から `useLoaderData()` でアクセスできる仕組みだ。
「何が嬉しいんだ」と思うかもしれないが、何個か理由がある。
例えば data fetch を上流に集めることで同じような data fetch をcacheできるようになったり、そもそも render on fetch による water fall を解消できる。

それ以外にも自分はPromiseを返せるのが一番の旨味だと考えている。
これのおかげで Suspense を自然に使える。
React v18 で Next の RSC などに頼らずSuspenseを使おうとしたことがある人なら分かると思うが、まあめんどくさい。
react-routerなら laoder で Promise で返しておけばそれを Suspsense で使える。

他にも defer という機能が便利だ。
これは遅延レンダリングを可能とする。

see: https://reactrouter.com/en/main/utils/defer

そのためには Await というコンポーネントを使わないといけないが、 Await は defer を有効にしなくても ErrorBoundary 的なものが付いてくるので、それ単体でも嬉しい。

see: https://reactrouter.com/en/main/components/await

```tsx
function Book() {
  const { book, reviews } = useLoaderData();
  return (
    <div>
      <h1>{book.title}</h1>
      <p>{book.description}</p>
      <React.Suspense fallback={<ReviewsSkeleton />}>
        <Await
          resolve={reviews}
          errorElement={<div>Could not load reviews 😬</div>}
          children={(resolvedReviews) => <Reviews items={resolvedReviews} />}
        />
      </React.Suspense>
    </div>
  );
}
```

自分がこの前 React Router を使った時は積極的に使った。が、Suspense 周りの嬉しさは react v19 で use が来たら満たされるので、そのうちこの機能を使わなくなるとは思っている。

あとDX的な懸念もあって、 useLoaderData() の結果が型推論効かないと言うのはある。
なので型を引き回す必要して as で型をつける必要がある。

see: https://github.com/remix-run/react-router/discussions/9792

まあ型を引き回せばいいとは思うが、 defer を使った後は Promise を返さないといけないが、そのloaderの戻り値型はそのままだと Await の children の関数の引数と型が合わなくなるといった別の問題があったりして、型推論だけで乗り切るのが厳しいという問題はある。

## action

action は React Router や Remix が web標準フレンドリーなどと言われている機能の一つだとは思うが、自分はこれは使わない。

router 定義に action を渡しておくと、form の submit に hook して実現される仕組みで、これによりフォームの値を使った操作が可能となる。

```tsx
import { useActionData, Form, redirect } from "react-router-dom";

export default function SignUp() {
  const errors = useActionData();

  return (
    <Form method="post">
      <p>
        <input type="text" name="email" />
        {errors?.email && <span>{errors.email}</span>}
      </p>

      <p>
        <input type="text" name="password" />
        {errors?.password && <span>{errors.password}</span>}
      </p>

      <p>
        <button type="submit">Sign up</button>
      </p>
    </Form>
  );
}

export async function action({ request }) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const errors = {};

  // validate the fields
  if (typeof email !== "string" || !email.includes("@")) {
    errors.email = "That doesn't look like an email address";
  }

  if (typeof password !== "string" || password.length < 6) {
    errors.password = "Password must be > 6 characters";
  }

  // return data if we have errors
  if (Object.keys(errors).length) {
    return errors;
  }

  // otherwise create the user and redirect
  await createUser(email, password);
  return redirect("/dashboard");
}
```

see: https://reactrouter.com/en/main/hooks/use-action-data

これを自分が使わない理由は、何個かある。
まず、フォームの送信時と入力時のバリデーションロジックが分散されてしまうのが困る。
上の例は email, password を検証しているが、これと同じロジックを form の onBlur で実現したいとなるとロジックの持ち運びが辛い。
こういうときは react-hook-form などを使うこととなる。

一応、conform というライブラリがあって remix フレンドリーなソリューションはある。
が、例を見たら分かる通り zod のスキーマをお互い引き渡しており、力技感はある。
onBlur と submit の検証が別ファイルに分かれてしまう以上はこうなってしまう。

see: https://conform.guide/

もう一つ致命的なのは1ページに複数フォームがあるときの扱いだ。
action はどのフォームから送られてきたか分からなくなるのである。
そうなると button や hidden に intent というフィールドを混ぜて判別させるように公式は言っている。

see: https://reactrouter.com/en/main/route/action#handling-multiple-actions-per-route

こうなるとファイルやロジックが膨らむので正直やりたくない。例えば送信中フラグやエラーメッセージの管理で常に intent を key に持つ Map を引き回さないといけないとなったりして面倒だった。

1ページに1フォームしかなくて、エラーハンドリングも緩めで良いのならフォームサポートは爆速開発にちょうど良いものに思うが、顧客からの注文が多いような開発する場合はこれまで通り react-hook-form を選ぶかなぁというのが個人的な感想だ。

## まとめ

適材適所。自分は Router + Loader を使う。use が安定したら Router だけを使うと思う。
