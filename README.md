# blog.ojisan.io

[![Netlify Status](https://api.netlify.com/api/v1/badges/00c9f479-1c04-40eb-8ae6-2a15b372398b/deploy-status)](https://app.netlify.com/sites/amazing-goodall-59e3b0/deploys)

website: https://blog.ojisan.io

## dev

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

gatsby-image が完璧ではないので手動で圧縮しよう

https://tinypng.com/

### deploy

```sh
# build
$ yarn build

# serve
$ yarn start
```

deploy 自体は master に merge されると自動でデプロイされる

## todo

- [x] analytics
- [x] prism
- [x] image
- [x] toc
- [x] first article
- [x] social share
- [ ] 全文検索(記事増えたら)
- [ ] TOP ページ作る(記事増えたら)

## icon

ここから拝借

- [flaticon](https://www.flaticon.com/free-icon/clap-hands_109638)
