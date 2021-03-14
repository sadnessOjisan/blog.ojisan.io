---
path: /yew-redux-like-data-fetch
created: "2021-03-15"
title: yew での data fetch を redux っぽくやる
visual: "./visual.png"
tags: ["Rust", "yew"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

yew の [next バージョンの公式チュートリアルに data fetch に関する記述がある](https://yew.rs/docs/en/next/concepts/services/fetch)のですが、React ユーザとしては Not for me だったので別のやり方を試してみました。

もちろん 「yew に 別 FW での考え方を持ち込んで勝手に Not for Me とか言ってんじゃねぇ」とも思わなくもないのですが、yew の html マクロは JSX のように目に映るので、開発効率のためにも なるべく React で普段やっていることを取り入れていきたいなとも思ってのことです。

Not for me なのはこの箇所です。

```rust
match msg {
    GetLocation => {
        // 1. build the request
        let request = Request::get("http://api.open-notify.org/iss-now.json")
            .body(Nothing)
            .expect("Could not build request.");
        // 2. construct a callback
        let callback =
            self.link
            .callback(|response: Response<Json<Result<ISS, anyhow::Error>>>| {
                let Json(data) = response.into_body();
                Msg::ReceiveResponse(data)
            });
         // 3. pass the request and callback to the fetch service
        let task = FetchService::fetch(request, callback).expect("failed to start request");
        // 4. store the task so it isn't canceled immediately
        self.fetch_task = Some(task);
        // we want to redraw so that the page displays a 'fetching...' message to the user
        // so return 'true'
        true
    }
    ReceiveResponse(response) => {
        match response {
            Ok(location) => {
                self.iss = Some(location);
            }
            Err(error) => {
                self.error = Some(error.to_string())
            }
        }
        self.fetch_task = None;
        // we want to redraw so that the page displays the location of the ISS instead of
        // 'fetching...'
        true
    }
}
```

このうち、

- msg が GetLocation と ReceiveResponse しかない
- GetLocation を実行したコールバックを ReceiveResponse で処理する

という部分が Not for me です。
これはいわば fetch の Promise のメソッドチェーンの中で setState() して状態管理しているようなものです。
もちろんそのやり方も React like な方法で僕もよく使いますが、状態管理が複雑になってくるとリファクタリングしたくなるのも事実です。
なので、そうしなくていいようにしましょう。

yew は Msg を enum で管理し、その各 Msg をパターンマッチに食わせることで、処理を分類できます。
これをみた時僕は、「あっ、React や Redux でみる reducer だ！」と思いました。
だとしたら、msg は action として見たくなり、各 action は start, success, fail であって欲しいと思いました。
action は小さくちぎっておくと、将来的に複数の action をまとめて監視したり呼び出せたりできるので、なるべく小さく作っておきたいと考えています。

なので、そう書き換えます。

以降の例では Hackers News の API を使って開発します。
叩く API は https://hacker-news.firebaseio.com/v0/item/8863.json?print=pretty で、戻り値は

```json
{
  "by": "dhouston",
  "descendants": 71,
  "id": 8863,
  "kids": [9224],
  "score": 104,
  "time": 1175714200,
  "title": "My YC app: Dropbox - Throw away your USB drive",
  "type": "story",
  "url": "http://www.getdropbox.com/u/2/screencast.html"
}
```

です。

ただ簡単なデモをすだけなので、そのうち title しか使わず、受け取った JSON を Deserialize する serde の定義は、

```rust
#[derive(Deserialize, Debug, Clone)]
pub struct ResponseData {
    title: String,
}
```

です。

## チュートリアルを書き換えていく

### モデルの準備

次のようなモデルを用意します。

```rust
#[derive(Debug)]
pub struct Model {
    ft: Option<FetchTask>,
    is_loading: bool,
    data: Option<ResponseData>,
    link: ComponentLink<Self>,
    error: Option<String>,
}
```

これは React でいうと state に該当します。

### Msg の準備

そして Msg はこう定義します。

```rust
#[derive(Debug)]
pub enum Msg {
    StartFetch,
    SuccessFetch(ResponseData),
    FailFetch,
}
```

これは Redux でいうと Action Type の集まりに該当します。

### Msg の実装

この Msg を使って、上の Model を書き換えていきます。

その書き換える処理を担うのが、update 関数です。

```rust
fn update(&mut self, msg: Self::Message) -> bool {
    match msg {
        Msg::StartFetch => {
        }
        Msg::SuccessFetch(response) => {
        }
        Msg::FailFetch => {
        }
    }
    true
}
```

この関数が Component トレイトとして実装されると、メッセージごとに呼び出されます。
これは Yew に実装されているライフサイクルメソッドの一つです。

では、それぞれのメッセージを受けたときの処理を書いていきましょう。

```rust
fn update(&mut self, msg: Self::Message) -> bool {
    match msg {
        Msg::StartFetch => {
            let request = Request::get(
                "https://hacker-news.firebaseio.com/v0/item/8863.json?print=pretty",
            )
            .body(Nothing)
            .expect("Could not build request.");

            // callbackの組み立て
            let callback = self.link.callback(
                response: Response<Json<Result<ResponseData, anyhow::Error>>>| {
                    let Json(data) = response.into_body();
                    match data {
                        Ok(data) => Msg::SuccessFetch(data),
                        Err(_) => {
                            log::info!("{:?}", data);
                            Msg::FailFetch
                        }
                    }
                },
            );
            let task = FetchService::fetch(request, callback).expect("failed to start request");
            self.is_loading = true;
            self.ft = Some(task)
        }
        Msg::SuccessFetch(response) => {
            self.is_loading = false;
            self.data = Some(response);
        }
        Msg::FailFetch => {
            self.error = Some("error".to_string());
            self.is_loading = false;
        }
    }
    true
}
```

ここでは注目したいのは StartFetch メッセージを受けたときの処理が最終的に実行するコールバック関数の中で Success と Fail を呼び出しています。
まるで redux-saga で `STSRT_FETCH` action を take して、`SUCCESS_FETCH` や `FAIL_FETCH` を呼び出しているような感じですね。

そうすればあとは `SuccessFetch` `FailFetch` それぞれのメッセージを受け取った時に state を更新してくれます。

fetch 中には一点注意点があり、それは fetch の時に

```rust
self.ft = Some(task)
```

を忘れないようにするということです。

fetchTask は model の中に持たせておかないと、data fetch に失敗します。
この fetchTask を見ていれば、これがないときは data loading とも判断できるので、loading フラグで loading を表現するのはモヤモヤもするのですが、それはいわば 「react の世界で data がないときは loading 中」といっているようにも取れるので、明示的に loading/error というフラグを使っていこうと思います。

### View の作成

これで状態が書き換わるようになりました。
その状態が書き換わった画面を作成します。

```rust
fn view(&self) -> Html {
    html! {
        <div class="container">
        {
           match (self.is_loading, self.data.as_ref(), self.error.as_ref()) {
               (true, _, _) => {
                self.fetching()
               }
               (false, Some(ResponseData), None) => {
                self.success()
               }
               (false, None, None) => {
                self.fail()
               }
               (_,_,_)=>{
                self.fail()
               }
           }
       }
       <button onclick=self.link.callback(|_| Msg::StartFetch)>{"refetch"}</button>
      </div>
    }
}
```

状態によって画面を出しわけています。

これらはそれぞれ

```rust
impl Model {
    fn success(&self) -> Html {
        match self.data {
            Some(ref res) => {
                html! {
                    <>
                        <p class="sum">{&res.title}</p>
                    </>
                }
            }
            None => {
                html! {
                     <>{"none"}</>
                }
            }
        }
    }

    fn fetching(&self) -> Html {
        html! {
            <div>{"fetching"}</div>
        }
    }

    fn fail(&self) -> Html {
        html! {
            <div>{"fail"}</div>
        }
    }
}
```

といった関数です。

これらの関数はパターンマッチで出し分けられています。
そのためどういう状態の時にどういう画面を出すかという分岐が書きやすく、これは僕が yew を気に入っている箇所でもあります。
TypeScript のように

```ts
type PageState =
  | { loading: true }
  | { loading: false; data: any }
  | { loading: false; error: string }
```

のような型定義を書かなくても、ページがとりうる状態に対する実装の抜け漏れを防ぎやすいです。

## ソースコード

https://github.com/ojisan-toybox/yew-data-fetch
