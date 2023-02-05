---
path: /not-use-dip
created: "2023-02-05"
title: DIP(依存性逆転の原則)を守っていない話
visual: "./visual.png"
tags: ["設計"]
userId: sadnessOjisan
isFavorite: false
isProtect: true
---

一昨日くらいに 「DIP してもどうせ辛くなるよね」的なことを適当にツイートしたら引用 RT や RT 後言及やエアリプで言及された上に「こいつは設計を何も理解しとらん」みたいなことを言われた。「俺は本当に何も理解していないのか？」と不安になったので、自分の考えをちゃんと書いておこうと思った。先に自分の立場を言うと、なんたらアーキテクチャとか SOLID 原則は有用だし自分も使うが、それを厳守しようとは思っていないと言う立場だ。

## DIP とはなんだったか

[DIP(依存性逆転の原則)](https://ja.wikipedia.org/wiki/%E4%BE%9D%E5%AD%98%E6%80%A7%E9%80%86%E8%BB%A2%E3%81%AE%E5%8E%9F%E5%89%87)は SOLID 原則の一つで、一言で言うと「抽象に依存させると依存関係が逆転する」といったものだ。何のことやらという風になるので例だけ挙げると、UserRepository と UserService があってこのように定義すると

```ts
class UserRepository {
  get() {
    return data_from_store;
  }
}

class UserService {
  private repo: UserRepository;
  get() {
    return this.repo.get();
  }
}
```

UserService が UserRepository に依存するが、ここで間に Interface を挟み、UserService が Interface に依存し、UserRepository が Inteface を実装すると

```ts
interface IUserRepository {
  get(): User;
}

class UserRepository implements IUserRepository {
  get(): User {
    return data_from_store;
  }
}

class UserService {
  constructor(private repo: IUserRepository) {}
  get(): User {
    return this.repo.get();
  }
}
```

といった風になって UserService は IUserRepository に依存、UserRepository は IUserRepository に依存するようになり、UserRepository が一方的に依存されなくなって依存関係が逆転するといったものだ。

## DIP があると何が嬉しいと言われているのか

依存関係が逆転すると何が嬉しいのだろうか。正直自分はあまりピンと来ていないが例えばこういうものがある。

### テストがしやすくなる

まず mock を指しやすくなると言う利点があるだろう。先の例だと IUserRepository を作れば UserService に DI できる。

### 差し替えが容易になる

IF は同じだけど実装が違うといったモジュールを差し替えやすくなる。Repository 層だと SQL Client ベースの Repository か HTTP Client ベースの Repsoitory かという差し替えができるようになる。そしてこの差し替え容易性はレイヤの再利用という風にも使える。レイヤの再利用はサーバー開発だとあまり出番がないかもしれないがアプリ開発だと Presenter や View 周りでありえる。

FYI: https://qiita.com/uhooi/items/03ec6b7f0adc68610426

またこの差し替え容易の利点はテストにおいても享受できる。

### チーム開発に規律を作れる

これは確かにと思った意見だ。インターフェースを作らないといけないと言うルールを設けて、テンプレをコピペさせて開発することで、ジュニアメンバーに開発を任せても規律が生まれてスケーリングするという視点だ。

### 詳細を知る気持ち悪さの軽減

自分が思っているだけかもしれないが、なんちゃらアーキテクチャの基本的なルールはいかに外界に無知でいられるかだと思う。ドメインモデルが外部ライブラリに依存していてそのライブラリが deprecated になったらどんな悲惨な目に遭うかなどを想像してもらえるとしっくりくると思う。具体的な何かを知らない方が差し替えの時に影響範囲を限定できる。DIP を使わないと抽象ではなく具象に依存することになるので詳細を知ってしまい、気持ち悪さは生まれると思う。

## これらを踏まえた上で DIP は守らなくてもそこまで困らないと思っている

といったメリットを挙げた上で、自分は DIP はそこまで守らなくてもいいのではと思っている。

### テストを取り巻く環境が変わりすぎた

まずモックライブラリが強力だと、 interface を切らなくてもモックできてしまう。

```ts
import { User } from "./domain";
import { UserRepositoryWithoutInterface } from "./repo";

export class UserService {
  constructor(private repo: UserRepositoryWithoutInterface) {}
  get(): User {
    return this.repo.get();
  }
}
```

```ts
import { User } from "./domain";

interface IUserRepository {
  get(): User;
}

export class UserRepository implements IUserRepository {
  get(): User {
    return { id: 1, name: "example" };
  }
}

export class UserRepositoryWithoutInterface {
  get(): User {
    return { id: 1, name: "example" };
  }
}
```

```ts
import { beforeEach, describe, expect, test, vi, vitest } from "vitest";
import { UserService } from ".";
import { UserRepositoryWithoutInterface } from "./repo";

vitest.mock("./repo", () => {
  const UserRepositoryWithoutInterface = vi.fn();
  UserRepositoryWithoutInterface.prototype.get = vi.fn();
  return { UserRepositoryWithoutInterface };
});

describe("service", () => {
  let mockRepository;

  beforeEach(() => {
    mockRepository = new UserRepositoryWithoutInterface();
  });

  test("service", () => {
    mockRepository.get.mockReturnValue({
      id: 2,
      name: "from mock value",
    });
    const service = new UserService(mockRepository);
    const actual = service.get();
    expect(actual).toEqual({ id: 2, name: "from mock value" });
  });
});
```

```
RERUN  index.test.ts x9

 ✓ index.test.ts (1)

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  11:18:10
   Duration  13ms
```

テストできてしまった。これは JS/TS 以外にも型ヒントがあってダックダイピングできる言語は全部当てはまると思う。なので Rust とか型のごまかしが難しい言語だとそういうのはできない。

```rust
use mockall::predicate::*;
use mockall::*;

#[derive(Debug, PartialEq)]
pub struct User {
    id: u32,
    name: String,
}

struct Repo {}

#[automock]
impl Repo {
    pub fn get(&self) -> User {
        User {
            id: 1,
            name: "example".to_string(),
        }
    }
}

struct Service {
    repo: Repo,
}

impl Service {
    fn get(&self) -> User {
        self.repo.get()
    }
}

fn main() {
    let repo = Repo {};
    let service = Service { repo };
    println!("{:?}", service.get());
}

#[cfg(test)]
mod tests {

    use crate::{MockRepo, Service, User};

    #[test]
    fn it_works() {
        let mut mock = MockRepo::new();
        mock.expect_get().returning(|| User {
            id: 2,
            name: "mocked".to_string(),
        });
        let service = Service { repo: mock };
        assert_eq!(
            service.get(),
            User {
                id: 2,
                name: "mocked".to_string()
            }
        );
    }
}
```

```
let mut mock: MockRepo
Go to MockRepo

mismatched types
expected struct `Repo`, found struct `MockRepo`rustcClick for full compiler diagnostic
No quick fixes available
```

mockall は struct にではなく trait に生やさないとコンパイルが通らない。なので Repo は struct にではなく trait を作る必要があり、そのため DIP が強制されてしまう。std::mem::transmute 使えば突破できるかなとも思ったけどサイズ合わなくてできなかった。ただ Rust ほど厳しくない静的型付け言語なら Any 型的なもので突破ハッチは作れるだろう。

ちなみに Rust での DI テクニックについてはこちらにまとめた。consturcutor injection して mockall 使えばいいよ。

FYI: https://blog.ojisan.io/rust-di/

あとそもそも最近の流行りとして msw だったりローカルに DB 立てたりして Unit Test はしない人たちも増えていると思うので、そもそもテストの事情は考えなくていいかもしれない。（自分は結構 UT を書きますが！！！）

### 差し替え可能とはいうが差し替えたい時ってあるのか

Usecase -> Service -> Repository みたいな構造があったとして、このうちどれかを差し替えたいということはそもそも起きるのだろうか。一つあるのは Repository が SQL クライアントベースから HTTP クライアントベースになることだ。シナリオとしては Next.js で Web サービス開発していて BFF サーバーから直接 SQL 叩いていたが、ネイティブアプリ版も提供することになってデータを取る API Gateway が新設されてそれを fetch で取るようになるといった場合だ。このとき connection pool とかもなくなるので Repository 層は丸ごと差し替えになるだろう。そういうとき interface に Repository が依存していればコンパイルが通るように新しい Repository を作れば良い。

だが僕は interface がなくても別に困らないと思う。どうせ最終的にコンパイルが通ればいいので、インターフェースがあろうがなかろうがコンパイルエラーが出てそれを通すように実装していくことになるからだ。本当にインターフェースは必要なのだろうか？

また仮に Repository 層は入れ替えられるようにしておくとしても Usecase や Service はどうか？入れ替えることってないと思うので DIP を遵守はしなくていいと思う。

### 詳細を知ることの何が悪いのか

ドメインモデルが外部ライブラリに依存していてそのライブラリが deprecated になったときなどは大変なことになるが、別に自分達が作ったモジュールであれば自分達のコントロールの範囲内なので知っていてもいいのではと思う。あまり困りそうなシナリオを思いつかなかった。逆に Service からするとトランザクションやエラーハンドリングの都合で Repository の詳細を知っていた方が良い時もあるかもしれない。

### 困ってから対処すればいい

そして究極的なことを言うと、DIP をサボってもし何か困ることが起きたとしても、そのときになって IF 作って差し替えたり implements すればいいと思う。最初にしないと破綻する系のものではないと思う。

## 改めて自分の立場を表明すると DIP は有用なテクニックだけど厳守はしていない

Repository には interface 切るかもしれなくて、Usecase, Service などには作らないって温度感でいつもやっている。月何億 PV あるくらいの規模のサービスをチーム開発で 3 個くらい経験しているが、こういう設計で困ったことはまだない。もしいつか困るのならごめんなさい。
