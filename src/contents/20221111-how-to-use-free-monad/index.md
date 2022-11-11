---
path: /how-to-use-free-monad
created: "2022-11-11"
title: Free モナドは何が嬉しいか
visual: "./visual.png"
tags: ["scala", "cats", "monad"]
userId: sadnessOjisan
isFavorite: false
isProtect: true
---

最近 Scala を勉強していて、cats が少しずつ色々分かってきたが Free モナドは何もわからんすぎたので整理がてらまとめる。

自分の理解を最初に書いておくと、Free モナドの嬉しさは副作用の分離にある。そしてそのために自然と DI 機構が提供されることも嬉しい。そしてこれらの事実は合成に使う関数の型シグネチャからも読み取ることができ、型レベルで読み手が DI の意図を理解できることも嬉しい。

## Free モナドのよくある説明

Free モナドは、

```haskell
data Free f a = Pure a | Free (f (Free f a))

instance Functor f => Monad (Free f) where
  return = Pure
  Pure a >>= f = f a
  Free m >>= f = Free ((>>= f) <$> m)
```

として定義されたものだ。

FYI: <https://eed3si9n.com/herding-cats/ja/Free-monads.html>

定義が再帰的で何がなにやらだ。

そこで Google で検索するとおおよそ以下のような説明が見つかる。

- Functor をモナドにできる
- プログラムを処理の流れと処理の実装に分離でき、処理の流れを純粋なもとして扱えるようになり、副作用を分離できる
- 言語内 DSL を作る
- インタプリタを作る

はて、自分はこの説明をみて何が嬉しいのか、どういう意味なのかさっぱりだった。きっとなんらかの性質を持ったモナドであるのだろう。そこで具体例から見ていこう。

## cats の例で見てみる

[Free モナドの具体例は Cats のドキュメントにある](https://typelevel.org/cats/datatypes/freemonad.html)。それを見ていこう。

まず、Cats における Free モナドの説明はこうだ。

- represent stateful computations as data, and run them
- run recursive computations in a stack-safe way
- build an embedded DSL (domain-specific language)

この説明をの具体例として、Key-Value ストアを考える。

Key-Value ストアなので、このような操作ができるとする。

```scala
put("toto", 3)
get("toto") // returns 3
delete("toto")
```

そしてこのとき、

- the computation to be represented as a pure, immutable value
- to separate the creation and execution of the program
- to be able to support many different methods of execution

といったことをできるようにしたいとする。これらの性質はプログラミングにおいては望ましい性質であろうし、開発者からすれば嬉しい性質だ。特に "to separate the creation and execution of the program" は嬉しいだろう。put, get, delete などは実際には DB へのアクセスになるので、副作用が起きる。そこでこれをなんらかの分離をできるのであれば嬉しいに違いない。

そこで副作用のない処理だけに注目した DSL をまず定義してみる。そのためのコマンドを定義しよう。

```scala
sealed trait KVStoreA[A]
case class Put[T](key: String, value: T) extends KVStoreA[Unit]
case class Get[T](key: String) extends KVStoreA[Option[T]]
case class Delete(key: String) extends KVStoreA[Unit]
```

なぜわざわざ `KVStoreA` を継承しているのかと思うかもしれないが、これは後々コマンドを解釈する interpreter に合成するときに引数の型を揃えやすくしたり、DSL を解釈する interpreter がそのコマンドを拾いやすくなるからと思っておいて欲しい。

さて、これを Free モナドを使った操作をできるようにする。

まず KVStoreA の Free モナドを定義する。

```scala
type KVStore[A] = Free[KVStoreA, A]
```

そしてそれぞれの命令を作る。そのときに Free への smart constructor を用意してあげるわけだが liftF を使う。さきに定義した Put, Get, Delete などのコマンドは KVStoreA を継承したものでありモナドではない。これを lifiting してあげることで Free モナド KVStore として使えるようにする。

```scala
// Put returns nothing (i.e. Unit).
def put[T](key: String, value: T): KVStore[Unit] =
  liftF[KVStoreA, Unit](Put[T](key, value))

// Get returns a T value.
def get[T](key: String): KVStore[Option[T]] =
  liftF[KVStoreA, Option[T]](Get[T](key))

// Delete returns nothing (i.e. Unit).
def delete(key: String): KVStore[Unit] =
  liftF(Delete(key))

// Update composes get and set, and returns nothing.
def update[T](key: String, f: T => T): KVStore[Unit] =
  for {
    vMaybe <- get[T](key)
    _ <- vMaybe.map(v => put[T](key, f(v))).getOrElse(Free.pure(()))
  } yield ()
```

さてその結果、各コマンドがモナドになったのでこれらは for yield で処理の流れを作る道具として使える。

```scala
def program: KVStore[Option[Int]] =
  for {
    _ <- put("wild-cats", 2)
    _ <- update[Int]("wild-cats", (_ + 12))
    _ <- put("tame-cats", 5)
    n <- get[Int]("wild-cats")
    _ <- delete("tame-cats")
  } yield n
```

これはまさしく KVStore に対する命令のフローだ。
さて、コマンドを Free モナドでモナドとして扱うことでこのように処理の流れを記述できたわけだが、処理の実態はどこにも書かれていない。命令のフローと実装を分離することが目的の技術だから当然だ。

そこで program は Free モナドであることから、これに対するモナドの合成を通して処理の実体を埋め込めると良さそうだ。というわけで分離した処理の実体部分を定義する。

```scala
import cats.arrow.FunctionK
import cats.{Id, ~>}
import scala.collection.mutable

// the program will crash if a type is incorrectly specified.
def impureCompiler: KVStoreA ~> Id  =
  new (KVStoreA ~> Id) {

    // a very simple (and imprecise) key-value store
    val kvs = mutable.Map.empty[String, Any]

    def apply[A](fa: KVStoreA[A]): Id[A] =
      fa match {
        case Put(key, value) =>
          println(s"put($key, $value)")
          kvs(key) = value
          ()
        case Get(key) =>
          println(s"get($key)")
          kvs.get(key).asInstanceOf[A]
        case Delete(key) =>
          println(s"delete($key)")
          kvs.remove(key)
          ()
      }
```

これは実行することで KVStoreA を ID 型に変換できる命令の実装を表す。

ここで `KVStoreA ~> Id` の `~>` は [FunctionK](https://typelevel.org/cats/datatypes/functionk.html) と呼ばれ、`F~>G` はそれ自体が型クラス `FunctionK[F, G]` を表し、`F[A]`を`G[A]`に置き換えれられることを表す。つまり今回は `KVStoreA ~> Id` なので、`KVStoreA[A]` を `Id[A]` に置き換えるメソッド apply を提供しないといけないということとなる。つまりは KVStoreA を Id に変換するような処理の実態をここに書き連ねるわけである。

ところで上の例で Id となっているのはいまシンプルな実装上ただの値を返すだけの処理になっているからだ。もし実際に Key Value Store にアクセスするときは Network IO があるだろうしそのときは KVStoreA ~> IO 　もしくは Future になるだろう。そのような拡張は自然にできるものとして考えている。このようにインタプリタの引数が KVStoreA である限り、実装を差し替えられるのも Free モナドを使ったパターンの良さだ。

つまり上の例では、インタプリタとは KVStoreA から Id へ移す FunctinK であり、渡された KVStoreA コマンド の種類に応じてそのコマンドを実行し、Id 型として返却してくれるものだ。

そして後は処理の流れの部分と処理の実装の部分を合成するだけだ。モナドと FunctionK の合成には foldMap を使う。

```scala
final def foldMap[M[_]](f: FunctionK[S,M])(M: Monad[M]): M[A] = ...
```

普通 foldMap は Foldable に定義されていて monoid を引数に取る関数だが、今回はその cats-free 版を使う。これは Free.foldMap として定義されている。Free.foldMap は monoid ではなく Monad を引数に取る。

```scala
/**
   * a FunctionK, suitable for composition, which calls foldMap
   */
  def foldMap[F[_], M[_]: Monad](fk: FunctionK[F, M]): FunctionK[Free[F, *], M] =
    new FunctionK[Free[F, *], M] { def apply[A](f: Free[F, A]): M[A] = f.foldMap(fk) }


/**
   * Catamorphism for `Free`.
   *
   * Run to completion, mapping the suspension with the given
   * transformation at each step and accumulating into the monad `M`.
   *
   * This method uses `tailRecM` to provide stack-safety.
   */
  final def foldMap[M[_]](f: FunctionK[S, M])(implicit M: Monad[M]): M[A] =
    M.tailRecM(this)(_.step match {
      case Pure(a)          => M.pure(Right(a))
      case Suspend(sa)      => M.map(f(sa))(Right(_))
      case FlatMapped(c, g) => M.map(c.foldMap(f))(cc => Left(g(cc)))
    })
```

その結果、

```scala
val result: Option[Int] = program.foldMap(impureCompiler)
// put(wild-cats, 2)
// get(wild-cats)
// put(wild-cats, 14)
// put(tame-cats, 5)
// get(wild-cats)
// delete(tame-cats)
// result: Option[Int] = Some(value = 14)
```

として実装できる。

## メンタルモデル

ぼくのブログを読んでいる人はほとんどがフロントエンドエンジニアだと思うので、フロントエンドっぽく書くと、やりたいことは要するに redux-saga だと思っている。take でアクションを待ち受けてその実体を dispatch しているのは、まさしくフローと副作用の分離だ。

```js
import { takeEvery } from "redux-saga/effects";
import Api from "./path/to/api";

function* watchFetchProducts() {
  yield takeEvery("PRODUCTS_REQUESTED", fetchProducts);
}

function* fetchProducts() {
  const products = yield Api.fetch("/products");
  console.log(products);
}
```

Issue にも「似てるよね〜」という指摘している人がいた。

FYI: <https://github.com/redux-saga/redux-saga/issues/505>

Free モナドの考えた方としては、

1. DSL に必要なコマンドを定義

2. コマンドを Free モナドとして使えるように、Free へのリフト

3. インタプリタの実装

4. foldMap で合成

といった感じだと思う。コマンドや DSL うんぬんに redux-saga との類似性は感じる。redux-saga は副作用の分離が take の引数に現れるが、Free モナドは合成可能な関数として現れる。

## コードジャンプすれば分かるかも

コードジャンプやプリントデバッグすれば挙動も追いやすいので、scala-cli でビルドできるコード (Free.scala)を置いておく。sbt 無しでこれ単体でも LSP での補完が効くはずだ。

```scala
import $ivy.`org.typelevel::cats-core:2.8.0`
import $ivy.`org.typelevel::cats-free:2.8.0`

import cats.syntax.all._
import cats.arrow.FunctionK
import cats.{Id, ~>}
import scala.collection.mutable

sealed trait KVStoreA[A]
case class Put[T](key: String, value: T) extends KVStoreA[Unit]
case class Get[T](key: String) extends KVStoreA[Option[T]]
case class Delete(key: String) extends KVStoreA[Unit]

import cats.free.Free

import cats.free.Free.liftF

object Main {

  type KVStore[A] = Free[KVStoreA, A]

  // Put returns nothing (i.e. Unit).
  def put[T](key: String, value: T): KVStore[Unit] =
    liftF[KVStoreA, Unit](Put[T](key, value))

  // Get returns a T value.
  def get[T](key: String): KVStore[Option[T]] =
    liftF[KVStoreA, Option[T]](Get[T](key))

  // Delete returns nothing (i.e. Unit).
  def delete(key: String): KVStore[Unit] =
    liftF(Delete(key))

  // Update composes get and set, and returns nothing.
  def update[T](key: String, f: T => T): KVStore[Unit] =
    for {
      vMaybe <- get[T](key)
      _ <- vMaybe.map(v => put[T](key, f(v))).getOrElse(Free.pure(()))
    } yield ()

  def impureCompiler: KVStoreA ~> Id =
    new (KVStoreA ~> Id) {
      // a very simple (and imprecise) key-value store
      val kvs = mutable.Map.empty[String, Any]

      def apply[A](fa: KVStoreA[A]): Id[A] =
        fa match {
          case Put(key, value) =>
            println(s"put($key, $value)")
            kvs(key) = value
            ()
          case Get(key) =>
            println(s"get($key)")
            kvs.get(key).asInstanceOf[A]
          case Delete(key) =>
            println(s"delete($key)")
            kvs.remove(key)
            ()
        }
    }

  def main(args: Array[String]): Unit = {
    def program: KVStore[Option[Int]] =
      for {
        _ <- put("wild-cats", 2)
        _ <- update[Int]("wild-cats", (_ + 12))
        _ <- put("tame-cats", 5)
        n <- get[Int]("wild-cats")
        _ <- delete("tame-cats")
      } yield n
    val result: Option[Int] = program.foldMap(impureCompiler)
  }
}
```

## なぜ Free の定義でこれを実現できるのか

分からん。

どうして Free や forldMap の定義があのようになっていて、このような嬉しい結果になるのかは、代数とか圏論をすれば分かるらしい。Functor を Monad にできるという説明も数学をすれば分かるらしい。知らんけど。

本来なら「ここは分からなかったので教えてください＞＜」で締めたいのだが、教えてもらって分かるものじゃないらしい。悲しい。

ちなみに Functor を Monad にできるという点では、ここでは KVStoreA というコマンド列をモナドとして扱えるようになることを指していた。だがそのためには KVStoreA が Functor である必要がある。しかし Free の型定義には Functor であるという制約は付いていない。個人的にはどうして制約を入れないのか気になっている。(けど cats ってちょっと制約緩いかもと思うときはたまにある）

```scala
/**
 * A free operational monad for some functor `S`. Binding is done
 * using the heap instead of the stack, allowing tail-call
 * elimination.
 */
sealed abstract class Free[S[_], A] extends Product with Serializable with FreeFoldStep[S, A] {
  ...
}
```
