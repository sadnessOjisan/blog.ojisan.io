---
path: /axum-response
created: "2023-10-12"
title: axum の router は hyper の上でどのような仕組みでレスポンスを返しているのか
visual: "./visual.png"
tags: [rust, tower, axum]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## 宣伝

10/21 に [rust.tokyo](http://rust.tokyo) で[カニさんタワーバトル](https://rust.tokyo/2023/lineup/2)という発表をする。その発表の中では axum がどういう仕組みで動いているかの解説をするが、時間の都合上全部は扱えないので先に書けるところをブログに書いてしまおうと思う。当日の説明は図解が主になるのでわかりやすいと思うが、こちらはとりあえずコードを追った事実をつらつらと書いていく。当日の発表に照らし合わせて読まれる使われ方を期待している。

また、hyper や tower について知っていることが前提の内容になっているが、これらに慣れていないのなら

- https://blog.ojisan.io/why-hyper/
- https://blog.ojisan.io/about-tower/

を読んで欲しい。

## tl;dr

- axum の Router は tower の Service
- route 定義でパスとハンドラをわたす。ハンドラをメソッド名で包むとそれがEndpointという構造体になり、route関数でパスごとに登録される。このEndpointもtowerのService
- Router の Service 実装は tower の Oneshot という構造体にEndpoint実装を入れて返す
- Oneshot は Future が実装されていて、poll で Oneshot に渡された service を call し、返ってきたFutureを解決してレスポンスとして返す
- Oneshot 内でserviceを呼び出すときに into_response も呼び出されている。文字列やResultを関数から返すだけでいい感じのレスポンスになる魔法はここにある。

## axum と hyper の分離

これからコードを読んでいく。使った axum のバージョンは 0.6 だ。

おそらく axum でサーバーを書くとその最小構成は以下の通りになるだろう。

```rust
#[tokio::main]
async fn main() {
    let app = Router::new().route("/", get(root)).layer(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
```

実は axum::Server の時点で hyper のコードとなる。なので、サーバーにおける axum 純粋の部分というのはとても少ない。 `.serve` は hyper 側のコードで、これは引数にRouter を取る。このRouterはaxumに実装があるが、これは tower の service を実装している。

## Router

axum では Router を

```rust
Router::new().route("/", get(root))
```

で作る。router は `pub fn route(mut self, path: &str, method_router: MethodRouter<S, B>) -> Self` であり Route を返す。つまり Route が tower の service として hyper に連携される。それを一つ一つ見ていこう。

### Router::call

Router の Service 実装は次の通りだ。

```rust
pub struct Router<S = (), B = Body> {
    path_router: PathRouter<S, B, false>,
    fallback_router: PathRouter<S, B, true>,
    default_fallback: bool,
    catch_all_fallback: Fallback<S, B>,
}

impl<B> Service<Request<B>> for Router<(), B>
where
    B: HttpBody + Send + 'static,
{
    type Response = Response;
    type Error = Infallible;
    type Future = RouteFuture<B, Infallible>;

    #[inline]
    fn poll_ready(&mut self, _: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    #[inline]
    fn call(&mut self, req: Request<B>) -> Self::Future {
        self.call_with_state(req, ())
    }
}
```

service としての機能を追っていきたいので call を追っていく。

#### call_with_state(Router)

そこでは同じく Router に impl された call_with_state を呼び出している。

```rust
pub(crate) fn call_with_state(
        &mut self,
        mut req: Request<B>,
        state: S,
    ) -> RouteFuture<B, Infallible> {
        // required for opaque routers to still inherit the fallback
        // TODO(david): remove this feature in 0.7
        if !self.default_fallback {
            req.extensions_mut().insert(SuperFallback(SyncWrapper::new(
                self.fallback_router.clone(),
            )));
        }

        match self.path_router.call_with_state(req, state) {
            Ok(future) => future,
            Err((mut req, state)) => {
                let super_fallback = req
                    .extensions_mut()
                    .remove::<SuperFallback<S, B>>()
                    .map(|SuperFallback(path_router)| path_router.into_inner());

                if let Some(mut super_fallback) = super_fallback {
                    match super_fallback.call_with_state(req, state) {
                        Ok(future) => return future,
                        Err((req, state)) => {
                            return self.catch_all_fallback.call_with_state(req, state);
                        }
                    }
                }

                match self.fallback_router.call_with_state(req, state) {
                    Ok(future) => future,
                    Err((req, state)) => self.catch_all_fallback.call_with_state(req, state),
                }
            }
        }
    }
```

正常系の流れとしては、 `self.path_router.call_with_state` で Routerのpath_routerフィールドにある PathRouter の `call_with_state` を呼び出している。

#### call_with_state(PathRouter)

なので PathRouter の impl を辿ると、

```rust
pub(super) struct PathRouter<S, B, const IS_FALLBACK: bool> {
    routes: HashMap<RouteId, Endpoint<S, B>>,
    node: Arc<Node>,
    prev_route_id: RouteId,
}

#[allow(clippy::large_enum_variant)]
enum Endpoint<S, B> {
    MethodRouter(MethodRouter<S, B>),
    Route(Route<B>),
}

pub(super) fn call_with_state(
        &mut self,
        mut req: Request<B>,
        state: S,
    ) -> Result<RouteFuture<B, Infallible>, (Request<B>, S)> {
        #[cfg(feature = "original-uri")]
        {
            use crate::extract::OriginalUri;

            if req.extensions().get::<OriginalUri>().is_none() {
                let original_uri = OriginalUri(req.uri().clone());
                req.extensions_mut().insert(original_uri);
            }
        }

        let path = req.uri().path().to_owned();

        match self.node.at(&path) {
            Ok(match_) => {
                let id = *match_.value;

                if !IS_FALLBACK {
                    #[cfg(feature = "matched-path")]
                    crate::extract::matched_path::set_matched_path_for_request(
                        id,
                        &self.node.route_id_to_path,
                        req.extensions_mut(),
                    );
                }

                url_params::insert_url_params(req.extensions_mut(), match_.params);

                let endpont = self
                    .routes
                    .get_mut(&id)
                    .expect("no route for id. This is a bug in axum. Please file an issue");

                match endpont {
                    Endpoint::MethodRouter(method_router) => {
                        Ok(method_router.call_with_state(req, state))
                    }
                    Endpoint::Route(route) => Ok(route.clone().call(req)),
                }
            }
            // explicitly handle all variants in case matchit adds
            // new ones we need to handle differently
            Err(
                MatchError::NotFound
                | MatchError::ExtraTrailingSlash
                | MatchError::MissingTrailingSlash,
            ) => Err((req, state)),
        }
```

とある。PathRouter の node と routes に path を元に登録されたハンドラを探し出して、

```rust
match endpont {
  Endpoint::MethodRouter(method_router) => {
    Ok(method_router.call_with_state(req, state))
  }
  Endpoint::Route(route) => Ok(route.clone().call(req)),
}
```

で呼び出している。正常系は call_with_state の方なのでこちらを追ってみよう。

#### call_with_state(MethodRouter)

```rust

pub struct MethodRouter<S = (), B = Body, E = Infallible> {
    get: MethodEndpoint<S, B, E>,
    head: MethodEndpoint<S, B, E>,
    delete: MethodEndpoint<S, B, E>,
    options: MethodEndpoint<S, B, E>,
    patch: MethodEndpoint<S, B, E>,
    post: MethodEndpoint<S, B, E>,
    put: MethodEndpoint<S, B, E>,
    trace: MethodEndpoint<S, B, E>,
    fallback: Fallback<S, B, E>,
    allow_header: AllowHeader,
}

enum MethodEndpoint<S, B, E> {
    None,
    Route(Route<B, E>),
    BoxedHandler(BoxedIntoRoute<S, B, E>),
}

pub(crate) fn call_with_state(&mut self, req: Request<B>, state: S) -> RouteFuture<B, E> {
        macro_rules! call {
            (
                $req:expr,
                $method:expr,
                $method_variant:ident,
                $svc:expr
            ) => {
                if $method == Method::$method_variant {
                    match $svc {
                        MethodEndpoint::None => {}
                        MethodEndpoint::Route(route) => {
                            return RouteFuture::from_future(route.oneshot_inner($req))
                                .strip_body($method == Method::HEAD);
                        }
                        MethodEndpoint::BoxedHandler(handler) => {
                            let mut route = handler.clone().into_route(state);
                            return RouteFuture::from_future(route.oneshot_inner($req))
                                .strip_body($method == Method::HEAD);
                        }
                    }
                }
            };
        }

        let method = req.method().clone();

        // written with a pattern match like this to ensure we call all routes
        let Self {
            get,
            head,
            delete,
            options,
            patch,
            post,
            put,
            trace,
            fallback,
            allow_header,
        } = self;

        call!(req, method, HEAD, head);
        call!(req, method, HEAD, get);
        call!(req, method, GET, get);
        call!(req, method, POST, post);
        call!(req, method, OPTIONS, options);
        call!(req, method, PATCH, patch);
        call!(req, method, PUT, put);
        call!(req, method, DELETE, delete);
        call!(req, method, TRACE, trace);

        let future = fallback.call_with_state(req, state);

        match allow_header {
            AllowHeader::None => future.allow_header(Bytes::new()),
            AllowHeader::Skip => future,
            AllowHeader::Bytes(allow_header) => future.allow_header(allow_header.clone().freeze()),
        }
    }
```

MethodRouter には各 path ごとの get, post, put, … などに対応するハンドラ関数が登録されている。それを call! マクロで呼び出している。call マクロでは `return RouteFuture::from_future(route.oneshot_inner($req))` としてリクエストの実行結果を返却している。

#### oneshot_inner (Route)

まず、RouteはRouterとは別の概念であることに注意しよう。名前がにすぎている。

`oneshot_inner` の呼び出しを追っていくと、

```rust
pub(crate) fn oneshot_inner(
        &mut self,
        req: Request<B>,
    ) -> Oneshot<BoxCloneService<Request<B>, Response, E>, Request<B>> {
        self.0.clone().oneshot(req)
    }
```

```rust
fn oneshot(self, req: Request) -> Oneshot<Self, Request>
    where
        Self: Sized,
    {
        Oneshot::new(self, req)
    }
```

```rust
impl<S, Req> Oneshot<S, Req>
where
    S: Service<Req>,
{
    #[allow(missing_docs)]
    pub fn new(svc: S, req: Req) -> Self {
        Oneshot {
            state: State::not_ready(svc, Some(req)),
        }
    }
}
```

として Oneshot 構造体を返している。これは tower に定義されている構造体だ。

```rust
pin_project! {
    /// A [`Future`] consuming a [`Service`] and request, waiting until the [`Service`]
    /// is ready, and then calling [`Service::call`] with the request, and
    /// waiting for that [`Future`].
    #[derive(Debug)]
    pub struct Oneshot<S: Service<Req>, Req> {
        #[pin]
        state: State<S, Req>,
    }
}
```

Oneshotは文字通り一回切りの実行を表現できる構造体だ。これは oneshot_inner → oneshot → new といった関数の呼び出しの流れをみると、これは PathRouterのroutesのRoute を包んで初期化されている。

この Oneshot は Future が実装されている。

```rust
impl<S, Req> Future for Oneshot<S, Req>
where
    S: Service<Req>,
{
    type Output = Result<S::Response, S::Error>;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let mut this = self.project();
        loop {
            match this.state.as_mut().project() {
                StateProj::NotReady { svc, req } => {
                    let _ = ready!(svc.poll_ready(cx))?;
                    let f = svc.call(req.take().expect("already called"));
                    this.state.set(State::called(f));
                }
                StateProj::Called { fut } => {
                    let res = ready!(fut.poll(cx))?;
                    this.state.set(State::Done);
                    return Poll::Ready(Ok(res));
                }
                StateProj::Done => panic!("polled after complete"),
            }
        }
    }
}
```

Oneshotの定義からして pin projection されている。初期化時は NotReady で初期化されているのでそちらの処理から追うと、tower の service が call されている。tower の定義からして service の call は future が返る。これを Called としてその future を格納しておき、これが解決されるまで loop で呼び出し、最終的に解決済みの future を `return Poll::Ready(Ok(res));` で関数外に返している。

#### Router のサービス実装から予想できる axum の Router 実装と疑問

まず、最終的に oneshot の call は [svc.call](http://svc.call) の future を poll した結果を res として返す処理だ。これが HTTP リクエストのレスポンスになることが予想される。そして svc.call の svc は当然 tower の service な訳だが、これの実体はエントリポイントからの呼び出しを辿ると MethodEndpoint の Route であることが分かる。なのでこの Route も tower の Servie を実装していると考えられる。そして MethodEndpoint は PathRouter の routes から path 情報を元に取り出した MethodRouter から作られる。そしてこの MethodEndpoint にユーザーがルーターに定義したハンドラ（このパスにこのメソッドでアクセスが来たらこのような処理をしてください関数の実体）が入ってきているが、これが最終的に oneshot 内で service として動作するために、ハンドラをサービス化している箇所がどこかにあるはずである。これに関しては「このパスにこのメソッドでアクセスが来たらこのような処理をしてください」を登録する箇所があるはずなのでそれを見ていくと良さそうだ。

これらの仮説を持って続きを読んでいこう。

### route

その登録箇所こそが `.route("/", get(root));` 。見た感じは `/` というパスに get がきたら root という関数を実行してくださいという登録をしているように見える。読んでいこう。

#### route(Router)

これは単純に path_routerの route に path と method_router を渡して呼び出しているだけだ。path は `/` の部分で、method_router は `get(root)` の部分だ。

```rust
pub struct Router<S = (), B = Body> {
    path_router: PathRouter<S, B, false>,
    fallback_router: PathRouter<S, B, true>,
    default_fallback: bool,
    catch_all_fallback: Fallback<S, B>,
}

pub fn route(mut self, path: &str, method_router: MethodRouter<S, B>) -> Self {
        panic_on_err!(self.path_router.route(path, method_router));
        self
    }
```

#### route(pathRouter)

```rust
pub(super) struct PathRouter<S, B, const IS_FALLBACK: bool> {
    routes: HashMap<RouteId, Endpoint<S, B>>,
    node: Arc<Node>,
    prev_route_id: RouteId,
}

pub(super) fn route(
        &mut self,
        path: &str,
        method_router: MethodRouter<S, B>,
    ) -> Result<(), Cow<'static, str>> {
        fn validate_path(path: &str) -> Result<(), &'static str> {
            if path.is_empty() {
                return Err("Paths must start with a `/`. Use \"/\" for root routes");
            } else if !path.starts_with('/') {
                return Err("Paths must start with a `/`");
            }

            Ok(())
        }

        validate_path(path)?;

        let id = self.next_route_id();

        let endpoint = if let Some((route_id, Endpoint::MethodRouter(prev_method_router))) = self
            .node
            .path_to_route_id
            .get(path)
            .and_then(|route_id| self.routes.get(route_id).map(|svc| (*route_id, svc)))
        {
            // if we're adding a new `MethodRouter` to a route that already has one just
            // merge them. This makes `.route("/", get(_)).route("/", post(_))` work
            let service = Endpoint::MethodRouter(
                prev_method_router
                    .clone()
                    .merge_for_path(Some(path), method_router),
            );
            self.routes.insert(route_id, service);
            return Ok(());
        } else {
            Endpoint::MethodRouter(method_router)
        };

        self.set_node(path, id)?;
        self.routes.insert(id, endpoint);

        Ok(())
    }
```

call_with_state(PathRouter)の実装では path 情報を元に routes から MehodEndpoint を取り出していた。反対に route(PathRouter) では path 情報に対して MehodEndpoint を登録しているのである。

この MehodEndpoint が self.routes としていろいろなところから呼ばれるようになる。

#### router 登録から見えてくる MethodRouterへの疑問と仮説

さて、ここで path と handler の組み合わせを登録する関数を見た。残る謎は handler の実態についてだ。これまでにわかっている情報としては handler は `MethodRouter` と呼ばれている。そしてこれは tower の service としても動作する。

そしてユーザーが実装するときはそんなことを意識して実装していない。つまり `get()` や `post()` のような関数で包むことでそのような能力を獲得していると考えられる。

### get/post/patch/delete/head…

これは包んだ handler の実行を call_with_state の呼び出しでできるようにしてくれる。では

```rust
let app = Router::new().route("/", get(root))
```

の get の部分を見ていく。

#### top_level_handler_fn

これは

```rust
top_level_handler_fn!(delete, DELETE);
top_level_handler_fn!(get, GET);
top_level_handler_fn!(head, HEAD);
top_level_handler_fn!(options, OPTIONS);
top_level_handler_fn!(patch, PATCH);
top_level_handler_fn!(post, POST);
top_level_handler_fn!(put, PUT);
top_level_handler_fn!(trace, TRACE);
```

で定義されている。

````rust
macro_rules! top_level_handler_fn {
    (
        $name:ident, GET
    ) => {
        top_level_handler_fn!(
            /// Route `GET` requests to the given handler.
            ///
            /// ## Example
            ///
            /// ```rust
            /// use axum::{
            ///     routing::get,
            ///     Router,
            /// };
            ///
            /// async fn handler() {}
            ///
            /// // Requests to `GET /` will go to `handler`.
            /// let app = Router::new().route("/", get(handler));
            /// ## async {
            /// ## axum::Server::bind(&"".parse().unwrap()).serve(app.into_make_service()).await.unwrap();
            /// ## };
            /// ```
            ///
            /// Note that `get` routes will also be called for `HEAD` requests but will have
            /// the response body removed. Make sure to add explicit `HEAD` routes
            /// afterwards.
            $name,
            GET
        );
    };

    (
        $name:ident, $method:ident
    ) => {
        top_level_handler_fn!(
            #[doc = concat!("Route `", stringify!($method) ,"` requests to the given handler.")]
            ///
            /// See [`get`] for an example.
            $name,
            $method
        );
    };

    (
        $(#[$m:meta])+
        $name:ident, $method:ident
    ) => {
        $(#[$m])+
        pub fn $name<H, T, S, B>(handler: H) -> MethodRouter<S, B, Infallible>
        where
            H: Handler<T, S, B>,
            B: HttpBody + Send + 'static,
            T: 'static,
            S: Clone + Send + Sync + 'static,
        {
            on(MethodFilter::$method, handler)
        }
    };
}
````

正常系の実態としては

```rust
(
        $(#[$m:meta])+
        $name:ident, $method:ident
    ) => {
        $(#[$m])+
        pub fn $name<H, T, S, B>(handler: H) -> MethodRouter<S, B, Infallible>
        where
            H: Handler<T, S, B>,
            B: HttpBody + Send + 'static,
            T: 'static,
            S: Clone + Send + Sync + 'static,
        {
            on(MethodFilter::$method, handler)
        }
    };
```

になるが、シグネチャにだけ注目すると MethodRouter を返してくれる。つまり get で包んだものは MethodRouter となることが分かる。

#### on

on の呼び出しをみると

```rust
pub fn on<H, T, S, B>(filter: MethodFilter, handler: H) -> MethodRouter<S, B, Infallible>
where
    H: Handler<T, S, B>,
    B: HttpBody + Send + 'static,
    T: 'static,
    S: Clone + Send + Sync + 'static,
{
    MethodRouter::new().on(filter, handler)
}
```

```rust
pub struct MethodRouter<S = (), B = Body, E = Infallible> {
    get: MethodEndpoint<S, B, E>,
    head: MethodEndpoint<S, B, E>,
    delete: MethodEndpoint<S, B, E>,
    options: MethodEndpoint<S, B, E>,
    patch: MethodEndpoint<S, B, E>,
    post: MethodEndpoint<S, B, E>,
    put: MethodEndpoint<S, B, E>,
    trace: MethodEndpoint<S, B, E>,
    fallback: Fallback<S, B, E>,
    allow_header: AllowHeader,
}

pub fn on<H, T>(self, filter: MethodFilter, handler: H) -> Self
    where
        H: Handler<T, S, B>,
        T: 'static,
        S: Send + Sync + 'static,
    {
        self.on_endpoint(
            filter,
            MethodEndpoint::BoxedHandler(BoxedIntoRoute::from_handler(handler)),
        )
    }
```

となっている。

#### impl Service for MethodRouter

また MethodRouter は Service でもある。

```rust
impl<B, E> Service<Request<B>> for MethodRouter<(), B, E>
where
    B: HttpBody + Send + 'static,
{
    type Response = Response;
    type Error = E;
    type Future = RouteFuture<B, E>;

    #[inline]
    fn poll_ready(&mut self, _cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    #[inline]
    fn call(&mut self, req: Request<B>) -> Self::Future {
        self.call_with_state(req, ())
    }
}
```

これは先に見た通り MethodRouter の call_with_state を呼んでいる。つまり oneshot へと繋がっていく処理だ。

#### on_endpoint(MethodRouter)

```rust
fn on_endpoint(mut self, filter: MethodFilter, endpoint: MethodEndpoint<S, B, E>) -> Self {
        // written as a separate function to generate less IR
        #[track_caller]
        fn set_endpoint<S, B, E>(
            method_name: &str,
            out: &mut MethodEndpoint<S, B, E>,
            endpoint: &MethodEndpoint<S, B, E>,
            endpoint_filter: MethodFilter,
            filter: MethodFilter,
            allow_header: &mut AllowHeader,
            methods: &[&'static str],
        ) where
            MethodEndpoint<S, B, E>: Clone,
            S: Clone,
        {
            if endpoint_filter.contains(filter) {
                if out.is_some() {
                    panic!(
                        "Overlapping method route. Cannot add two method routes that both handle \
                         `{method_name}`",
                    )
                }
                *out = endpoint.clone();
                for method in methods {
                    append_allow_header(allow_header, method);
                }
            }
        }

        set_endpoint(
            "GET",
            &mut self.get,
            &endpoint,
            filter,
            MethodFilter::GET,
            &mut self.allow_header,
            &["GET", "HEAD"],
        );

        ...

        self
    }
```

\*out = endpoint.clone(); の部分で引数に渡された `&mut self.get,` を書き換えていく。こうすることで処理の登録をしていく。ではその肝心のendpointとは何なのか見ていこう。

#### Handler

ここでエントリポイントのgetの引数でもあり、on, from_handler まで渡ってきている Handler について見ていく。

```rust
pub trait Handler<T, S, B = Body>: Clone + Send + Sized + 'static {
    /// The type of future calling this handler returns.
    type Future: Future<Output = Response> + Send + 'static;

    /// Call the handler with the given request.
    fn call(self, req: Request<B>, state: S) -> Self::Future;

    fn layer<L, NewReqBody>(self, layer: L) -> Layered<L, Self, T, S, B, NewReqBody>
    where
        L: Layer<HandlerService<Self, T, S, B>> + Clone,
        L::Service: Service<Request<NewReqBody>>,
    {
        Layered {
            layer,
            handler: self,
            _marker: PhantomData,
        }
    }

    /// Convert the handler into a [`Service`] by providing the state
    fn with_state(self, state: S) -> HandlerService<Self, T, S, B> {
        HandlerService::new(self, state)
    }
}

```

Handler の定義は上記のようだが、通常私たちがget, postなどの関数にわたす定義したハンドラは、このようなtraitを実装していない。ただ関数をわたすだけだ。どうしてgetにそのような関数を渡せるかというと、

```rust
impl<F, Fut, Res, S, B> Handler<((),), S, B> for F
where
    F: FnOnce() -> Fut + Clone + Send + 'static,
    Fut: Future<Output = Res> + Send,
    Res: IntoResponse,
    B: Send + 'static,
{
    type Future = Pin<Box<dyn Future<Output = Response> + Send>>;

    fn call(self, _req: Request<B>, _state: S) -> Self::Future {
        Box::pin(async move { self().await.into_response() })
    }
}
```

として関数に対してHandlerを実装しているからだ。なので自分達が定義したハンドラに対して

```rust
root.call
```

のような呼び出せるし、それはエディタでも確かめられる。

ここで分かるのは、ユーザーが定義したハンドラは from_handlerまでHandlerとして伝わっているということだ。

#### BoxedIntoRoute::from_handler

from_handlerではこのハンドラ関数を保持する構造体を作る。

```rust
pub(crate) trait ErasedIntoRoute<S, B, E>: Send {
    fn clone_box(&self) -> Box<dyn ErasedIntoRoute<S, B, E>>;

    fn into_route(self: Box<Self>, state: S) -> Route<B, E>;

    fn call_with_state(self: Box<Self>, request: Request<B>, state: S) -> RouteFuture<B, E>;
}

pub(crate) struct BoxedIntoRoute<S, B, E>(Box<dyn ErasedIntoRoute<S, B, E>>);

pub(crate) struct MakeErasedHandler<H, S, B> {
    pub(crate) handler: H,
    pub(crate) into_route: fn(H, S) -> Route<B>,
}

impl<S, B> BoxedIntoRoute<S, B, Infallible>
where
    S: Clone + Send + Sync + 'static,
    B: Send + 'static,
{
    pub(crate) fn from_handler<H, T>(handler: H) -> Self
    where
        H: Handler<T, S, B>,
        T: 'static,
        B: HttpBody,
    {
        Self(Box::new(MakeErasedHandler {
            handler,
            into_route: |handler, state| Route::new(Handler::with_state(handler, state)),
        }))
    }
}
```

```rust
fn with_state(self, state: S) -> HandlerService<Self, T, S, B> {
        HandlerService::new(self, state)
    }
```

この結果、BoxedIntoRoute という構造体にハンドラ関数を登録し、それをリターンしてくれる。ここで返された ハンドラ登録済みのBoxedIntoRouteがEndpointとしてon_endpointでMethodEndpoint に登録されるのである。

### データの流れ

つまりは Route 自体は tower のサービスでそれは、request を元に登録済みの routes から OneShot を取り出し、その結果 RouteFuture を返す。route は get で作り出した MehotdRouter をパスとメソッドごとに登録する。このMehotdRouterにはユーザー定義のハンドラが保存されている。MehotdRouter 自体は tower の service になっており、これは RouteFuture の poll の中で呼ばれる。RouteFutureは tower の Oneshot として実装されていて、それは Future が実装されているから poll を持ち、その poll は渡された tower service を call し、その戻り値の Future を解決する。この tower service こそが MehotdRouter の Rotue 実装であり、ユーザー定義のハンドラを持つ。そのようにしてユーザー登録のハンドラが呼び出される。

## IntoResponseで文字列やResultからHTTPレスポンスが作られる

ここまでの処理の流れがわかると axum の目玉機能であるIntoResponseがどう実現されているかがわかるのでそれを見ていこう。

### IntoResponse

axum では 文字列やResultをハンドラから返すと、いい感じのレスポンスに変換される。これを実現しているのが IntoResponse という仕組みだ。対象となる文字列や Result に IntoResponse trait を実装することでResponseをカスタマイズできる。そして文字列やResultはIntoResponseがデフォルト実装されているので、セットしなくてもよしなにいい感じの値も返すことができる。

```rust
ub trait IntoResponse {
    /// Create a response.
    fn into_response(self) -> Response;
}

impl IntoResponse for StatusCode {
    fn into_response(self) -> Response {
        let mut res = ().into_response();
        *res.status_mut() = self;
        res
    }
}

impl IntoResponse for () {
    fn into_response(self) -> Response {
        Empty::new().into_response()
    }
}

impl<T, E> IntoResponse for Result<T, E>
where
    T: IntoResponse,
    E: IntoResponse,
{
    fn into_response(self) -> Response {
        match self {
            Ok(value) => value.into_response(),
            Err(err) => err.into_response(),
        }
    }
}

impl IntoResponse for &'static str {
    fn into_response(self) -> Response {
        println!("call into_response");
        Cow::Borrowed(self).into_response()
    }
}
```

IntoResponse を実装しているだけでいい感じのレスポンスが返るような仕組みがあるというのは axum 上では FW が into_response を呼び出しているということだ。

### MethodRouter

まず axum の Router では Endpoint である MethodRouter は `get: MethodEndpoint<S, B, E>` のようにして

```rust
enum MethodEndpoint<S, B, E> {
    None,
    Route(Route<B, E>),
    BoxedHandler(BoxedIntoRoute<S, B, E>),
}
```

を持つ。これは get/post/delete… などを呼び出した時の

```rust
pub fn on<H, T>(self, filter: MethodFilter, handler: H) -> Self
    where
        H: Handler<T, S, B>,
        T: 'static,
        S: Send + Sync + 'static,
    {
        self.on_endpoint(
            filter,
            MethodEndpoint::BoxedHandler(BoxedIntoRoute::from_handler(handler)),
        )
    }
```

で作られる。この from_handler は

```rust
impl<S, B> BoxedIntoRoute<S, B, Infallible>
where
    S: Clone + Send + Sync + 'static,
    B: Send + 'static,
{
    pub(crate) fn from_handler<H, T>(handler: H) -> Self
    where
        H: Handler<T, S, B>,
        T: 'static,
        B: HttpBody,
    {
        Self(Box::new(MakeErasedHandler {
            handler,
            into_route: |handler, state| Route::new(Handler::with_state(handler, state)),
        }))
    }
}
```

となっており、Router::new で Routing を登録している。この Router::new は

```rust
pub(crate) fn new<T>(svc: T) -> Self
    where
        T: Service<Request<B>, Error = E> + Clone + Send + 'static,
        T::Response: IntoResponse + 'static,
        T::Future: Send + 'static,
    {
        Self(BoxCloneService::new(svc.map_response(|s| {
            IntoResponse::into_response(s)
        })))
    }
```

となっており、渡された handler の結果を into_response で map している。そのためこれがレスポンスをよしなにしてくれている部分だと思う。

しかし疑問に思う部分もある。newは定義時に実行されるので、レスポンスが渡ってくるたびに呼ばれるものではない。そのため本当にこの部分が変換しているとは思えないのである。

### Route

そこでRouter定義を全体から見てみると、これも tower の Serviceだ。

```rust
impl<B, E> Service<Request<B>> for Route<B, E>
where
    B: HttpBody,
{
    type Response = Response;
    type Error = E;
    type Future = RouteFuture<B, E>;

    #[inline]
    fn poll_ready(&mut self, _cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    #[inline]
    fn call(&mut self, req: Request<B>) -> Self::Future {
        RouteFuture::from_future(self.oneshot_inner(req))
    }
}
```

これは

```rust
pub(crate) fn oneshot_inner(
        &mut self,
        req: Request<B>,
    ) -> Oneshot<BoxCloneService<Request<B>, Response, E>, Request<B>> {
        self.0.clone().oneshot(req)
    }
```

```rust
fn oneshot(self, req: Request) -> Oneshot<Self, Request>
    where
        Self: Sized,
    {
        Oneshot::new(self, req)
    }
```

と呼び出され、

```rust
impl<S, Req> Oneshot<S, Req>
where
    S: Service<Req>,
{
    #[allow(missing_docs)]
    pub fn new(svc: S, req: Req) -> Self {
        Oneshot {
            state: State::not_ready(svc, Some(req)),
        }
    }
}
```

として svc 部分に `BoxCloneService<Request<B>, Response, E>` , req にリクエスト情報が入る。

### MapResponse

そしてこの `BoxCloneService<Request<B>, Response, E>` の部分は

```rust
pub(crate) fn new<T>(svc: T) -> Self
    where
        T: Service<Request<B>, Error = E> + Clone + Send + 'static,
        T::Response: IntoResponse + 'static,
        T::Future: Send + 'static,
    {
        Self(BoxCloneService::new(svc.map_response(|s| {
            IntoResponse::into_response(s)
        })))
    }
```

```rust
fn map_response<F, Response>(self, f: F) -> MapResponse<Self, F>
    where
        Self: Sized,
        F: FnOnce(Self::Response) -> Response + Clone,
    {
        println!("map_response");
        MapResponse::new(self, f)
    }
```

```rust
pub fn new(inner: S, f: F) -> Self {
        MapResponse { f, inner }
    }
```

だ。

そしてこの MapResponse も Service だ。

```rust
impl<S, F, Request, Response> Service<Request> for MapResponse<S, F>
where
    S: Service<Request>,
    F: FnOnce(S::Response) -> Response + Clone,
{
    type Response = Response;
    type Error = S::Error;
    type Future = MapResponseFuture<S::Future, F>;

    #[inline]
    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    #[inline]
    fn call(&mut self, request: Request) -> Self::Future {
        println!("MapResponse::service::call");
        MapResponseFuture::new(self.inner.call(request).map_ok(self.f.clone()))
    }
}
```

つまりBoxCloneServiceに包まれた中身は towerのServiceを実装した

```rust
MapResponse { f, inner }
```

であり、f には into_response が入っている。これは Route の定義が

```rust
pub struct Route<B = Body, E = Infallible>(BoxCloneService<Request<B>, Response, E>);
```

であり、タプルの0番目がselfに渡ってきていたからだ。

Oneshot は Future なので

```rust
impl<S, Req> Future for Oneshot<S, Req>
where
    S: Service<Req>,
{
    type Output = Result<S::Response, S::Error>;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        println!("Oneshot::Future::poll");
        let mut this = self.project();
        loop {
            match this.state.as_mut().project() {
                StateProj::NotReady { svc, req } => {
                    let _ = ready!(svc.poll_ready(cx))?;
                    let f = svc.call(req.take().expect("already called"));
                    this.state.set(State::called(f));
                }
                StateProj::Called { fut } => {
                    let res = ready!(fut.poll(cx))?;
                    this.state.set(State::Done);
                    return Poll::Ready(Ok(res));
                }
                StateProj::Done => panic!("polled after complete"),
            }
        }
    }
}
```

の poll が呼ばれるが、`svc.call` で MapResponse の service 部分が呼ばれる。

```rust
fn call(&mut self, request: Request) -> Self::Future {
        println!("MapResponse::service::call");
        MapResponseFuture::new(self.inner.call(request).map_ok(self.f.clone()))
    }
```

その結果 f で渡ってきた into_response 部分が map_ok で実行される。その結果、handler の実行結果が Response に変換される。この Service の関連型には

```rust
type Future = MapResponseFuture<S::Future, F>;
```

ともあるのでこれが Response を書いていることはただしそうだ。
