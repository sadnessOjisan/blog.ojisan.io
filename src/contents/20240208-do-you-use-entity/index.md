---
path: /do-you-use-entity
created: "2024-02-08"
title: レイヤードアーキテクチャでデータを作成・編集するときの設計が分からん
visual: "./visual.png"
tags: [architecture]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

定期的に DDD やクリーンアーキテクチャなどを題材にした記事が盛り上がっているのを見ていると、いま長年の疑問を書けば誰か答えてくれるのではと思って書いてみる。
何に困っているかというと、

- いわゆるレポジトリ層が持つ create/update 関数の引数は Entity で待ち受けるべきか、プレーンなオブジェクトで待ち受けるべきか分からない
- ユーザーから POST Body されたデータにはビジネスルールを適用させるべきか（= 一度 Entity を作るべきか）分からない

だ。
Entity を作らない場合、いわゆるトランザクションスクリプトと呼ばれているものに近づく。
そしてトランザクションスクリプトには結構否定的な意見も見られる。
しかし、自分は Entity を作ることが必ず正解とは思えず、レイヤードな設計とトランザクションスクリプトを組み合わせる設計の余地もあると思っていて、トランザクションスクリプトが悪いものと言い切れないという感じだ。
そして設計に関しては諸々な観点で程度問題になると思っているので、みなさんはどんな設計にしているのだろうと思って書いてみた。

OGP は最近ハマっているネギ油だ。
汚い同心円は自分の設計に通ずるものがある。

## 謝罪

先に書いておくと自分は DDD も IDDD も PoEAA も読んでいない。
なのでこの疑問についての回答がこれらの本に書かれていたら申し訳ない。
クリーンアーキテクチャ本は駆け出しプログラマー時代に読んだ。
設計に精通しているわけではないが、いろいろな本や記事で紹介されているレイヤードアーキテクチャの手法は好きだし、自分は結構使っている。
ただ単一責任原則を守ってテスタブルにしたいと思っていたら自然とそういう設計に落ち着いたところがあり、思想についてちゃんと理解しているとは言えない。
なので変なこと書いていたらごめんなさい。
先に謝っておきます。
多分変なことを書いています。

## 前提となる設計

ここでいうレイヤードアーキテクチャとは、クリーンアーキテクチャ本に出てくる同心円の図のアレを指した言葉だと思ってくれて良い。

- Entity が中心にあり、ビジネスルールを持つ。
- その外側のレイヤーがアプリケーションのロジックを持つ。
- その外側に HTTP 通信や DB との IO といった機能を持つ。
- 内側は外側の事情を知ってはいけない。

ここでいうビジネスルールとは、Entity の中に書かれるルールのことを指してそう読んでいる。
恣意的な例を出すと、お酒を販売するECサイトにおけるユーザーの age は 20 歳以上のはずなので、

```ts
class User {
  private _id: number;
  private _name: number;
  private _age: number;

  ...

  get age() {
    if (this._age < 20) {
      throw new Error("お酒は二十歳から");
    }
    return this._age;
  }

  set age(age: number) {
    if (age < 20) {
      throw new Error("お酒は二十歳から");
    }
    this._age = age;
  }
}
```

と表せる。

レイヤードアーキテクチャの実装としては Router -> Usecase -> Service -> Repository のようなデータフローで、`new Usecase(new Service(new Repository))` のような依存関係でDIがされているものを想定している。
これが正しいかどうかはさておき、いろんなFWがこういった実装をしていたり、設計記事とかでも紹介されていて、共通認識を得られる手法だと思う。
正しいと言い切らなかったのは、こういう設計をすると大体の場合は[Domain model purity vs. domain model completeness (DDD Trilemma)](https://enterprisecraftsmanship.com/posts/domain-model-purity-completeness/)にあるように純粋性と完全性とパフォーマンスが衝突してしまうからだ。
教科書的な実装をしていくのであれば、パフォーマンスが犠牲になるだろう。
自分が悩んでいる課題も言ってしまえばDDD Trilemmaに含まれるものだと思う。

## データをDBに作成するときにビジネスルールを適用する方法がわからない

さて、さきの EC サイトの例でユーザー情報を登録する例を考える。
Repository 層を考えてみる。

### Entity を引数に取る

案の一つとしてはEntityを受け取り、それを保存する方法だ。

```ts
class Repository {
  private connection: MySQLConnection;

  save(user: User) {
    this.connection("INSERT INTO items SET ?", user);
  }
}
```

この方法の良いところは user が Entity なので、レポジトリ層のコードから 「ビジネスルールが適用されたオブジェクトを、データベースに保存している」と分かることだ。

しかしこのやり方は時として難しいだろう。
まずDBの id が auto increment だと LastID を取得してからでないと Entity を作れない。
Entity は同一性の比較のために id を必要とするからだ。
LastIDを取るとなると、複数ユーザーが同時に create userすることを考えて、ロックを取る仕組みを作ったり、単純に通信が１往復増えるので嬉しくない。
実際ISUCONでもここを潰すと予選突破できる年があった。
なので auto incrementな場合はこの手法を使いたくない動機が生まれる。

一方で ID 生成に制限がないのであればアプリケーション側で UUID を作って、それをもとに Entity を作れば解決できると思う。
けど primary key を UUID にするのは容量・検索・ソート・パフォーマンスの面から問題がないとは言えないので使っていい自信が持てない。
UUIDを代替するもの(ULIDなど)や新しいUUIDもあるが、セキュリティの懸念があったり、規格がまだ安定していなかったりというデメリットはあり、Entityを作る目的のために導入すべきなのかというと分からない。
（ID類推されたくないから連番やめたいという話なら、顧客に見せて良い用のidカラムを追加するので、今はEntityを作る目的と言い切っている。）

なので、Entityを受け取る方式が正解と言い切れないと思う。

### Plainなオブジェクトを引数に取る

では Entity でないものを受け取る方式を考える。
保存したいデータでEntityでないものを仮に DTO と呼ぶとする。
（これを本当にDTOと呼んでいいのかは知らないが、nest.js は[これ](https://docs.nestjs.com/controllers#request-payloads)を dto と呼んでいてそれが広く使われているのだから、自分で定義さえすれば自由に使っていい言葉だと思っている。）

```ts
interfafce DTO {
  name: string;
  age: number;
}

class Repository {
  private connection: MySQLConnection;

  save(dto: DTO) {
    this.connection("INSERT INTO items SET ?", dto);
  }
}
```

こうすれば id は不要で、DBの id 生成にお任せできる。

ただ、こうすると今度はビジネスルールの適用が Entity 経由でできなくなる。
その検証をしたければそのロジックをどこかにおく必要があり、きっとコードとしては、

```ts
const userService = new UserService(new UserRepository(mysqlDriver));
router.post("users", (req, res) => {
  const { name, age } = req.body;
  userService.save({ name, age });
});

class UserSerivice {
  private: _repo: UserRepository

  save({name, age}: UserInput){
    if(age < 20){
      throw new Error()
    }
    this._repo.save({name, age})
  }
}
```

となる。
これはそんなに変な設計でないと思っている。
まず一般的にこういう Service は DomainService とも呼ばれ、「Entityに関するものだが、Entity に定義できないロジックを集約する場所」としての役割がある。
なので Entity でチェックしていたことをここで行うことはそんなに悪いことだとも思わない。
もし悪いことがあるとすれば、Entityとサービスで検証内容が二重管理になることだろう。
ただそれを避けるためにビジネスロジックを全部 service に寄せていくと、今度は Entity に getter と setter しかない状態が生まれてしまう。
これはこれでドメインモデル貧血症などと呼ばれたりしてよくないものとされている。
それに加えてEntityにロジックがあれば、生成と検証が必ずセットになるので、こういうロジックはEntityに書いておいたほうが良いだろう。

そうなると Entity を作って、レポジトリ層は Entity を引数に取るべきな気がしてくる。

## データを更新するときにビジネスルールを適用する方法がわからない

さて、もっとやっかいなのは更新時の処理だ。
例えばユーザー情報の更新となると、名前だけ・年齢だけというパターンがありえ、そもそもとして Entity のフィールドが全て埋まらない状況で保存しないといけなくなる。
こうなるとEntityは作れない。

それに対する解決策の一つは、更新ということは更新対象のIDが分かっているということを使って、その ID で DBからデータをゲットすることだ。
そしてEntityを作り出し、更新対象を set し、もう一度DBに保存するとすると良い。
だがこれは当然のことながら DB に対するアクセスが1往復増えている。
なのでその余計な往復を避けたければ、Entityではなくプレーンなオブジェクトを使うべきとなる。
そしてプレーンなオブジェクトを使うと、先ほどと同じくどこで「二十歳以上か」というビジネスルールの適用すべきかに悩むことになる。

## 自分なりの解決策

いわゆるレイヤードアーキテクチャで実装した時にはいつも上記のことに頭を悩ましているが、これまでに自分がとった解決策もあるので紹介しようと思う。

### EntityのサブクラスとしてDTOもClassで定義する

まずは自分があまり筋良くなかったなと反省しているやり方だ。

```ts
class UserBase {
  constructor(
    protected _name?: string,
    protected _age?: number,
  ) {}

  get name() {}

  set name(name: string) {}

  get age() {
    return this._age;
  }

  set age(age: number) {
    // check age
    this._age = age;
  }
}

class User extends UserBase {
  constructor(
    protected override _name: string,
    protected override _age: number,
  ) {
    super(_name, _age);
  }
}

export class UserDTO extends UserBase {}
```

ロジックを集約させた UserBase を継承する形で User と UserDTO を作っている。
こうすると User も DTO も作成するときに同じロジックを適用することになる。

このやり方をするとDTO の歯抜けなオブジェクトのために `?` 付きのフィールド定義が必要だったり、protectedやoverrideを付けないといけなかったりで、複雑性が増したと思う。
自分1人の開発ならアリとも思ったが、このコードを引き継いだ人はギョッとしそうだなと思ってしまい、使うのをやめてしまった。

### Plain なオブジェクトとEntity でValue Objectを共有する

こちらは Repository に Plain なオブジェクトを使う場合のやり方だ。

#### Class を使う場合

age に対して いわゆる ValueObject を作り、

```ts
class UserAge {
  _age: number;

  get age() {
    if (this._age < 20) {
      throw new Error("お酒は二十歳から");
    }
    return this._age;
  }

  set age(age: number) {
    if (age < 20) {
      throw new Error("お酒は二十歳から");
    }
    this._age = age;
  }
}
```

これを User のフィールドに持たせ、

```ts
class User {
  age: UserAge;
}
```

DTOにも持たせると、

```ts
interfafce DTO {
  name: string;
  age: UserAge;
}

class Repository {
  private connection: MySQLConnection;

  save(dto: DTO) {
    this.connection("INSERT INTO items SET ?", dto);
  }
}
```

Entityを Repository で使わずともビジネスルールの検証を強制させられる。

この方法が最高に思えるが、実際にやるとすごくめんどくさい。
実務の大きいクラスと複雑なルールで実践すると、コストとメリットが釣り合っているのか分からなくなってくる。

#### Opaque を使う場合

そこで TypeScript など限られた言語専用のやり方になるが、少し楽をする方法もある。
いわゆるValueObjectを幽霊型で表現してしまうやり方だ。

```ts
type UserAge = { __userAge: never } & number;

const toUserAge = (age: number) => {
  if (age < 20) throw new Error();
  return age as UserAge;
};
```

こうすると UserAge は toUserAge経由でしか作れなくなる。
なので UserAge がフィールドに現れている箇所に値を入れるためには、必ずこのチェックを通す必要が生まれる。
これも ValueObject と呼べるだろう。

### 細かいことは気にせず、自分と同僚とテストを信じる

自分は PlainObject + ValueObject 派だったのだが、ビジネスルールの移譲がこれだけで表現できないこともある。
例えば、別のフィールドを参照したりする場合や状態遷移がある場合だ。
会社の技術ブログを投稿するCMSを例に考えると、下書き -> レビュー -> 公開 or 差し戻し のような遷移に伴って、審査中にはレビュアーフィールドが必須、差し戻しならコメントが必須になるなどするビジネスルールだと、ValueObject だけでこのルールを表現することは難しい。
（ユニオン型やEnumを駆使すればできないこともないとは思うが、TSやFP文化圏以外ではあまりやらない気がするので一般的な回答とは言えないと思う）
Entity にルールを集約させていないのなら、どうしても投稿状態ごとのswitch文の中で独自のロジックを適用させるようなコードをサービス層に書くことになると思う。

なので最近はもう「同一のビジネスルールを徹底して適用するためには〜」と考えるのをやめた。
ルールを書く場所が散らばろうが、Plain な Object を使いながら、お守り程度の Value Object を作りながら、全部 Service にロジックを書くことが増えた。
なるべくサービスにロジックを集約させてそのサービスを使い回し、お互いにレビューで指摘しあえば問題は軽減できる。
その代わり、不整合が起きてはいけないので、E2Eテストはしっかり書いて、入力とDBに保存された値の確認はしっかりしている。
あと入力時のバリデーションをしっかりするだけで解消できる問題も多い。
意外とこれでもなんとかなる。

## とはいえ教科書的にやれると嬉しい

とはいえ妥協している自覚はあるので、正解があるなら知りたいとずっと思っていた。
なので皆さんはどのようにしているのかが気になっている。
とっちらかった文章になったので最後に自分が知りたいことをまとめると、いわゆるレイヤードアーキテクチャで設計している場面で、ユーザーのリクエストをもとにデータを作成・更新するエンドポイントを開発する時、

- ビジネスロジックはEntityに集約させているか
- ビジネスロジックをEntityに集約させてそれをデータ作成・更新時に使うとなると、Entityを作るためにDBに対してパフォーマンス面でトレードオフが発生するが、どう解決しているか。
- ビジネスロジックをEntityに集約させなければ、完全性が失われてロジックが適用されないデータが保存される可能性が生まれる（酒屋ECに20未満のユーザーデータが作られるなど）が、どう解決しているか。

だ。
