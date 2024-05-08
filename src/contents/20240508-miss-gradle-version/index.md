---
path: /miss-gradle-version
created: "2024-05-08"
title: InteliJ で作った new Kotlin Project が、Gradle のバージョン設定が古くてビルドできなかった
visual: "./visual.png"
tags: ["kotlin", "intelij", "gradle"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

## new project した新品をビルドできない

最近はサーバーサイド Kotlin の勉強をしているのですが、InteliJ から new project しただけのプロジェクトがビルドできなくて困っていました。

```
Could not open init generic class cache for initialization script '/private/var/folders/7m/c_dxyw993zbddrn7s6_g06l40000gn/T/wrapper_init6.gradle' (/Users/ideyuta/.gradle/caches/7.4.2/scripts/62yitbq6ojelk1741cldo8m6e).
> BUG! exception in phase 'semantic analysis' in source unit '_BuildScript_' Unsupported class file major version 65

* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
```

みたところ Gradle が何かおかしいようです。

## Gradle と Java の対応を合わせる

Java と Gradle のバージョンが合っていないときにこのエラーが出るらしいです。
そこで Gradle 公式の対応表で確認してみます。

see: https://docs.gradle.org/current/userguide/compatibility.html#java

いま私が使っている JDK は v21 です。
なので Gradle は 8.5 以上が良いとのことです。

Gradle のバージョン切り替えは grade-wrapper.properties の distributionUrl で行えます。
これは gradle/wrapper/gradle-wrapper.properties にあります。

```
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-7.4.2-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

いま distributionUrl は 7.4.2 だったので、これを 8.5 にします。

```
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.5-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

そしてビルドすると、コンパイルに成功しました。

```
BUILD SUCCESSFUL in 478ms
1 actionable task: 1 executed
```

## まとめ

new project で作られるプロジェクトはビルドが安定しているという訳ではない。
選択する JDK のバージョンによってはうまく行かない。
