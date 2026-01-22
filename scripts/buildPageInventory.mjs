import { promises as fs } from 'fs';
import path from 'path';

const meta = JSON.parse(await fs.readFile(path.join(process.cwd(), 'docs', 'page-meta.json'), 'utf8'));

const overrides = {
  '/': {
    jaName: 'トップページ',
    enName: 'Home',
    pageType: 'ランディング',
    metaDescription: '未設定（要検討）',
    notes: 'Heroスライダーや注目コンテンツを掲載。',
  },
  '/beginner': {
    jaName: 'はじめてガイド',
    enName: 'Beginner Guide',
    pageType: 'ガイド',
  },
  '/blog_for_custmor': {
    jaName: 'お客様向けブログ一覧',
    enName: 'Customer Blog',
    pageType: '一覧',
    notes: '旧ブログの投稿一覧。',
  },
  '/blog_for_custmor/[slug]': {
    jaName: 'お客様向けブログ記事',
    enName: 'Customer Blog Article',
    pageType: '記事詳細',
    title: 'meta.title - ヤスカリ',
    metaDescription: 'Markdown frontmatterに依存',
    apiIntegration: 'TRUE',
    apiEndpoint: 'blog_for_custmor/*.md',
  },
  '/blog_for_custmor/tag/[tag]': {
    jaName: 'お客様向けブログ（タグ）',
    enName: 'Customer Blog Tag',
    pageType: '一覧',
    title: '#{tag} の記事 - ヤスカリ',
    notes: 'タグ別フィルタページ。',
  },
  '/chat': {
    jaName: 'チャットサポート',
    enName: 'Chat Support',
    pageType: 'ツール',
  },
  '/company': {
    jaName: '会社概要',
    enName: 'Company',
    pageType: '静的情報',
  },
  '/contact': {
    jaName: 'お問い合わせ案内',
    enName: 'Contact',
    pageType: '静的情報',
  },
  '/customer_blog': {
    jaName: '店舗ブログ一覧',
    enName: 'Store Blog',
    pageType: '一覧',
  },
  '/en': {
    jaName: '英語トップ',
    enName: 'Home (EN)',
    pageType: 'ランディング',
    metaDescription: '未設定（要検討）',
    notes: '英語版トップページ。',
  },
  '/external': {
    jaName: '情報の外部送信について',
    enName: 'External Transmission',
    pageType: 'ポリシー',
  },
  '/guide': {
    jaName: 'ご利用案内',
    enName: 'Usage Guide',
    pageType: 'ガイド',
  },
  '/help': {
    jaName: 'ヘルプ',
    enName: 'Help',
    pageType: 'FAQ',
    apiIntegration: 'TRUE',
    apiEndpoint: 'data/chatbot-faq.json',
  },
  '/insurance': {
    jaName: '保険と補償',
    enName: 'Insurance',
    pageType: '静的情報',
  },
  '/login': {
    jaName: 'ログイン',
    enName: 'Login',
    pageType: 'フォーム',
    colorTheme: 'ブルーグラデーション (#2563eb→#3b82f6)',
    gaEventId: 'login_submit',
    apiIntegration: 'TRUE',
    apiEndpoint: '/api/login',
    notes: 'メールアドレス/ソーシャル認証フォーム。',
  },
  '/manual_for_system': {
    jaName: 'システム更新ブログ',
    enName: 'System Manual Index',
    pageType: '一覧',
    displayMode: '社内向け',
    apiIntegration: 'TRUE',
    apiEndpoint: 'manual_for_system/*.md',
    notes: '社内マニュアルの一覧。',
  },
  '/manual_for_system/[slug]': {
    jaName: 'システム更新記事',
    enName: 'System Manual Article',
    pageType: '記事詳細',
    displayMode: '社内向け',
    title: 'meta.title',
    metaDescription: 'Markdown本文冒頭',
    apiIntegration: 'TRUE',
    apiEndpoint: 'manual_for_system/*.md',
  },
  '/monitor': {
    jaName: 'レート制限モニター',
    enName: 'Rate Limit Monitor',
    pageType: '管理ツール',
    displayMode: '社内向け',
    colorTheme: 'ホワイト (#ffffff)',
    apiIntegration: 'TRUE',
    apiEndpoint: '/api/monitor',
    notes: 'APIレート制限状況を表示。',
  },
  '/mypage': {
    jaName: 'マイページ',
    enName: 'Dashboard',
    pageType: 'ダッシュボード',
    displayMode: '会員限定',
    colorTheme: 'ブルーグラデーション (#2563eb→#3b82f6)',
    gaEventId: 'mypage_view',
    apiIntegration: 'TRUE',
    apiEndpoint: 'SSR（GetServerSideProps）',
    notes: 'ログイン判定後にダッシュボードを表示。',
  },
  '/news': {
    jaName: '新着情報一覧',
    enName: 'News',
    pageType: '一覧',
  },
  '/news/site-renewal': {
    jaName: 'サイトリニューアルのお知らせ',
    enName: 'News Detail',
    pageType: '記事詳細',
  },
  '/pricing': {
    jaName: '料金表',
    enName: 'Pricing',
    pageType: '価格表',
  },
  '/privacy': {
    jaName: 'プライバシーポリシー',
    enName: 'Privacy Policy',
    pageType: 'ポリシー',
  },
  '/products': {
    jaName: '車種一覧',
    enName: 'Product Catalog',
    pageType: '一覧',
    apiIntegration: 'TRUE',
    apiEndpoint: 'lib/bikes.ts',
  },
  '/products/[modelCode]': {
    jaName: '車種詳細',
    enName: 'Product Detail',
    pageType: '詳細',
    title: '{bike.modelName} - ヤスカリ',
    metaDescription: 'モデルデータに依存',
    apiIntegration: 'TRUE',
    apiEndpoint: 'lib/bikes.ts',
  },
  '/rental-status': {
    jaName: 'レンタル状況',
    enName: 'Rental Status',
    pageType: 'ダッシュボード',
  },
  '/rental_bike': {
    jaName: 'レンタルバイク記事一覧',
    enName: 'Rental Bike Blog',
    pageType: '一覧',
    apiIntegration: 'TRUE',
    apiEndpoint: 'rental_bike/*.md',
  },
  '/rental_bike/[slug]': {
    jaName: 'レンタルバイク記事詳細',
    enName: 'Rental Bike Article',
    pageType: '記事詳細',
    title: 'meta.title - ヤスカリ',
    metaDescription: 'Markdown frontmatterに依存',
    apiIntegration: 'TRUE',
    apiEndpoint: 'rental_bike/*.md',
  },
  '/rental_bike/tag/[tag]': {
    jaName: 'レンタルバイク（タグ）',
    enName: 'Rental Bike Tag',
    pageType: '一覧',
    title: '#{tag} の記事 - ヤスカリ',
  },
  '/signup': {
    jaName: '新規会員登録',
    enName: 'Register',
    pageType: 'フォーム',
    metaDescription: '中古バイク専門店が運営するレンタルバイク屋です。メールアドレスを入力して簡単に会員登録が行えます。',
    gaEventId: 'register_submit',
    apiIntegration: 'TRUE',
    apiEndpoint: '/api/signup',
  },
  '/source/[...path]': {
    jaName: 'ソースビューア',
    enName: 'Source Viewer',
    pageType: '管理ツール',
    displayMode: '社内向け',
    apiIntegration: 'TRUE',
    apiEndpoint: 'ファイルシステム参照',
    notes: '任意のリポジトリファイルを表示。',
  },
  '/stores': {
    jaName: '店舗一覧',
    enName: 'Stores',
    pageType: '静的情報',
  },
  '/t/genre/cc126-250': {
    jaName: '126〜250ccカテゴリ',
    enName: '126-250cc',
    pageType: 'カテゴリ',
  },
  '/t/genre/cc251-400': {
    jaName: '251〜400ccカテゴリ',
    enName: '251-400cc',
    pageType: 'カテゴリ',
  },
  '/t/genre/cc400-plus': {
    jaName: '400cc超カテゴリ',
    enName: 'Over 400cc',
    pageType: 'カテゴリ',
  },
  '/t/genre/gyrocanopy-minicar': {
    jaName: 'ジャイロキャノビーミニカー',
    enName: 'Gyro Canopy Minicar',
    pageType: 'カテゴリ',
  },
  '/t/genre/gyrocanopy-moped': {
    jaName: 'ジャイロキャノビー原付',
    enName: 'Gyro Canopy Moped',
    pageType: 'カテゴリ',
  },
  '/t/genre/moped-manual': {
    jaName: '原付ミッション',
    enName: 'Manual Moped',
    pageType: 'カテゴリ',
  },
  '/t/genre/scooter-125cc': {
    jaName: '原付二種スクーター',
    enName: 'Class 2 Scooter',
    pageType: 'カテゴリ',
  },
  '/t/genre/scooter-50cc': {
    jaName: '原付スクーター',
    enName: 'Moped Scooter',
    pageType: 'カテゴリ',
  },
  '/terms': {
    jaName: '利用規約',
    enName: 'Terms of Use',
    pageType: 'ポリシー',
  },
  '/tokusyouhou': {
    jaName: '特定商取引法に基づく表記',
    enName: 'Legal Notice',
    pageType: 'ポリシー',
  },
  '/wait': {
    jaName: 'お待ちください案内',
    enName: 'Please Wait',
    pageType: '案内',
  },
  '/404': {
    jaName: '404エラーページ',
    enName: 'Not Found',
    pageType: 'システム',
    notes: 'Next.js標準の404をカスタマイズ。',
  },
};

const defaults = {
  pageType: 'コンテンツ',
  displayMode: '公開',
  devices: 'PC/SP',
  template: 'Layout',
  colorTheme: 'ブランドレッド (#dc2626)',
  font: 'Inter, Noto Sans JP',
  headerNav: 'TRUE',
  footerNav: 'TRUE',
  gaEventId: '-',
  apiIntegration: 'FALSE',
  apiEndpoint: '-',
  created: '未設定',
  updated: '未設定',
  owner: '未割当',
  version: 'v1.0',
  notes: '',
};

const rows = meta.map((record, index) => {
  const override = overrides[record.route] ?? {};
  const pageId = `PG${String(index + 1).padStart(3, '0')}`;
  const title = override.title ?? record.title ?? '未設定';
  const metaDescription = override.metaDescription ?? record.description ?? '未設定';
  const breadcrumb = override.breadcrumb ?? (record.hasBreadcrumb ? 'TRUE' : 'FALSE');
  const pageType = override.pageType ?? defaults.pageType;
  const displayMode = override.displayMode ?? defaults.displayMode;
  const devices = override.devices ?? defaults.devices;
  const template = override.template ?? defaults.template;
  const colorTheme = override.colorTheme ?? defaults.colorTheme;
  const font = override.font ?? defaults.font;
  const headerNav = override.headerNav ?? defaults.headerNav;
  const footerNav = override.footerNav ?? defaults.footerNav;
  const gaEventId = override.gaEventId ?? defaults.gaEventId;
  const apiIntegration = override.apiIntegration ?? defaults.apiIntegration;
  const apiEndpoint = override.apiEndpoint ?? defaults.apiEndpoint;
  const created = override.created ?? defaults.created;
  const updated = override.updated ?? defaults.updated;
  const owner = override.owner ?? defaults.owner;
  const version = override.version ?? defaults.version;
  const notes = override.notes ?? defaults.notes;
  const jaName = override.jaName ?? record.title?.split(/\s*[\-|｜|\|]\s*/)[0] ?? record.route;
  const routeSegments = record.route.split('/').filter(Boolean).map((seg) => seg.replace(/\[|\]|\.\.\./g, ''));
  const derivedEn = routeSegments.length > 0 ? routeSegments.join(' ') : 'Root';
  const enName = override.enName ?? derivedEn;

  return [
    pageId,
    jaName,
    enName,
    record.route,
    pageType,
    displayMode,
    devices,
    template,
    title,
    metaDescription,
    colorTheme,
    font,
    headerNav,
    footerNav,
    breadcrumb,
    gaEventId,
    apiIntegration,
    apiEndpoint,
    created,
    updated,
    owner,
    version,
    notes,
  ];
});

const header = [
  'ページID',
  'ページ名（日本語）',
  'ページ名（英語）',
  'URLパス',
  'ページタイプ',
  '表示モード',
  '対応デバイス',
  '使用テンプレート',
  'タイトル',
  'メタディスクリプション',
  'カラーテーマ',
  '使用フォント',
  'ヘッダーナビ有無',
  'フッターナビ有無',
  'パンくずリスト',
  'GAイベントID',
  'API連携有無',
  'APIエンドポイント',
  '作成日',
  '最終更新日',
  '担当者',
  'バージョン',
  '備考',
];

const csv = [header, ...rows]
  .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
  .join('\n');

await fs.writeFile(path.join(process.cwd(), 'docs', 'page-inventory.csv'), csv, 'utf8');
