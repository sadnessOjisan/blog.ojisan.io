---
path: /dayjs-plugin
created: "2022-12-28"
title: dayjs と timezone plugin
visual: "./visual.png"
tags: ["dayjs"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

day.js アドベントカレンダー -3 日目は sadnessOjisan が担当します。
必要性に駆られて dayjs を理解する必要があったので読んでみました。

## dayjs とは

[dayjs](https://day.js.org/) は [momentjs](https://momentjs.com/) 互換の 日付ライブラリ です。
互換性を保ちながらも moment.js と違って immutable なオブジェクトを返してくれます。
moment.js が deprecated になった今、このライブラリへの移行が薦められています。

## dayjs でタイムゾーンを扱う

まずタイムゾーンについては [タイムゾーン呪いの書 (知識編)](https://zenn.dev/dmikurube/articles/curse-of-timezones-common-ja) を読んでください。神です。

### timezone をなぜ考慮する必要があるのか

そのシステムを使う人や使う PC の設定が、そのサービスが想定するタイムゾーンと一致していれば何も考えなくて良いのですが、実際にはどんなタイムゾーン設定がされたユーザーが来るか分からないので、その人のタイムゾーンとシステムが想定する時刻を比較するために、タイムゾーンを解釈する仕組みがシステムには必要となります。
dayjs の場合そのような機能は plugin として提供されています。

### タイムゾーンプラグインは何をするのか

[公式 Doc](https://day.js.org/docs/en/timezone/timezone) をみると、timezone plugin を入れれば

```js
dayjs.extend(utc);
dayjs.extend(timezone);

// current time zone is 'Europe/Berlin' (offset +01:00)
// Parsing
dayjs.tz("2013-11-18 11:55:20", "America/Toronto"); // '2013-11-18T11:55:20-05:00'

// Converting (from time zone 'Europe/Berlin'!)
dayjs("2013-11-18 11:55:20").tz("America/Toronto"); // '2013-11-18T05:55:20-05:00'
```

のようなコードが使えるようになります。

これはただの `2013-11-18 11:55:20"` にオフセットが付いたことで「ベルリンから見たトロントで言う 11:55:20 は UTC(イギリス(GMT))で言えば `5:55:20` だ」を表します。

tz は該当の dayjs オブジェクトの UTC とのオフセットを反映してくれるメソッドと言えるでしょう。
この tz の実体は

```js
const proto = c.prototype;

proto.tz = function (timezone = defaultTimezone, keepLocalTime) {
  const oldOffset = this.utcOffset();
  const date = this.toDate();
  const target = date.toLocaleString("en-US", { timeZone: timezone });
  const diff = Math.round((date - new Date(target)) / 1000 / 60);
  let ins = d(target)
    .$set(MS, this.$ms)
    .utcOffset(-Math.round(date.getTimezoneOffset() / 15) * 15 - diff, true);
  if (keepLocalTime) {
    const newOffset = ins.utcOffset();
    ins = ins.add(oldOffset - newOffset, MIN);
  }
  ins.$x.$timezone = timezone;
  return ins;
};
```

(<https://github.com/iamkun/dayjs/blob/dev/src/plugin/timezone/index.js>)

となっています。

いまの dayjs オブジェクトが持つタイムゾーンからのズレ(oldOffset)を保持しておき、目的のタイムゾーンにおける該当時間と UTC とのオフセットも保持しておき、最後にそれを目的のタイムゾーンにおける date に対して足し引きします。

このコードでは `dayjs.extend(utc);` をしていますが、それはこのような[実装](https://github.com/iamkun/dayjs/blob/dev/src/plugin/utc/index.js)です。

timezone で使われている utcOffset は

```js
proto.utcOffset = function (input, keepLocalTime) {
  const { u } = this.$utils();
  if (u(input)) {
    if (this.$u) {
      return 0;
    }
    if (!u(this.$offset)) {
      return this.$offset;
    }
    return oldUtcOffset.call(this);
  }
  if (typeof input === "string") {
    input = offsetFromString(input);
    if (input === null) {
      return this;
    }
  }
  const offset = Math.abs(input) <= 16 ? input * 60 : input;
  let ins = this;
  if (keepLocalTime) {
    ins.$offset = offset;
    ins.$u = input === 0;
    return ins;
  }
  if (input !== 0) {
    const localTimezoneOffset = this.$u
      ? this.toDate().getTimezoneOffset()
      : -1 * this.utcOffset();
    ins = this.local().add(offset + localTimezoneOffset, MIN);
    ins.$offset = offset;
    ins.$x.$localOffset = localTimezoneOffset;
  } else {
    ins = this.utc();
  }
  return ins;
};
```

です。utc とのオフセットを計算してそれを dayjs オブジェクトに格納してくれています。

ちなみに `const { u } = this.$utils();` は

```js
export default {
  s: padStart,
  z: padZoneStr,
  m: monthDiff,
  a: absFloor,
  p: prettyUnit,
  u: isUndefined,
};
```

から来ていて、「分かるか〜〜〜！」という気持ち。

(<https://github.com/iamkun/dayjs/blob/dev/src/utils.js>)

### plugin は型レベルで何をするのか

たとえば

```js
import * as timezone from "dayjs/plugin/timezone";
```

のようなコードの d.ts は、

```ts
import { PluginFunc, ConfigType } from "dayjs";

declare const plugin: PluginFunc;
export = plugin;

declare module "dayjs" {
  interface Dayjs {
    tz(timezone?: string, keepLocalTime?: boolean): Dayjs;
    offsetName(type?: "short" | "long"): string | undefined;
  }

  interface DayjsTimezone {
    (date: ConfigType, timezone?: string): Dayjs;
    (date: ConfigType, format: string, timezone?: string): Dayjs;
    guess(): string;
    setDefault(timezone?: string): void;
  }

  const tz: DayjsTimezone;
}
```

です。つまり import した瞬間に型レベルでは `.tz` `.offsetName` が使えるようになります。

ただ実装レベルでは extend を呼ぶ必要があるので注意しましょう。extend は渡されたプラグインを

```js
dayjs.extend = (plugin, option) => {
  if (!plugin.$i) {
    // install plugin only once
    plugin(option, Dayjs, dayjs);
    plugin.$i = true;
  }
  return dayjs;
};
```

する処理です。

(<https://github.com/iamkun/dayjs/blob/dev/src/index.js>)

つまり plugin の初期化関数を呼び出した後、plugin に install 済みの flag を立てて、extend を複数呼ばれた時には再度初期化が走らないようにしてくれています。

じゃあその plugin は何をしているかと言うと、あえて utc でも timezone でもないものを見てみると(既に例に挙げてしまっているので)、

```js
export default (o, c, d) => {
  c.prototype.isBetween = function (a, b, u, i) {
    const dA = d(a);
    const dB = d(b);
    i = i || "()";
    const dAi = i[0] === "(";
    const dBi = i[1] === ")";

    return (
      ((dAi ? this.isAfter(dA, u) : !this.isBefore(dA, u)) &&
        (dBi ? this.isBefore(dB, u) : !this.isAfter(dB, u))) ||
      ((dAi ? this.isBefore(dA, u) : !this.isAfter(dA, u)) &&
        (dBi ? this.isAfter(dB, u) : !this.isBefore(dB, u)))
    );
  };
};
```

第二引数で渡される Dayjs そのものに isBetween 関数を拡張しています。
つまり、extend したら Dayjs そのものが拡張されると言うわけです。

そして普段 dayjs() として呼んでいる Dayjs オブジェクトは Dayjs クラスのインスタンスなので、一度この設定がされた後に dayjs() を呼ぶと、その dayjs オブジェクトは plugin で拡張されたものです。そしてそれは、node_modules の dayjs モジュールの Dayjs クラスを拡張するので、ファイルを跨いでもその設定は有効です。なのでこのプラグイン設定はエントリポイントで行われる必要があります。

この事実は公式のドキュメントには書かれていなさそうですが、Issue で論じている人はいました。

FYI: <https://github.com/iamkun/dayjs/issues/1577#issuecomment-879817809>

## timezone plugin を使うためには

結果を先に書くと、

```ts
import * as dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc";
import * as timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

console.log(dayjs().tz("Asia/Tokyo"));
```

を推奨します。

`import timezone from 'dayjs'` という書き方もできますが、tsconfig の設定次第では動かない可能性があります。

またコードリーディングで見た通り、timezone plugin は utc plugin のメソッドを呼び出します。そのため先に utc plugin を extends しておいてください。（まあコード読む限りは順序は逆でも大丈夫そうだけど）

FYI: <https://github.com/iamkun/dayjs/issues/1584#issuecomment-897308065>
