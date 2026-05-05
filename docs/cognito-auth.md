# Cognito ログイン基盤の構成とセットアップ

Amazon Cognito Hosted UI をそのまま利用し、Next.js 側でコールバックを受け取ってトークンを保存する構成に刷新しました。Flask バックエンドは不要になり、フロントエンドのみで認証が完結します。

## ディレクトリ

- `pages/auth/callback.tsx` … Hosted UI から返却されたトークンを Cookie に保存
- `pages/auth/logout.tsx` … Cognito のログアウトにリダイレクトする前に Cookie を破棄
- `pages/api/me.ts` … Cookie の ID トークンを Cognito の JWKS で検証し、ログイン情報を返却

## 必要な環境変数

`.env.local` に以下の値を設定します。Hosted UI のドメインとクライアントIDは環境に合わせて置き換えてください。

```bash
NEXT_PUBLIC_COGNITO_DOMAIN=https://ap-northeast-17pdere9jo.auth.ap-northeast-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=vicsspgv2q7mtn6m6os2n893j
NEXT_PUBLIC_COGNITO_REDIRECT_URI=https://yasukari.com/auth/callback
NEXT_PUBLIC_COGNITO_LOGOUT_REDIRECT_URI=https://yasukari.com/
COGNITO_REGION=ap-northeast-1
COGNITO_USER_POOL_ID=ap-northeast-1_7PderE9jo
COGNITO_CLIENT_ID=vicsspgv2q7mtn6m6os2n893j
```

## エンドポイント概要

- `/auth/callback` … Hosted UI から返却されたトークンを Cookie に保存
- `/api/me` … Cookie の ID トークンを JWKS で検証し、ログイン情報(JSON)を返却
- `/auth/logout` … Cookie を削除した上で Cognito の `/logout` へリダイレクト

## 本番デプロイ例（ALB + EC2）

- Next.js を静的または Node.js サーバーとしてデプロイし、`/auth/*` と `/api/me` が同一オリジンで動作するようルーティングを設定
- Cognito のコールバック/ログアウト URL に `https://yasukari.com/auth/callback` と `https://yasukari.com/auth/logout` を登録

## フロントエンド連携ポイント

- ヘッダーのログイン/ログアウトボタンは Hosted UI の URL に直接リダイレクト
- ログイン状態の判定は `/api/me` を `credentials: 'include'` で呼び出して実施
- マイページ（`/mypage`）は `/api/me` のレスポンスを用いて表示し、未ログイン時は `/login` へリダイレクト

## 追加要件（共有用の短文）

追加要件：Google アカウントでのログイン対応（Cognito ユーザープールの IdP に Google を追加し、Hosted UI で通常ログインと Google ログインを並列表示、フロントはヘッダーなどに `/auth/login` と `/auth/login/google` ボタンを出し `/auth/login/google` で identity_provider=Google を付けた Cognito の `/oauth2/authorize` へリダイレクトさせ、どちらのログインも共通の `/auth/callback` でトークン検証とセッション作成を行う）。
