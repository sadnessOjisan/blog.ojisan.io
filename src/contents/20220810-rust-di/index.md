---
path: /rust-di
created: "2022-08-10"
title: Rust で DI
visual: "./visual.png"
tags: ["rust", "di", "cake pattern"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

OGP はリコリス・リコイル４話的な何かです。語感的にもはや何の繋がりもないのですが、前に書いた[Cake Pattern で DI してみた](https://blog.ojisan.io/cake-pattern/) 繋がりで仕方なこうなっています。

## はじめに

[先日 Cake Pattern を紹介しました](https://blog.ojisan.io/cake-pattern/)。これは constructor injection に頼らない DI の方法です。
Scala であれば、その本質は自己型アノテーションで、 継承元の trait を自己型アノテーショに指定しておけば、その trait を実装やテストごとに差し替えられることができて、DI が可能になるというものです。

## Rust でも Cake Pattern で DI

前に scala を使ったのは原点から学びたかったためです。いきなり Rust で学ぶと難しかったからです。今日は Cake Pattern をある程度理解しているので、Rust でやっていきます。
といっても κeen さんの [Rust の DI](https://keens.github.io/blog/2017/12/01/rustnodi/) を見れば全部書いてあるのでそれを見てください。
実装を紹介すると、

```rust
pub trait UserDao {
    fn find_user(&self, id: i32) -> ();
}

pub trait HaveUserDao {
    type UserDao: UserDao;
    fn user_dao(&self) -> Self::UserDao;
}

pub trait UserService: HaveUserDao {
    fn get_user_by_id(&self, id: i32) -> () {
        self.user_dao().find_user(id)
    }
}

impl<T: HaveUserDao> UserService for T {}

struct RepositoryImpl<Repo: UserDao> {
    repo: Repo,
}

trait HaveUserService {
    type UserService: UserService;
    fn user_service(&self) -> Self::UserService;
}

struct ServiceImpl<Service: UserService> {
    service: Service,
}
```

のようになります。

Scala の自己型アノテーションを使った DI テクニックは、関連型を使った差し替えで実現できます。試しにテストコードを書いてみるとすれば、

```rust
#[cfg(test)]
mod tests {
    use crate::{HaveUserDao, HaveUserService, ServiceImpl, UserDao, UserService};

    #[test]
    fn test_get_user_by_id() {
        struct MockRepository {}
        impl UserDao for MockRepository {
            fn find_user(&self, id: i32) -> () {
            }
        }
        struct DaoComponent {}
        impl HaveUserDao for DaoComponent {
            type UserDao = MockRepository;
            fn user_dao(&self) -> Self::UserDao {
                MockRepository {}
            }
        }

        let dao_component = DaoComponent{};
        let service = ServiceImpl {
            service: dao_component
        };
        let user = service.service.get_user_by_id(2);
        assert_eq!(user, 3);
    }
}
```

という風に Repository を mock して service のテストを書けるわけですが、このとき UserDao を実装した MockRepository を HaveUserDao の関連型に指定することで DaoComponent に injection できます。また DaoComponent は `impl<T: HaveUserDao> UserService for T {}` によって Service として振る舞えます。（HaveUserDao を実装しているものは UserService が実装されるの意。詳しくは [ジェネリックトレイト](https://doc.rust-jp.rs/rust-by-example-ja/generics/gen_trait.html)）

このようにテストでモックに差し替えができるので DI の要件は満たしており、実用的に思えます。

## 3 層以上の DI を考える

しかし問題があります。いまは 2 層での DI でしたが 3 層の DI になったときはどうすればよいでしょうか。つまり Usecase -> Service -> Repository のようなパターンです。これは何が問題になるかというと Usecase から Service の DI です。先ほどの例では Service(DaoComponent) は repository を持つ必要がありました。そのため、Usecase を作るためには Repository の準備も必要となるわけです。テストするたびに毎回 Repository を作る必要が生まれるわけです。めんどくさいです。

一応、[Rust で DI する時の小技](https://ryym.tokyo/posts/rust-di/) という記事でこの手の問題に対する対策が書かれており、

```rust
pub trait IsSvcA {
    fn a(&self) -> String;
}

pub trait SvcA {}

impl<T: SvcA> IsSvcA for T {
    fn a(&self) -> String {
        "svc-a".to_owned()
    }
}

// Provide A service.
pub trait HaveSvcA {
    type A: IsSvcA; // Not SvcA
    fn get_svc_a(&self) -> &Self::A;
}

pub trait IsSvcB {
    fn b(&self) -> String;
}

// SvcB depends on HaveSvcA instead of IsSvcA.
pub trait SvcB: HaveSvcA {}

impl<T: SvcB> IsSvcB for T {
    fn b(&self) -> String {
        let a = self.get_svc_a();
        format!("a: {}, b: {}", a.a(), "svc-b")
    }
}

// Provide B service.
pub trait HaveSvcB {
    type B: IsSvcB; // Not SvcB
    fn get_svc_b(&self) -> &Self::B;
}

pub fn use_b<S: HaveSvcB>(svc: S) -> String {
    let b = svc.get_svc_b();
    format!("[use] {}", b.b())
}
```

のようにインターフェイスと依存関係定義を分離すると良いとされています。
こうすることで、HaveSvcB を使う他のコードは IsSvcB にのみ依存する形になり、mock 部分が簡単に作れます。

ただ、このパターンは普通に難しくて僕は使いたくなくなりました。
このパターンを暗記すればいいのかもしれませんが、継承や trait 境界における意味付けがしっくりこなかったし、ただでさえ多い Cake Pattern のルールやボイラープレートがさらに増えるので大変です。

## 初心に帰って Constructor Injection

やはり簡単な DI は Constructor Injection です。
どうにかしてこれに頼りましょう。
これまで Constructor Injection を避けていた、採用しなかった理由は次の通りです。

### constructor がない

Rust には class constructor がないことから DI する口を作れません。
ただこれは trait に `fn new (&self) -> Self` を生やせば済む話です。

### 所有権, ライフタイム

これは injection されるものを使い回す場合の問題です。一つの handler が複数の usecase を呼ぶが、それらは共通の injection を要求する場合などが該当します。参照を渡す場合はライフタイムが煩雑になり、実体を渡す場合は clone の付与と実行が必要となります。そして clone した場合は application cache などが使えなくなってしまいます。

### 3 層で mock

cake pattern のときと同じ問題も残っています。この形式だと、Usecase のテストを書くためには mock service のための repository が必要となってしまいます。なぜならそれがないとインスタンスを作れないからです。煩雑です。

しかしこれらにはきちんと解決法（というか誤魔化し方）があるので、それを見ていきます。

## 救世主、mockall

ところで Rust には [mockall](https://docs.rs/mockall/latest/mockall/) という crate があります。

```rust
fn do_something() {}

struct NonClone();

#[automock]
trait Foo {
    fn foo(&self) -> NonClone;
}

let mut mock = MockFoo::new();
let r = NonClone{};
mock.expect_foo()
    .return_once(move || {
        do_something();
        r
    });
```

のようにマクロをつけたところから、MockXXX という名前の構造体（しかも constructor もついている）と、`expect_xxx()` というメソッドを作ってくれます。つまり、このモックライブラリは DI することなく欲しい構造体をピンポイントで作ってくれ(= Usecase からは Service のための Repository が不要になる)、なおかつ上書き可能な mock 関数も提供してくれるわけです。これにより 3 層で mock する場合の入れ子定義をしなくて済みます。

## 所有権、ライフタイムは気にしない言い訳を作る

handler の中で 1 リクエストにつき構造体を作ります。

```rust
async fn handler() -> String {
    let repo = RepositoryImpl {};
    let service = UserServiceImpl {
        user_repository: repo,
    };
    let usecase = UserUsecaseImpl {
        user_service: service,
    };
    let actual = usecase.get_user_by_id(1).await;
    format!("<h1>Hello, World! {}</h1>", actual.id)
```

そして injection しているものは実体で、もし他のユースケースに injection を求められたら clone します。こうすれば原理的には動きます。

と書くと、「余計なステップが挟まっている」「メモリの無駄遣い」という意見も出るでしょう。それに対しては、「IO が挟まるのだからそれに比べたら微々たるもので無視できる」「長時間リクエストを保つわけじゃないし、それが終わればメモリは解放されるでしょ」ということで無視します。

## とはいえちゃんとパフォーマンスも考えるならば？

先の解決法は強引なので正攻法も少し考えます。

パフォーマンスの考慮は helloyuki\_ さんの [Rust の新しい HTTP サーバーのクレート Axum をフルに活用してサーバーサイドアプリケーション開発をしてみる](https://blog-dry.com/entry/2021/12/26/002649#Dependency-Injection) に全部書かれているので、こちらをご参照ください。DI コンテナを用意して一度作った repository などを使い回したり、使い回すための参照は Arc で管理することで、複数の口から呼べるようにします。そうすると、構造体を作るステップやメモリの消費を抑えることができます。この方式ならキャッシュも作れます。
