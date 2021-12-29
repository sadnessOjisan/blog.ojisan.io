---
path: /how-to-use-pdfjs
created: "2021-08-29"
title: pdfjs の使い方
visual: "./visual.png"
tags: ["pdfjs"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

[pdf.js](https://mozilla.github.io/pdf.js/) というどんなブラウザでも PDF を読める様になるライブラリがあります。これを使うにあたって、Example 通りに作らなくてもいい方法があるのでその紹介です。

OGP や例に使った PDF はこちらです。

<https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf>

## 使い方

### 使い方１：pdfjs を埋め込んで、PDF を SVG や canvas 要素に変換する

pdfjs は [getting_started](https://mozilla.github.io/pdf.js/getting_started/) から DL して使えます。これを読み込むことで、pdfjs の関数がもろもろ使える様になります。Example をそのまま持ってくると、

```html
<script src="//mozilla.github.io/pdf.js/build/pdf.js"></script>

<h1>PDF.js 'Hello, world!' example</h1>

<canvas id="the-canvas"></canvas>
```

```js
var url =
  "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf";

// Loaded via <script> tag, create shortcut to access PDF.js exports.
var pdfjsLib = window["pdfjs-dist/build/pdf"];

// The workerSrc property shall be specified.
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "//mozilla.github.io/pdf.js/build/pdf.worker.js";

// Asynchronous download of PDF
var loadingTask = pdfjsLib.getDocument(url);
loadingTask.promise.then(
  function (pdf) {
    console.log("PDF loaded");

    // Fetch the first page
    var pageNumber = 1;
    pdf.getPage(pageNumber).then(function (page) {
      console.log("Page loaded");

      var scale = 1.5;
      var viewport = page.getViewport({ scale: scale });

      var canvas = document.getElementById("the-canvas");
      var context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page into canvas context
      var renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      var renderTask = page.render(renderContext);
      renderTask.promise.then(function () {
        console.log("Page rendered");
      });
    });
  },
  function (reason) {
    // PDF loading error
    console.error(reason);
  }
);
```

という風に使えます。

つまり、PDF を Canvas に変換、それを DOM にマウントすることで、PDF の中身を表示しています。

このやり方は、どのページを表示させたりだとかの制御を全部ユーザーが行えるメリットがありますが、如何せんめんどくさいです。また React などを併用していると、実 DOM 操作の兼ね合いを考える必要も生まれ、骨が折れます。そこで別の方法を使います。

### 使い方 2: Viewer をデプロイしてそれを呼び出す

先ほど DL したフォルダには、web というフォルダが含まれています。実はここに含まれている viewer.html に `?file=path-to-url` を付けて開くと、その PDF を閲覧できます。

つまりその Viewer をどこかにデプロイしておいて、その URL を iframe で埋め込むと、アプリケーション自体に pdf.js を含めなくても PDF を表示できます。

例: <https://ojisan-toybox.github.io/pdfjs-file-ie11-viewer/>

ただし、ホストしたアプリと PDF が同じオリジンであることが条件です。

## IE 対応

ちなみに公式 HP で配布しているバージョンだと、Legacy 向けのものでも IE 対応はできません。v2.3.200 以前のものを GitHub の Tag から探し出して使いましょう。そのバージョンで Viewer をホスティングしたものが先ほどの <https://ojisan-toybox.github.io/pdfjs-file-ie11-viewer/> です。これを自分のドメインにホスティングすると、IE でも動く Viewer を実装できると思います。
