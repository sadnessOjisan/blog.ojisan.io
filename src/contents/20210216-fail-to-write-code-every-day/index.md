---
path: /fail-to-write-code-every-day
created: "2021-02-16"
title: Write Code Every Day に失敗したから commit log を改竄した
visual: "./visual.png"
tags: ["Git"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

[マイ Git しぐさ](https://miyaoka.dev/posts/2021-02-12-git-alias) を紹介するのが流行っているようなので僕も少し。

## Write Code Every Day とは

Write Code Every Day は jQuery の作者でもある John Resig が始めた習慣のようなものです。
続けると色々と良いことがあったらしいです。（※どのような良いことがあったかは、この人の置かれていた前提の説明が必要で面倒なのでボカします。）

FYI: https://johnresig.com/blog/write-code-every-day/

## 人は愚か

僕も「毎日コード書くぞ〜」と思っていたのですが、つい先日うっかり push し忘れていて草を欠いてしまいまいた。
実際にはその日の commit log があるのでそれが master に merge されると草は生えるはずなのですが、生える確証がないので偽装工作をしました。
いつの間にか草を生やすことが目的化していますね。

ちなみに Write Code Every Day の前提としては、「意味のあるコードを書く、ブログは含まない」といった制約があるのですが、そもそもの時点でそれすらも守れていなかった気はします。
俺がこの活動を続ける意味はあるのか？

## commit log の改竄

やり方は調べると幾らでも出てくると思いますが、自分の知識の整理のためにも書こうと思います。

### Author Date と Commit Date

commit log には Author Date と Commit Date があります。これらは、

- Author Date: コミットの著者である author による commit 日付
- Commit Date: コミットを取り込んだ人を表す committer による commit 日付

という違いがあります。

FYI: https://vividcode.hatenablog.com/entry/git/author-date-and-committer-date

普段 git log で見ているものは Author Date です。

```sh
 git log -1
commit ea74c11d0f537e52f672bb0a3791d7021d3b89ec (HEAD -> feature/write-code-every-day, origin/master, origin/HEAD, master)
Author: sadness_ojisan <sadness.ojisan@gmail.com>
Date:   Sun Feb 14 04:53:39 2021 +0900
```

これは `git ammend` で編集できます。

しかし、GitHub が見ているのは、Commit Date の方です。
こちらはどうやって書き換えたら良いでしょうか。

### Commit Date を書き換える

まず、Commit Date を確認してみましょう。
Commit Date は `git log` に `--pretty=fuller` を 付けると見れます。

```sh
$ git log -1 --pretty=fuller

commit ea74c11d0f537e52f672bb0a3791d7021d3b89ec (HEAD -> feature/write-code-every-day, origin/master, origin/HEAD, master)
Author:     sadness_ojisan
AuthorDate: Sun Feb 14 04:53:39 2021 +0900
Commit:     sadness_ojisan
CommitDate: Sun Feb 14 04:53:39 2021 +0900
```

これを書き換えるためには、`git ammend` で Author Date を書き換えてから、それを Commit Date に反映させると良いです。
幸いにもその反映を実現する `--committer-date-is-author-date` という便利なものがあります。

```sh
$ git commit --amend --date 2020-02-14

$ git rebase HEAD~1 --committer-date-is-author-date
```

上の例だと直前 1 commit の改竄なので、Write Code Every Day をしくじった翌日などに使える方法です。

もし過去の Write Code Every Day 逃しを直したいときは、複数 commit に跨って歴史を改竄しなければいけません。
その場合は --amend 時点から rebase してやると良いです。

```sh
$ git rebase -i HEAD~100

#pick を edit に修正

$ git commit --amend --date="2019-02-14"
$ git rebase --continue

$ git rebase HEAD~100 --committer-date-is-author-date
```

ちなみに git log で見る日付は `Sun Feb 14 04:53:39 2021 +0900` のような形式ですが、これは `2020-02-14` といった書き方でも可能です。
曜日が不要なのでこっちの方が簡単に改竄できると思います。

### なんで改竄した commit log が 2/14 なの？

匂わせてみたかっただけです。匂いましたか？

## おわりに

Write Code Every Day を改竄して自分の身にどういう変化があったかについてですが、手段が目的化してレギュレーションを破っている形だけの Write Code Every Day に意味はないことにようやく気づけました。

## おまけ（先行研究）

### 人工芝

芝をそれっぽくする Chrome 拡張。当然、自分にしかいい感じに見えない。

https://chrome.google.com/webstore/detail/%E4%BA%BA%E5%B7%A5%E8%8A%9D/ilnlbllkdghiepmmomeglepgbinddpkb?hl=ja

### kusa

改竄するわけではなく、毎日それっぽく草を生やせるツール。
ただ改竄はしていないものの、日付指定して新規で commit を作っておりズルい。

https://github.com/YuG1224/kusa

乱数をちょっと入れて、人間が commit してるぽさを出そうとしているところがズルい。

```js
function commit(n) {
  // 1/n判定
  const r = n => {
    return n ? Math.floor(Math.random() * n) === 0 : false
  }

  if (!r(n)) {
    return
  }
  const string = `git commit --allow-empty --date='${date.format()}' -m 'update'`
  const result = execSync(string).toString()
  console.log(result || string)
}
```
