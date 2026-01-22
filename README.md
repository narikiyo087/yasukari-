# ヤスカリ

公式レンタルバイクサービス **ヤスカリ** の Next.js 製フロントエンドです。マーケティングサイトと店舗向けのコンテンツをホストし、手続きフローやブログ、FAQ などを静的生成で提供します。

## 特長
- **Next.js 14 + TypeScript**: `pages/` ベースのルーティングでマーケティングページ、ニュース、問い合わせ、カテゴリ別一覧などを提供。
- **コンテンツ配信**: `manual_for_system/` と `blog_for_custmor/` の Markdown 記事をビルド時に HTML へ変換し、タグやページネーションで公開。
- **データドリブンな UI**: `data/` 配下の FAQ やバイクデータをチャットボットやカタログ表示に再利用。
- **補助ユーティリティ**: `lib/` にディレクトリツリー生成、レートリミット、モック DB（ライト会員登録・ログイン）などの開発用ツールを同梱。
- **スタイリング**: `styles/global.css` を中心に、Swiper ベースのスライダーやカードレイアウトを共通デザインで統一。

## ディレクトリ概要
- `pages/` — トップ、ニュース、ジャンル別一覧、会員登録/認証、問い合わせなどのページと API Routes。
- `components/` — ヒーローセクション、カルーセル、FAQ などの再利用コンポーネント。
- `manual_for_system/` — 運用・更新ブログ用の Markdown 記事。
- `blog_for_custmor/` — 店舗向けブログ記事（Front Matter 付き Markdown）。
- `data/` — FAQ やバイクラインナップの静的データ。
- `lib/` — 認証コード生成、メール送信モック、DynamoDB/S3/SES 連携のラッパー、モック会員 DB、ディレクトリツリー取得などのユーティリティ。
- `styles/` — グローバルスタイルとテーマ定義。
- `docs/` — 設計メモや更新履歴。

## 開発環境
- Node.js 18 以上を推奨します。
- 依存関係: Next.js 14 / React 18 / TypeScript 5 / Swiper / AWS SDK v3。

### セットアップ
```bash
npm install
```

### 開発サーバー
```bash
npm run dev
```
`http://localhost:3000` をブラウザで開いて動作を確認できます。

### ビルド
```bash
npm run build
```

### テストと Lint
```bash
npm test -- --passWithNoTests
npm run lint
```

## コンテンツ・データの更新
- `manual_for_system/` や `blog_for_custmor/` に Markdown を追加・更新すると、ビルド時に静的ページへ反映されます。
- `data/` 配下の JSON（例: `chatbot-faq.json`, `bikes.json`）を更新すると、対応する UI やチャットボットに内容が反映されます。
- モック会員機能の動作確認は `lib/mockUserDb.ts` と `lib/pendingRegistrations.ts` を参照してください。

## 認証・制御まわりの補足
- `middleware.ts` で IP ベースのアクセス制御や Basic 認証を行い、混雑時の `/wait` への誘導も実装しています。
- AWS Cognito / DynamoDB / SES 連携用のクライアントを同梱しています（本番運用時に実サービスへ置き換え可能）。

## ライセンス
本リポジトリはプライベートリポジトリとして運用されています。
