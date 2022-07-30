---
path: /cake-pattern
created: "2022-07-31"
title: Cake PatternでDIしてみた
visual: "./visual.png"
tags: ["scala", "di", "cake pattern"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

OGP はリコリス・リコイル４話的な何かです。

## はじめに

Cake Pattern という DI の方法があります。普通 DI というと Constructor Injection だとは思いますが、Rust のような constructor がない言語だと依存を注入するのが難しかったり、ライフタイムや所有権の制約で難しい場面があったりします。そのようなとき、Cake Pattern と呼ばれる方法があることを知りました。これは [Scala が発祥のテクニック](https://eed3si9n.com/ja/real-world-scala-dependency-injection-di/)で、[構造がケーキのように水平に何段にも重ねたようにも、垂直にきりだしたようにもみえるのでそのように名付けられたもの](https://www.techscore.com/blog/2012/03/27/scala%E3%81%A7di-%EF%BC%88cake-pattern%E5%B0%8E%E5%85%A5%E7%B7%A8%EF%BC%89/) とのことです。

具体的には、

```scala
trait ConfigurationComponent {
  val configuration: Configuration
}

trait AComponent {
  this: ConfigurationComponent =>
  val a: A
  class A {
    val value = "a-" + configuration.value
  }
}

trait BComponent {
  this: ConfigurationComponent with AComponent =>
  val b: B
  class B {
    val value = a.value + "-b-"+ configuration.value
  }
}

trait Components
    extends ConfigurationComponent
    with AComponent
    with BComponent

object Registry extends Components {
  val configuration = new DefaultConfiguration
  val a = new A()
  val b = new B()
}
```

<https://github.com/davidmoten/cake-pattern>

のように定義します。この class を xxxComponent trait でかぶせていくことがケーキのようと言われているわけです。

さてこの方法ですが、[Rust でしている先駆者様はいらっしゃる](https://keens.github.io/blog/2017/12/01/rustnodi/) のですが、どうしてこのやり方で DI ができているのかがよく分からなかったので、まずは源流の方を学んでみることとしました。

## はじめての Scala

というわけで、まずは Scala の勉強からです。Cake Pattern を読めるようになるための文法やビルド周りについて速習します。

### ビルド

JVM 系特有の InteliJ に全部ぶん投げないとビルドができないような環境なのかなと思っていたのですが、[sbt](https://www.scala-sbt.org/1.x/docs/ja/Hello.html) というコマンドを入れるだけでよかったです。多分 JDK とかは前もって入っていたからこれだけで済んだような気はする。sbt は run コマンドがあるので、これがあれば Scala のプロジェクトをビルドできます。ファイル構成ですが、src/main/scala 配下にエントリポイントを作ったり、build.sbt を用意する必要がありますが、この辺は sbt のテンプレート生成コマンド `sbt new scala/hello-world.g8` 的なのを使って作らせると良いです。

### エントリポイントと実行

エントリポイントの定義方法はいくつかあり、1 つには main 関数を持った object を定義することです。

```scala
object HelloWorld {
  def main(args: Array[String]) { println("Hello World") }
}
```

もう一つは App を継承した object を作ります。

```scala
object Main extends App {
  println("Hello, New York!")
}
```

これはつまり、その気になれば複数のエントリポイントを持てるということです。なので複数作った場合は `sbt run` した際にどのエントリポイントを使うか聞かれます。

```sh
Multiple main classes detected. Select one to run:
 [1] HelloWorld
 [2] Main
```

### モジュール構造

とはいえ、複数 main を作るよりかは一つのエントリポイントに対して、そこから各モジュールを呼び出していくのが正統な方法ではあります。そのようなモジュールは package で定義できます。

```scala
package hoge

class Fuga {}
```

このように定義した package は

```scala
import hoge.Fuga

object Main extends App {
  val a = new Fuga
  println("Hello, New York!")
}
```

として import できます。

import するものは明示しなくても `import hoge._` で全部持ってくることもできます。

フォルダの構成は決まりはありませんが、[package 名とディレクトリ名を一致させる](https://docs.scala-lang.org/ja/tour/packages-and-imports.html) ことが慣習のようです。複数のファイルに同一の package 名がまたがるのは問題がないです。

ちなみにファイル名やクラス名に関しては自由につけて問題ないです。Java だとファイル名とクラス名を一致させたり、1 ファイルに 1 クラスファイルみたいなことを教わりましたが Scala はどうなのでしょうか。

### trait

最初に紹介した例では、trait を多用していたので調べました。Rust にあるやつでしょという気持ちもあるのですが、Scala 特有の機能もあるのでちゃんと調べることにしました。

[JAVA プログラマーのための SCALA チュートリアル](https://docs.scala-lang.org/ja/tutorials/scala-for-java-programmers.html) というとても便利な公式 Doc があるのですが、ここには

> おそらく Java プログラマーにとってトレイトを理解するもっとも簡単な方法は、コードを含むことができるインターフェースとしてとらえることでしょう

とあります。全く持ってその通りだと思います。この機能があるので、Scala では trait をがちゃがちゃくっつけて Mixin 的なこともできます。

### 自分型アノテーション

そしてその Scala 特有な Mixin があり、それが自分型アノテーションです。 <http://www.nct9.ne.jp/m_hiroi/java/scala24.html> から例を拝借すると、

```scala
class Foo {
  self =>
  val x = 1
  def display(): Unit = { println(this); println(self) }
}
```

の `self =>` がそれで、自分自身を参照できます。

```sh
scala> val a = new Foo
scala> a.display()

$line3.$read$$iw$Foo@502a4156
$line3.$read$$iw$Foo@502a4156
```

このような `名前 =>` （名前はなんでもいい）が自分型アノテーションですが、ここには trait で型指定することができ、それをするとその型を継承したこととなります。

```scala
trait Foo {
  def foo(): Unit = { println("foo") }
}

class Bar {
  self: Foo =>
    def bar(): Unit = { println("bar") }
}
```

```sh
scala> val a = new Bar with Foo
val a: Bar with Foo = $anon$1@7cc1f72c

scala> a.foo()
foo

scala> a.bar()
bar
```

インスタンスを作るときは `new Bar with Foo` の `with Foo` を忘れないようにしましょう。忘れても foo() メソッドを実装しましょうと怒られるので気付くとは思います。

さて、この機能はなにが嬉しいのでしょうか。それは、

```scala
trait Base {
  def foo(): Unit
}

trait Foo1 extends Base {
  def foo(): Unit = { println("foo1") }
}

trait Foo2 extends Base {
  def foo(): Unit = { println("foo2") }
}

class Bar {
  self: Base =>
    def bar(): Unit = { println("bar") }
}
```

```sh
scala> val a = new Bar with Foo1

scala> val b = new Bar with Foo2
```

とすれば、実装を差し替えられるところにあります。いまは Foo1, Foo2 ですが、たとえばテスト用の mock を実装するなんてこともできるわけです。おや、急に DI ぽさが出てきました。

## Cake Pattern

これで Cake Pattern を調べる準備が整いました。まず、完成系をみます。

```scala
trait Configuration {
  def value: String
}

class DefaultConfiguration extends Configuration {
  val value = "production"
}
class TestingConfiguration extends Configuration {
  val value = "test"
}


trait ConfigurationComponent {
  val configuration: Configuration
}

trait AComponent {
  this: ConfigurationComponent =>
  val a: A
  class A {
    val value = "a-" + configuration.value
  }
}

trait BComponent {
  this: ConfigurationComponent with AComponent =>
  val b: B
  class B {
    val value = a.value + "-b-"+ configuration.value
  }
}

trait Components
    extends ConfigurationComponent
    with AComponent
    with BComponent

object Registry extends Components {
  val configuration = new DefaultConfiguration
  val a = new A()
  val b = new B()
}

object RegistryTesting extends Components {
  val configuration = new TestingConfiguration
  val a = new A()
  val b = new B()
}
```

### Component で覆いかぶせる意味

この cake pattern ですが、特徴的なのは

```scala
trait BComponent {
  this: ConfigurationComponent with AComponent =>
  val b: B
  class B {
    val value = a.value + "-b-"+ configuration.value
  }
}
```

のように実装の本体である B class を Component という trait ですっぽり覆い被させます。こうすることで、自分型アノテーションを使った実装差し替えの口を作れ、`val b: B` のようなフィールドは extends している以上は呼び出し元にそのフィールドを作らせることを強制できます。それは

```scala
object Registry extends Components {
  val configuration = new DefaultConfiguration
  val a = new A()
  val b = new B()
}
```

の `val a = new A()` を消すとコンパイルエラーが出ることからもわかります。

ちなみに

```scala
trait ConfigurationComponent {
  val configuration: Configuration
}
```

に関しては自分型アノテーションを持っていないので、Configuration をそのまま使ってもコンパイルは通せます。

```scala
trait BComponent {
  this: Configuration with AComponent =>
  val b: B
  class B {
    // 名前が衝突するので value2 に変えた
    val value2 = a.value + "-b-"+ value
  }
}
```

とはいえ xxxComponent でかぶせることが Cake Pattern のお作法なので、かぶせた方が良い気はしました。

### Dependency Injection

今回の例だと、DefaultConfiguration と TestingConfiguration で実装を差し替えています。これはベースとなる Configuration trait を ConfigurationComponent に渡しているからです。これは同じように A や B に対しても BaseA みたいな tarit を定義して、

```scala
trait BaseA {
  def value: String
}

class DefaultA extends BaseA {
  val value = "production"
}
class TestingA extends BaseA {
  val value = "test"
}
```

なのを作れば差し替えは可能です。

### DI コンテナ

ところで、Registry とは何でしょうか。この部分です。

```scala
trait Components
    extends ConfigurationComponent
    with AComponent
    with BComponent

object Registry extends Components {
  val configuration = new DefaultConfiguration
  val a = new A()
  val b = new B()
}

object RegistryTesting extends Components {
  val configuration = new TestingConfiguration
  val a = new A()
  val b = new B()
}
```

これは `Registry.a` などと指定して取り出せるので、DI コンテナです。このとき Components を継承しているおかげで、この a とかを作っていないとコンパイルエラーになります。必要な依存を必ず作らせてくれるのは、ソースコードで依存性を定義できる Scala の強みでしょう。

Cake Pattern は trait を前提とした DI なので、いつ instance が作られるかわかりづらいですが、それはこのコンテナ部分だったというオチです。

### シングルトン

さて、先ほどの例は Registry という DI コンテナから依存を取り出していました。これはサーバーサイドの実務上は結構危険だと思っているのでやめたいと個人的には思っています。どんなサーバーサイド FW を採用するかにもよりますが、誰かが setter を実装してしまった場合を考えています。メモリの使用量問題はありますが、セキュリティの都合で 1 リクエストあたり 1 インスタンスが作りたく、このようにインスタンスを使い回すのはやめたいです。しかも scala では object はシングルトンです。そのため作られるインスタンスは一つです。

FYI: https://docs.scala-lang.org/ja/tour/singleton-objects.html

そのようなときは Component の中でインスタンスを作れば良いです。そのケースも https://github.com/davidmoten/cake-pattern の下部に書かれているので参照して欲しいです。

```scala
import java.util.UUID._

  trait AComponent {
    this: ConfigurationComponent with CComponent =>
    val a: A
    class A {
      val c = new C()
      val value = "a-" + configuration.value + "-" + c.value
    }
  }

  trait BComponent {
    this: ConfigurationComponent with AComponent with CComponent =>
    val b: B
    class B {
      val c = new C()
      val value = a.value + "-b-" + configuration.value + "-" + c.value
    }
  }

  trait CComponent {
    this: ConfigurationComponent =>
    class C {
      val value = "c-" + configuration.value + "-" +
        randomUUID.toString.substring(1, 5)
    }
  }

  object Registry
    extends ConfigurationComponent
    with AComponent
    with BComponent
    with CComponent {

    val configuration = new DefaultConfiguration
    val a = new A()
    val b = new B()
  }
```

ただ、疑問に残るのがこのとき C に依存を持つ BComponent に対するテストはどう書けば良いのだろうかということです。C を外から挿入しなければモックできないのではないでしょうか。詳しい人、教えてください。

### サーバーサイドの実務で使うならば

それっぽく書くならこういう感じになると思います。実際は Entity 返したり、SQL ドライバ入れたりとかあるが、雰囲気はこのような感じではないでしょうか。あとは Registry を各 router が呼び出せばいつもの感じです。

```scala
trait UsecaseComponent {
    this: RepositoryComponent with ServiceComponent =>
    class Usecase {
        def getUsers(){
            service.getUsers()
        }
    }
}

trait ServiceComponent {
    this: RepositoryComponent =>
    val service: Service
    class Service {
        def getUsers(){
          repo.getUsers()
        }
    }
}

trait RepositoryComponent {
    val repo: Repository
    class Repository {
        def getUsers(){}
    }
}

trait Components
    extends UsecaseComponent
    with ServiceComponent
    with RepositoryComponent

object DefaultRegistry extends Components {
  val usecase = new Usecase()
  val service = new Service()
  val repo = new Repository()
}
```

そしてこれにテストを書くときは、テスト対象のクラスに対して base trait を作っておいて自分型アノテーション経由で実装を差し替えると良いです。

それは <https://www.techscore.com/blog/2012/03/27/scala%E3%81%A7di-%EF%BC%88cake-pattern%E5%B0%8E%E5%85%A5%E7%B7%A8%EF%BC%89/> の xxxImpl を作っている箇所が該当するので参考にして欲しいです。

## 終わりに

むずい。constructor injection 最高
