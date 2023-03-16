---
path: /my-new-error
created: "2023-01-18"
title: My new error...
visual: "./visual.png"
tags: ["error", "sentry"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

2023 年度の僕のエラーハンドリング について書きたい。
昨日[Safe Data Fetching in Modern JavaScript](https://www.builder.io/blog/safe-data-fetching)を読んでいて、fetch に限った話ではないが一家言ある内容だったので書きたくなった。
おそらくやりすぎだとか非効率と言われる点はあると思うので、みんなの一家言も教えて欲しい。
対象は Typescript での サーバー開発想定だが、TS であればクライアント開発にもほとんどに当てはまる話だと思う。

## 例外のスローではなく Result 型を使う

### Result は失敗するかもしれないという文脈を与えてくれる型

エラーハンドリングの戦略として例外を投げるのではなく、Result 型を返すやり方がある。

Result 型というのは

```ts
export type Result<T, E> = Ok<T> | Err<E>;

export interface Ok<T> {
  readonly ok: true;
  readonly val: T;
  readonly err?: null | undefined;
}

export interface Err<E> {
  readonly ok: false;
  readonly val?: null | undefined;
  readonly err: E;
}
```

のような型だ。

(<https://github.com/karen-irc/option-t/blob/main/src/PlainResult/Result.ts>)

これによって、ある値や処理に対して、成功するかもしれない・失敗するかもしれないといった文脈を足すことができる。

### Result 型があると何が嬉しいか

さて、`Result` を使わずに `throw Error` を使っていた場合であるが、例外をハンドリングしたければ

```ts
const f1 = () => {
  const r = Math.random();
  if (r < 0.5) {
    throw new Error();
  }
  return r;
};

try {
  const val = f1();
} catch (e) {
  console.error(e);
}
```

のような `try catch` を使う必要があった。

しかし f1 が例外を投げるかどうかは実装を読まないとわからないので、`try catch` を使うのを忘れることがあるかもしれない。特にライブラリを使っていると、そのライブラリの挙動を完全に知っていないといつ例外が投げられるかという恐怖がつきまとい、難しい問題だ。

こういうときに `Result` が返ってくる設計だとどうだろうか？

```ts
const f1 = (): Result<number, Error> => {
  const r = Math.random();
  if (r < 0.5) {
    return createErr(new Error());
  }
  return createOk(r);
};

const f1Result = f1();

if (isOk(f1Result)) {
  const val = f1Result.val;
} else {
  console.error(f1Result.err);
}
```

として val を使うためには必ず `f1Result` の `ok`, `error` 検証が必要となる。
つまり失敗するかもしれないという文脈を型検査で確かめることが強制されるのである。

### Result は型だけでなく combinator や util も作るべき

Result 型を定義する時は型だけでなく combinator や utility も導入すべきだ。

例えば `map` や `and_then` という関数を用意してあげることでエラーをチェインさせられる。つまり `Result` を返す関数の戻り値 `Result` を別の関数の引数に渡して同じような `Result` 返させることができる。そのときに`Result` を引数に取るのではなく Result の中身だけを引数に取れたり(map)、Result のネストを防いだり(and_then, flatmap)といったことがコンビネータの力でできる。

#### createOk

```ts
export interface Ok<T> {
  readonly ok: true;
  readonly val: T;
  readonly err?: null | undefined;
}
```

を作る関数だ。

#### createErr

```ts
export interface Err<E> {
  readonly ok: false;
  readonly val?: null | undefined;
  readonly err: E;
}
```

を作る関数だ。

#### isOk

```ts
const result = getDataResult()

isOk(result){
  result.val
}
```

Result が Ok であることの絞り込みをしてくれて val にアクセスできるようにする。

#### map

Result の Ok の中身をもとに新しい値を作りたいときにつかう。例えば user data を取得した後にその user id を暗号化したいとする。そのとき

```ts
const getUserResult = getUserResult(id)

isOk(getUserResult){
  const userId = getUserResult.val.user.id
  const eid = enc(userId)
  return createOk(eid)
}

```

とするのは何か長くて嫌だ。

そこで文脈を保ったまま変換できるのが map で

```ts
const encUserId = (input: User): EncUserId => {};
```

を用意して、

```ts
const getUserResult = getUserResult(id);

const EncedUserId = map(getUserResult, (user) => {
  return getUserPostsResult(user);
});
```

として使える。つまり Result の中身だけを移す処理と言える。

#### flatMap(and_then)

Result を返す関数にチェインしたい時に使う。例えば user data を取得した後にその user id を使って投稿履歴を問い合わせたいとする。そのとき

```ts
const getUserResult = getUserResult(id)

isOk(getUserResult){
  const userId = getUserResult.val.id
  const posts = getUserPostsResult(userId)
}

```

とするのはめんどくさい。

なので

```ts
const getUserResult = getUserResult(id);

const posts = getUserPostsResult(getUserResult);
```

とできたら嬉しい。

しかしそうすると

```ts
const getUserPostsResult = (input: Result<User, Error>) => {};
```

といったふうに引数に Result が現れるので、ここ以外での使い回しがしにくくなる。
それを防げるのが map や flatMap で

```ts
const getUserPostsResult = (input: User): Result => {};
```

を定義して

```ts
const getUserPostsResult = flatMap(getUserPostsResult, (user) => {
  return getUserPostsResult(user.id);
});
```

として使える。ここだけ見ると `map` と似ているがその差異は二つ目の関数が Result を返しているかどうかにある。`flatMap` は `flat` と `map` の両方をするので `map` との違いがややこしいが、もし `flatMap` じゃなければ `Result<Result<>>` になってしまっている。そこで平坦にしてくれて同じ文脈を保ってくれるのが `flatMap` だ。

#### （余談）箱の中の値をチェインするという意識を持つといい

combinator はややこしいが Result は箱・文脈で、それに包まれた中身を操作するために combintor が使えると意識すると良い。箱の中身を継続して扱う考えについては Scala ではあるが書いたことがあるので参考にして見てほしい。コツは型シグネチャをジッと眺めることだ。

FYI: https://blog.ojisan.io/monad-applicative/

### どういうライブラリを選ぶべきか

さて型くらいであれば自分で定義すればいいが、combinator まで作るのは骨が折れるので何かそういうライブラリに頼ってしまってもいいだろう。

#### fp-ts

この手のことをするライブラリとしては fp-ts が有名で一番使われているだろう。実績もたくさんあるライブラリだ。この Either が Result に相当する。

FYI: https://gcanti.github.io/fp-ts/modules/Either.ts

しかしこのライブラリは Result の導入というより強く静的に型付けられた関数型プログラミングスタイルを導入するツールだ。役割で言えば Scala で言う cats だと思っている。cats 経済圏のようなものを作らないのであれば入れなくてもいいのではというのが個人的な感想だ。Result を使うだけであれば少々オーバーキル感が否めないので私は次に紹介する option-t を推す。

#### option-t

Option, Result だけを持ってきているライブラリがありそれが option-t だ。Option は transopose などをするときに使ったり何かと Result にあると便利なので、Option が付いてくるのも嬉しい。

FYI: <https://github.com/karen-irc/option-t>

このライブラリのいいところは Rust の標準ライブラリに影響を受けているので、Rust 標準ライブラリの combinator が備わっていたり、使い方のドキュメントは [Rust のドキュメント](https://doc.rust-lang.org/std/result/enum.Result.html)を読めばいいところにある。Rust は難しい印象もあるがドキュメントの生成機能がすごいこともあって Example の充実がすごく、Rust を読めなくても Result のリファレンス・教科書としてまで使えるクオリティなのでチームに導入する時も使いやすい。

たとえば先の `map`, `flatmap` も公式が解説してくれている。

- <https://doc.rust-jp.rs/rust-by-example-ja/error/option_unwrap/map.html>
- <https://doc.rust-jp.rs/rust-by-example-ja/error/option_unwrap/and_then.html>

またこのライブラリのいいところは 0deps であり、改造したいことがあればそのままファイルをコピーしてこればユーザーランドでも動かせるところにある。なので挙動を変えたいところがあったりするとすぐにパッチを当てられる。たとえば後述している 「createErr するときに必ずロギングしたい」みたいな改造を簡単に施せる。ただし MIT ライセンスなのでクレジットのコピーも忘れないようにしよう。

## Custom Error を定義する

さて Result で包むエラーであるが、僕は必ず Custom Error を作るようにしている。

### Error の継承で Custom Error を作る

カスタムエラーに関しては JAVASCRIPT.INFO が良い感じにまとまっているのでこれを読むと良いだろう。
色々やり方はあるがサマリにある通り

> Error や他の組み込みのエラークラスから継承することができます。そのときは、name プロパティに手を入れることと、super の呼び出しを忘れないでください。

とすれば実現できる。

FYI: <https://ja.javascript.info/custom-errors>

つまり、

```ts
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}
```

のようなクラスを定義する。

ちなみに現実の Error はこのような型定義になっている(ES2022 相応)

```ts
interface ErrorConstructor {
  new (message?: string, options?: ErrorOptions): Error;
  (message?: string, options?: ErrorOptions): Error;
}

interface ErrorOptions {
  cause?: unknown;
}
```

ので

```ts
class ValidationError extends Error {
  constructor(message, options: { cause: unknown }) {
    super(message);
    this.name = "ValidationError";
    this.cause = options.cause;
  }
}
```

として使う方が良いだろう。この cause についてはのちに説明する。

さらにこのとき

```ts
class ValidationError extends Error {
  override readonly name = "ValidationError" as const;
  constructor(message: string, options?: { cause: unknown }) {
    super(message, options);
    this.cause = options?.cause;
  }
}
```

として `as const` で型をつけてしまえば、他の Error を継承したカスタムエラーとの識別も容易になる。`as const`使っていこう。

### カスタムエラーは エラーの識別に便利

カスタムエラーは 受け取った先で

```ts
if (err instanceof ValidationError) {
} else if (err instanceof NetworkError) {
}
```

のようにして分岐を書ける。

これにより、このエラーの場合は復帰させたいといた処理を書きやすくなる。

### カスタムエラーは name を使い分けられることにも旨味がある

カスタムエラーの良いところは、定義した時に別々の name を与えておけば、簡単にさまざまな name のエラーを作れるところだ。

このエラーの name は Sentry のような Issue/Alert 監視ツールの項目名になるので、Alert の分析時に原因調査する上で非常に役に立つ。

### Error に status は含めない

一方でバックエンド開発において Error に status code を入れる流派があるが私はそうしない。なぜなら Result に包む以上、response に複数の Result を含んだりネストさせることがあるからだ。例えば 1 画面を表示するデータを返す際に一部が失敗して全ページがクラッシュするよりかは部分的に見えていた方が良いに決まっているからだ。別々の API に分割しなよ、Suspence 使いなよと思うかもしれないが、例えば CDN にページごとキャッシュさせたいという使い方は十分に考えられ、現実に即したケースだ。そういった場合、HTTP Status は 200 だけど部分的にエラーがある場合のエラーの status は無用なものになるので最初から入れていない。

それにエラーというものが HTTP の存在を知っているのは、`なんちゃらアーキテクチャ`や`ほげほげアーキテクチャ`における依存関係としても正しくないと考え、ステータスコードは含めていない。

## catch 節で受け取る Error を握り潰さない

さてこの Result 型だが、導入しているライブラリやツールが返してくれない限りは開発者が作らなければいけない。それを作るのは例外が発生した時の catch でだが、そのときに元々上がってきた例外情報を握り潰さないように注意しないといけない。

### 握りつぶすとはどういうことか

もし、

```ts
try {
  occurException();
} catch (e) {
  return createErr(new MyError("なんかエラー出た"));
}
```

みたいなコードを書いてしまうと、`occurException` の実行情報が含まれた `e` が消えてしまい、trace のときに困ってしまう。
この `e` をどう生かすかを考えよう。

### Error Cause で積む

例外が起きたらそれを stack trace に積むのが良い。
一般的には関数を伝播すればエラーは勝手に内部に stack として Error を積んでくれるが、実はこの機能は仕様で明記されていない。

FYI: <https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Error/Stack>

なのでそれを開発者側で明示的にしてあげよう。その機能が Error Cause だ。

FYI: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause

先のコードを

```ts
try {
  throw new Error("orig error");
} catch (e) {
  throw new Error("なんかエラー出た", { cause: e });
}
```

```
Uncaught [Error: なんかエラー出た] {
  [cause]: Error: orig error
      at REPL5:2:9
      at Script.runInThisContext (node:vm:129:12)
      at REPLServer.defaultEval (node:repl:572:29)
      at bound (node:domain:433:15)
      at REPLServer.runBound [as eval] (node:domain:444:12)
      at REPLServer.onLine (node:repl:902:10)
      at REPLServer.emit (node:events:525:35)
      at REPLServer.emit (node:domain:489:12)
      at [_onLine] [as _onLine] (node:internal/readline/interface:425:12)
      at [_line] [as _line] (node:internal/readline/interface:886:18)
```

のように元のエラー情報が保たれる。もし cause がなければ

```ts
try {
  throw new Error("orig error");
} catch (e) {
  throw new Error("なんかエラー出た");
}
```

```
Uncaught Error: なんかエラー出た
```

となってしまう。

元のエラーが保たれることでそれをハンドリングする側やそのエラーを通知された監視ツールでは元のエラーも見れるのでデバッグが非常に捗る。

### ログに出す

そして catch した e はその例外の原因となる非常に重要な情報なので積極的にログに出していこう。

```
console.error(e)
```

これは後述する Sentry とまとめてしまうのが良い。

## エラーログの扱い

### アラートツールか標準出力ログかどっちを使うか

両方使うべきである。

たくさんツールを入れるのは憚られるかもしれないが、それぞれに目的があるのであればツールは全部入れていいと思う。

例えば

- Cloud Logging: インスタンスの CPU メトリクス確認
- Datadog: 標準出力の確認
- Kibana: HTTP ベースでのモニタリング
- Sentry: Issue の管理、アラートの作成

といったふうにいろんなツールを使っていいと思う。[入門監視](https://www.oreilly.co.jp/books/9784873118642/)にもそういうことが書かれている。

なので両方に出すような関数を作ってしまおう。

```ts
const loggingException = (err: Error) => {
  console.error(err);
  if (process.env.NODE_ENV === "production") {
    // send to setnry
    captureException(err);
  }
};
```

### createErr のタイミングでロギング

さて、Sentry だったり datadog のようなログ・アラートツールを使うときはソースのどこでエラーを出力すればいいだろうか。Result を使っているのであれば選択肢は Err を作ったタイミングかレスポンスを返すタイミングだ。だが Result はネストしたり複数持つことがあるので上流でまとめてログを出すのはめんどくさかったり、問題が起きたときにすぐ出力した方が実態に即するので createErr したタイミングで必ずログに出すのが良いだろう。手で出力してもいいが自信がある人は createErr のラッパーを作るか createErr の中でロガーに出してしまえば良い。

ただそうすると

```ts
const result = getDataResult();

if (isErr(result)) {
  const err = convertErr(result.err);
  return createErr(err);
}

return result;
```

のような Result を分解する処理をすると再度 createErr するときにアラートが 2 回出てしまうのでこれは避けたい。
それを防ぐのが map などの combinator なので combinator を積極的に使っていこう。

ただ最初は手で createErr の前に出したいログを出させるようにするといいと思う。

```ts
const loggingException = (err: Error) => {
  console.error(err);
  if (process.env.NODE_ENV === "production") {
    // send to setnry
    captureException(err);
  }
};

let res;
try {
  res = await fetch(`${URL}/users/${id}`);
} catch (e) {
  const error = new FetchMethodError(
    JSON.stringify({
      reason: "fail to fetch",
      url: URL,
      payload: { id },
    }),
    { cause: e }
  );
  loggingException(error);
  return createErr(error);
}
```

### ログを出すなら意味あるログを出そう、特に Sentry

ログを出してエラーに気づけたとしても `Invalid: undefined` みたいなログだと何をどうデバッグしていいかわからない。なるべくどこから出てきたログか分かるようにするか（Custom Error などを使う）、ありのままの exception を吐き出させよう（握り潰さない）。Custom Error を使う場合もただ使うだけでなく Error の message にヒントは入れておこう。自分はよく構造化したログを stringify して詰め込んでいる。

```ts
let res;
try {
  res = await fetch(`${URL}/users/${id}`);
} catch (e) {
  const error = new FetchMethodError(
    JSON.stringify({
      reason: "fail to fetch",
      url: URL,
      payload: { id },
    }),
    { cause: e }
  );
  loggingException(error);
  return createErr(error);
}
```

Sentry は Error の name で Issue のタイトルが作られ、message でエラー本文が作られ、cause でスタックトレースが作られて分析できるようになる。エラー分析する人の気持ちを考えたものを入れるようにしよう。

## 強制はしないがなるべく try のスコープを狭める

昔は小さくすべきだと主張していた。が、error cause のおかげで必ずしも今はそうしなくていいと思っている。

最悪、

```ts
try {
  const res = await fetch(URL);
  switch(res.status){
    case: 400:
      return createErr(new InvalidInput())
  }
  const data = await res.json();
  validate(data);
  return createOk(data);
} catch (e) {
  return createErr(new APIError("error happen", { cause: e }));
}
```

としても良いだろう。ネットワークエラーだろうが JSON パースエラーだろうが e を cause で持たせれば原因が分かるからだ。

が、大きい try スコープは安全なところと不安なところがぱっと見でわからなくなってしまうので、

```ts
let res;
try {
  res = await fetch(URL);
} catch (e) {
  return createErr(new FetchMethodError("error happen", { cause: e }));
}

switch(res.status){
    case: 400:
      return createErr(new InvalidInput())
}

let data;
try {
    data = await res.json();
} catch (e) {
  return createErr(new ResponseParseError("error happen", { cause: e }));
}

try {
    validate(data);
} catch (e) {
  return createErr(new ValidationError("error happen", { cause: e }));
}

return createOk(data);
```

まあコードが長くなってしまうので時と場合によるとは思う。

## fetch を例に実践する

まずエラークラスを定義しましょう。

```ts
/**
 * fetch のメソッドの使い方が変かネットワークエラーのときに利用する
 */
class FetchMethodError extends Error {
  override readonly name = "FetchMethodError" as const;
  constructor(message: string, options?: { cause: unknown }) {
    super(message, options);

    this.cause = options?.cause;
  }
}

/**
 * response parse に失敗したときに利用する
 */
class ResponseParseError extends Error {
  override readonly name = "ResponseParseError" as const;
  constructor(message: string, options?: { cause: unknown }) {
    super(message, options);
    this.cause = options?.cause;
  }
}
/**
 * 認証情報が足りないときに利用する
 */
class AuthorizationError extends Error {
  override readonly name = "AuthorizationError" as const;
  constructor(message: string, options?: { cause: unknown }) {
    super(message, options);
    this.cause = options?.cause;
  }
}

/**
 * data がスキーマに合っていない
 */
class ValidationError extends Error {
  override readonly name = "ValidationError" as const;
  constructor(message: string, options?: { cause: unknown }) {
    super(message, options);
    this.cause = options?.cause;
  }
}
```

name に as const をつけて、それぞれのエラーを識別可能にした。

そしてこれらを全部まとめた型も作っておく。

```ts
type RepositoryError =
  | FetchMethodError
  | ResponseParseError
  | AuthorizationError
  | ValidationError;
```

次に method の I/F を決めてしまおう。

```ts
class Repository {
  async getUserById(id: number): Promise<Result<Object, RepositoryError>> {}
}
```

`<Result<Object, RepositoryError>>` を返す関数を作る。

まずは fetch 部分。

```ts
class Repository {
  static URL = "";
  async getUserById(id: number): Promise<Result<Object, RepositoryError>> {
    let res;
    try {
      res = await fetch(`${URL}/users/${id}`);
    } catch (e) {
      const error = new FetchMethodError(
        JSON.stringify({
          reason: "fail to fetch",
          url: URL,
          payload: { id },
        }),
        { cause: e }
      );
      loggingException(error);
      return createErr(error);
    }
  }
}
```

`: Promise<Result<Object, RepositoryError>>` としているので FetchMethodError ではなく Error とするとコンパイルできなくなる。宣言した Error 以外返せなくなるので便利だし、Custom Error に識別可能なラベルを与えたことの恩恵を受けている。

loggingException は Sentry やログ出しに使うものでこういうコードだ。

```ts
const loggingException = (err: Error) => {
  console.error(err);
  if (process.env.NODE_ENV === "production") {
    // send to setnry
    captureException(err);
  }
};
```

次に status code ごとにハンドリングする。ここでも Custom Error を返していこう。

```ts
if (!res.ok) {
  switch (res.status) {
    case 401: {
      const error = new AuthorizationError(
        JSON.stringify({
          reason: "fail to fetch by miisng auth",
          url: URL,
          payload: { id },
        })
      );
      loggingException(error);
      return createErr(error);
    }
    default: {
      const error = new InternalError(
        JSON.stringify({
          reason: "internal server error",
          url: URL,
          payload: { id },
        })
      );
      loggingException(error);
      return createErr(error);
    }
  }
}
```

そしてデータを見ていく。

```ts
let data;
try {
  data = await res.json();
} catch (e) {
  const error = new ResponseParseError(
    JSON.stringify({
      reason: "fail to parse",
      url: URL,
      payload: { id },
    }),
    { cause: e }
  );
  loggingException(error);
  return createErr(error);
}
```

res.json は

> json() は Response インターフェイスのメソッドで、 Response のストリームを取得して完全に読み取ります。本体のテキストを JSON として解釈した結果で解決するプロミスを返します。

FYI: <https://developer.mozilla.org/ja/docs/Web/API/Response/json>

なので input 次第では consume body や parse JSON from bytes のフェーズで失敗することもあり得るので try でガードする。

FYI: <https://fetch.spec.whatwg.org/#dom-body-json>

そしてデータを得たらそれがスキーマ通りか検証する。

```ts
const validate = (data: unknown): data is Object => {
  if (typeof data !== "object") {
    return false;
  }
  return true;
};

if (validate(data)) {
  return createOk(data);
} else {
  const error = new ValidationError(
    JSON.stringify({
      reason: "fail to validate",
      url: URL,
      response: { data },
    })
  );
  loggingException(error);
  return createErr(error);
}
```

違反していたら例外を返そう。

全体で見るとこうなる。

```ts
import { createErr, createOk, Result } from "option-t/esm/PlainResult";

const validate = (data: unknown): data is Object => {
  if (typeof data !== "object") {
    return false;
  }
  return true;
};

const loggingException = (err: Error) => {
  console.error(err);
  if (process.env.NODE_ENV === "production") {
    // send to setnry
    captureException(err);
  }
};

/**
 * fetch のメソッドの使い方が変かネットワークエラーのときに利用する
 */
class FetchMethodError extends Error {
  override readonly name = "FetchMethodError" as const;
  constructor(message: string, options?: { cause: unknown }) {
    super(message, options);

    this.cause = options?.cause;
  }
}

/**
 * response parse に失敗したときに利用する
 */
class ResponseParseError extends Error {
  override readonly name = "ResponseParseError" as const;
  constructor(message: string, options?: { cause: unknown }) {
    super(message, options);
    this.cause = options?.cause;
  }
}
/**
 * 認証情報が足りないときに利用する
 */
class AuthorizationError extends Error {
  override readonly name = "AuthorizationError" as const;
  constructor(message: string, options?: { cause: unknown }) {
    super(message, options);
    this.cause = options?.cause;
  }
}

/**
 * どうにもならなかったときに使うエラー
 */
class InternalError extends Error {
  override readonly name = "InternalError" as const;
  constructor(message: string, options?: { cause: unknown }) {
    super(message, options);
    this.cause = options?.cause;
  }
}

/**
 * data がスキーマに合っていない
 */
class ValidationError extends Error {
  override readonly name = "ValidationError" as const;
  constructor(message: string, options?: { cause: unknown }) {
    super(message, options);
    this.cause = options?.cause;
  }
}

const URL = "";

type RepositoryError =
  | FetchMethodError
  | ResponseParseError
  | AuthorizationError
  | ValidationError
  | InternalError;

class Repository {
  static URL = "";
  async getUserById(id: number): Promise<Result<Object, RepositoryError>> {
    let res;
    try {
      res = await fetch(`${URL}/users/${id}`);
    } catch (e) {
      const error = new FetchMethodError(
        JSON.stringify({
          reason: "fail to fetch",
          url: URL,
          payload: { id },
        }),
        { cause: e }
      );
      loggingException(error);
      return createErr(error);
    }

    if (!res.ok) {
      switch (res.status) {
        case 401: {
          const error = new AuthorizationError(
            JSON.stringify({
              reason: "fail to fetch by miisng auth",
              url: URL,
              payload: { id },
              res,
            })
          );
          loggingException(error);
          return createErr(error);
        }
        default: {
          const error = new InternalError(
            JSON.stringify({
              reason: "internal server error",
              url: URL,
              payload: { id },
              res,
            })
          );
          loggingException(error);
          return createErr(error);
        }
      }
    }

    let data;
    try {
      data = await res.json();
    } catch (e) {
      const error = new ResponseParseError(
        JSON.stringify({
          reason: "fail to parse",
          url: URL,
          payload: { id },
        }),
        { cause: e }
      );
      loggingException(error);
      return createErr(error);
    }

    if (validate(data)) {
      return createOk(data);
    } else {
      const error = new ValidationError(
        JSON.stringify({
          reason: "fail to validate",
          url: URL,
          response: { data },
        })
      );
      loggingException(error);
      return createErr(error);
    }
  }
}
```

まあ fetch に限ってこんなに長くなるので利便性を考えたら[Safe Data Fetching in Modern JavaScript](https://www.builder.io/blog/safe-data-fetching)でしていたことも取り入れるべきなのだろう。実際にその記事は fetch の抽象化をしていくことが主題なので、ここでのエラーハンドリングのテクニックともあまり競合しない。

が、私は結構ベタにこれを書くことが多いしこれからもそうすると思う。それは社会の現実は status code の意味や使い方が API ごとによって異なりすぎて一概に抽象化できなかったり、もしくは spec がしっかりしているような API であればそもそも spec から client を自動生成できたりしてこういうコードを書かなくて済むからだ。結局は個々人の環境次第だと思う。
