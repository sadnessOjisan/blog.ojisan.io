---
path: /monorepo-amplify
created: "2021-08-17"
title: amplify でモノレポのパッケージをデプロイする最小構成
visual: "./visual.png"
tags: ["Amplify", "yaml"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

今思えばすごく簡単な話でしたが、monorepo を実現する最小構成が分からなくてちょっとつまづいたのでメモです。

## そもそも monorepo 用の設定はいるのか？

[amplify](https://aws.amazon.com/jp/amplify/) は標準で monorepo 用のサポートや機能が存在しています。
ユーザーからしてみれば、root の package.json から 各 workspace への alias を貼っておき、root から見たデプロイフォルダを指定さえできれば困らないはずで特にサポートは不要かにも思えます。
しかしそうしなくても amplify が提供している monorepo サポートを使えば、その package に定義された npm scripts をそのまま呼び出せたりと何かと便利なので使っていきます。

## 最小構成

```yaml
version: 1
applications:
  - appRoot: packages/hoge
    frontend:
      phases:
        build:
          commands:
            - yarn install
            - yarn run build
      artifacts:
        baseDirectory: ./dist
        files:
          - "**/*"
      cache:
        paths:
          - node_modules/**/*
  - appRoot: packages/fuga
    frontend:
      phases:
      build:
        commands:
          - yarn install
          - yarn run build
      artifacts:
      baseDirectory: dist
      files:
        - "**/*"
      cache:
      paths:
        - node_modules/**/*
```

## appRoot を定義する

Amplify は project を作成したときに、

```
- [ ] connecting monorepo? pick a folder
```

といった質問がされます。

ここで moorepo のうちデプロイしたいフォルダ名を指定します。
そしてそのフォルダ名は amplify.yaml の中の appRoot に合致させる必要があります。

この設定を忘れた場合でも、AMPLIFY_MONOREPO_APP_ROOT という環境変数にそれをセットすれば大丈夫です。むしろ初回の設定は環境変数へのセットであるともいえます。

## ちゃんと yaml を書こう

amplify は認証やストアのようなバックエンドも提供しており、 その設定は amplify.yaml にも書けます。

frontend のようなフィールドがそれで、backend というフィールドが存在しています。
ここで例えば frontend フィールドしか定義していなくても yaml の定義の仕方が 1 段ずれていると、backend の定義エラーとしてデプロイ時にエラーになることがあります。
たとえ yaml としての syntax が正しくてもです。
特に今は `appRoot` で一段ネストが深くなっているので、コピペミスをするとこのエラーに出会うかもしれません。注意しましょう。
