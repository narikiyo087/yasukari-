import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from '../../styles/AdminV2.module.css';

type SubItem = { label: string; href?: string };
type NavItem = { key: string; label: string; href?: string; count?: number; sub?: SubItem[] };
type NavGroup = { title: string; items: NavItem[] };

// 確定したサイドバーIA（レビュー反映済み）
export const NAV_GROUPS: NavGroup[] = [
  {
    title: '今日の運用',
    items: [
      { key: 'dash', label: 'ダッシュボード', href: '/admin' },
      { key: 'reservations', label: '予約管理', href: '/admin/reservations' },
      { key: 'approvals', label: '承認待ち', href: '/admin/approvals', count: 7 },
      { key: 'license', label: '免許確認', href: '/admin/license', count: 3 },
      {
        key: 'keybox',
        label: 'KEYBOX',
        href: '/admin/keybox',
        sub: [
          { label: '実行ログ', href: '/admin/keybox?tab=log' },
          { label: '再発行', href: '/admin/keybox?tab=reissue' },
        ],
      },
      { key: 'schedule', label: 'バイクスケジュール', href: '/admin/schedule' },
      { key: 'maint', label: '整備アラート', href: '/admin/maint', count: 2 },
    ],
  },
  {
    title: '会員・サポート',
    items: [
      { key: 'members', label: '会員管理' },
      { key: 'activity', label: '顧客アクティビティ' },
      { key: 'mail', label: 'メール履歴' },
      { key: 'mailtmpl', label: 'メールテンプレート', sub: [{ label: '取引メール' }, { label: 'メルマガ' }] },
      { key: 'chatbot', label: 'チャットボット', sub: [{ label: '問い合わせ' }, { label: 'QA管理' }] },
    ],
  },
  {
    title: '商品マスタ（本部）',
    items: [
      { key: 'catalog', label: '車両登録・編集', sub: [{ label: 'クラス' }, { label: '車種' }, { label: '車両' }] },
      { key: 'pricing', label: '料金設計', sub: [{ label: 'クラス料金' }, { label: '車種料金' }, { label: '海外' }] },
      { key: 'accessories', label: '用品・オプション' },
    ],
  },
  {
    title: '販促・お知らせ',
    items: [
      { key: 'promo', label: 'お知らせ/ブログ' },
      { key: 'coupons', label: 'クーポン' },
      { key: 'campaign', label: 'メール配信/キャンペーン' },
      { key: 'waitlist', label: '空き通知リクエスト', count: 5 },
    ],
  },
  {
    title: '売上・分析',
    items: [
      { key: 'revenue', label: '売上・精算' },
      { key: 'deposits', label: 'デポジット管理' },
      { key: 'analytics', label: '全店分析', sub: [{ label: '予約分析' }, { label: '会員分析' }, { label: '車両分析' }] },
    ],
  },
  {
    title: '設定（本部）',
    items: [
      { key: 'stores', label: '店舗設定' },
      { key: 'contract', label: '契約書・約款 書式' },
      { key: 'apikeys', label: 'APIキー管理' },
      { key: 'audit', label: '監査ログ' },
      { key: 'settings', label: '公開/メンテナンス' },
    ],
  },
];

type Props = {
  active: string;
  title?: string;
  children: ReactNode;
};

export default function AdminV2Shell({ active, title = 'ヤスカリ 管理画面', children }: Props) {
  return (
    <div className={styles.app}>
      <aside className={styles.nav}>
        <div className={styles.brand}>
          <span className={styles.brandLogo}>Y</span>
          <span className={styles.brandName}>
            ヤスカリ<span>ADMIN</span>
          </span>
        </div>
        {NAV_GROUPS.map((group) => (
          <nav key={group.title}>
            <div className={styles.grp}>{group.title}</div>
            {group.items.map((item) => {
              const isActive = item.key === active;
              const cls = `${styles.item} ${isActive ? styles.on : ''}`;
              const inner = (
                <>
                  <span>{item.label}</span>
                  {typeof item.count === 'number' && <span className={styles.count}>{item.count}</span>}
                </>
              );
              return (
                <div key={item.key}>
                  {item.href ? (
                    <Link href={item.href} className={cls}>
                      {inner}
                    </Link>
                  ) : (
                    <button type="button" className={cls} title="準備中（順次実装）">
                      {inner}
                    </button>
                  )}
                  {isActive && item.sub && (
                    <div className={styles.subnav}>
                      {item.sub.map((s) =>
                        s.href ? (
                          <Link key={s.label} href={s.href} className={styles.subitem}>
                            {s.label}
                          </Link>
                        ) : (
                          <span key={s.label} className={styles.subitem}>
                            {s.label}
                          </span>
                        ),
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        ))}
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <span className={styles.topTitle}>{title}</span>
          <div className={styles.scope}>
            <select defaultValue="本部管理者（全店・マスター）">
              <option>本部管理者（全店・マスター）</option>
              <option>店舗オーナー（自店のみ）</option>
            </select>
            <select defaultValue="全店（本部）">
              <option>全店（本部）</option>
              <option>足立小台店</option>
              <option>三ノ輪店</option>
            </select>
            <span className={styles.avatar}>本</span>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
