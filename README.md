# J.Navi - 二郎系ラーメン店舗情報共有アプリ

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-0081CB?style=for-the-badge&logo=material-ui&logoColor=white)](https://mui.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=tanstack&logoColor=white)](https://tanstack.com/query/latest)

Next.js, Material-UI, Firebase で構築された、二郎系ラーメン専門の店舗情報共有・コールシミュレーションアプリです。

## 機能

- **ユーザー認証**: メールアドレスとパスワードによるサインアップ・ログイン機能
- **店舗情報 CRUD**: 店舗の基本情報（店名、住所、営業時間など）を登録・更新・削除
- **インタラクティブマップ**: Google Maps と連携し、登録店舗をマップ上に表示。マーカークリックで詳細情報を確認
- **画像アップロード**: 店舗の外観やラーメンの画像をアップロードし、ギャラリー形式で表示
- **コールシミュレーション**: 各店舗の注文方法（コール）を登録し、初心者でも注文の流れを模擬体験できるシミュレーション機能
- **レスポンシブデザイン**: PC、タブレット、スマートフォンなど、あらゆるデバイスに最適化された UI
- **リアルタイム状態管理**: TanStack Query と Zustand による効率的なデータフェッチと状態管理

## URL

https://jnavi-web.vercel.app/stores/map

※ホスティングサービス（Render）が不安定なため、一時的にアクセスできない場合があります。

## 技術スタック

- **フレームワーク**: Next.js 15.3.2 (App Router)
- **UI ライブラリ**: Material-UI v7
- **スタイリング**: Tailwind CSS v4
- **言語**: TypeScript
- **状態管理**: TanStack React Query v5, Zustand v5
- **フォーム管理**: React Hook Form v7, Zod v3
- **認証・DB**: Firebase (Authentication, Storage)
- **API クライアント**: Axios
- **マップ**: @vis.gl/react-google-maps

## 開発環境の構築

### 前提条件

- Node.js 18 以上
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/hideaki1979/jnavi_web.git
cd jnavi_web

# .env.localファイルを作成し、Firebaseの環境変数を設定
# ※詳細は.env.exampleなどを参照
cp .env.example .env.local

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

## スクリプト

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm run start

# コード品質チェック
npm run lint
```

## プロジェクト構造

```
src/
├── app/
│   ├── api/                   # APIルート (認証, データ操作)
│   ├── auth/                  # 認証関連ページ (ログイン, サインアップ)
│   ├── stores/                # 店舗情報関連ページ (マップ, 作成, 編集)
│   ├── layout.tsx             # ルートレイアウト
│   └── page.tsx               # トップページ
├── components/
│   ├── auth/                  # 認証関連コンポーネント
│   ├── image/                 # 画像関連コンポーネント
│   ├── layout/                # ヘッダーなどのレイアウト部品
│   ├── modals/                # 確認・結果表示ダイアログ
│   ├── simulation/            # コールシミュレーション関連コンポーネント
│   └── Store/                 # 店舗情報関連コンポーネント (フォーム, マップ, 詳細表示)
├── hooks/
│   ├── api/                   # TanStack Queryを使ったAPIフック (useStores, useImagesなど)
│   └── ...                    # 各種カスタムフック (useDialogState, useResponsiveなど)
├── lib/
│   ├── server/                # サーバーサイド専用ロジック (Firebase Admin)
│   └── ...                    # ライブラリ設定、クライアント (Firebase, Axios)
├── types/
│   └── ...                    # プロジェクト全体の型定義
└── validations/
    └── ...                    # Zodバリデーションスキーマ
```

## アプリケーションフロー

1. **ユーザー登録・ログイン**: 新規登録または既存アカウントでログインします。
2. **店舗マップ**: ログイン後、登録されている店舗がマップ上に一覧表示されます。
3. **店舗詳細**: マップ上のマーカーをクリックすると、ドロワーで店舗の営業時間、コール情報、画像ギャラリーなどの詳細を確認できます。
4. **店舗登録・編集**: 新規店舗の登録や、既存店舗の情報を編集できます。住所から自動で緯度経度が入力されます。
5. **画像管理**: 店舗ごとに複数の画像をアップロード・編集・削除できます。
6. **コールシミュレーション**: 店舗詳細のシミュレーション機能で、実際の注文の流れを体験できます。

### コード規約・重要実装ポイント

- **TypeScript Strict Mode**: 型安全性を重視し、`any`型の使用を原則禁止します。
- **コンポーネント設計**:
  - 200 行を超えるコンポーネントは機能ごとに分割します。
  - 3 箇所以上で使用されるロジックはカスタムフックに抽出し、共通化します。
- **状態管理**:
  - サーバー状態は TanStack React Query、クライアント状態は Zustand で管理します。
  - API フックは`src/hooks/api`に集約します。
- **フォーム**: React Hook Form と Zod を組み合わせ、型安全で再利用性の高いフォームを構築します。
- **認証**: Firebase Authentication と HTTP Only のセッションクッキーを組み合わせたセキュアな認証基盤を実装します。
- **Next.js App Router**: Server Components を積極的に活用し、パフォーマンスを最適化します。
- **ハイドレーションエラー対策**: `useResponsive`フックなどを用いて、サーバーとクライアントのレンダリング差異を吸収します。
