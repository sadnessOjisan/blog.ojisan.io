---
path: /actions-rs-cargo-ari-nashi
created: "2023-08-10"
title: actions-rs/cargo が非推奨とは言うものの 
visual: "./visual.png"
tags: [rust, "github actions"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

Github Actions のアクションに [actions-rs/cargo](https://github.com/actions-rs/cargo), [actions-rs/toolchain](https://github.com/actions-rs/toolchain) といったアクションがあり、これはワークフロー上で cargo を使えるようにしてくれるモノだ。ただ、グループ名にactions-rs とついているが公式のものではなく、最終更新が4年前であることからメンテもされていないと言われている。実際、そう言ったことが書かれたブログも見かけるし、周りの有識者も同じような見解を示していた。

FYI: https://techblog.paild.co.jp/entry/2023/04/10/170218

しかしこの action は黎明期から存在しており、数々の有名OSSでの利用実績もあり、機能不全だとかそういうデメリットがあるモノでもなく、現時点でも意図通りに動いてくれる。とはいえメンテされていないのは事実ではあるので、置き換える必要があるのかどうかを判断するために読んでみた。

## エコシステム

まず actions-rs というグループがある。

https://github.com/actions-rs

関連レポジトリがたくさんあり、core, toolchain, cargo が主なコンポーネントだ。

## 使われ方

コードを読んでいく前に、どこを読むのか明らかにすべく、想定している使われ方を先に示す。

このような format, lint, test を回す想定で考える。

```yaml
name: test

on: push
jobs:
  test:
    name: run test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          components: rustfmt, clippy
      - uses: actions-rs/cargo@v1
        with:
          command: fmt
          args: --all -- --check
      - uses: actions-rs/cargo@v1
        with:
          command: clippy
          args: -- -D warnings
      - uses: actions-rs/cargo@v1
        with:
          command: test
```

## actions-rs/toolchain

URL は https://github.com/actions-rs/toolchain だ。

GitHub Actions では compose できる外部 action は action.yml として定義されており、つまりはそれがエントリポイントだ。確認すると

```yaml
runs:
  using: 'node12'
  main: 'dist/index.js'
```

とあるので、この処理の本体はそれだ。ただそれはどうみてもビルドした後のコードだ。package.json には 

```
"build": "rm -rf ./dist/* && ncc build src/main.ts --minify"
```

とあるので src/main.ts がエントリポイントとしてみてみる。

そこには

```ts
import * as core from "@actions/core";
import path from "path";

import * as args from "./args";
import * as versions from "./versions";
import { RustUp, ToolchainOptions } from "@actions-rs/core";

async function run(): Promise<void> {
   ...

    const rustup = await RustUp.getOrInstall();

    ...

    await rustup.installToolchain(opts.name, installOptions);

    ...
}

async function main(): Promise<void> {
    try {
        await run();
    } catch (error) {
        core.setFailed(error.message);
    }
}

main();
```

とある。

ここで actions-rs/core というパッケージからの呼び出しがされる。

`RustUp.getOrInstall()` などは

```ts
import { promises as fs } from 'fs';
import * as path from 'path';
import * as process from 'process';

import * as semver from 'semver';
import * as io from '@actions/io';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';

export class RustUp {
    private readonly path: string;

    private constructor(exePath: string) {
        this.path = exePath;
    }

    public static async getOrInstall(): Promise<RustUp> {
        try {
            return await RustUp.get();
        } catch (error) {
            core.debug(
                `Unable to find "rustup" executable, installing it now. Reason: ${error}`,
            );
            return await RustUp.install();
        }
    }

    public static async get(): Promise<RustUp> {
        const exePath = await io.which('rustup', true);
        return new RustUp(exePath);
    }

    public static async install(): Promise<RustUp> {
        const args = [
            '--default-toolchain',
            'none',
            '-y', // No need for the prompts (hard error from within the Docker containers)
        ];

        switch (process.platform) {
            case 'darwin':
            case 'linux': {
                const rustupSh = await tc.downloadTool('https://sh.rustup.rs');
                await exec.exec(rustupSh, args);
                break;
            }

            case 'win32': {
                const rustupExe = await tc.downloadTool(
                    'https://win.rustup.rs',
                );
                await exec.exec(rustupExe, args);
                break;
            }

            default:
                throw new Error(
                    `Unknown platform ${process.platform}, can't install rustup`,
                );
        }

        core.addPath(path.join(process.env.HOME!, '.cargo', 'bin')); // eslint-disable-line @typescript-eslint/no-non-null-assertion

        return new RustUp('rustup');
    }

    public async installToolchain(
        name: string,
        options?: ToolchainOptions,
    ): Promise<number> {
        const args = ['toolchain', 'install', name];

        ...

        await this.call(args);

        ...

        return 0;
    }

    ...
}
```

で定義されている。install 部分の肝は

```ts
const rustupSh = await tc.downloadTool('https://sh.rustup.rs');
await exec.exec(rustupSh, args);
```

であり、まず [actions/tool-cache](https://www.npmjs.com/package/@actions/tool-cache) を使ってセットアップスクリプトをDLしている。その実態は rustup の実体を wget してくるスクリプトなのでそれを exec.exec で実行している。[actions/exec](https://www.npmjs.com/package/@actions/exec) はクロスプラットフォームでスクリプトを実行できる優れものだ。

これは getOrInstall 越しに install 側で１度だけ呼ばれる処理だが、１度呼ばれたらそのタスクのワークフローではそのバイナリとコマンドが使えるようになる。

つまりこれで cargo toolchain が使えるようになった。

ちなみにバイナリまでのパスをインスタンス変数で保持するのでこれにアクセスさえできればPATHの設定などは不要だ。そしてそのパスを指定して実行するのが call で、これは次の cargo で登場する。

## actions-rs/cargo

```rs
- uses: actions-rs/cargo@v1
    with:
        command: test
```

のようにして呼ばれることから、`cargo hoge` を実行してくれるのだろう。その実体が [actions-rs/cargo](https://github.com/actions-rs/cargo) だ。ここでは渡したコマンドがどう実行されるか見ていこう。

これも action.yaml や package.json を見るとエントリポイントは main.ts であることが分かる。

```ts
import path from "path";
import * as core from "@actions/core";
import * as input from "./input";
import { Cargo, Cross } from "@actions-rs/core";

export async function run(actionInput: input.Input): Promise<void> {
  ...

  program = await Cargo.get();

   ...

    args.push(actionInput.command);
    args = args.concat(actionInput.args);

    await program.call(args);
}

async function main(): Promise<void> {
    const matchersPath = path.join(__dirname, ".matchers");
    console.log(`::add-matcher::${path.join(matchersPath, "rust.json")}`);

    const actionInput = input.get();

    try {
        await run(actionInput);
    } catch (error) {
        core.setFailed((<Error>error).message);
    }
}

void main();
```

ただ受け取った args を `program.call` しているだけに見える。

`program` は先に見た actins-rs/core だ。

```rs
public static async get(): Promise<RustUp> {
  const exePath = await io.which('rustup', true);
  return new RustUp(exePath);
}
```

io.Which は [actions/io](https://www.npmjs.com/package/@actions/io) の機能で、

> Get the path to a tool and resolves via paths. Follows the rules specified in [man which](https://linux.die.net/man/1/which).

とあることから実行ファイルへのパスを示してくれる。つまりここでは rustup までのパスを手に入れてくれる。なのですでに rustup は設定されていることが前提で呼び出されている。

そして RustUp のインスタンスメソッド call が呼ばれる。

```
public async call(args: string[], options?: {}): Promise<number> {
  return await exec.exec(this.path, args, options);
}
```

そのままバイナリに引数を渡して実行しているだけだ。つまり `cargo test` していることに他ならない。なのでコマンドを実行していることが確認できた。

## actions-rs は何を解決してるのか

### actions-rs を使わないときの方法

直接 install してしまえばいい。

```rust
- run: |
  rustup component add clippy
  rustup component add rustfmt
- run: cargo fmt --all -- --check
- run: cargo clippy -- -D warnings
- run: cargo test
```

どうしていきなり rustup が使えるのかと思うかもしれないが、実は GitHub Actions の Ubuntus latest には最初から入っているのである。

https://github.com/actions/runner-images/blob/main/images/linux/scripts/installers/rust.sh

なのでこの方法はベースイメージ次第では使えないので注意が必要だ。

### クロスプラットフォームへの対応

上のコードで置き換えられるということはわざわざこのアクションを入れなくてもいいと思うかもしれないが、メリットはある。それはクロスプラットフォームに対応できていることで、install は実行OSによって切り替えているし、コマンドの実行系は actions 系のライブラリを経由している。actions 系は win, mac, linux かのハンドリングを全部押しつけることができる。

https://github.com/actions/toolkit/blob/main/packages/exec/src/toolrunner.ts#L48

なのでこれらのライブラリを呼び出したいという点でカスタムアクションをJSで実装したのは合理的な戦略だったと思う。

## 私はactions-rs を置き換える必要がないと考えているが、置き換えは簡単だし困らないので置き換えるようにしている

さて、actions を使うのはマルチプラットフォーム対応したいからだ。なのでただのサーバーを書く分には別にOSの抽象化はいらなくてこの actions を使う必要はないと思う。それに

```yaml
- run: |
  rustup component add clippy
  rustup component add rustfmt
- run: cargo fmt --all -- --check
- run: cargo clippy -- -D warnings
- run: cargo test
```

とするだけで済む。

ただ置き換えなくても喫緊で何か問題が起きるとも思わない。それでも移行したい人は、actions-rs のように [actions toolkit](https://github.com/actions/toolkit) を使ってそういう抽象化レイヤーを作ると良いと思う。そういうツールを TS で書けるのは良いことだ。

FYI: https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action

ちなみにDockerでやる方法もあるが、ホストOSのmatrixが使えない・もしくはその数だけDockerfileを増やす必要があるのでJSに載せて、OS間の差異吸収はGitHubに任せる（信じる）方がよいと思う。