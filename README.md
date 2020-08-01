# blog.ojisan.io

[![Netlify Status](https://api.netlify.com/api/v1/badges/00c9f479-1c04-40eb-8ae6-2a15b372398b/deploy-status)](https://app.netlify.com/sites/amazing-goodall-59e3b0/deploys)

website: https://blog.ojisan.io

## For Dev

### for develop

```sh
# start dev server
$ yarn develop

# type checking
$ yarn tsc -p . --noEmit
```

gql

```sh
$ open http://localhost:8000/___graphql
```

gatsby-image が完璧ではないので手動で圧縮した方が良い.
[tinypng](https://tinypng.com/)で突っ込んだ画像の方がサイズ小さくなった。

### deploy

```sh
# build
$ yarn build

# serve
$ yarn start
```

deploy 自体は master に merge されると自動でデプロイされる on [Netfliy](https://www.netlify.com/)

## How To Contribute

### PR

明らかな誤字脱字などリンク間違いなどあれば、シャっと PR を投げてくれると嬉しいです。
github-flow で運用しています。直接 master に PR ください。

### Issues

バグ報告や改善要望を受け付けています。
いまのところはフォーマットに指定はないので、気軽にシャッと書いてくれると喜びます。
