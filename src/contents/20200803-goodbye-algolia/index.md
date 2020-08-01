---
path: /goodbye-algolia
created: "2020-08-03"
title: ブログに全文検索機能を導入して2週間で除却した回
visual: "./visual.png"
tags: [Algolia]
---

ブログに全文検索入れたいなと思って Algolia を入れて除却するまでの話です。

## 何が起きたか 3 行で！

- Algolia 導入した
- ブログがバズって無料枠を使い潰す
- CI/CD が落ちた

## Algolia って？

> Algolia is the search-as-a-service platform that enables companies of all sizes to deliver fast and relevant digital experiences that drive real results.

音声や位置を使った検索 API などもありますが、**全文検索エンジン** と言って問題ないでしょう。

index という仕組みにドキュメントを紐付け、Algolia に対してクエリを投げるとドキュメントを返してくれます。
このとき検索結果に対するハイライトを入れてくれたりします。

## 開発

### ビルド時に Index を Algolia に登録

<!-- TBD -->

### Algolia の検索結果を表示

<!-- TBD -->

## 起きた問題

ユニットを使い果たすと CI・CD ができなくなる

## 回避方法

### 課金する

<!-- TBD: 高い -->

### 無料枠を増やす

<!-- TBD: OSSプランを契約 -->

### ビルド時にみない

<!-- TBD: Index登録が走るタイミングを節約したいが根本転機開発ではない -->

## めんどくさくなって除却

よくよく考えたらブログで全文検索したいってニーズわからなくなったのでやめました。
SNS, Google 経由での流入を一番期待しており、ブログ内での遷移はあまり考えていません。
全文検索が欲しいっていうのは、

- 僕のことが大好きすぎる人で僕の書いた文章を読みたい
- 僕が特定領域のプロフェッショナルで僕のアウトプットを検索すること自体が有益

っていう場合な気がしていて、そんなことないなと気づいたのでやめました。
