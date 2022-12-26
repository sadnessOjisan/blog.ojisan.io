---
path: /last-moment
created: "2022-12-26"
title: 色々知りたいことがあってmoment を読んだ
visual: "./visual.png"
tags: ["moment"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

moment.js アドベントカレンダー -1 日目は sadnessOjisan が担当します。
必要性に駆られて moment を理解する必要があったので読んでみました。

## エントリポイントはどこか

package.json の main は moment.js だが、これはビルド済みファイルであり、CONTRIBUTING.md に

> Starting from version 2.10.0 the code is placed under `src/`.
> `moment.js`, `locale/*.js`, `min/*.js` are generated only on release.
>
> **DO NOT** submit changes to the generated files. Instead only change
> `src/**/*.js` and run the tests.

とある。なのでコードリーディングは src/moment.js から行う。

## mutable と言われる所以

`moment()` したら Moment オブジェクトが返ってくるのでそれを確かめてみる。

```js
import { hooks as moment, setHookCallback } from './lib/utils/hooks';

import {
    min,
    max,
    now,
    isMoment,
    momentPrototype as fn,
    createUTC as utc,
    createUnix as unix,
    createLocal as local,
    createInvalid as invalid,
    createInZone as parseZone,
} from './lib/moment/moment';

setHookCallback(local);

moment.fn = fn;
moment.min = min;
moment.max = max;
moment.now = now;
moment.utc = utc;
moment.unix = unix;
...

export default moment;
```

(<https://github.com/moment/moment/blob/f2006b647939466f4f403721b8c7816d844c038c/src/moment.js>)

moment オブジェクトを破壊的変更して関数を生やしているのは確認ができる。
コードを見た限り、moment の実態は import している hook のようだ。
見てみよう。

```js
export { hooks, setHookCallback };

var hookCallback;

function hooks() {
  return hookCallback.apply(null, arguments);
}

// This is done to register the method called with moment()
// without creating circular dependencies.
function setHookCallback(callback) {
  hookCallback = callback;
}
```

??? といった感じである。ただスコープ外変数 hookCallback を共用して呼び出しているので、setHookCallback でセットされるものが実体なのだろう。それは先のファイルにあった

```
setHookCallback(local);
```

である。この local を見てみよう。

```js
import { createLocalOrUTC } from "./from-anything";

export function createLocal(input, format, locale, strict) {
  return createLocalOrUTC(input, format, locale, strict, false);
}
```

(<https://github.com/moment/moment/blob/e96809208c9d1b1bbe22d605e76985770024de42/src/lib/create/local.js>)

ここから関数を辿っていくと

```js
function createFromConfig(config) {
  var res = new Moment(checkOverflow(prepareConfig(config)));
  if (res._nextDay) {
    // Adding is smart enough around DST
    res.add(1, "d");
    res._nextDay = undefined;
  }

  return res;
}
```

といった関数にであう。Moment の実態のようなものが出てきた。

```js
export function Moment(config) {
  copyConfig(this, config);
  this._d = new Date(config._d != null ? config._d.getTime() : NaN);
  if (!this.isValid()) {
    this._d = new Date(NaN);
  }
  // Prevent infinite loop in case updateOffset creates new moment
  // objects.
  if (updateInProgress === false) {
    updateInProgress = true;
    hooks.updateOffset(this);
    updateInProgress = false;
  }
}
```

内部に日付を持つ日付のようなものだ。

これがただの Date オブジェクト差異として、

```js
import {
    min,
    max,
    now,
    isMoment,
    momentPrototype as fn,
    createUTC as utc,
    createUnix as unix,
    createLocal as local,
    createInvalid as invalid,
    createInZone as parseZone,
} from './lib/moment/moment';

moment.fn = fn;
moment.min = min;
moment.max = max;
moment.now = now;
moment.utc = utc;
moment.unix = unix;
...
```

として拡張されていくのであろう。
これが Moment の実態だ。

そして mutable と呼ばれる所以は、

```js
export { hooks, setHookCallback };

var hookCallback;

function hooks() {
  return hookCallback.apply(null, arguments);
}

// This is done to register the method called with moment()
// without creating circular dependencies.
function setHookCallback(callback) {
  hookCallback = callback;
}
```

にあり、一度作られた Moment が hookCallback に保持されるからだ。
別の moment() 呼び出しては同じ hookCallback が呼ばれるし、なにかは快適操作をすると hookCallback を参照している他の object にも影響があるというわけだ。

ちなみにこの手の問題は `.clone()` で解消するが、それは

```js
import { Moment } from "./constructor";

export function clone() {
  return new Moment(this);
}
```

となっており、あぁなるほどという感じである。

### なんでもあり subtract

moment の add や subtract は [公式 Doc](https://momentjs.com/docs/#/manipulating/add/) によると

```js
moment().add(Number, String);
moment().add(Duration);
moment().add(Object);
```

のような形式で使えるらしく、

```js
moment().add(7, "days").add(1, "months"); // with chaining
moment().add({ days: 7, months: 1 }); // with object literal

var duration = moment.duration({ days: 1 });
moment([2012, 0, 31]).add(duration);
```

という風になる。

しかし実際には、

`.subtract("04:30", "h")`

のような形式でも良いのである。

この謎を追い求めるべく、subtract や add の実装を見ていこう。

それは `moment.fn = fn;` で生やされる。

fn の中では

```js
proto.add = add;
proto.subtract = subtract;
```

となっているのでさらに追うと、

```js
export var add = createAdder(1, "add"),
  subtract = createAdder(-1, "subtract");
```

となる。

これは

```js
function createAdder(direction, name) {
  return function (val, period) {
    var dur, tmp;
    //invert the arguments, but complain about it
    if (period !== null && !isNaN(+period)) {
      deprecateSimple(
        name,
        "moment()." +
          name +
          "(period, number) is deprecated. Please use moment()." +
          name +
          "(number, period). " +
          "See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info."
      );
      tmp = val;
      val = period;
      period = tmp;
    }

    dur = createDuration(val, period);
    addSubtract(this, dur, direction);
    return this;
  };
}
```

であり、"12:00" のような引数は val に渡されることがわかる。この val を使っているのは createDuration であり、ここで多様な引数を扱っていることとなる。

そしてその該当の処理がここだ。

```js
export function createDuration(input, key) {
  var duration = input,
    // matching against regexp is expensive, do it on demand
    match = null,
    sign,
    ret,
    diffRes;

  if (isDuration(input)) {
    duration = {
      ms: input._milliseconds,
      d: input._days,
      M: input._months,
    };
  } else if (isNumber(input) || !isNaN(+input)) {
    duration = {};
    if (key) {
      duration[key] = +input;
    } else {
      duration.milliseconds = +input;
    }
  } else if ((match = aspNetRegex.exec(input))) {
    sign = match[1] === "-" ? -1 : 1;
    duration = {
      y: 0,
      d: toInt(match[DATE]) * sign,
      h: toInt(match[HOUR]) * sign,
      m: toInt(match[MINUTE]) * sign,
      s: toInt(match[SECOND]) * sign,
      ms: toInt(absRound(match[MILLISECOND] * 1000)) * sign, // the millisecond decimal point is included in the match
    };
  } else if ((match = isoRegex.exec(input))) {
    sign = match[1] === "-" ? -1 : 1;
    duration = {
      y: parseIso(match[2], sign),
      M: parseIso(match[3], sign),
      w: parseIso(match[4], sign),
      d: parseIso(match[5], sign),
      h: parseIso(match[6], sign),
      m: parseIso(match[7], sign),
      s: parseIso(match[8], sign),
    };
  } else if (duration == null) {
    // checks for null or undefined
    duration = {};
  } else if (
    typeof duration === "object" &&
    ("from" in duration || "to" in duration)
  ) {
    diffRes = momentsDifference(
      createLocal(duration.from),
      createLocal(duration.to)
    );

    duration = {};
    duration.ms = diffRes.milliseconds;
    duration.M = diffRes.months;
  }

  ret = new Duration(duration);

  if (isDuration(input) && hasOwnProp(input, "_locale")) {
    ret._locale = input._locale;
  }

  if (isDuration(input) && hasOwnProp(input, "_isValid")) {
    ret._isValid = input._isValid;
  }

  return ret;
}
```

読み進めていくと、12:00 のような形式は

```js
if ((match = aspNetRegex.exec(input))) {
  sign = match[1] === "-" ? -1 : 1;
  duration = {
    y: 0,
    d: toInt(match[DATE]) * sign,
    h: toInt(match[HOUR]) * sign,
    m: toInt(match[MINUTE]) * sign,
    s: toInt(match[SECOND]) * sign,
    ms: toInt(absRound(match[MILLISECOND] * 1000)) * sign, // the millisecond decimal point is included in the match;
  };
}
```

にマッチすることがわかる。aspNetRegex は

```js
var aspNetRegex = /^(-|\+)?(?:(\d*)[. ])?(\d+):(\d+)(?::(\d+)(\.\d*)?)?$/;
```

という形式で正規表現チェッカーによると、

<iframe frameborder="0" width="1484" height="195" src="https://jex.im/regulex/#!embed=true&flags=&re=%5E(-%7C%5C%2B)%3F(%3F%3A(%5Cd*)%5B.%20%5D)%3F(%5Cd%2B)%3A(%5Cd%2B)(%3F%3A%3A(%5Cd%2B)(%5C.%5Cd*)%3F)%3F%24"></iframe>

となるからだ。つまり、12:00 のようなフォーマットでも受け入れてくれることが確認できた。

ただこれは dayjs など moment 互換を謳うライブラリではサポートされていないので使うのはやめておこう。

### 複数形 API

さて、Moment では `m.year()` があれば `m.years()` もある。

他にも

```js
moment().week(Number);
moment().week(); // Number
moment().weeks(Number);
moment().weeks(); // Number
```

(<https://momentjs.com/docs/#/get-set/week/>)

```js
moment().month(Number | String);
moment().month(); // Number
moment().months(Number | String);
moment().months(); // Number
```

(<https://momentjs.com/docs/#/get-set/month/>)

と単数系と複数形がサポートされている。どう違うのだろうか。

これは実行してみると結果は同じである。

ほんとだろうか、実装を確かめてみよう。
これは先ほどの fn と同じファイルに実装があり、

```js
proto.week = proto.weeks = getSetWeek;
proto.day = proto.days = getSetDayOfWeek;
proto.hour = proto.hours = getSetHour;

proto.dates = deprecate(
  "dates accessor is deprecated. Use date instead.",
  getSetDayOfMonth
);
proto.months = deprecate(
  "months accessor is deprecated. Use month instead",
  getSetMonth
);
proto.years = deprecate(
  "years accessor is deprecated. Use year instead",
  getSetYear
);
```

と確かめられた。（deprecate は警告付き実行）

これは識者によると JS の日付ライブラリの監修のようなものであるとのことだ。
しかし moment 互換を謳う dayjs には複数形サポートがないので複数形を使っていると移行で痛い目を見る。単数系を使おう。

## まとめ

なんか色々スッキリした。
