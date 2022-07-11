---
path: /wsl-reinstall-d
created: "2022-07-06"
title: wsl をDドライブに入れ直してディスク拡張する
visual: "./visual.png"
tags: ["wsl", "Linux", "Ubuntu"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

WSL で AOSP をビルドしようとしたら容量が足りなかったので、WSL 環境を D ドライブで作り直す。

入れ直しなので wsl コマンドは入っている前提。また移行はせずに作り直す。

OGP は <http://tsukuru-hito.com/e2482904.html>

## install 済を確認

wsl や ディストリビューションがすでに入っているか確認。

```
> wsl  --list
Linux 用 Windows サブシステム ディストリビューション:
Ubuntu-20.04 (既定)
```

## wsl 環境の削除

コマンドで消した

```
wsl --unregister Ubuntu-20.04
```

Windows terminal からも消えた。

[Qiita の記事](https://qiita.com/PoodleMaster/items/b54db3608c4d343d27c4)などによると、設定からアンインストールできるが、Windows Terminal から指定できたり、中のファイルが残っていてうまくいかなかったので、先のコマンドで消した。（この記事を書く前にも D ドライブに入れる実験とかしていた影響かもしれない）

## wsl install

install できるディストリビューションを調べる

```
> wsl --list --onlin

NAME            FRIENDLY NAME
Ubuntu          Ubuntu
Debian          Debian GNU/Linux
kali-linux      Kali Linux Rolling
openSUSE-42     openSUSE Leap 42
SLES-12         SUSE Linux Enterprise Server v12
Ubuntu-16.04    Ubuntu 16.04 LTS
Ubuntu-18.04    Ubuntu 18.04 LTS
Ubuntu-20.04    Ubuntu 20.04 LTS
```

指定のディストリビューションを入れる。

```
wsl --install -d Ubuntu-20.04
```

終わったらターミナルが立ち上がるはず。

そして、username と password を登録する。
name には大文字が使えないので注意。

この時点で Windows Terminal を立ち上げると、Windows Terminal から Ubuntu を選択できる。

## D ドライブにマウントする

次に D ドライブへと環境を移す。
そのために作った環境を export して環境を zip として吐き出し、D ドライブ側で import する。

wsl にはそれぞれコマンドがあるので、その説明を見ると、

```
--export <Distro> <FileName>
ディストリビューションを tar ファイルにエクスポートします。
ファイル名には、標準出力として - を使用できます。

--import <Distro> <InstallLocation> <FileName> [Options]
指定した tar ファイルを新しいディストリビューションとしてインポートします。
ファイル名には標準入力として - を使用できます。
```

とのこと。

では早速 export

```
wsl --export Ubuntu-20.04 ubuntu.tar
```

コマンドを実行した場所にその tar ができるので、これを D ドライブへ import しよう。

ただし今ある環境を消しておかないと、同じ名前のディストリビューションを作ろうとして「指定された名前のディストリビューションは既に存在します。」という警告が出るので、C ドライブ側の環境を消しておこう。

```
wsl --unregister Ubuntu-20.04
```

そして D ドライブ側に import する

```
cd D:

mkdir wsl

wsl --import Ubuntu-20.04 wsl C:\Users\your_name\ubuntu.tar --version 2
```

そうすれば、D ドライブに wsl のファイルシステムが見えているはずである。

```
PS D:\> ls wsl


    ディレクトリ: D:\wsl


Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----        2022/07/05     21:06     1173356544 ext4.vhdx
```

ちなみに wsl の中は explorer に `\\wsl$` と打つと、windows 側から中をのぞける。

仮に wsl 側のルートで `touch test` などしておけば、それは explorer 側から `\\wsl$\Ubuntu-20.04\root` で見れる。

## 本当に D ドライブで環境がつくられたかの確認？

df でディスクの空き容量を確認する

```
root@DESKTOP-TI85UUC:~# df
Filesystem      1K-blocks      Used  Available Use% Mounted on
/dev/sdb        263174212   1122612  248613444   1% /
tmpfs            13108660         0   13108660   0% /mnt/wsl
tools           975628284 304152948  671475336  32% /init
none             13106576         0   13106576   0% /dev
none             13108660         4   13108656   1% /run
none             13108660         0   13108660   0% /run/lock
none             13108660         0   13108660   0% /run/shm
none             13108660         0   13108660   0% /run/user
tmpfs            13108660         0   13108660   0% /sys/fs/cgroup
drivers         975628284 304152948  671475336  32% /usr/lib/wsl/drivers
lib             975628284 304152948  671475336  32% /usr/lib/wsl/lib
C:\             975628284 304152948  671475336  32% /mnt/c
D:\            1953513468   2362304 1951151164   1% /mnt/d
```

この状態で適当にビルド環境を作る

```
sudo apt-get install -y git-core gnupg flex bison build-essential zip curl zlib1g-dev gcc-multilib g++-multilib libc6-dev-i386 libncurses5 lib32ncurses5-dev x11proto-core-dev libx11-dev lib32z1-dev libgl1-mesa-dev libxml2-utils xsltproc unzip fontconfig
```

そして再度 df を確認する。

```
root@DESKTOP-TI85UUC:~# df
Filesystem      1K-blocks      Used  Available Use% Mounted on
/dev/sdb        263174212   1903532  247832524   1% /
tmpfs            13108660         0   13108660   0% /mnt/wsl
tools           975628284 304149492  671478792  32% /init
none             13106576         0   13106576   0% /dev
none             13108660        12   13108648   1% /run
none             13108660         0   13108660   0% /run/lock
none             13108660         0   13108660   0% /run/shm
none             13108660         0   13108660   0% /run/user
tmpfs            13108660         0   13108660   0% /sys/fs/cgroup
drivers         975628284 304149492  671478792  32% /usr/lib/wsl/drivers
lib             975628284 304149492  671478792  32% /usr/lib/wsl/lib
C:\             975628284 304149492  671478792  32% /mnt/c
D:\            1953513468   3345344 1950168124   1% /mnt/d
```

D ドライブが減ったので D ドライブで動いていそうである。

## D ドライブへの割り当て容量を増やす

もともと D ドライブに wsl 環境が欲しかった理由は、潤沢なディスクが欲しかったためである。
ただ wsl はデフォルトでは 256G いか確保しないのでこれを拡張する。

これに関しては Microsoft 公式の[WSL 2 仮想ハード ディスクのサイズを拡張する](https://docs.microsoft.com/ja-jp/windows/wsl/vhd-size)という資料があるのだが、C ドライブを使わない都合で手順が異なる場所があるので、自分の手順を書く。

disk の割り当ては diskpart コマンドで行う。これができるのは管理者権限なので、管理者権限でターミナルを開く。ターミナルを右クリックすればできる。

次に wsl のルートファイルシステムを見つける。これはエクスプローラーの D ドライブから見えているものだ。私の場合だと、D:\wsl\ext4.vhdx にある。

この状態で diskpart を立ち上げる。

```
diskpart
```

そうするとプロンプトがでるので、ディスクの確認をする。

```
DISKPART> Select vdisk file="D:\wsl\ext4.vhdx"

DiskPart により、仮想ディスク ファイルが選択されました。

DISKPART>  detail vdisk

デバイスの種類 ID: 0 (不明)
ベンダー ID: {00000000-0000-0000-0000-000000000000} (不明)
状態: 追加済み
仮想サイズ:  256 GB
物理サイズ: 2092 MB
ファイル名: D:\wsl\ext4.vhdx
子: いいえ
親ファイル名:
関連付けられたディスク番号: 見つかりません。
```

どうやら初期値の 256GB が割り当たっているようだ。

これを 512GB まで拡張する。

```
DISKPART> expand vdisk maximum=512000

  100% 完了しました

DiskPart により、仮想ディスク ファイルは正常に拡張されました。
```

拡張したら、これを wsl 側へマウントする。なのでこれ以降の手順は wsl 側のターミナルから行うこと。

```
root@DESKTOP-TI85UUC:~# sudo resize2fs /dev/sdb 512000M
resize2fs 1.45.5 (07-Jan-2020)
Filesystem at /dev/sdb is mounted on /; on-line resizing required
old_desc_blocks = 32, new_desc_blocks = 63
The filesystem on /dev/sdb is now 131072000 (4k) blocks long.
```

/dev/sdb を指定しているが、本当にこの値かどうかは [WSL 2 仮想ハード ディスクのサイズを拡張する](https://docs.microsoft.com/ja-jp/windows/wsl/vhd-size) の項目 6 を確認してほしい。

割り当てれたか確認してみよう。

```
root@DESKTOP-TI85UUC:~# df
Filesystem      1K-blocks      Used  Available Use% Mounted on
/dev/sdb        515010816   1911380  489427180   1% /
tmpfs            13108660         0   13108660   0% /mnt/wsl
tools           975628284 304151176  671477108  32% /init
none             13106576         0   13106576   0% /dev
none             13108660         4   13108656   1% /run
none             13108660         0   13108660   0% /run/lock
none             13108660         0   13108660   0% /run/shm
none             13108660         0   13108660   0% /run/user
tmpfs            13108660         0   13108660   0% /sys/fs/cgroup
drivers         975628284 304151176  671477108  32% /usr/lib/wsl/drivers
lib             975628284 304151176  671477108  32% /usr/lib/wsl/lib
C:\             975628284 304151176  671477108  32% /mnt/c
D:\            1953513468   3345344 1950168124   1% /mnt/d
```

/dev/sdb に 500GB ほど割り当たっているので、割り当てが完了したといえる。

## 感想

Windows, steam の起動以外に使うの難しい。
