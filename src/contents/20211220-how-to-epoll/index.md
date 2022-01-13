---
path: /how-to-epoll
created: "2021-12-20"
title: サーバー入門、非同期処理入門、epoll 入門
visual: "./visual.png"
tags: ["epoll", "Linux", "Rust"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

この記事は [sadnessOjisan Advent Calendar 2021](https://adventar.org/calendars/7015) 20 日目の記事です。書かれた日付は 1/13 です。
フロントエンドエンジニアとして JS を JS のレイヤーでしか扱ったことがなかった僕が NodeJS の非同期ランタイムを調べていたときについでで epoll を勉強したときのメモをまとめたものです。
コンピュータサイエンスの専門的な教育を受けたわけでもないし、趣味でしか勉強したことがない範囲なので、もしかしたら間違いがあるかもしれません。
そのため間違いを発見しましたらご指摘してくれると助かります。（<https://github.com/sadnessOjisan/blog.ojisan.io> に PR/Issue を投げてくれると一番助かります。）

## 参考にしたもの

- [ふつうの Linux プログラミング 第 2 版　 Linux の仕組みから学べる gcc プログラミングの王道](https://www.amazon.co.jp/dp/B075ST51Y5/)
- [並行プログラミング入門 ―Rust、C、アセンブリによる実装からのアプローチ](https://www.amazon.co.jp/dp/4873119596)
- [The Rust Programming Language 日本語版](https://doc.rust-jp.rs/book-ja/ch20-02-multithreaded.html)

## パソコン同士はどのようにして繋がるか

epoll の前に、epoll に現れるストリームやファイルディスクリプタについて解説します。

### プロセスとファイルとストリーム

Linux プログラミングではプログラムはプロセスという単位で動きます。
プロセス（プログラム）はファイルなどを読み込んだり、キーボードのような物理デバイスのようなものと繋がれます。
この繋がりでは何かしらの入力や出力をやり取りしますが、この通り道がストリームと呼ばれており、一般的にはバイト列をやり取りします。
ストリームはカーネルに作ってもらうため、ストリームへの読み書きにはシステムコールを使います。
代表的なものは read(2) や write(2) などですが、このストリームを別 PC（で動いてるプロセス）と繋げることができるシステムコールもあります。
そのシステムコールを使って実現した通信方法が TCP/IP です。
IP は IP アドレスに対してパケットを送る技術で、TCP はそのパケットの列をストリームに見立てる技術です。
そして TCP 上でストリームを作り接続するためのシステムコールが scoket(2), connect(2), bind(2), listen(2), accept(2) です。

### ファイルディスクリプタ

プロセスとストリームのやり取りはファイルディスクリプタと呼ばれるものを使います。
これは各ストリームと対応した数字だと思ってください。

たとえばストリームからバイト列を読み込むための read(2) は、

```c
#include <unistd.h>

ssize_t read(int fd, void *buf, size_t bufsize)
```

と定義されており、ファイルディスクリプタを指定するインターフェースです。

これは fd(ファイルディスクリプタ)が指定したストリームから 最大 bufsize 分を読み込んで buf に格納するシステムコールです。

この fd はネットワーク越しに通信する際にも使います。
先ほど挙げた socket(2) の返り値は int ですが、この値はファイルディスクリプタです。
そしてその値が connect や accept で使われます。
なのでソケット通信は ストリームをファイルディスクリプタで指定し、そのストリームに対して入力・出力をやり取りすることで通信をしていると言えます。

## サーバーを実装する

では、ネットワーク通信の例としてサーバーを実装します。
ここでは epoll を使う必要を説明するために反復サーバーの実装から始めます。
また言語は C ではなく Rust で行います。
これは

- 僕が C を書けない
- Rust はシステムコールにおける引数の破壊的変更がインターフェース的に分かりやすく説明しやすい

ためです。
そのためシステムコールを直接は使えませんが、Rust の nix クレートなどが似たインターフェイスを提供するので適宜読み替えれば読めると思います。

コードは、The Rust Programming Language と 並行プログラミング入門から拝借しています。

### 反復サーバーを実装する

さて、先ほどソケット通信などの API を紹介しましたが、TCP の接続を自前で用意しなくても Rust には TcpListener があり、ここからストリームをそのまま受け取ることができます。

たとえば受け取ったストリームをそのまま表示するには次のようなコードになります。

```rust
use std::io::prelude::*;
use std::net::TcpStream;
use std::net::TcpListener;

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        handle_connection(stream);
    }
}

fn handle_connection(mut stream: TcpStream) {
    let mut buffer = [0; 1024];

    stream.read(&mut buffer).unwrap();

    println!("Request: {}", String::from_utf8_lossy(&buffer[..]));
}
```

このようにストリームに来るリクエストを逐次処理するモデルは反復サーバーと呼ばれます。
この反復サーバーには弱点があり、それは上の例だと handle_connection の処理が重たくなると、サーバー全体のパフォーマンスが落ちます。

### マルチスレッドサーバー

そこでこれを並行処理するように書き換えます。
具体的には各処理を別スレッドに切り出し、処理を多重化します。
Rust には別スレッドを作る関数に spawn があり簡単に処理を切り出せます。
また各スレッドへは、Multi Producer, Single Consumer(mpsc) モデルのチャネルを使って処理を送り込め、処理を各スレッドへと分散させられます。
Rust には Mutex があるため、レースコンディションの心配なく mpsc のキューを各スレッドから安全に操作できます。

このように並行処理は比較的簡単に実装できるのですが、問題があります。
それが コンテキストスイッチによる C10K 問題です。
CPU コアの数以上の並行処理は仮想的に行われるので、コアの数以上のスレッドを動かすと処理の切り替え時の復元コストがかかります。
マルチプロセスほどのコストではないですが、マルチスレッドでもコストがかかるのが実情です。

FYI: <https://naoya-2.hatenadiary.org/entry/20071010/1192040413>

（※ちなみに The Rust Programming Language の例はスレッドプールを実装するので、この数をコアの数以内に抑えるとコンテキストスイッチは起きはしない。ただしその代償としてリクエストの数が増えたときに並列実行できる数に蓋がかかっている状況なので効率的ではない。）

このコンテキストスイッチのコストを解消するためには、スレッドの仕組みをコンテキストスイッチやスケジューラも含めて全部自前で実装（たとえばコンテキストの出し入れの方法には大幅な工夫の余地がある）するグリーンスレッドベースな方法か、もっとシンプルな方法として 1 スレッドしか持たないイベント駆動の非同期ランタイムという解決方法があり epoll はこれを実現するシステムコールです。

ちなみに今時の非同期ランタイムを読む限りではグリーンスレッドを取り入れる方法が主流(グリーンスレッド + イベントループというモデルもあったり、いろんな人が最強の非同期ランタイムを作ろうとしていろんな実装がある)で、多くの場合シングルスレッドのモデルより計算資源を使い切れるのでパフォーマンスも良いとされています。もし興味がある方は、グリーンスレッド上のマルチスレッドプログラミングについても [並行プログラミング入門](https://www.amazon.co.jp/dp/4873119596) で解説されているので興味がある方は読んでみると良いと思います。
グリーンスレッド上におけるコンテキストスイッチの実装や、さらにそこから踏み込んでアクターモデル上でコンテキストをやりとする方法や解説がされており、非同期ランタイムの世界観がなんとなく分かって良かったです。

### イベント駆動サーバー、epoll

さて、コンテキストスイッチの自前実装は骨が折れるので、マルチスレッドにせずに処理を複数捌く方法を考えます。
反復サーバーの弱点は重たい処理が入ると他の処理が止まることでした。
一般的にこの重たい処理は IO を指しており、イベント駆動サーバーでは IO 中は他の処理を優先して行うといった風にして実装していきます。
そのためには IO 中、完了を知る必要があり、その仕組みが epoll です。

## epoll とは

epoll(7) は Linux 系の OS に備わっているイベント通知インターフェースです。
たとえば NodeJS では非同期ランタイムとして libuv が同梱されていますが、epoll(7) がその内部で使われているように、フロントエンドエンジニアにとっては実は馴染みの深い命令です。

epoll では監視したいイベントを登録しておけば、そのイベントが完了した時に通知を受け取れます。一般的には epoll instance を作り、そのファイルディスクリプタに監視対象を紐付け、そのファイルディスクリプタを監視することでイベントの発生を検知します。

### EpollEvent::new()

epoll event を作る関数です。

### epoll_ctl

```rust
pub fn epoll_ctl(epfd: RawFd, op: EpollOp, fd: RawFd, event: &EpollEvent) -> Result<()>
```

epoll の ファイルディスクリプタと監視対象のファイルディスクリプタの紐付けをするものです。

EpollOp は

```rust
pub enum EpollOp {
    EpollCtlAdd,
    EpollCtlDel,
    EpollCtlMod,
}
```

と定義されており、紐付けを追加・削除・編集することができます。

### epoll_wait

epoll event の発生を監視し、そのイベント一覧を取得できる関数です。

```rust
pub fn epoll_wait(
    epfd: RawFd,
    events: &mut [EpollEvent],
    timeout_ms: isize
) -> Result<usize>
```

epfd は監視対象の epoll event を表し、events には実際に発生した event が格納されます。
events は mut であることに注目してください。
epoll_wait 実行後に引数の events に発生済み event が格納されます。

## epoll を使う例

動作例として並行プログラミング 5 章の例をそのまま引用します。

(<https://github.com/oreilly-japan/conc_ytakano/blob/main/chap5/5.1/ch5_1_conc/src/main.rs>)

```rust
use nix::sys::epoll::{
    epoll_create1, epoll_ctl, epoll_wait, EpollCreateFlags, EpollEvent, EpollFlags, EpollOp,
};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, BufWriter, Write};
use std::net::TcpListener;
use std::os::unix::io::{AsRawFd, RawFd};

fn main() {
  // epollのフラグの短縮系
  let epoll_in = EpollFlags::EPOLLIN;
  let epoll_add = EpollOp::EpollCtlAdd;
  let epoll_del = EpollOp::EpollCtlDel;

  // TCPの10000番ポートをリッスン
  let listener = TcpListener::bind("127.0.0.1:10000").unwrap();

  // epoll用のオブジェクトを生成
  let epfd = epoll_create1(EpollCreateFlags::empty()).unwrap(); // <1>

  // リッスン用のソケットを監視対象に追加 <2>
  let listen_fd = listener.as_raw_fd();
  let mut ev = EpollEvent::new(epoll_in, listen_fd as u64);
  epoll_ctl(epfd, epoll_add, listen_fd, &mut ev).unwrap();

  let mut fd2buf = HashMap::new();
  let mut events = vec![EpollEvent::empty(); 1024];

  // epollでイベント発生を監視
  while let Ok(nfds) = epoll_wait(epfd, &mut events, -1) { // <3>
    for n in 0..nfds { // <4>
      if events[n].data() == listen_fd as u64 {
        // リッスンソケットにイベント <5>
        if let Ok((stream, _)) = listener.accept() {
          // 読み込み、書き込みオブジェクトを生成
          let fd = stream.as_raw_fd();
          let stream0 = stream.try_clone().unwrap();
          let reader = BufReader::new(stream0);
          let writer = BufWriter::new(stream);

          // fdとreader, writerを関連付け
          fd2buf.insert(fd, (reader, writer));

          println!("accept: fd = {}", fd);

          // fdを監視対象に登録
          let mut ev =
            EpollEvent::new(epoll_in, fd as u64);
          epoll_ctl(epfd, epoll_add,
                fd, &mut ev).unwrap();
        }
      } else {
        // クライアントからデータ到着 <6>
        let fd = events[n].data() as RawFd;
        let (reader, writer) =
          fd2buf.get_mut(&fd).unwrap();

        // 1行読み込み
        let mut buf = String::new();
        let n = reader.read_line(&mut buf).unwrap();

        // コネクションクローズした場合、epollの監視対象から外す
        if n == 0 {
          let mut ev =
            EpollEvent::new(epoll_in, fd as u64);
          epoll_ctl(epfd, epoll_del,
                fd, &mut ev).unwrap();
          fd2buf.remove(&fd);
          println!("closed: fd = {}", fd);
          continue;
        }

        print!("read: fd = {}, buf = {}", fd, buf);

        // 読み込んだデータをそのまま書き込み
        writer.write(buf.as_bytes()).unwrap();
        writer.flush().unwrap();
      }
    }
  }
}
```

### コネクト済みのディスクリプタかどうかの識別が肝

epoll を使ったプログラミングスタイルの頻出パターンとして、クライアントと接続済みかどうかの識別が挙げられます。
epoll を使うと並行処理を行うことになるのでどのファイルディスクリプタでどういうデータが来てるかを管理、割り振る仕組みが必要です。

上のコードで言うとファイルディスクリプタとデータの紐付けは fd2buf で行っています。
型が明示されていませんがこれは、`<RawFd, (BufReader, BufWriter)>` という組です。
つまり該当のファイルディスクリプタさえわかれば読み書きができる口を保持してくれています。

そして、

```rust
while let Ok(nfds) = epoll_wait(epfd, &mut events, -1) {
  for n in 0..nfds {
      if events[n].data() == listen_fd as u64 {
          // 中略
          let mut ev =
            EpollEvent::new(epoll_in, fd as u64);
          epoll_ctl(epfd, epoll_add,
                fd, &mut ev).unwrap();
      } else {
          let fd = events[n].data() as RawFd;
           // 中略
      }
  }
}
```

という形は rust に限らず epoll を使うシステムプログラミングでは頻出パターンです。

epoll_wait を実行後、events には EpollEvent の配列が格納されます。
そして nfds にはイベントが発生した数が格納されます。

つまり、

```rust
for n in 0..nfds {
    events[n]
}
```

とすれば発生したイベント全てにアクセスできます。

そして、 `if events[n].data() == listen_fd as u64` という比較は、発生したイベントが listen 用ソケットに通信が来ていることによるかどうかで分岐させます。

```rust
if events[n].data() == listen_fd as u64 {
  // listen 用ソケットに通信が来ている場合
  // 中略
  let mut ev = EpollEvent::new(epoll_in, fd as u64);
  epoll_ctl(epfd, epoll_add, fd, &mut ev).unwrap();
} else {
  // 接続済みソケットに通信が来ている場合
  let fd = events[n].data() as RawFd;
   // 中略
}
```

listen 用ソケットに通信が来ている場合 の処理では `epoll_ctl(epfd, epoll_add, fd, &mut ev)` をします。
これは epfd(監視用の epoll インスタンスの fd)に今接続中の fd を登録します。
そうすることでいま listen 中の接続で何かイベントが起きたときに、`epoll_wait` で拾えるようになります。
ここで登録した fd は wait 時に取得できるイベントでは data に含まれ、`events[n].data()` として取り出すことができます。
それを見越して `epoll_ctl` に fd を渡しています。

イベントが発生した fd を取得できれば fd2buf から reader, writter を取得できるので、その socket に対しての読み書きができるようになるわけです。
(reader, writer は socket から作られた 読み書き口)

### なぜ epoll で並行処理を実現できるのか

epoll を使うことで IO が完了したものしか通知されないようになります。
そのため IO の先で重たい処理があってもそこで処理がブロックされないからです。
複数のリクエストがあっても、それに紐づく IO を待つことなく次々に処理でき、socket の先で処理を実行させているので処理が並行できています。
こういうのを IO 多重化と呼び、NodeJS プログラミングではたまに聞く言葉でもあります。
