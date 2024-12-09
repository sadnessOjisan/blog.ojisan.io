---
path: /layered-firestore
created: "2024-12-06"
title: Firestoreを使う際のレイヤードアーキテクチャ
visual: "./visual.png"
tags: ["firebase"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

[Firebase と添い遂げる Advent Calendar 2024](https://adventar.org/calendars/11050)、6日目です。
はい！3日くらい遅れていますが、ISUCONがあったんだから仕方ないよね。

## Firebase 使うならレイヤードアーキテクチャをやりたいよね

[1日目の記事](https://blog.ojisan.io/firebase-soitogeru/) にも書いたが、Firebase を技術選定する時はいつか卒業する前提で選ばれるというケースがある。
特に開発リソースのないチームは Firebase でビジネスを始めるのは合理的であり、その結果会社が成長したらお金にモノ言わせて好き放題なんでもできる環境を使うというのも合理的だと思う。
そしてそこまで見据えたエンジニアはきっと Firebase をいつか卒業する前提でアーキテクチャを考えるだろう。
その場合、アプリケーションのアーキテクチャとしてはレイヤードアーキテクチャが採用されると思う。
つまり Cloud Functions for Firebase や Firestore, Cloud Storage for Firebase の SDK への依存が、アプリケーションの中枢を侵食しないようにコントロールする設計だ。
そうしておけば、CloudRun へ移行がしようが、Stackdriver を使おうが、CloudSQL を使おうが S3 を使おうが、その移行は限定的になるというわけだ。

## Firebaseのレイヤードアーキテクチャはアンチパターンかもしれない

さて、ここまで読んで「移行できるようにっていっても、それをできたことも、やったこともないんだよな」と思ったかもしれない。
僕もそう思うし、どうせなら作り直してしまうと思う。移行できないということを深ぼってみると何個か理由はあるのでそれを考えてみる。

### 障害なく移行ができるのか

例えば Firestore を使っていて、もし trigger を使っていたらそれを RDBMS 製品にはないような機能で、ただ Repository レイヤーを差し替えたら終わりというわけではない。
trigger のロジックも実装しないといけない。
そこまで含めて、同一の機能を担保できるだろうか。

### テストを書くのが難しい

移行が正しくできるかどうかが不安ならテストを書くのは手だろう。
つまりあらかじめテストを書いておいて、移行してからテストを回して通ればOKという感じである。
しかしこれも実際にやってみて気づくのだが、DBを差し替えるとテストコードも変えないといけなくなる。
結合テストをしたとしても、データの挿入結果の検証ではDBからデータを取り出してその値を検証するので、DB製品が変わるとそのクエリの方法も変わってしまい、同じテストケースでテストするということができなくなってしまう。
もちろんこれはテストコードを変えればいい話ではあるのだが、妥協をしてしまった結果にはなっている。

### アプリケーション側でのJOINで設計が歪むかもしれない

RDB思考をしてしまうと、DBは正規化したくなるが、Firestoreにおいてこれは一般的には推奨はされていない。
そのために SubCollection を使う。
ただ、もしEntityごとにフォルダを切って、そこにRepositoryを入れた場合、フォルダ構成に引きずられる形でDBが正規化されることになる。
これは Firestore の思想には合わない。
ただ、やりたければもちろんやっていいとは思う。
そのための Reference 型だとは思う。

### Transaction に関する SDK の問題

大体の RDB SDK だと begin と commit で挟んでおけば良いはずである。
しかし Firestore の transaction は tx を持ち回らないといけない。

```ts
import { runTransaction } from "firebase/firestore";

try {
  await runTransaction(db, async (transaction) => {
    const sfDoc = await transaction.get(sfDocRef);
    if (!sfDoc.exists()) {
      throw "Document does not exist!";
    }

    const newPopulation = sfDoc.data().population + 1;
    transaction.update(sfDocRef, { population: newPopulation });
  });
  console.log("Transaction successfully committed!");
} catch (e) {
  console.log("Transaction failed: ", e);
}
```

see: https://firebase.google.com/docs/firestore/manage-data/transactions?hl=ja

runTransaction の仮引数を使い回さないと 1 transaction にまとめられないのである。

## レイヤードアーキテクチャにする方法

自分ならこう考えるというのを例を出す。

アプリケーションの設計にもよるが、

Router -> Usecase -> (Service) -> Repository

というデータフローになるようにレイヤーを用意する。
(DataのIOしかないようなもの、Entityにロジックを全て閉じ込められるような時、筆者はServiceレイヤーを作るのをサボる)
そして Usecase 以降は子をDIする設計にする。
Router は Web との境界線であり、ドメインロジックというよりはインフラに関するロジックを含んで良い領域だと思っている。
なのでここで DB Client の初期化もする。
そして Usecase、もしくはルーティング の単位でトランザクションを貼るようにして、Routerでトランザクションオブジェクトを定義し、それをルーターの中で Usecase にDIする形でインスタンスを造る。
Usecaseは内部でRepository側にトランザクションオブジェクトをバケツリレーする形で初期化する。
RepositoryやEntityはCollectionの単位で作り、RepositoryはEntity（もしくはPartialなEntity）を受け取り、Entityを返す設計にする。
そしてアプリケーションでのJOINはなるべくせず、サブコレクションで頑張るようにする。
なので擬似的なコードを書くとこういうコードを書くと思う。

```ts
f.get("/hoge", (req, res) => {
  const db = firebaseAdmin.initialize();
  runTransaction(db, async (transaction) => {
    const usecase = new Usecase(
      new RepositoryA(db, transaction),
      new RepositoryB(db, transaction),
    );
    const data = await usecae.exec(userId);
    return json(data);
  });
});

class RepositpryA {
  constructor(
    private firestore: Firestore,
    private tx: Transaction,
  ) {}

  get(id: string) {
    const doc = this.firestore.collection("hoge").doc(id);
    return this.tx.get(doc);
  }

  update(currentDoc: Document, newDoc: Document) {
    this.tx.update(currentDoc, newDoc);
  }
}
```
