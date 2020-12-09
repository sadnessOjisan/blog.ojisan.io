---
path: /context-reducer-custom-hook
created: "2020-12-10"
title: Context API と useReducer で custom hook を作る時のテンプレート
visual: "./visual.png"
tags: ["React"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

Context API と useReducer で custom hook を作る例が見つからなくて色々と思考錯誤をしていたのですが、現時点で自分なりにたどり着いた答えを紹介します。

## フォルダ構成とそれぞれの役割

context, reducer, hooks で分けています。ただこだわりはなく、実際にはフォルダ構成はなんでもいいと思いますし、手を抜きたい時は Context のファイルに reducer を書いたりしています。
それでも技術的な関心には分離できるのでそのように分けることを意識しています。

### context

Context の作成と Provider でラップできる関数を作ります。

```ts
import { createContext, Dispatch, ReactChild, useReducer } from "react"
import { inialState, reducer, State, ActionType } from "../reducer/user"

export const UserContext = createContext<State | undefined>(undefined)

export const UserUpdateContext = createContext<Dispatch<ActionType>>(null)

export function UserContextProvider({ children }: { children: ReactChild }) {
  const [user, dispatch] = useReducer(reducer, inialState)

  return (
    <UserContext.Provider value={user}>
      <UserUpdateContext.Provider value={dispatch}>
        {children}
      </UserUpdateContext.Provider>
    </UserContext.Provider>
  )
}
```

データの表示と取得系は別の Context に分けています。
これは再レンダリングの抑制に使えるテクニックであり、関心のある小さい単位で Context は管理します。

FYI: [脱 Redux を試みて失敗した話、その原因と対策について](https://blog.ojisan.io/datsu-redux-regret#%E5%86%8D%E3%83%AC%E3%83%B3%E3%83%80%E3%83%AA%E3%83%B3%E3%82%B0%E3%81%8C%E8%B5%B7%E3%81%8D%E3%82%8B-store-%E3%81%AF-props-%E3%81%A8%E3%81%97%E3%81%A6%E6%AC%B2%E3%81%97%E3%81%84)

Context のラッパーでは reducer から state を取得し埋め込んでおきます。(useReducer を使わないなら useState から持ってきた state でも良い。)
ラッパー関数を作ることで呼び出し側は 2 つの Provider を呼ばなくて済むので見通しはよくなります。
また、ラッパーを作りその中で reducer を呼び出すことで、reducer と context の関係を紐付けられます。
こうすることで Provider の階層を変える修正が入っても、呼び出し側は value の埋め込む階層を気にしなくて済むので修正もしやすいです。

View ではこのようにして Provider を呼び出します。

```ts
import { AppProps } from "next/app"
import { UserContextProvider } from "../context/userContext"

const App = ({ Component, pageProps }: AppProps) => (
  <>
    <UserContextProvider>
      <Component {...pageProps} />
    </UserContextProvider>
  </>
)

export default App
```

### reducer

reducer は 普通の reducer です。

```ts
import { User } from "../type/User"

const START_FETCH_USER = "START_FETCH_USER" as const
const SUCCESS_FETCH_USER = "SUCCESS_FETCH_USER" as const
const FAIL_FETCH_USER = "FAIL_FETCH_USER" as const

const startFetchUserAction = () => {
  return { type: START_FETCH_USER }
}

const successFetchUserAction = (user: User) => {
  return { type: SUCCESS_FETCH_USER, payload: user }
}

const failFetchUserAction = () => {
  return { type: FAIL_FETCH_USER }
}

export const actions = {
  startFetchUserAction,
  successFetchUserAction,
  failFetchUserAction,
}

export type ActionType =
  | ReturnType<typeof startFetchUserAction>
  | ReturnType<typeof successFetchUserAction>
  | ReturnType<typeof failFetchUserAction>

export type State =
  | undefined // before init
  | { isLoading: true; data: undefined } // loading
  | { isLoading: false; data: User } // success
  | { isLoading: false; data: undefined } // fail

export const inialState: State = undefined

export const reducer = (state: State, action: ActionType): State => {
  switch (action.type) {
    case START_FETCH_USER:
      return {
        ...state,
        isLoading: true,
        data: undefined,
      }
    case SUCCESS_FETCH_USER:
      return {
        ...state,
        isLoading: false,
        data: action.payload,
      }
    case FAIL_FETCH_USER:
      return {
        ...state,
        isLoading: false,
        data: undefined,
      }
    default:
      return state
  }
}
```

Cotext を関心ごとに作る以上は各 state は膨らまないはずで、useReducer を使わなくても useState で完結できるケースがほとんどだとは思います。
ただ、spread hell への対処が必要な場合に、もしビルドサイズの制約上 immer や normalizr のようなライブラリを入れられないのであれば、useReducer を使って reducer で正規化をする手があります。
正規化は reducer でやることでテストがしやすくなるので、正規化するときは useState ではなく useReducer を選んでいます。

(プロからすれば preact ですら重いという意見もありますが、)省ビルドサイズ環境での開発では preact が使え、preact には hooks 一式と ContextAPI があるので、バンドルサイズを抑えないといけないがそこそこ複雑な UI を持つものを開発せねばならないといった時に、Context + useReducer + custom hooks を使った開発方法に旨味が出てきます。

### hooks

hooks は View から渡されるイベントを dispatch に伝えたり、dispatch の結果を View に伝える役割を担います。
そのため View と Reducer にとってのクッションとなります。

```ts
import { useContext, useEffect, useState } from "react"
import { UserContext, UserUpdateContext } from "../context/userContext"
import { actions, State } from "../reducer/user"

export const useUserFetch = (): [State, () => void] => {
  const user = useContext(UserContext)
  const dispatch = useContext(UserUpdateContext)
  const [refetchIndex, setRefetchIndex] = useState(0)

  const refetch = () =>
    setRefetchIndex(prevRefetchIndex => prevRefetchIndex + 1)

  useEffect(() => {
    const fetchData = async () => {
      if (!dispatch) return
      dispatch(actions.startFetchUserAction())
      fetch("/api/user")
        .then(res => res.json())
        .then(data => dispatch(actions.successFetchUserAction(data)))
        .catch(() => dispatch(actions.failFetchUserAction()))
    }

    fetchData()
  }, [refetchIndex])

  return [user, refetch]
}
```

View で直接 dispatch が出てくると、その dispach にどんな action を渡せばいいか迷子になりやすいですが、dispach を View に渡さず hooks の中だけで完結させることで迷子になりやすい問題の解決を図ります。
useUserFetch という user 情報を fetch する hooks に閉じている限りは dispach の種類で迷子になることもないはずです。

## View からは hooks を呼ぶだけ

View は hooks にしか依存しないようにしています。
refetch を実行すると hooks 内から action を発行し、それを reducer が state に反映して View を書き換えています。

```ts
import { useUserFetch } from "../hooks/useUserFetch"

export default () => {
  const [userState, refetch] = useUserFetch()
  return (
    <div>
      {!userState ? (
        "init"
      ) : userState?.isLoading ? (
        <div>loading</div>
      ) : (
        <div>user name: {userState.data.name}</div>
      )}
      <button onClick={() => refetch()}>random fetch</button>
    </div>
  )
}
```

## おまけ

- ソースコード
  - https://github.com/sadnessOjisan/context-reducer-hooks
- デプロイしたもの
  - https://context-reducer-hooks.vercel.app/
