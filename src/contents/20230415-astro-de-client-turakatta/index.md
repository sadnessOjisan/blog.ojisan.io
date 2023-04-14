---
path: /astro-de-client-turakatta
created: "2023-04-15"
title: Astro でクライアント側の処理を書いたら辛かった
visual: "./visual.png"
tags: [astro]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

画像は明日トロに見せかけた昨日トロだ。この OGP を作るために昨日大急ぎで閉店前にくら寿司に駆け込んだ。びっくらポンは全部外れた。

古来よりゲームの攻略ツールを作ることでプログラミングができるようになるとある。そのような期待を持ち、[paimon.moe](https://paimon.moe/)で満足できなくなった私は[原神の TODO リスト](https://genshin-todo.ojisan.dev/)を最近作り始めた。原神はリポップの時間がイベントやアイテムでバラバラなのでそれを管理するためのツールだ。iOS 向けの Push 通知のサンドボックスだったり、OSS として公開して yaml で入稿する口を用意することで自分でセルフホストして自分に都合の良い TODO リストを作れるようにもしようとしていた。が、技術選定を間違えたなと思っていま作り直している。その間違いについて書く。

## Astro でクライアント処理大変

リポップに合わせて TODO リストを更新したいのでローカルストレージで TODO の expire 管理する。なのでクライアントスクリプトを書かなければいけない。これまで Astro は [持続可能なスプラトゥーン３反省システム](https://blog.ojisan.io/splatoon3-hansei-site2/) で書いたように SSG としてしか使っていなかった。astro コンポーネントでクライアント処理を書くと思いのほか大変だったことをこれから書いていく。

### コード

GitHub も公開しようと思ったが、コードは実質この２ファイルなので先に貼り付ける。

```astro
---
import Layout from "../layouts/Layout.astro";
import Todos from "../components/Todos.astro";
import { getLanguageFromURL } from "../util";
import { vocabulary, type Vocabulary } from "../data/todo";
const lang = getLanguageFromURL(Astro.url.pathname);

let data: Vocabulary;
switch (lang) {
  case "ja":
  case "en":
    data = vocabulary[lang];
    break;
  default:
    console.error("lang: ", lang);
    throw new Error("");
}

export function getStaticPaths() {
  return [{ params: { lang: "ja" } }, { params: { lang: "en" } }];
}
---

<script>
  import { getLanguageFromURL } from "../util";

  const langSelectorEl = document.getElementById("langSelector");

  if (langSelectorEl === null) throw new Error("el should be");

  langSelectorEl.addEventListener("change", (e) => {
    if (e.target === null || !(e.target instanceof HTMLSelectElement)) {
      throw new Error("target should be select el");
    }
    window.location.href = `/${e.target.value}`;
  });

  const options = document.querySelectorAll(".langSelectorItem");
  options.forEach((option) => {
    if (!(option instanceof HTMLOptionElement)) {
      throw new Error("option should be HTMLOptionElement");
    }
    const currentLang = getLanguageFromURL(window.location.pathname);
    console.log(option);
    if (option.value === currentLang) {
      option.selected = true;
    }
  });
</script>

<Layout title="Welcome to Astro.">
  <button>{data.reset_local_storage}</button>
  <div>
    lang: <select id="langSelector"
      ><option class="langSelectorItem">ja</option><option
        class="langSelectorItem">en</option
      ></select
    >
  </div>
  <main>
    <h1><span class="text-gradient">{data["title"]}</span></h1>
    <Todos lang={lang} data={data} />
  </main>
</Layout>

<style>
</style>
```

```astro
---
import { KEYS, type Vocabulary } from "../data/todo";

export interface Props {
  lang: string;
  data: Vocabulary;
}

const { data } = Astro.props as Props; // FIXME: without `as`, it fails typing.

// FIXME: how can I use this value in client script.
const REGISTER_DATE_ID_TRAILER = "register-date";
---

<script>
  import { KEYS } from "../data/todo";

  import { getDateFromLocalStorage, formatDate } from "../util/date";

  const REGISTER_DATE_ID_TRAILER = "register-date";

  const checkboxes = document.querySelectorAll("input[type='checkbox']");
  checkboxes.forEach((checkbox) => {
    if (!(checkbox instanceof HTMLInputElement)) {
      throw new Error("checkbox should be HTMLInputElement");
    }
    checkbox.addEventListener("change", (e) => {
      if (e.target === null || !(e.target instanceof HTMLInputElement)) {
        throw new Error("");
      }

      // TODO: validate e.target.value which is a member of KEYS.

      if (e.target.checked) {
        // Save saved date.
        localStorage.setItem(e.target.value, new Date().toISOString());
        const el = document.getElementById(
          `${e.target.value}-${REGISTER_DATE_ID_TRAILER}`
        );
        if (el) {
          el.textContent = `(${formatDate(new Date())})`;
        }
      } else {
        localStorage.removeItem(e.target.value);
        const el = document.getElementById(
          `${e.target.value}-${REGISTER_DATE_ID_TRAILER}`
        );
        if (el) {
          el.textContent = "";
        }
      }
    });

    switch (checkbox.id) {
      case KEYS.JUSHI:
      case KEYS.MISSION1:
      case KEYS.MISSION2:
      case KEYS.MISSION3:
      case KEYS.MISSION4: {
        const el = document.getElementById(
          `${checkbox.id}-${REGISTER_DATE_ID_TRAILER}`
        );
        if (el) {
          const value = getDateFromLocalStorage(localStorage, checkbox.id);
          console.log(el);
          el.textContent = value ? `(${formatDate(value)})` : "";
        }
        const savedDateString = localStorage.getItem(checkbox.id);
        if (savedDateString === null) break;

        const savedDate = new Date(savedDateString);
        const expireDate = new Date(savedDate.setDate(savedDate.getDate() + 1));
        const now = new Date();
        if (now > expireDate) {
          checkbox.checked = false;
        } else {
          checkbox.checked = true;
        }
        return;
      }
      case KEYS.WEEKLY_BOSS1:
      case KEYS.WEEKLY_BOSS2:
      case KEYS.WEEKLY_BOSS3: {
        const el = document.getElementById(
          `${checkbox.id}-${REGISTER_DATE_ID_TRAILER}`
        );
        if (el) {
          const value = getDateFromLocalStorage(localStorage, checkbox.id);
          console.log(el);
          el.textContent = value ? `(${formatDate(value)})` : "";
        }
        const savedDateString = localStorage.getItem(checkbox.id);
        if (savedDateString === null) break;
        const savedDate = new Date(savedDateString);
        const expireDate = new Date(savedDate.setDate(savedDate.getDate() + 7));
        const now = new Date();
        if (now > expireDate) {
          checkbox.checked = false;
        } else {
          checkbox.checked = true;
        }
        return;
      }
      default:
    }
  });
</script>

<h2>daily</h2>
<p>{data.dayly_reset_description}</p>
<ul>
  <li>
    <input name="todo" id={KEYS.JUSHI} type="checkbox" value={KEYS.JUSHI} />
    <label for={KEYS.JUSHI}
      >{data.jushi}<span
        id={`${KEYS.JUSHI}-${REGISTER_DATE_ID_TRAILER}`}
        class="todo-date-text"></span></label
    >
  </li>
  <li>
    <input
      name="todo"
      id={KEYS.MISSION1}
      type="checkbox"
      value={KEYS.MISSION1}
    />
    <label for={KEYS.MISSION1}
      >{data.mission1}<span
        id={`${KEYS.MISSION1}-${REGISTER_DATE_ID_TRAILER}`}
        class="todo-date-text"></span></label
    >
  </li>
  <li>
    <input
      name="todo"
      id={KEYS.MISSION2}
      type="checkbox"
      value={KEYS.MISSION2}
    /><label for={KEYS.MISSION2}
      >{data.mission2}<span
        id={`${KEYS.MISSION2}-${REGISTER_DATE_ID_TRAILER}`}
        class="todo-date-text"></span></label
    >
  </li>
  <li>
    <input
      name="todo"
      id={KEYS.MISSION3}
      type="checkbox"
      value={KEYS.MISSION3}
    /><label for={KEYS.MISSION3}
      >{data.mission3}<span
        id={`${KEYS.MISSION3}-${REGISTER_DATE_ID_TRAILER}`}
        class="todo-date-text"></span></label
    >
  </li>
  <li>
    <input
      name="todo"
      id={KEYS.MISSION4}
      type="checkbox"
      value={KEYS.MISSION4}
    />
    <label for={KEYS.MISSION4}
      >{data.mission4}<span
        id={`${KEYS.MISSION4}-${REGISTER_DATE_ID_TRAILER}`}
        class="todo-date-text"></span></label
    >
  </li>
</ul>

<h2>weekly</h2>
<p>{data.weekly_reset_description}</p>
<ul>
  <li>
    <input id={KEYS.WEEKLY_BOSS1} type="checkbox" value={KEYS.WEEKLY_BOSS1} />
    <label for={KEYS.WEEKLY_BOSS1}
      >{data.weekly_boss1}<span
        id={`${KEYS.WEEKLY_BOSS1}-${REGISTER_DATE_ID_TRAILER}`}
        class="todo-date-text"></span></label
    >
  </li>
  <li>
    <input id={KEYS.WEEKLY_BOSS2} type="checkbox" value={KEYS.WEEKLY_BOSS2} />
    <label for={KEYS.WEEKLY_BOSS2}
      >{data.weekly_boss2}<span
        id={`${KEYS.WEEKLY_BOSS2}-${REGISTER_DATE_ID_TRAILER}`}
        class="todo-date-text"></span></label
    >
  </li>
  <li>
    <input id={KEYS.WEEKLY_BOSS3} type="checkbox" value={KEYS.WEEKLY_BOSS3} />
    <label for={KEYS.WEEKLY_BOSS3}
      >{data.weekly_boss3}<span
        id={`${KEYS.WEEKLY_BOSS3}-${REGISTER_DATE_ID_TRAILER}`}
        class="todo-date-text"></span></label
    >
  </li>
</ul>

<style></style>
```

### 辛ポイント 1: 宣言的に書けない

クライアント側での処理を script タグで埋め込んで昔ながらの DOM manipulation している。

テンプレートはビルド時の変数しか使えないので、ローカルストレージから値を取り出して DOM に反映するために

```html
<span
  id="{`${KEYS.WEEKLY_BOSS3}-${REGISTER_DATE_ID_TRAILER}`}class"
  ="todo-date-text"
></span>
```

を用意して、

```js
const el = document.getElementById(
  `${e.target.value}-${REGISTER_DATE_ID_TRAILER}`
);
if (el) {
  el.textContent = `(${formatDate(new Date())})`;
}
```

なことをしている。

DOM manipulation とイベントリスナの登録がめんどくさい。

JSX 書きたい。

### 辛ポイント 2: 同じ変数定義を二回する

[Component Script](https://docs.astro.build/en/core-concepts/astro-components/#the-component-script) と Client Script で変数を共有できない。

つまり

```astro
---
...

const REGISTER_DATE_ID_TRAILER = "register-date";
---

<script>
  const REGISTER_DATE_ID_TRAILER = "register-date";
  ...
</script>

<h2>daily</h2>
<p>{data.dayly_reset_description}</p>
<ul>
  <li>
    <input name="todo" id={KEYS.JUSHI} type="checkbox" value={KEYS.JUSHI} />
    <label for={KEYS.JUSHI}
      >{data.jushi}<span
        id={`${KEYS.JUSHI}-${REGISTER_DATE_ID_TRAILER}`}
        class="todo-date-text"></span></label
    >
  </li>
  ...

</ul>

<style></style>
```

といったコードになっている。理想的には REGISTER_DATE_ID_TRAILER の定義は 1 回だけにしたかった。

これと似た問題に同じ import を 2 回するというものもある。

### 辛ポイント 3: イベントハンドリングと TypeScript の相性の悪さ

React だと react-hook-form などを使うことで気づかずに済む辛さだが、`e.target.value` は必ず型エラーになる。

それは e.target が何の要素か分からないという問題があるからで、常に

```ts
if (e.target === null || !(e.target instanceof HTMLInputElement)) {
  throw new Error("");
}
```

のようなガードが必要となる。

この辺の辛さは [TypeScript Event.target, Event.currentTarget の型がむずい！](https://chaika.hatenablog.com/entry/2021/11/04/083000) に詳しく書いてあるので読んでみると良いだろう。

## 対策

一応 Astro でも JSX と React を使えるので React ベースに置き換えても良いだろう。ただランタイムで React 動かすならもう Astro 使わずに Next でもよくないか感はある。

これから書き直していくのだが、どっちで書くか悩んでいる。
