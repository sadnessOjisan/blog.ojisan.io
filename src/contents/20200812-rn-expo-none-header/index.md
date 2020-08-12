---
path: /rn-expo-none-header
created: "2020-08-12 09:00"
title: Expoから生成したアプリのヘッダーを消す
visual: "./visual.png"
tags: ["React Native", expo]
userId: sadnessOjisan
isProtect: false
---

最近 React Native をはじめたので詰まったことを雑多にメモしていこうと思います！
「react-native header hide」 などで検索すればいくらでも情報が出てくるとは思いますが、情報がふるかったり、expo で作ったアプリケーションにはそのまま適用できなかったりしたので、メモします。

## header を出しているのは誰か

expo-cli で作ったアプリの場合、header を表出しているのは react-navigation の StackNavigator です。
おそらく検索結果には StackNavigator で navigator を作るときのオプション指定で header を消すように言われるのではないでしょうか。

```js
const MainNavigation = StackNavigator(
  {
    otp: { screen: OTPlogin },
    otpverify: { screen: OTPverification },
    userVerified: {
      screen: TabNavigator({
        List: { screen: List },
        Settings: { screen: Settings },
      }),
    },
  },
  {
    headerMode: "none",
    navigationOptions: {
      headerVisible: false,
    },
  }
)
```

しかし [Hide header in stack navigator React navigation](https://stackoverflow.com/questions/44701245/hide-header-in-stack-navigator-react-navigation)を読む限り、 version 2.0.0-alpha.36 (2019-11-07) 以前の書き方らしく今は使いません。

事実 expo-cli が生成しているコードは

```js
const Stack = createStackNavigator<RootStackParamList>();

function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Root" component={BottomTabNavigator} />
      <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Oops!' }} />
    </Stack.Navigator>
  );
}
```

といった形で、`StackNavigator()`ではなく`createStackNavigator()`を実行しており、オプションを渡す口がありません。

## Navigator の props のオプションで Navigator の表出を管理する

API リファレンスの[createStackNavigator](https://reactnavigation.org/docs/stack-navigator)には headerMode と headerShown というオプションについての記述があります。
これらは header の表出を制御できるオプションですが[headerMode](https://reactnavigation.org/docs/stack-navigator#headermode)を読むと表出を細かく管理するために [headerShown](https://reactnavigation.org/docs/stack-navigator#headershown)を使った方が良さそうなので、この headerShown を使っていきます。

で、これをセットすれば header が出なくなるはずなのですが、expo-cli が生成したコードにはそれが含まれていて、その上で header が表出されています。

![headerがある](./header.png)

```js
const Stack = createStackNavigator<RootStackParamList>();

function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Root" component={BottomTabNavigator} />
      <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Oops!' }} />
    </Stack.Navigator>
  );
}
```

ではどうして header が表出しているのでしょうか。

## Navigator を入れ子にすると header の設定を上書ける

header が出ている原因は、expo-cli が生成するコードが Navigator を入れ子にしているところにあります。
`<Stack.Screen name="Root" component={BottomTabNavigator} />` の BottomTabNavigator から先を読んでいくと、

```jsx
const BottomTab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
  const colorScheme = useColorScheme();

  return (
    <BottomTab.Navigator
      initialRouteName="TabOne"
      tabBarOptions={{ activeTintColor: Colors[colorScheme].tint }}
    >
      <BottomTab.Screen
        name="TabOne"
        component={TabOneNavigator}
        options={{
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="ios-code" color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="TabTwo"
        component={TabTwoNavigator}
        options={{
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="ios-code" color={color} />
          ),
        }}
      />
    </BottomTab.Navigator>
  );
}

function TabBarIcon(props: { name: string; color: string }) {
  return <Ionicons size={30} style={{ marginBottom: -3 }} {...props} />;
}

const TabOneStack = createStackNavigator<TabOneParamList>();

function TabOneNavigator() {
  return (
    <TabOneStack.Navigator>
      <TabOneStack.Screen
        name="TabOneScreen"
        component={TabOneScreen}
        options={{ headerTitle: "Tab One Title" }}
      />
    </TabOneStack.Navigator>
  );
}

const TabTwoStack = createStackNavigator<TabTwoParamList>();

function TabTwoNavigator() {
  return (
    <TabTwoStack.Navigator>
      <TabTwoStack.Screen
        name="TabTwoScreen"
        component={TabTwoScreen}
        options={{ headerTitle: "Tab Two Title" }}
      />
    </TabTwoStack.Navigator>
  );
}

```

というファイルがあります。

ここで各スクリーンに紐づく Navigation を定義していますが、

```js
const TabOneStack = createStackNavigator<TabOneParamList>();

function TabOneNavigator() {
  return (
    <TabOneStack.Navigator>
      <TabOneStack.Screen
        name="TabOneScreen"
        component={TabOneScreen}
        options={{ headerTitle: "Tab One Title" }}
      />
    </TabOneStack.Navigator>
  );
}
```

とあるとおり、StackNavigator を入れ子にしていたことがわかります。
**header を消すためにはここにも headerShown の props を書いてあげる必要があります。**

```js
function TabOneNavigator() {
  return (
    <TabOneStack.Navigator screenOptions={{ headerShown: false }}>
      <TabOneStack.Screen
        name="TabOneScreen"
        component={TabOneScreen}
        options={{ headerTitle: "Tab One Title" }}
      />
    </TabOneStack.Navigator>
  );
```

とすれば無事 header を消すことができます。

![headerがない](./headless.png)

## Navigator を入れ子にしたときの挙動

expo-cli が生成したコードに似たコードが 公式 Docs の Guides の[Nesting navigators]()にあります。
[Nesting multiple stack navigators](https://reactnavigation.org/docs/nesting-navigators/#nesting-multiple-stack-navigators)がまさしくそうで、

> When nesting multiple stacks, React Navigation will automatically hide the header from the child stack navigator in order to avoid showing duplicate headers. However, depending on the scenario, it might be more useful to show the header in the child stack navigator instead and hide the header in the parent stack navigator.

とあるように入れ子の親の header 名を隠す方法として紹介されています。

そして [Each screen in a navigator has its own params](https://reactnavigation.org/docs/nesting-navigators/#each-screen-in-a-navigator-has-its-own-params)とあるとおり、子の screen は独立して header の設定を持つので、header は表出されます。なぜなら headershown の設定は

> Whether to show the header. The header is shown by default unless `headerMode` was set to `none`.

とある通り明示的に false にしないと隠せないからです。

そのため header を隠すために隠したい Screen は明示的に false を設定する必要がありました。

## まとめ

- react-native で header を隠す方法が v4 と v5 で違うので検索結果がそのまま使えないかも
- expo-cli の生成するコードは Navigator を nest しているので v5 の書き方を採用しても header は書き換わらない(というより隠す設定が標準でされているが隠れない)
- 入れ子の内側にも headerShown を設定すると隠せる
