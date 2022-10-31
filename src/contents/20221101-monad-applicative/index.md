---
path: /monad-applicative
created: "2022-11-01"
title: Monad は継続、Applicative は並列
visual: "./visual.png"
tags: ["scala", "cats", "monad"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

Scala の cats のドキュメント群が Monad に関する説明としてすごくわかりやすかったので、そこで学んだことをまとめておこうと思った。

## モナドを理解したい

モナドを理解したいというモチベーションをずっと持っている。Wasm 文脈で Rust に入門しそこで Option や Result と出会い、[OCaml で Monadic Parser を意味も分からず実装](https://youtu.be/Y5IIXUBXvLs)し、そのための勉強で Parsec を知り[H 本](https://www.amazon.co.jp/%E3%81%99%E3%81%94%E3%81%84Haskell%E3%81%9F%E3%81%AE%E3%81%97%E3%81%8F%E5%AD%A6%E3%81%BC%E3%81%86-Miran-Lipova%C4%8Da/dp/4274068854)で Haskell と一緒に勉強したり、同僚に Scala と cats を布教されたりで、長いことモナド周りの技術に触れている。しかし今でもきちんと理解できている自信がない。何が理解できないのだろうか。

## H 本で学んだこと

H 本は型クラスについて解説したあとに Functor の説明に入る。ここでは文脈を持った値、文脈を維持したまま関数を適用できる関数として fmap の説明がある。そして fmap だと 1 引数の関数しか取れないのでその自然な拡張として Applicative が登場する。そしてモナドは "普通の値 a を取って文脈付きの値を返す関数に、文脈付きの値 m a を渡す (bind)" ことができるように、Applicative を拡張したものとして紹介される。

このとき functor は List.map の経験などからなんとなくメンタルモデルが分かるのだが、Applicative や Monad はどうだろうか。導入されると何が嬉しいのか、なぜこんなに話題（？）になるのかが分からないかもしれない。私は分からなかった。

誤解を招く前に弁明すると、H 本は悪い本ではないと思うし、むしろ私の頭が悪いだけだ。

それでも知人に講義してもらったり [cats のドキュメント](https://typelevel.org/cats/index.html)と睨めっこしていたら何かが見えた気がしたので、この記事では自分が掴んだ Monad と Apprecative に対する理解やメンタルモデルの言語化を試みる。

## Monad をじっと眺める

さて Monad のことを "普通の値 a を取って文脈付きの値を返す関数に、文脈付きの値 m a を渡す (bind)" と書いたが、これはどういうことだろうか。ジッと眺めてみよう。

```scala
trait FlatMap[F[_]] extends Apply[F] {
  def flatMap[A, B](fa: F[A])(f: A => F[B]): F[B]
}

trait Monad[F[_]] extends FlatMap[F] with Applicative[F]
```

ここでいう flatMap は 先の説明での bind だ。`F[A]` は文脈に包まれた値、`A=>F[B]` はただの値を引数にとって文脈付きの値を返す関数だ。

文脈に包まれた値 `F[A]` は `Maybe[Int]`, `List[Int]`, `Either[String, User]` などだ。`A=>F[B]` は Maybe や Either を返す関数と思えば馴染みが深いだろう(例外を投げずに Either や Result で包むことはよくすることであろう。たとえばバリデーション)。

さて、この flatMap をジッと眺めてみるとあることに気づくだろう。flatMap は　`F[A]` と `A => F[B]` を受け取って `F[B]` を返すのである。そのためここで作った `F[B]` は `F[A]` としてもう一つ後続に flatMap があればその引数に渡せるのである。つまり flatMap はチェーンできる。

Monad は継続と書いたのはそういうことである。

## Monad は継続を表現できる

さて、継続を表すことについてもっと見ていこう。

flatMap を連続させることは H 本でも言及がある。

たとえば Maybe で包まれた文字を結合するにはこうする。

```hs
foo :: Maybe String
foo = Just 3 >>= (\x ->
      Just "!" >>= (\y ->
      Just (show x ++ y)))
```

しかしこのやり方だとラムダ式を毎回作る必要があって手間なので、簡単に記述する方法として Haskell では do 記法が提供されている。

```hs
foo :: Maybe String
foo = do
  x <- Just 3
  y <- Just "!"
  Just (show x ++ y)
```

今回の例は簡単であったが、実際には Maybe 値が Just か Nothing かみたいなロジックを入れ出すともっと複雑なラムダ式になり、do 記法の必要性は高まる。（H 本のピエールの綱渡りの例がまさしくそれ）

この例から分かる通り do 記法はモナド値を引数に取り、bind を実行してくれる仕組みだ。

こんなに素晴らしい do 記法だが、残念ながら do 記法は Scala には存在せず、代わりに for yield で代用する。

```scala
val result = for {
    x <- Some(1)
    y <- Some(x + 1)
    z <- None
} yield (x, y, z)
print(result) // Nothing
```

最初はなぜ for yield と思うかもしれないが一般的な for 式をジッと眺めるとこれも合点がいく。

```scala
def foo(n: Int, v: Int) =
   for (i <- 0 until n;
        j <- 0 until n if i + j == v)
   yield (i, j)

foo(10, 10) // prints (1, 9) (2, 8) (3, 7) (4, 6) (5, 5) (6, 4) (7, 3) (8, 2) (9, 1)
```

for yiled は for 内包表記とも呼ばれ、[実際には List を生成する](https://docs.scala-lang.org/ja/tour/for-comprehensions.html)。

ここで思い出してほしいのは、List は monad であることだ。List は map もあるし、flatMap もある。なので for という一般的な初歩的な構文であっても、実は裏側では List Monad の文脈で do 式 (ここでは for 内包表記)が実行されて flatMap が適用されていたのである。このときは for yiled は List 専用に見えるものだが、内部的には flatMap の呼び出しに変換してくれていたようだ。

FYI: https://www.scala-lang.org/files/archive/spec/2.12/06-expressions.html (6.19)

これは

```scala
def foo1(n:Int,v:Int) = (0 until 10).flatMap( i => (0 until 10).withFilter(_ + i == 10).map(j => (i,j)))
```

このように変換できる。

```scala
def foo2(n:Int,v:Int) = for {
  i <- 0 until n
  j <- 0 until n if i + j == v
} yield (i,j)
```

逐次という表現はリストだと分かりにくいかもしれないが、IO (Rust でいう Future みたいなもの) で考えるともっと分かりやすくなる。

たとえば、

```scala
IO.readline
  .flatMap(input =>
    IO.println("start").flatMap(_ =>
      IO.sleep(Duration.fromNanos(input.toLong)).flatMap(
        _ => IO.println("done")
      )
    )
  )
```

は

```scala
for {
  input <- IO.readLine
  _ <- IO.println("start")
  _ <- IO.sleep(Duration.fromNanos(input.toLong))
  _ <- IO.println("done")
} yield ()
```

となる。

この通り Scala では for yield を使って flatMap を容易に使え、flatMap のおかげで前のステップでの処理結果を使った処理を文脈に包んで返すことができる。それは flatMap が提供する `def flatMap[A, B](fa: F[A])(f: A => F[B]): F[B]` の型シグニチャからも明らかだろう(返り値の `F[B]` が後続の flatMap の引数になれるという点で)。

そのためメンタルモデル的には、Monad は継続を表すと言える。

では、Applicative はどうだろうか。

## Applicative

### まずは Functor のおさらい

型クラスの基本的なものとして Functor がある。
これはある文脈（箱という風にも呼ばれる）に包まれた値に対して関数を適用する fmap を提供するものだ。

```scala
trait Functor[F[_]] {
  def map[A, B](fa: F[A])(f: A => B): F[B]
}
```

具体的には例えば Option であれば、

```scala
implicit val functorForOption: Functor[Option] = new Functor[Option] {
  def map[A, B](fa: Option[A])(f: A => B): Option[B] = fa match {
    case None    => None
    case Some(a) => Some(f(a))
  }
}
```

と言うふうな map の実装になる。

```scala
functorForOption(Some(3))(_ + 1) // Some(4)
```

などとして、Some という文脈 (失敗するかもしれないという文脈)に包まれた 3 に対して +1 という関数を適用している。

### Functor を拡張した Applicative

Applicative は Functor を拡張したもので、

```scala
trait Applicative[F[_]] extends Functor[F] {
  def ap[A, B](ff: F[A => B])(fa: F[A]): F[B]
  def pure[A](a: A): F[A]
}
```

と定義される。

これは A を F[A] と文脈に包んであげる pure と、関数 A=>B を文脈に包んだ F[A=>B] と、文脈にくるんだ F[A]を受け取って F[B]を返す関数 ap から構成される。`F[A=>B]` は馴染みがないかもしれないが、例えば足し算をする関数 + を Some(+) で包んだものがこれとなる。Some といった文脈で任意のものを包みたければ pure の出番となる。

H 本では

```haskell
Just (+3) <*> Just 9

pure (+3) <*> Just 9
```

みたいな例があったがこれも読み解けば同じことである。

### Applicative は何が嬉しいか

それは多変数の関数が扱い **易い** 点である。例えば

```haskell
pure (+) <*> Just 9 <*> Just 3
```

のようなことができる。その結果、いわゆる文脈に包まれていないスッピンの関数を様々な文脈付きの値に適応できるようになる。これは文脈付きの値がたくさん出てくる実務においては非常に有効だ。（例えば Rust や Scala を書くとそこかしこから Result や Future が返ってくる。）

もう一つには、並列処理の提供である。Applicative の場合は多変数をとるので、map ではなく mapN が提供される。

## Applicative は並列を表す

さて、Monad の例では

> 文脈に包まれた値 `F[A]` は `Maybe[Int]`, `List[Int]`, `Either[String, User]` などだ。`A=>F[B]` は Maybe や Either を返す関数と思えば馴染みが深いだろう(例外を投げずに Either や Result で包むことはよくすることであろう。たとえばバリデーション)。

のような説明をしたが、実はフォームバリデーションにおいては Monad が適さないことが知られている。

これは [cats の validated](https://typelevel.org/cats/datatypes/validated.html) に全て書かれているので、かいつまんで説明する。

そのためにまず、Validation のエラー結果を定義する。

```scala
sealed trait DomainValidation {
  def errorMessage: String
}

case object UsernameHasSpecialCharacters extends DomainValidation {
  def errorMessage: String = "Username cannot contain special characters."
}

case object PasswordDoesNotMeetCriteria extends DomainValidation {
  def errorMessage: String = "Password must be at least 10 characters long, including an uppercase and a lowercase letter, one number and one special character."
}

case object AgeIsInvalid extends DomainValidation {
  def errorMessage: String = "You must be aged 18 and not older than 75 to use our services."
}
```

そして

```scala
def validateUserName(userName: String): Either[DomainValidation, String] =
    Either.cond(
      userName.matches("^[a-zA-Z0-9]+$"),
      userName,
      UsernameHasSpecialCharacters
    )
```

のように `String -> Either[DomainValidation, String]` のような型を持つバリデーション関数を定義する。

```scala
import cats.implicits._

sealed trait FormValidator {
 def validateUserName(userName: String): Either[DomainValidation, String] =
    Either.cond(
      userName.matches("^[a-zA-Z0-9]+$"),
      userName,
      UsernameHasSpecialCharacters
    )

 def validatePassword(password: String): Either[DomainValidation, String] =
    Either.cond(
      password.matches("(?=^.{10,}$)((?=.*\\d)|(?=.*\\W+))(?![.\\n])(?=.*[A-Z])(?=.*[a-z]).*$"),
      password,
      PasswordDoesNotMeetCriteria
    )

 def validateAge(age: Int): Either[DomainValidation, Int] =
    Either.cond(
      age >= 18 && age <= 75,
      age,
      AgeIsInvalid
    )
}

object FormValidator extends FormValidator
```

そしてこの trait に Form 全体をバリデーションする関数を定義する。

```scala
def validateForm(username: String, password: String, firstName: String, lastName: String, age: Int): Either[DomainValidation, RegistrationData] = {

    for {
      validatedUserName <- validateUserName(username)
      validatedPassword <- validatePassword(password)
      validatedAge <- validateAge(age)
    } yield RegistrationData(validatedUserName, validatedPassword, validatedAge)
  }
```

ここでは、Either は Monad なので flatMap を持ち、for yield で計算することができる。

このバリデーション関数に、パスワードの複雑性と年齢の２つで違反したデータを渡してみると、

```scala
FormValidator.validateForm(
  username = "fakeUs3rname",
  password = "password",
  age = 15
)
// res1: Either[DomainValidation, RegistrationData] = Left(
//   value = PasswordDoesNotMeetCriteria
// )
```

最初に失敗した方しか反映されないのである。これは flatMap が継続を表しているためであり、失敗した時点で継続の反映をやめてしまうので age の判定まで処理が及んでいないのである。

フォームのバリデーションにおいては Either と flatMap は適さないのである。

そこで flatMap のように前の処理結果に影響されることなく、処理を行える "並列" の考え方を取り入れたい。それは [Validated](https://typelevel.org/cats/datatypes/validated.html) だ。

```scala
sealed trait FormValidatorNec {

  type ValidationResult[A] = ValidatedNec[DomainValidation, A]

  private def validateUserName(userName: String): ValidationResult[String] =
    if (userName.matches("^[a-zA-Z0-9]+$")) userName.validNec else UsernameHasSpecialCharacters.invalidNec

  private def validatePassword(password: String): ValidationResult[String] =
    if (password.matches("(?=^.{10,}$)((?=.*\\d)|(?=.*\\W+))(?![.\\n])(?=.*[A-Z])(?=.*[a-z]).*$")) password.validNec
    else PasswordDoesNotMeetCriteria.invalidNec

  private def validateAge(age: Int): ValidationResult[Int] =
    if (age >= 18 && age <= 75) age.validNec else AgeIsInvalid.invalidNec

  def validateForm(username: String, password: String, age: Int): ValidationResult[RegistrationData] = {
    (validateUserName(username),
    validatePassword(password),
    validateAge(age)).mapN(RegistrationData)
  }

}

object FormValidatorNec extends FormValidatorNec
```

こうすることで mapN で複数項目のバリデーション結果をそのまま受け取れる。

Either は失敗するかもしれないというモナドであったが、Validated は失敗するかもしれないと言う Applicative である。

## Either でも良いざー

とはいえ Either は Monad であるため Applicative でもある。そう考えると Validated の存在意義は何だろうか？Either は逐次を表すから Validation に向かないと書いたが、その真犯人は for yield ではないだろうか。並列処理できるようにした真の立役者は mapN ではないだろうか。mapN は Either でもできるので Validated を使う理由はないかもしれない。

結論からいうと、その通りである。しかし Validated を使うことで Monad でなく Applicative という宣言をするので、flatMap や for yield が使われる可能性を排除できるし、使えばコンパイルエラーとなる。なので コードを読む人が Validated を見れば、「あ、順序に依存しないのだ」と型から読み取れるようになる。Either でも mapN できるという考え方は、「TypeScript なんてなんでも any 型で書けばいいじゃん」 っていう考えと同じである。制約は強ければ強いほど良いのである。

## これらを学べる資料

- https://typelevel.org/cats/index.html
- https://www.scalawithcats.com/dist/scala-with-cats.pdf
- https://eed3si9n.com/herding-cats/ja/index.html
