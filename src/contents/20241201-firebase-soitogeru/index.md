---
path: /firebase-soitogeru
created: "2024-12-01"
title: Firebase と添い遂げるアドベントカレンダーをやるよ
visual: "./visual.png"
tags: ["firebase"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

悪い人たちに唆されたので[1人アドベントカレンダー](https://adventar.org/calendars/11050) やります。
彼らが本当に悪いのは、その人たちも1人アドベントカレンダーをやるということです。
外堀を埋めるな！

OGPは、火災報知器が鳴ったときの画像です。
マンションで誰かの家で火事になると、全てのインターホンがこんな感じになって、めちゃくちゃうるさい音が鳴ります。
初見だとかなりビックリするので鳴ってる動画とか一度見ておいた方が良いです。
あと、いざ避難するときは、どうやって避難したらいいかが頭がパニックになって分からなくなってしまうので、避難経路や持って逃げるものはあらかじめ知っておいた方が良いです。
自分は危うく Wifi しか繋がらないスマホを持って逃げるところでした。

<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;"><iframe style="top: 0; left: 0; width: 100%; height: 100%; position: absolute; border: 0;" src="https://www.youtube.com/embed/Fmfe2R1-g9E?si=czOtyBQOqR3Tcluz" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

## なぜいま Firebase でアドベントカレンダーを書くのか

実は先月までとある会社を手伝っていて、そこで久しぶりに Firebase を触っていました。
久しぶりに触って思ったのは、昔に比べていろんな知見が共有されなくなっていることです。
実際自分も調べ物をするときに困りました。
その背景には、Firebase は競合の台頭や GCP それ自体の進化があると思います。
そして Firebase が使われなくなっていることの背景には、単純に機能が足りないというのを開発者が感じ取って、避けてしまっているというのもあると思います。
ただ、これは誤解だったり、最新のバージョンで改善されていることもあり、実は Firebase は現役でバリバリ使っていける技術であるということを今書いておくのは良いだろうなと思いました。
僕はリリースノートを追いかけていたり、SDKの内部実装を読んでいたことがあり、最近もそのキャッチアップを再開したので、きっと有意義なこともたくさん書けることもたくさんあると思っています。
なのでアドベントカレンダーという形式で毎日、少しずつ書いていこうと思います。

## レギュレーション

- 遅れてもOK
- 雑でもOK

## タイトルに込めた想い

Firebase は昔から「初期実装に使うけど、ビジネスが育ったらインフラごと剥がす」みたいな扱いをされていると思います。
「Firebase 卒業」で調べたら記事はたくさん出ますし、Fireabaseからの卒業というテーマでの[勉強会](https://hack-at-delta.connpass.com/event/316883/) が開かれていたり、卒業されていく対象という認識がされていると感じています。
その気持ちはわかるのですが、一方で最後まで Firebase でやり切ることも可能だと思っており、実際にそれを実現しそうな会社も知っています。
「Firebase 卒業」は確かに魅力的なのですが、実際にやろうとするとそもそも卒業可能なことを見越して設計する必要があったり、Firestore はルールや認可をアプリケーションロジックに再実装しないといけなかったり、認証は移行期間が必要だったり、FunctionsもSDKでインフラと密結合していたりで、正直なところ現実的でないと思っています。
可能だとしても、本当に小さなサービスじゃないと移行できないと思っています。
ビジネスやアーキテクチャが大きく育ってしまったプロダクトは、Fireabaseとともに添い遂げる方を目指した方が良いと思っています。
それに卒業しなくても Firebase は現代でも最前線で使っていけるとても強力なツールだと思っております。
僕は、Firebaseは卒業しなくてもいいし、新規採用を躊躇わなくてもいいし、でもそのためには必要な知見もあるので、その知見を書いておきたいと思ってこのタイトルにしました。
