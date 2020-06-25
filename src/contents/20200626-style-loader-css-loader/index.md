---
path: /css-loader-style-loader
created: "2020-06-26"
title: css-loader と style-loaderを間違えない
visual: "./visual.png"
---

css-loader と style-loader どっちがどっちかってたまになるので、そうならないための備忘です。

- css-loader
  - JS の世界に CSS を持ち込む役割
- style-loader
  - JS の中にある css を style tag に変換してページに埋め込む役割

です。

全然役割が違うのに取り違えてしまいます。
css-loader と style-loader を取り違えてしまう大きな原因は、これらは同時に出現することにあると思います。
そこで、片方だけ使ってみると言うことに挑戦します。
