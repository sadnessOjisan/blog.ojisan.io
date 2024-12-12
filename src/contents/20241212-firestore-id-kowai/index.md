---
path: /firestore-id-kowai
created: "2024-12-12"
title: firestore の ID衝突なんて起きないと頭では分かっているが、不安で寝れない
visual: "./visual.png"
tags: ["firebase"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

[Firebase と添い遂げる Advent Calendar 2024](https://adventar.org/calendars/11050)、7日目です。
5日のビハインドです。
今日も Firestore ネタです。
そろそろ Functions や Hosting ネタに移るのでそちらが気になる方は今しばらくのご辛抱を。

## その ID、本当に信用しますか？

Firestore で Document を add したら、勝手に ID が採番される。
見るとわかるが、`9YY7uAeqRVGjfieakTL1k` のようにアルファベット英数字大文字小文字の20字で生成される。
これは 2日目の [Firestore の ID 採番を add 使わずにやりたい](https://blog.ojisan.io/firebase-id-saiban/) でも触れたが、TS SDK だと

```ts
/**
 * Generate a unique client-side identifier.
 *
 * Used for the creation of new documents.
 *
 * @private
 * @internal
 * @returns {string} A unique 20-character wide identifier.
 */
export function autoId(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let autoId = "";
  while (autoId.length < 20) {
    const bytes = randomBytes(40);
    bytes.forEach((b) => {
      // Length of `chars` is 62. We only take bytes between 0 and 62*4-1
      // (both inclusive). The value is then evenly mapped to indices of `char`
      // via a modulo operation.
      const maxValue = 62 * 4 - 1;
      if (autoId.length < 20 && b <= maxValue) {
        autoId += chars.charAt(b % 62);
      }
    });
  }
  return autoId;
}
```

のようなロジックだ。

ふと思ったのだが、この ID は衝突しないだろうか？

## IDの衝突があると何が危ないのか

さて、IDの衝突が起きる・起きないの話をする前に、仮に衝突したら何が危険かについて述べる。
それは、データが上書かれてしまうことにある。
それが起きうる理由は、Firestore にはユニークキー制約がないことにある。
つまり、Aさんが doc id: a に対してデータを書き込んだ後、B さんが衝突した doc id: a に対して書き込んでしまうと、A さんのリソース a が B さんのデータに書き変わってしまう。
書き込めてしまうのである！
これは情報の流出になり危険である。

## ID の衝突なんてものは起きるのか

SDKで採番されるIDは 英数字大文字小文字の20字である。
62文字で長さ20の文字列を作ってそれが衝突するかを考えると、まあ起きないとは思う。
自分で計算はしていないが ChatGPT に聞いたら 3.12×10^17 回 ID を作れば衝突するらしい。
なので安全そうだ。

が、ちょっと待って欲しい。
[【Firestore】ドキュメントの自動生成 ID って被らないの？](https://qiita.com/yukin01/items/dcac3366adcf0fe827a3) で指摘されているのだが、どうも偏りのある疑似乱数を使っている関係で衝突する可能性が高まっているらしい。
ちょっとこれについて確かめてみよう。

SDK で使われているのはcrypto モジュールの `randomBytes` だ。
暗号学的に安全なものと言えるだろう。

see: https://github.com/googleapis/nodejs-firestore/blob/main/dev/src/util.ts#L19

公式はcryptographically strongと言っている。

> Generates cryptographically strong pseudorandom data.

see: https://nodejs.org/api/crypto.html#cryptorandombytessize-callback

ブラウザSDKの方も https://github.com/firebase/firebase-js-sdk/blob/cbec4b985419a3ae30db3bb7d3872d51ae4ac717/packages/firestore/src/platform/browser/random_bytes.ts#L29 となっている。
これはブラウザに `crypto.getRandomValues`が生えていない限りにおいてはフォールバックして疑似乱数に偏りのある `Math.floor(Math.random() * 256);` が使われる。
しかし`getRandomValues`はChrome11からサポートされているような [Baseline](https://developer.mozilla.org/ja/docs/Glossary/Baseline/Compatibility) の関数なのでこのフォールバックが呼ばれることはないだろう。
なので暗号学的に安全な乱数だと言えるだろう。

> Crypto.getRandomValues() メソッドは、暗号強度の強い乱数値を取得します。

とあるので多分安全。

see: https://developer.mozilla.org/ja/docs/Web/API/Crypto/getRandomValues

少なくとも `Math.random()` よりは安全。

> メモ: Math.random() の提供する乱数は、暗号に使用可能な安全性を備えていません。セキュリティに関連する目的では使用しないでください。代わりにウェブ暗号 API (より具体的には Crypto.getRandomValues() メソッド) を使用してください。

see: https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Math/random

先の記事は5年前なので、いまは状況が変わったのだと思う。
つまり、SDK で採番しても、乱数の偏りという観点は心配しなくてよさそうだ。

## それでも僕は衝突をケアする

現実的な確率では衝突が起きないことはわかった。
しかし僕は衝突をケアするようにしている。
その理由に、まず一つは桁数が想定以上に少ないことだ。
例えば似たようなIDとしてはUUIDがあるがこれは32桁だ。
もちろん、UUIDと違ってFirestoreのIDは大文字小文字の区別もあるので複雑さは増しているが、UUIDより短いというのは少し気になってしまう。
タイムスタンプを考慮しないID生成というのも、これからの長い時間の中で衝突するのではみたいな心配をしてしまう。
暗号学的には大丈夫そうって思っても何かの拍子で20文字しかないのは何か衝突しそうな気がしそうと思ってしまう。

第二にもし万が一衝突した時の安全装置がないことだ。
アプリケーションで採番してDBに保存するパターンが成り立っているのは、ユニークキー制約が使えるからだと思っている。
一応 Firestore でもユニークキーを実現する方法がないわけではないが、これは完全な裏技的なやり方であり、積極的に採用したいものでもない。
それに firestore rules を使うので Admin SDK からは無力だ。

see: https://stackoverflow.com/questions/47543251/firestore-unique-index-or-unique-constraint

## 衝突をどのようにケアするか

なので僕は普段衝突のことも気にしてコードを書いている。

そのために、なるべく階層構造を持ったデータの持ち方をし、階層に沿ったクエリを作るようにしている。

たとえば今何かしらの to B SaaS を作っているとする。法人にユーザーが紐付き、そのユーザーが業務支援アプリを使えるような状況だ。そのとき、

- company
- user

という風にデータを持つのではなく、

- company
  - {companyId}
    - user
      - {userId}
      - {userId}
      - {userId}
  - {companyId}
    - user
      - {userId}
      - {userId}
      - {userId}

としてデータを持つようにする。
こうすると 20桁 + 20桁の 40桁が一致しないといけなくなるので、さらに衝突の可能性を減らせて、それに加えて仮に衝突しても同じ組織内にしか影響が及ばないようになっている。
Firestoreを使う以上は可能な限り階層構造でデータを持つようにする嬉しさの一つでもあると思う。

## 結論

- ID生成のロジックを確認したところ、ID衝突なんて可能性は考えなくてよさそう。
- しかし万が一衝突した時の安全装置がFirestoreにはないのでケアしたい
- コストをかけないケアならしてもいいと思って、その方法としてデータはなるべく階層で持つようにしている。
