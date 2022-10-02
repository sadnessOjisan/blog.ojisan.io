---
path: /drf-serialize-association
created: "2022-10-02"
title: DRF で association を持ったデータを serialize する
visual: "./visual.png"
tags: ["django-rest-framework", "django", "python"]
userId: sadnessOjisan
isFavorite: false
isProtect: false
---

[Django REST framework](https://www.django-rest-framework.org/) の serializer で関連情報を扱う。

今日は簡略化したモデルで考える。Author has many books という著者が複数の本を書いている状態を考える。なお共著は存在せず、一冊の本は一人の著者に紐づくという前提に立つ。

## model を考える

```py
from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return str(self.id)

class Book(models.Model):
    title = models.CharField(max_length=100)
    author = models.ForeignKey(Author)

    def __str__(self):
        return str(self.id)
```

とする。

これは migration すると book table に author_id という author に対する外部キーが生成される。

## 著者に本一覧を含めて返す serializer

ではまず、一人の著者のデータを返す時に、本のデータも返すようにしよう。

```py
class AuthorSerializer(serializers.ModelSerializer):
    books = BookSerializer(read_only=True, many=True)
    class Meta:
        model = Battle
        fields = ('id', 'name', 'books')
```

親は子の serializer を呼び出せるので、BookSerializer を使えば良い。

## 本に著者情報を含めて返す serializer

```py
class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ['id', 'title', 'author']
        depth = 1
```

子は親の serializer を呼び出せないので（親が子を読んでいる場合、モジュールの循環参照になるため）、depth を使う。

もし depth がなければ author は外部キーの数字が帰る。Book モデルは `author = models.ForeignKey(Author)` というフィールドを持つので仕方ない。
ただそこで depth を持ってさえいればそのオブジェクトのまま渡すことができる。

> The default ModelSerializer uses primary keys for relationships, but you can also easily generate nested representations using the depth option:

FYI: https://www.django-rest-framework.org/api-guide/serializers/#specifying-nested-serialization
