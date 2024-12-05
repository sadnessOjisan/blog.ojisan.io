---
path: /vercel-preview-url
created: "2021-12-21"
title: vercel の preview URL を使って、preview 環境でも OGP image を展開したい
visual: "./visual.png"
tags: ["vercel"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

この記事は [sadnessOjisan Advent Calendar 2021](https://adventar.org/calendars/7015) 21 日目の記事です。書かれた日付は 1/15 です。

## OGP 画像の展開条件

OGP 画像は

```html
<meta
  property="og:image"
  content="https://twiogp.ojisan.dev/images/shirankedo.png"
/>
```

のように絶対パスで書く必要があります。

つまり、

```html
<meta
  property="og:image"
  content="/images/shirankedo.png"
/>
```

だと OGP 画像は展開されません。

PRD, STG 環境のようにオリジンが決まっている環境であればいいですが、preview 環境のように URL がころころ変わる環境で OGP 画像を確認したい場合は困ります。

そこで Vercel 環境で Preview 環境でも OGP を展開できる方法を紹介します。

## process.env.VERCEL_URL でデプロイ先の URL を取得できる

Vercel には組み込みの環境変数がいくつかあります。

FYI: <https://vercel.com/docs/concepts/projects/environment-variables>

そこによると VERCEL_URL もしくは NEXT_PUBLIC_VERCEL_URL という環境変数にデプロイ先の URL が格納されているとのことです。

そのため、

```html
<meta property="og:image"
content={https://${process.env.NEXT_PUBLIC_VERCEL_URL}/images/shirankedo.png`}
/>
```

として OGP 画像を展開できます。
