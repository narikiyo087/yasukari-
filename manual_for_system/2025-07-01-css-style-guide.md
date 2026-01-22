---
title: "CSSスタイルガイド"
date: "2025-07-01"
---

# CSSスタイルガイド (2025/07/01)

このドキュメントでは `styles/global.css` の内容を中心に、ヤスカリ サイトで使用しているスタイルの役割とカスタマイズ方法をまとめます。新しいページやコンポーネントを作成する際の参考にしてください。

## ルート変数

```css
:root {
  --primary-color: #b91c1c;
  --primary-color-light: #f43f5e;
  --secondary-color: #fdf2f2;
  --font-family-base: "Inter", "Noto Sans JP", Arial, Helvetica,
    "Hiragino Kaku Gothic ProN", "Hiragino Sans",
    "\30e1\30a4\30ea\30aa", Meiryo, sans-serif;
}
```

- `--primary-color` と `--primary-color-light` はブランドカラーの濃淡を表します。ボタンやリンクの色に利用します。
- `--secondary-color` は背景色として使われ、全体を淡い印象に整えます。
- `--font-family-base` は日本語と欧文を混在させた汎用フォントセットです。

これらの変数を変更するとサイト全体の配色やフォントが一括で変えられます。

## 基本スタイル

### body

```css
body {
  margin: 0;
  font-family: var(--font-family-base);
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  background-color: var(--secondary-color);
}
```

- ページの余白をリセットし、フォントと背景色を一律に指定しています。
- `font-size` と `line-height` は可読性を意識したベース設定です。

### 見出しと段落

```css
h1, h2, h3, h4, h5, h6 {
  margin: 0 0 0.5rem;
  font-weight: bold;
  line-height: 1.2;
}

p {
  margin: 0 0 1rem;
}
```

- 見出しは下に適度な余白を設け、ボールド表示にしています。
- 段落には下マージンを付与し、文章間の区切りを明確にしています。

### リンク

```css
a {
  color: var(--primary-color);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
```

- 通常状態では下線をなくし、ホバー時のみアンダーラインを表示します。
- `text-primary` クラスを使うと任意の要素でブランドカラーを適用できます。

### ボタン

```css
.btn-primary {
  display: inline-block;
  padding: 0.5rem 1rem;
  color: #fff;
  background-color: var(--primary-color);
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color .2s ease;
}

.btn-primary:hover {
  background-color: var(--primary-color-light);
}
```

- ブランドカラーで塗りつぶすシンプルなボタンです。
- ホバー時には少し明るい色へ変化させています。

### カード

```css
.card {
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 0.5rem;
  overflow: hidden;
}

.card img {
  width: 100%;
  display: block;
}
```

- 画像を含む汎用カード。角丸と枠線でコンテンツを区切ります。
- 画像は横幅をカードいっぱいに広げ、レイアウト崩れを防ぎます。

## Swiper 用スタイル

カルーセル表示に使用している Swiper ライブラリのスタイルを追加で定義しています。

```css
.swiper {
  width: 100%;
  height: 100%;
}

.swiper-slide {
  width: auto;
  box-sizing: border-box;
}

.swiper-button-next,
.swiper-button-prev {
  color: #fff;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}

.swiper-pagination-bullet {
  width: 10px;
  height: 10px;
  margin: 0 4px !important;
  background: rgba(255, 255, 255, 0.7);
  opacity: 1;
}

.swiper-pagination-bullet-active {
  background: var(--primary-color);
}
```

- ナビゲーション矢印とページネーションの色を上書きし、サイト全体の配色に合わせています。

## モバイルナビゲーション

```css
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  background: #fff;
  border-top: 1px solid #e5e5e5;
  padding: 0.25rem 0.5rem;
  z-index: 40;
}

.mobile-nav a {
  color: #555;
  text-align: center;
  font-size: 0.75rem;
}

.mobile-nav a:hover {
  color: var(--primary-color);
}
```

- 画面下部に固定表示されるメニューです。スマホ利用時の操作性を考慮しています。
- `z-index: 40` で他の要素より前面に配置し、常にアクセスしやすくしています。

## アニメーション

```css
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade {
  animation: fade-up 0.3s ease forwards;
}
```

- フェードアップ用のシンプルなアニメーション。要素に `animate-fade` を付与すると適用されます。

## まとめ

`global.css` は最小限のスタイルに絞りつつ、ブランドカラーやフォント、共通パーツの見た目を整える役割を果たしています。Tailwind CSS のユーティリティを使いつつも、ここで定義したクラスを併用することでサイト全体の一貫性を保っています。新しいスタイルを追加する際は、既存の変数やクラスを活用してデザインを統一しましょう。
