# Slash-Kagari.github.io

/Kagari（スラッシュ・カガリ）公式サイトのソースコードです。

- 公開URL（予定）: https://slash-kagari.github.io
- タグライン: 篝に必要な灯りを。/ Light for the watchfire.

## 構成

```
/
├── index.html                 トップ（ヒーロー / About / Products / Contact）
├── products/
│   ├── only-task.html         Only Task 詳細
│   └── life-in-seconds.html   Life in Seconds 詳細
├── legal/
│   ├── only-task-privacy.html   プライバシーポリシー
│   ├── only-task-terms.html     利用規約
│   └── only-task-tokushoho.html 特定商取引法表記
├── assets/
│   ├── css/style.css
│   ├── js/main.js
│   └── img/
└── README.md
```

## 技術

- 純粋な HTML + CSS + JavaScript（ビルド不要）
- ヒーローの火の粉は Canvas で描画、篝籠の格子は SVG
- `prefers-reduced-motion` に対応

## 新しいプロダクトを追加するとき

1. `products/<slug>.html` を既存ファイルを複製して作成
2. `legal/<slug>-*.html` を複製（必要な法的ページ）
3. `index.html` の `.products__grid` 内に `<li class="product-cell" ...>` を1つ追加
4. 注目にする場合は `.products__feature` を差し替え

## ライセンス

ソースコード: 私的利用目的。ブランド素材（/Kagari 名称・ロゴ）の転用は不可。
