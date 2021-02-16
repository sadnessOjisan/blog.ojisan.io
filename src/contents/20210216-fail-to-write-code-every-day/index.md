---
path: /fail-to-write-code-every-day
created: "2021-02-16"
title: write code every day に失敗したから commit log を改竄した
visual: "./visual.png"
tags: ["Git"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

[マイ Git しぐさ](https://miyaoka.dev/posts/2021-02-12-git-alias) を紹介するのが流行っているようなので僕も少し。

## Write Code Every Day とは

jQuery の作者でもある [Joh Resig](https://johnresig.com/blog/write-code-every-day/) が始めた習慣のようなものです。

続けると自分自身の時間の使い方などに良い影響があったらしいです。

## 人は愚か

そしてつい先日、うっかり push し忘れていて草を欠いてしまいまいた。
実際にはその日の commit log があるのでそれが master に merge されると草は生えるはずなのですが、生える確証がないので偽装工作をしました。
いつの間にか草を生やすことが目的化していますね。

## commit log の改竄

やり方は調べると幾らでも出てくると思いますが、自分の知識の整理のためにも書きます。

### Commit Date と Author Date

commit log には Commit Date と Author Date があります。これらは、

- コミットにはコミットの著者である author による commit 日付
- コミットを取り込んだ人を表す committer による commit 日付

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
どうやって書き換えたら良いでしょうか。

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

```
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

Write Code Every Day を改竄して自分の身にどういう変化があったかについてですが、形だけの Write Code Every Day に意味はないことにようやく気づいて、commit しなければというプレッシャーから解放されました。
代わりに Joh Resig のように意味のある commit をしようと心機一転できました。

## おまけ（先行研究）

### 人工芝

芝をそれっぽくする Chrome 拡張。当然、自分にしかいい感じに見えない。

https://chrome.google.com/webstore/detail/%E4%BA%BA%E5%B7%A5%E8%8A%9D/ilnlbllkdghiepmmomeglepgbinddpkb?hl=ja

### kusa

毎日はやしたり偽装したりするわけではなく、毎日それっぽく草を生やせるツール

https://github.com/YuG1224/kusa
